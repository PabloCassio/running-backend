'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Races', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Distance in kilometers',
      },
      maxParticipants: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      currentParticipants: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      registrationFee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      categories: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of race categories (e.g., ["5km", "10km", "21km"])',
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled'),
        defaultValue: 'draft',
        allowNull: false,
      },
      organizerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      registrationOpen: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      registrationClose: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      routeMap: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL to route map image',
      },
      rules: {
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
    await queryInterface.addIndex('Races', ['date'], {
      name: 'races_date_index',
    });
    await queryInterface.addIndex('Races', ['status'], {
      name: 'races_status_index',
    });
    await queryInterface.addIndex('Races', ['organizerId'], {
      name: 'races_organizer_id_index',
    });
    await queryInterface.addIndex('Races', ['location'], {
      name: 'races_location_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Races');
  },
};