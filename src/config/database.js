const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see the raw SQL queries
});

module.exports = sequelize;
