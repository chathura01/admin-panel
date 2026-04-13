const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: async (category) => {
      const { generateId } = require('../utils/idGenerator');
      if (!category.id) {
        category.id = await generateId(Category, 'C');
      }
    }
  }
});

module.exports = Category;
