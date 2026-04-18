const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: async (order) => {
      const { generateId } = require('../utils/idGenerator');
      if (!order.id) {
        order.id = await generateId(Order, 'O');
      }
    }
  }
});

module.exports = Order;
