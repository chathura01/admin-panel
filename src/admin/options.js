const AdminJS = require('adminjs');
const AdminJSSequelize = require('@adminjs/sequelize');
const db = require('../models');

// Register the Sequelize adapter for AdminJS
AdminJS.AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

const adminOptions = {
  databases: [db.sequelize],
  rootPath: '/admin',
  resources: [
    db.User,
    db.Category,
    db.Product,
    db.Order,
    db.OrderItem,
    db.Setting,
  ],
  branding: {
    companyName: 'Admin Dashboard',
  },
};

module.exports = adminOptions;
