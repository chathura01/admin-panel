require('dotenv').config();
const sequelize = require('./config/database');
const initApp = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Authenticate the database connection
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // --- AUTO-SEED INITIAL USERS ---
    try {
      const db = require('./models');
      const bcrypt = require('bcrypt');
      await db.sequelize.sync(); // ensure tables exist first
      
      const defaultPw = await bcrypt.hash('1234', 10);

      const [, adminCreated] = await db.User.findOrCreate({
        where: { email: 'admin@email.com' },
        defaults: { name: 'Admin', password: defaultPw, role: 'admin' }
      });
      if (adminCreated) console.log('Seeded initial admin@email.com');

      const [, userCreated] = await db.User.findOrCreate({
        where: { email: 'user@email.com' },
        defaults: { name: 'Customer', password: defaultPw, role: 'customer' }
      });
      if (userCreated) console.log('Seeded initial user@email.com');
    } catch (seedErr) {
      console.warn('Auto-seed check complete:', seedErr.message);
    }
    // --- END AUTO-SEED ---

    // Initialize application routes asynchronously
    const app = await initApp();


    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
