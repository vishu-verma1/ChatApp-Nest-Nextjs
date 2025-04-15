const { type } = require('os');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      iv: {
        type: Sequelize.TEXT,
      },

      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      deletedForEveryone: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      deletedForSender: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      deletedForReceiver: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      isSeen: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      isDelivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      imageUrl: {
        type: Sequelize.TEXT,
      },

      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      receiverId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('messages');
  },
};
