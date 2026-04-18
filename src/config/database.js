const { Sequelize } = require('sequelize');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;
