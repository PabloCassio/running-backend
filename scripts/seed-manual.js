const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

async function seedDatabase() {
  console.log('Starting manual seeding...');
  
  // Create sequelize instance
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'maratona_db',
    process.env.DB_USER || 'maratona_user',
    process.env.DB_PASSWORD || 'maratona_password',
    {
      host: process.env.DB_HOST || 'postgres',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin123!', salt);
    const userPassword = await bcrypt.hash('User123!', salt);
    const organizerPassword = await bcrypt.hash('Organizer123!', salt);

    // Insert users with UPSERT (INSERT ... ON CONFLICT DO NOTHING)
    console.log('Inserting users...');
    try {
      await sequelize.query(`
        INSERT INTO "Users" (username, email, password, "firstName", "lastName", role, "isActive", "emailVerified", "createdAt", "updatedAt")
        VALUES 
          ('admin', 'admin@maratona.com', :adminPassword, 'System', 'Administrator', 'admin', true, true, NOW(), NOW()),
          ('organizer1', 'organizer@maratona.com', :organizerPassword, 'Race', 'Organizer', 'organizer', true, true, NOW(), NOW()),
          ('runner1', 'runner1@maratona.com', :userPassword, 'John', 'Runner', 'user', true, true, NOW(), NOW()),
          ('runner2', 'runner2@maratona.com', :userPassword, 'Jane', 'Marathoner', 'user', true, true, NOW(), NOW()),
          ('runner3', 'runner3@maratona.com', :userPassword, 'Bob', 'Sprinter', 'user', true, false, NOW(), NOW())
        ON CONFLICT (username) DO NOTHING;
      `, {
        replacements: { adminPassword, userPassword, organizerPassword },
        type: sequelize.QueryTypes.INSERT
      });
      console.log('✅ Users inserted or already exist');
    } catch (error) {
      console.log('⚠️ Users insertion skipped (already exist):', error.message);
    }

    // Get user IDs
    const userResult = await sequelize.query(
      `SELECT id, username FROM "Users" WHERE username IN ('organizer1', 'runner1', 'runner2', 'runner3')`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const userMap = {};
    userResult.forEach(user => {
      userMap[user.username] = user.id;
    });

    console.log('User map:', userMap);

    // Insert races (check if they exist first)
    console.log('Inserting races...');
    
    // Check if races already exist
    const existingRaces = await sequelize.query(
      `SELECT name FROM "Races" WHERE name IN ('São Paulo Marathon 2024', 'Rio Beach Run 2024', 'Mountain Trail Challenge')`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const existingRaceNames = existingRaces.map(race => race.name);
    console.log('Existing races:', existingRaceNames);
    
    if (existingRaceNames.length === 0) {
      // No races exist, insert them
      try {
        await sequelize.query(`
          INSERT INTO "Races" (name, description, date, location, distance, "maxParticipants", "currentParticipants", "registrationFee", categories, status, "organizerId", "startTime", "endTime", "registrationOpen", "registrationClose", "routeMap", rules, "createdAt", "updatedAt")
          VALUES 
            ('São Paulo Marathon 2024', 'Annual marathon through the streets of São Paulo. Join thousands of runners in this iconic race.', '2024-10-20', 'São Paulo, SP', 42.195, 5000, 1250, 150.00, '["5km","10km","21km","42km"]', 'published', :organizerId1, '07:00:00', '14:00:00', '2024-01-01', '2024-10-10', 'https://example.com/maps/sao-paulo-marathon.png', 'All participants must be 18+ years old. Medical certificate required.', NOW(), NOW()),
            ('Rio Beach Run 2024', 'Scenic beach run along the beautiful coast of Rio de Janeiro.', '2024-08-15', 'Rio de Janeiro, RJ', 10.0, 2000, 850, 80.00, '["5km","10km"]', 'published', :organizerId2, '06:30:00', '10:00:00', '2024-02-01', '2024-08-01', 'https://example.com/maps/rio-beach-run.png', 'Bring your own water bottle. No headphones allowed for safety.', NOW(), NOW()),
            ('Mountain Trail Challenge', 'Challenging trail run through mountainous terrain. For experienced runners only.', '2024-11-05', 'Campos do Jordão, SP', 25.0, 500, 120, 200.00, '["25km"]', 'draft', :organizerId3, '08:00:00', '17:00:00', '2024-03-01', '2024-10-25', 'https://example.com/maps/mountain-trail.png', 'Mandatory safety equipment: headlamp, whistle, emergency blanket.', NOW(), NOW())
        `, {
          replacements: { 
            organizerId1: userMap['organizer1'],
            organizerId2: userMap['organizer1'],
            organizerId3: userMap['organizer1']
          },
          type: sequelize.QueryTypes.INSERT
        });
        console.log('✅ Races inserted successfully');
      } catch (error) {
        console.log('⚠️ Failed to insert races:', error.message);
      }
    } else {
      console.log('✅ Races already exist, skipping insertion');
    }

    // Get race IDs
    const raceResult = await sequelize.query(
      `SELECT id, name FROM "Races"`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const raceMap = {};
    raceResult.forEach(race => {
      raceMap[race.name] = race.id;
    });

    console.log('Race map:', raceMap);

    // Insert race participations with UPSERT
    console.log('Inserting race participations...');
    try {
      await sequelize.query(`
        INSERT INTO "RaceParticipations" ("raceId", "userId", category, "bibNumber", "registrationDate", status, "paymentStatus", "paymentAmount", "paymentDate", "paymentMethod", "transactionId", "estimatedTime", "ageGroup", gender, "emergencyContact", "emergencyPhone", "tshirtSize", "waiverSigned", "waiverSignedAt", "createdAt", "updatedAt")
        VALUES 
          (:raceId1, :userId1, '42km', 'SPM2024-001', '2024-01-15', 'confirmed', 'paid', 150.00, '2024-01-15', 'credit_card', 'TXN-001', '04:30:00', '30-39', 'male', 'Mary Runner', '+55 11 99999-9999', 'M', true, '2024-01-15', NOW(), NOW()),
          (:raceId2, :userId2, '21km', 'SPM2024-002', '2024-02-01', 'confirmed', 'paid', 150.00, '2024-02-01', 'pix', 'TXN-002', '02:15:00', '25-29', 'female', 'John Doe', '+55 21 98888-8888', 'S', true, '2024-02-01', NOW(), NOW()),
          (:raceId3, :userId3, '10km', 'RBR2024-001', '2024-02-10', 'registered', 'pending', 80.00, NULL, NULL, NULL, NULL, '30-39', 'male', 'Mary Runner', '+55 11 99999-9999', 'M', false, NULL, NOW(), NOW()),
          (:raceId4, :userId4, '5km', 'RBR2024-002', '2024-02-12', 'confirmed', 'paid', 80.00, '2024-02-12', 'credit_card', 'TXN-003', '00:35:00', '40-49', 'male', 'Alice Sprinter', '+55 31 97777-7777', 'L', true, '2024-02-12', NOW(), NOW())
        ON CONFLICT ("raceId", "userId") DO NOTHING;
      `, {
        replacements: { 
          raceId1: raceMap['São Paulo Marathon 2024'],
          raceId2: raceMap['São Paulo Marathon 2024'],
          raceId3: raceMap['Rio Beach Run 2024'],
          raceId4: raceMap['Rio Beach Run 2024'],
          userId1: userMap['runner1'],
          userId2: userMap['runner2'],
          userId3: userMap['runner1'],
          userId4: userMap['runner3']
        },
        type: sequelize.QueryTypes.INSERT
      });
      console.log('✅ Race participations inserted or already exist');
    } catch (error) {
      console.log('⚠️ Race participations insertion skipped (already exist):', error.message);
    }

    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();