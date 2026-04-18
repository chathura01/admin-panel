require('dotenv').config();
const sequelize = require('./config/database');
const initApp = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Authenticate the database connection
    await sequelize.authenticate();
    console.log('Database cconnected successfully.');

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
