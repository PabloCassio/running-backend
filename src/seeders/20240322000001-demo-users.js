'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin123!', salt);
    const userPassword = await bcrypt.hash('User123!', salt);
    const organizerPassword = await bcrypt.hash('Organizer123!', salt);

    // Insert demo users
    await queryInterface.bulkInsert('Users', [
      {
        username: 'admin',
        email: 'admin@maratona.com',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'organizer1',
        email: 'organizer@maratona.com',
        password: organizerPassword,
        firstName: 'Race',
        lastName: 'Organizer',
        role: 'organizer',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'runner1',
        email: 'runner1@maratona.com',
        password: userPassword,
        firstName: 'John',
        lastName: 'Runner',
        role: 'user',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'runner2',
        email: 'runner2@maratona.com',
        password: userPassword,
        firstName: 'Jane',
        lastName: 'Marathoner',
        role: 'user',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'runner3',
        email: 'runner3@maratona.com',
        password: userPassword,
        firstName: 'Bob',
        lastName: 'Sprinter',
        role: 'user',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // Get the inserted user IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM Users WHERE username IN ('organizer1', 'runner1', 'runner2', 'runner3')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = user.id;
    });

    // Insert demo races
    await queryInterface.bulkInsert('Races', [
      {
        name: 'São Paulo Marathon 2024',
        description: 'Annual marathon through the streets of São Paulo. Join thousands of runners in this iconic race.',
        date: new Date('2024-10-20'),
        location: 'São Paulo, SP',
        distance: 42.195,
        maxParticipants: 5000,
        currentParticipants: 1250,
        registrationFee: 150.00,
        categories: JSON.stringify(['5km', '10km', '21km', '42km']),
        status: 'published',
        organizerId: userMap['organizer1'],
        startTime: '07:00:00',
        endTime: '14:00:00',
        registrationOpen: new Date('2024-01-01'),
        registrationClose: new Date('2024-10-10'),
        routeMap: 'https://example.com/maps/sao-paulo-marathon.png',
        rules: 'All participants must be 18+ years old. Medical certificate required.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Rio Beach Run 2024',
        description: 'Scenic beach run along the beautiful coast of Rio de Janeiro.',
        date: new Date('2024-08-15'),
        location: 'Rio de Janeiro, RJ',
        distance: 10.0,
        maxParticipants: 2000,
        currentParticipants: 850,
        registrationFee: 80.00,
        categories: JSON.stringify(['5km', '10km']),
        status: 'published',
        organizerId: userMap['organizer1'],
        startTime: '06:30:00',
        endTime: '10:00:00',
        registrationOpen: new Date('2024-02-01'),
        registrationClose: new Date('2024-08-01'),
        routeMap: 'https://example.com/maps/rio-beach-run.png',
        rules: 'Bring your own water bottle. No headphones allowed for safety.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Mountain Trail Challenge',
        description: 'Challenging trail run through mountainous terrain. For experienced runners only.',
        date: new Date('2024-11-05'),
        location: 'Campos do Jordão, SP',
        distance: 25.0,
        maxParticipants: 500,
        currentParticipants: 120,
        registrationFee: 200.00,
        categories: JSON.stringify(['25km']),
        status: 'draft',
        organizerId: userMap['organizer1'],
        startTime: '08:00:00',
        endTime: '17:00:00',
        registrationOpen: new Date('2024-03-01'),
        registrationClose: new Date('2024-10-25'),
        routeMap: 'https://example.com/maps/mountain-trail.png',
        rules: 'Mandatory safety equipment: headlamp, whistle, emergency blanket.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // Get the inserted race IDs
    const races = await queryInterface.sequelize.query(
      `SELECT id, name FROM Races`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const raceMap = {};
    races.forEach(race => {
      raceMap[race.name] = race.id;
    });

    // Insert demo race participations
    await queryInterface.bulkInsert('RaceParticipations', [
      {
        raceId: raceMap['São Paulo Marathon 2024'],
        userId: userMap['runner1'],
        category: '42km',
        bibNumber: 'SPM2024-001',
        registrationDate: new Date('2024-01-15'),
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentAmount: 150.00,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'credit_card',
        transactionId: 'TXN-001',
        estimatedTime: '04:30:00',
        ageGroup: '30-39',
        gender: 'male',
        emergencyContact: 'Mary Runner',
        emergencyPhone: '+55 11 99999-9999',
        tshirtSize: 'M',
        waiverSigned: true,
        waiverSignedAt: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        raceId: raceMap['São Paulo Marathon 2024'],
        userId: userMap['runner2'],
        category: '21km',
        bibNumber: 'SPM2024-002',
        registrationDate: new Date('2024-02-01'),
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentAmount: 150.00,
        paymentDate: new Date('2024-02-01'),
        paymentMethod: 'pix',
        transactionId: 'TXN-002',
        estimatedTime: '02:15:00',
        ageGroup: '25-29',
        gender: 'female',
        emergencyContact: 'John Doe',
        emergencyPhone: '+55 21 98888-8888',
        tshirtSize: 'S',
        waiverSigned: true,
        waiverSignedAt: new Date('2024-02-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        raceId: raceMap['Rio Beach Run 2024'],
        userId: userMap['runner1'],
        category: '10km',
        bibNumber: 'RBR2024-001',
        registrationDate: new Date('2024-02-10'),
        status: 'registered',
        paymentStatus: 'pending',
        paymentAmount: 80.00,
        ageGroup: '30-39',
        gender: 'male',
        emergencyContact: 'Mary Runner',
        emergencyPhone: '+55 11 99999-9999',
        tshirtSize: 'M',
        waiverSigned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        raceId: raceMap['Rio Beach Run 2024'],
        userId: userMap['runner3'],
        category: '5km',
        bibNumber: 'RBR2024-002',
        registrationDate: new Date('2024-02-12'),
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentAmount: 80.00,
        paymentDate: new Date('2024-02-12'),
        paymentMethod: 'credit_card',
        transactionId: 'TXN-003',
        estimatedTime: '00:35:00',
        ageGroup: '40-49',
        gender: 'male',
        emergencyContact: 'Alice Sprinter',
        emergencyPhone: '+55 31 97777-7777',
        tshirtSize: 'L',
        waiverSigned: true,
        waiverSignedAt: new Date('2024-02-12'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order due to foreign key constraints
    await queryInterface.bulkDelete('RaceParticipations', null, {});
    await queryInterface.bulkDelete('Races', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  },
};