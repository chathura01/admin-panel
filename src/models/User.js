const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'customer'),
    defaultValue: 'customer',
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: async (user) => {
      const { generateId } = require('../utils/idGenerator');
      if (!user.id) {
        user.id = await generateId(User, 'U');
      }
    }
  }
});

module.exports = User;
