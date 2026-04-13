const sequelize = require('../config/database');

/**
 * Generates a sequential ID with a prefix
 * @param {Object} model - The Sequelize model
 * @param {string} prefix - The prefix for the ID
 * @returns {Promise<string>}
 */
const generateId = async (model, prefix) => {
  const lastRecord = await model.findOne({
    order: [
      [sequelize.fn('LENGTH', sequelize.col('id')), 'DESC'],
      ['id', 'DESC']
    ],
    // Ensure we are only looking at IDs with the correct prefix
    raw: true,
  });

  let nextNumber = 1;
  if (lastRecord && lastRecord.id && lastRecord.id.startsWith(prefix)) {
    const numPart = lastRecord.id.substring(prefix.length);
    const currentNumber = parseInt(numPart, 10);
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  // Format with padding
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = { generateId };
