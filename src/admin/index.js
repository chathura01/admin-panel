const db = require('../models');

async function buildAdminRouter() {
  const { default: AdminJS } = await import('adminjs');
  const AdminJSExpress = await import('@adminjs/express');
  const AdminJSSequelize = await import('@adminjs/sequelize');

  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });

  const adminOptions = {
    databases: [db.sequelize],
    rootPath: '/admin',
    resources: [
      db.User,
      db.Category,
      db.Product,
      db.Order,
      db.OrderItem,
      db.Setting,
    ],
    branding: {
      companyName: 'Admin Dashboard',
    },
  };

  const admin = new AdminJS(adminOptions);
  const adminRouter = AdminJSExpress.buildRouter(admin);

  return { admin, adminRouter };
}

module.exports = buildAdminRouter;
