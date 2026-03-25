const TrackingService = require('../services/tracking.service');

/**
 * Initialize socket.io tracking handlers
 */
const initializeTrackingSocket = (io) => {
  const trackingService = new TrackingService(io);

  // Set up periodic cleanup
  setInterval(() => {
    trackingService.cleanup();
  }, 30 * 60 * 1000); // Clean up every 30 minutes

  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    /**
     * Join a race room and start tracking
     */
    socket.on('join-race-tracking', async (data) => {
      try {
        const { raceId, userId } = data;

        if (!raceId || !userId) {
          socket.emit('error', { message: 'Race ID and User ID are required.' });
          return;
        }

        // Join the race room
        socket.join(`race-${raceId}`);
        
        // Add participant to tracking service
        await trackingService.addParticipant(raceId, userId);

        // Send current race data to the client
        const raceData = trackingService.getRaceData(raceId);
        const participantData = trackingService.getParticipantData(raceId, userId);

        socket.emit('tracking-initialized', {
          raceId,
          raceData,
          participantData
        });

        console.log(`User ${userId} joined race ${raceId} tracking`);
      } catch (error) {
        console.error('Error joining race tracking:', error);
        socket.emit('error', { message: 'Failed to join race tracking.' });
      }
    });

    /**
     * Update participant position
     */
    socket.on('update-position', async (data) => {
      try {
        const { raceId, userId, latitude, longitude, distance, pace, timestamp, heartRate, elevation } = data;

        if (!raceId || !userId || distance === undefined) {
          socket.emit('error', { message: 'Race ID, User ID, and distance are required.' });
          return;
        }

        // Update position in tracking service
        await trackingService.updatePosition(raceId, userId, {
          latitude,
          longitude,
          distance: parseFloat(distance),
          pace: pace ? parseFloat(pace) : null,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          heartRate: heartRate ? parseInt(heartRate) : null,
          elevation: elevation ? parseFloat(elevation) : null
        });

        // Send confirmation to client
        socket.emit('position-updated', {
          success: true,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating position:', error);
        socket.emit('error', { message: 'Failed to update position.' });
      }
    });

    /**
     * Get current race data
     */
    socket.on('get-race-data', (data) => {
      try {
        const { raceId } = data;

        if (!raceId) {
          socket.emit('error', { message: 'Race ID is required.' });
          return;
        }

        const raceData = trackingService.getRaceData(raceId);
        
        if (!raceData) {
          socket.emit('race-not-found', { raceId });
          return;
        }

        socket.emit('race-data', {
          raceId,
          data: raceData
        });
      } catch (error) {
        console.error('Error getting race data:', error);
        socket.emit('error', { message: 'Failed to get race data.' });
      }
    });

    /**
     * Get participant data
     */
    socket.on('get-participant-data', (data) => {
      try {
        const { raceId, userId } = data;

        if (!raceId || !userId) {
          socket.emit('error', { message: 'Race ID and User ID are required.' });
          return;
        }

        const participantData = trackingService.getParticipantData(raceId, userId);
        
        if (!participantData) {
          socket.emit('participant-not-found', { raceId, userId });
          return;
        }

        socket.emit('participant-data', {
          raceId,
          userId,
          data: participantData
        });
      } catch (error) {
        console.error('Error getting participant data:', error);
        socket.emit('error', { message: 'Failed to get participant data.' });
      }
    });

    /**
     * Leave race tracking
     */
    socket.on('leave-race-tracking', (data) => {
      try {
        const { raceId, userId } = data;

        if (!raceId) {
          socket.emit('error', { message: 'Race ID is required.' });
          return;
        }

        // Leave the race room
        socket.leave(`race-${raceId}`);

        // Remove participant from tracking service if userId provided
        if (userId) {
          trackingService.removeParticipant(raceId, userId);
        }

        socket.emit('left-race-tracking', {
          raceId,
          userId
        });

        console.log(`User ${userId || 'unknown'} left race ${raceId} tracking`);
      } catch (error) {
        console.error('Error leaving race tracking:', error);
        socket.emit('error', { message: 'Failed to leave race tracking.' });
      }
    });

    /**
     * Report DNF (Did Not Finish)
     */
    socket.on('report-dnf', async (data) => {
      try {
        const { raceId, userId, reason } = data;

        if (!raceId || !userId) {
          socket.emit('error', { message: 'Race ID and User ID are required.' });
          return;
        }

        // Update participation status in database
        const RaceParticipation = require('../models/raceParticipation.model');
        await RaceParticipation.update(
          {
            status: 'dnf',
            endTime: new Date(),
            notes: reason || 'Did not finish'
          },
          {
            where: {
              raceId,
              userId
            }
          }
        );

        // Remove from tracking service
        trackingService.removeParticipant(raceId, userId);

        // Broadcast DNF event
        io.to(`race-${raceId}`).emit('participant-dnf', {
          userId,
          raceId,
          reason,
          timestamp: new Date()
        });

        socket.emit('dnf-reported', {
          success: true,
          raceId,
          userId
        });

        console.log(`User ${userId} reported DNF for race ${raceId}`);
      } catch (error) {
        console.error('Error reporting DNF:', error);
        socket.emit('error', { message: 'Failed to report DNF.' });
      }
    });

    /**
     * Report cheating or suspicious activity
     */
    socket.on('report-suspicious', async (data) => {
      try {
        const { raceId, userId, reportedUserId, reason, evidence } = data;

        if (!raceId || !userId || !reportedUserId) {
          socket.emit('error', { message: 'Race ID, User ID, and Reported User ID are required.' });
          return;
        }

        // In a real implementation, you would:
        // 1. Store the report in a database
        // 2. Notify moderators
        // 3. Possibly flag the user for review
        
        console.log(`Suspicious activity reported in race ${raceId}:`, {
          reporter: userId,
          reported: reportedUserId,
          reason,
          evidence
        });

        socket.emit('suspicious-reported', {
          success: true,
          message: 'Report submitted for review.'
        });
      } catch (error) {
        console.error('Error reporting suspicious activity:', error);
        socket.emit('error', { message: 'Failed to report suspicious activity.' });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Note: In a production app, you might want to track which races
      // the user was participating in and clean up appropriately
    });

    /**
     * Error handling
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return trackingService;
};

module.exports = initializeTrackingSocket;