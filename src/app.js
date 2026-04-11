const express = require('express');
const authRoutes = require('./routes/authRoutes');

module.exports = async function initApp() {
  const app = express();

  // Setup AdminJS BEFORE any global body parsers so express-formidable can parse streams
  const buildAdminRouter = require('./admin');
  const { admin, adminRouter } = await buildAdminRouter();
  app.use(admin.options.rootPath, adminRouter);
  console.log('AdminJS setup completed.');

  // Now apply standard body parsers for rest of API 
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/auth', authRoutes);

  // Basic health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });

  return app;
};
