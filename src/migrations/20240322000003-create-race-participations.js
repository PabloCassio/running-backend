'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RaceParticipations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      raceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Races',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Race category (e.g., "5km", "10km", "21km")',
      },
      bibNumber: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      registrationDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      status: {
        type: Sequelize.ENUM('registered', 'confirmed', 'checked_in', 'started', 'finished', 'dnf', 'disqualified'),
        defaultValue: 'registered',
        allowNull: false,
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'paid', 'refunded', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false,
      },
      paymentAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      transactionId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      estimatedTime: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Estimated finish time (HH:MM:SS)',
      },
      actualTime: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Actual finish time (HH:MM:SS)',
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Actual start time',
      },
      finishTime: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Actual finish time',
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Final position in race',
      },
      ageGroup: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Age group (e.g., "18-25", "26-35")',
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: true,
      },
      emergencyContact: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      emergencyPhone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      medicalConditions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tshirtSize: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      waiverSigned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      waiverSignedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('RaceParticipations', ['raceId', 'userId'], {
      name: 'race_participations_race_user_index',
      unique: true,
    });
    await queryInterface.addIndex('RaceParticipations', ['raceId'], {
      name: 'race_participations_race_id_index',
    });
    await queryInterface.addIndex('RaceParticipations', ['userId'], {
      name: 'race_participations_user_id_index',
    });
    await queryInterface.addIndex('RaceParticipations', ['status'], {
      name: 'race_participations_status_index',
    });
    await queryInterface.addIndex('RaceParticipations', ['paymentStatus'], {
      name: 'race_participations_payment_status_index',
    });
    await queryInterface.addIndex('RaceParticipations', ['bibNumber'], {
      name: 'race_participations_bib_number_index',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RaceParticipations');
  },
};