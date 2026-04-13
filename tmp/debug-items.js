const { Order, OrderItem, Product, sequelize } = require('../src/models');

async function debug() {
  try {
    await sequelize.authenticate();
    console.log('--- Debugging Order -> Items ---');
    
    const orders = await Order.findAll({ limit: 5 });
    if (orders.length === 0) {
      console.log('No orders found.');
      return;
    }
    
    for (const order of orders) {
      console.log(`Order ID: ${order.id}`);
      const items = await OrderItem.findAll({
        where: { orderId: order.id },
        include: [{ model: Product, as: 'product' }]
      });
      console.log(`Found ${items.length} items for this order.`);
      items.forEach(item => {
        console.log(` - Item ID: ${item.id}, Product: ${item.product?.name || 'NULL'}, Qty: ${item.quantity}`);
      });
    }
    
    // Also check all items and their orderIds
    const allItems = await OrderItem.findAll();
    console.log('\nAll Order Items in DB:');
    allItems.forEach(item => {
      console.log(`- Item ID: ${item.id}, Pointing to orderId: ${item.orderId}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();
