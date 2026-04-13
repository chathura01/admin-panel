const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: async (orderItem) => {
      const { generateId } = require('../utils/idGenerator');
      if (!orderItem.id) {
        orderItem.id = await generateId(OrderItem, 'OI');
      }
    }
  }
});

module.exports = OrderItem;
