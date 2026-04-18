const express = require('express');
const authRoutes = require('./routes/authRoutes');

module.exports = async function initApp() {
  const app = express();

  // Setup AdminJS BEFORE any global body parsers so express-formidable can parse streams
  const buildAdminRouter = require('./admin');
  const { admin, adminRouter } = await buildAdminRouter();

  // Force AdminJS to compile React components (Dashboard, Settings, OrderShow)
  await admin.initialize();
  console.log('AdminJS React bundle compiled successfully.');

  app.use(admin.options.rootPath, adminRouter);
  console.log('AdminJS setup completed.');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/auth', authRoutes);

  // Settings custom API
  app.get('/api/settings', async (req, res) => {
    const db = require('./models');
    const settingsRaw = await db.Setting.findAll({ where: { key: ['shopName', 'supportEmail'] } });
    const settings = { shopName: 'Admin Dashboard', supportEmail: 'support@example.com' };
    settingsRaw.forEach(s => settings[s.key] = s.value);
    res.json(settings);
  });

  app.post('/api/settings', async (req, res) => {
    const db = require('./models');
    const { shopName, supportEmail } = req.body;
    if (shopName) await db.Setting.upsert({ key: 'shopName', value: String(shopName) });
    if (supportEmail) await db.Setting.upsert({ key: 'supportEmail', value: String(supportEmail) });
    res.json({ success: true });
  });

  // Basic health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });

  return app;
};
