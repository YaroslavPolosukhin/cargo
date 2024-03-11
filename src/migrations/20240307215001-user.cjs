"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "roles", // Имя таблицы ролей
          key: "id",
        },
        allowNull: false,
        onUpdate: "CASCADE",
      },
      approved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      responsible_user: {
        type: Sequelize.INTEGER,
        references: {
          model: "users", // Имя таблицы пользователей для самосвязывания
          key: "id",
        },
        allowNull: true,
        onUpdate: "CASCADE",
      },
      refresh_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fcm_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
