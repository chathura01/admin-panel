const db = require('../models');
const bcrypt = require('bcrypt');

async function buildAdminRouter() {
  const { default: AdminJS } = await import('adminjs');
  const AdminJSExpress = await import('@adminjs/express');
  const AdminJSSequelize = await import('@adminjs/sequelize');

  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });

  // Setup Dashboard Component
  const { ComponentLoader } = await import('adminjs');
  const componentLoader = new ComponentLoader();
  const DashboardComponent = componentLoader.add('Dashboard', './components/Dashboard');

  // RBAC Roles
  const canModify = ({ currentAdmin }) => {
    return currentAdmin && currentAdmin.role === 'admin';
  };

  const resources = [
    db.User,
    db.Category,
    db.Product,
    db.Order,
    db.OrderItem,
    db.Setting,
  ].map((model) => {
    const options = {
      actions: {
        new: { isAccessible: canModify },
        edit: { isAccessible: canModify },
        delete: { isAccessible: canModify },
      },
    };

    // Hide password field
    if (model.name === 'User') {
      options.properties = {
        password: { isVisible: false },
      };
    }

    // Hide User and Setting entirely from regular users
    if (model.name === 'User' || model.name === 'Setting') {
      options.isAccessible = canModify; // Evaluates false for non-admins, completely hiding resource
    }

    return { resource: model, options };
  });

  const adminOptions = {
    databases: [db.sequelize],
    rootPath: '/admin',
    resources,
    componentLoader,
    dashboard: {
      component: DashboardComponent,
    },
    branding: {
      companyName: 'Admin Dashboard',
    },
  };

  const admin = new AdminJS(adminOptions);

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => {
      const user = await db.User.findOne({ where: { email } });
      if (user) {
        const matched = await bcrypt.compare(password, user.password);
        if (matched) {
          return user.toJSON();
        }
      }
      return false;
    },
    cookiePassword: process.env.COOKIE_PASSWORD || 'very-secure-cookie-password-change-me',
    cookieName: 'adminjs',
  });

  return { admin, adminRouter };
}

module.exports = buildAdminRouter;
