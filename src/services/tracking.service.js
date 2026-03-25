const RaceParticipation = require('../models/raceParticipation.model');
const Race = require('../models/race.model');
const User = require('../models/user.model');

class TrackingService {
  constructor(io) {
    this.io = io;
    this.activeRaces = new Map(); // raceId -> { participants: Map<userId, data>, raceData }
  }

  /**
   * Initialize tracking for a race
   */
  async initializeRace(raceId) {
    try {
      const race = await Race.findByPk(raceId);
      if (!race) {
        throw new Error(`Race ${raceId} not found`);
      }

      // Get all participants
      const participants = await RaceParticipation.findAll({
        where: {
          raceId,
          status: ['registered', 'started', 'in_progress']
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
          }
        ]
      });

      // Initialize race tracking data
      const raceData = {
        raceId,
        distance: race.distance,
        startTime: race.startTime,
        participants: new Map(),
        leaderboard: [],
        lastUpdate: new Date()
      };

      // Add participants to tracking
      participants.forEach(participation => {
        raceData.participants.set(participation.userId, {
          userId: participation.userId,
          participationId: participation.id,
          username: participation.user.username,
          profileImage: participation.user.profileImage,
          status: participation.status,
          distanceCovered: participation.distanceCovered || 0,
          currentPace: participation.averagePace || null,
          lastPosition: null,
          lastUpdate: new Date(),
          gpsHistory: [],
          checkpoints: []
        });
      });

      this.activeRaces.set(raceId, raceData);
      console.log(`Tracking initialized for race ${raceId} with ${participants.length} participants`);

      return raceData;
    } catch (error) {
      console.error('Error initializing race tracking:', error);
      throw error;
    }
  }

  /**
   * Update participant position
   */
  async updatePosition(raceId, userId, data) {
    try {
      const { latitude, longitude, distance, pace, timestamp, heartRate, elevation } = data;
      
      const raceData = this.activeRaces.get(raceId);
      if (!raceData) {
        throw new Error(`Race ${raceId} not being tracked`);
      }

      const participant = raceData.participants.get(userId);
      if (!participant) {
        throw new Error(`Participant ${userId} not found in race ${raceId}`);
      }

      // Update participant data
      participant.distanceCovered = distance;
      participant.currentPace = pace;
      participant.lastUpdate = new Date(timestamp || Date.now());

      // Add GPS point to history (limit to last 100 points)
      if (latitude && longitude) {
        participant.gpsHistory.push({
          latitude,
          longitude,
          timestamp: participant.lastUpdate,
          distance,
          pace
        });

        if (participant.gpsHistory.length > 100) {
          participant.gpsHistory = participant.gpsHistory.slice(-100);
        }
      }

      // Update database
      await RaceParticipation.update(
        {
          distanceCovered: distance,
          averagePace: pace,
          ...(heartRate && { averageHeartRate: heartRate }),
          ...(elevation && { elevationGain: elevation }),
          gpsData: participant.gpsHistory
        },
        {
          where: {
            raceId,
            userId,
            status: ['started', 'in_progress']
          }
        }
      );

      // Update status to in_progress if not already
      if (participant.status === 'started') {
        participant.status = 'in_progress';
        await RaceParticipation.update(
          { status: 'in_progress' },
          {
            where: {
              raceId,
              userId
            }
          }
        );
      }

      // Update leaderboard
      this.updateLeaderboard(raceId);

      // Broadcast update to all clients in the race room
      this.io.to(`race-${raceId}`).emit('participant-update', {
        userId,
        username: participant.username,
        profileImage: participant.profileImage,
        distanceCovered: participant.distanceCovered,
        currentPace: participant.currentPace,
        position: participant.lastPosition,
        progressPercentage: (participant.distanceCovered / raceData.distance) * 100,
        timestamp: participant.lastUpdate
      });

      // Check if participant has finished
      if (participant.distanceCovered >= raceData.distance && participant.status !== 'completed') {
        await this.finishParticipant(raceId, userId);
      }

      return participant;
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  }

  /**
   * Update leaderboard for a race
   */
  updateLeaderboard(raceId) {
    const raceData = this.activeRaces.get(raceId);
    if (!raceData) return;

    // Convert participants map to array and sort by distance covered (descending)
    const participantsArray = Array.from(raceData.participants.values())
      .filter(p => p.status === 'in_progress' || p.status === 'completed')
      .sort((a, b) => b.distanceCovered - a.distanceCovered);

    // Update positions
    participantsArray.forEach((participant, index) => {
      participant.lastPosition = index + 1;
      
      // Update position in database (async, non-blocking)
      RaceParticipation.update(
        { position: index + 1 },
        {
          where: {
            raceId,
            userId: participant.userId
          }
        }
      ).catch(console.error);
    });

    raceData.leaderboard = participantsArray.map(p => ({
      userId: p.userId,
      username: p.username,
      profileImage: p.profileImage,
      distanceCovered: p.distanceCovered,
      currentPace: p.currentPace,
      position: p.lastPosition,
      progressPercentage: (p.distanceCovered / raceData.distance) * 100
    }));

    // Broadcast leaderboard update
    this.io.to(`race-${raceId}`).emit('leaderboard-update', {
      raceId,
      leaderboard: raceData.leaderboard,
      timestamp: new Date()
    });

    raceData.lastUpdate = new Date();
  }

  /**
   * Mark participant as finished
   */
  async finishParticipant(raceId, userId) {
    try {
      const raceData = this.activeRaces.get(raceId);
      if (!raceData) return;

      const participant = raceData.participants.get(userId);
      if (!participant) return;

      // Calculate finish time
      const startTime = new Date(raceData.startTime);
      const finishTime = new Date();
      const totalTime = Math.floor((finishTime - startTime) / 1000); // in seconds

      // Update participant status
      participant.status = 'completed';
      participant.finishTime = finishTime;
      participant.totalTime = totalTime;

      // Update database
      await RaceParticipation.update(
        {
          status: 'completed',
          endTime: finishTime,
          totalTime,
          distanceCovered: raceData.distance, // Ensure distance is exactly race distance
          position: participant.lastPosition
        },
        {
          where: {
            raceId,
            userId
          }
        }
      );

      // Update user stats
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({
          totalDistance: (user.totalDistance || 0) + raceData.distance,
          totalRaces: (user.totalRaces || 0) + 1,
          ...(participant.lastPosition === 1 && { wins: (user.wins || 0) + 1 })
        });

        // Update personal bests based on distance
        if (raceData.distance === 5 && (!user.personalBest5k || totalTime < user.personalBest5k)) {
          await user.update({ personalBest5k: totalTime });
        } else if (raceData.distance === 10 && (!user.personalBest10k || totalTime < user.personalBest10k)) {
          await user.update({ personalBest10k: totalTime });
        } else if (raceData.distance === 21.0975 && (!user.personalBestHalfMarathon || totalTime < user.personalBestHalfMarathon)) {
          await user.update({ personalBestHalfMarathon: totalTime });
        } else if (raceData.distance === 42.195 && (!user.personalBestMarathon || totalTime < user.personalBestMarathon)) {
          await user.update({ personalBestMarathon: totalTime });
        }
      }

      // Broadcast finish event
      this.io.to(`race-${raceId}`).emit('participant-finished', {
        userId,
        username: participant.username,
        profileImage: participant.profileImage,
        position: participant.lastPosition,
        totalTime,
        finishTime,
        timestamp: new Date()
      });

      console.log(`Participant ${userId} finished race ${raceId} in position ${participant.lastPosition}`);

      // Check if all participants have finished
      const allFinished = Array.from(raceData.participants.values())
        .every(p => p.status === 'completed' || p.status === 'dnf' || p.status === 'disqualified');

      if (allFinished) {
        await this.finishRace(raceId);
      }

      return participant;
    } catch (error) {
      console.error('Error finishing participant:', error);
      throw error;
    }
  }

  /**
   * Finish entire race
   */
  async finishRace(raceId) {
    try {
      const raceData = this.activeRaces.get(raceId);
      if (!raceData) return;

      // Update race status in database
      await Race.update(
        {
          status: 'completed',
          endTime: new Date()
        },
        {
          where: { id: raceId }
        }
      );

      // Remove from active races
      this.activeRaces.delete(raceId);

      // Broadcast race finished event
      this.io.to(`race-${raceId}`).emit('race-finished', {
        raceId,
        finalLeaderboard: raceData.leaderboard,
        finishTime: new Date()
      });

      console.log(`Race ${raceId} finished`);

      return true;
    } catch (error) {
      console.error('Error finishing race:', error);
      throw error;
    }
  }

  /**
   * Get race tracking data
   */
  getRaceData(raceId) {
    const raceData = this.activeRaces.get(raceId);
    if (!raceData) return null;

    return {
      raceId,
      distance: raceData.distance,
      startTime: raceData.startTime,
      participantCount: raceData.participants.size,
      leaderboard: raceData.leaderboard,
      lastUpdate: raceData.lastUpdate
    };
  }

  /**
   * Get participant tracking data
   */
  getParticipantData(raceId, userId) {
    const raceData = this.activeRaces.get(raceId);
    if (!raceData) return null;

    const participant = raceData.participants.get(userId);
    if (!participant) return null;

    return {
      userId: participant.userId,
      username: participant.username,
      status: participant.status,
      distanceCovered: participant.distanceCovered,
      currentPace: participant.currentPace,
      position: participant.lastPosition,
      progressPercentage: (participant.distanceCovered / raceData.distance) * 100,
      lastUpdate: participant.lastUpdate,
      gpsHistory: participant.gpsHistory.slice(-10) // Last 10 points
    };
  }

  /**
   * Add participant to race tracking
   */
  async addParticipant(raceId, userId) {
    try {
      const raceData = this.activeRaces.get(raceId);
      if (!raceData) {
        // Initialize race if not already tracking
        await this.initializeRace(raceId);
        return this.addParticipant(raceId, userId);
      }

      // Get user and participation data
      const [user, participation] = await Promise.all([
        User.findByPk(userId, {
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
        }),
        RaceParticipation.findOne({
          where: {
            raceId,
            userId,
            status: ['registered', 'started', 'in_progress']
          }
        })
      ]);

      if (!user || !participation) {
        throw new Error(`User ${userId} not registered for race ${raceId}`);
      }

      // Add participant to tracking
      raceData.participants.set(userId, {
        userId,
        participationId: participation.id,
        username: user.username,
        profileImage: user.profileImage,
        status: participation.status,
        distanceCovered: participation.distanceCovered || 0,
        currentPace: participation.averagePace || null,
        lastPosition: null,
        lastUpdate: new Date(),
        gpsHistory: participation.gpsData || [],
        checkpoints: participation.checkpoints || []
      });

      console.log(`Participant ${userId} added to race ${raceId} tracking`);

      return raceData.participants.get(userId);
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Remove participant from race tracking
   */
  removeParticipant(raceId, userId) {
    const raceData = this.activeRaces.get(raceId);
    if (!raceData) return false;

    const removed = raceData.participants.delete(userId);
    if (removed) {
      console.log(`Participant ${userId} removed from race ${raceId} tracking`);
      
      // Update leaderboard
      this.updateLeaderboard(raceId);
    }

    return removed;
  }

  /**
   * Clean up inactive races
   */
  cleanup() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [raceId, raceData] of this.activeRaces.entries()) {
      if (raceData.lastUpdate < oneHourAgo) {
        this.activeRaces.delete(raceId);
        console.log(`Cleaned up inactive race ${raceId}`);
      }
    }
  }
}

module.exports = TrackingService;