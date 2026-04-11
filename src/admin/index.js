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

  // Setup Dashboard and Page Components
  const { ComponentLoader } = await import('adminjs');
  const componentLoader = new ComponentLoader();
  const DashboardComponent = componentLoader.add('Dashboard', './components/Dashboard.jsx');
  const SettingsComponent = componentLoader.add('Settings', './components/Settings.jsx');

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
      options.actions.list = { isAccessible: canModify };
      options.actions.show = { isAccessible: canModify };
      options.actions.search = { isAccessible: canModify };
    }

    return { resource: model, options };
  });

  const adminOptions = {
    databases: [db.sequelize],
    rootPath: '/admin',
    resources,
    componentLoader,
    pages: {
      Settings: {
        component: SettingsComponent,
        icon: 'SetAsCurrentProject',
        handler: async (request, response, context) => {
          if (request.method === 'post') {
            const updates = request.payload?.settings || [];
            for (const sp of updates) {
              // Create or update key-value pairs
              await db.Setting.upsert({ key: sp.key, value: sp.value });
            }
            return { settings: updates };
          }
          const data = await db.Setting.findAll();
          return { settings: data };
        },
      },
    },
    dashboard: {
      component: DashboardComponent,
      handler: async (request, response, context) => {
        const usersCount = await db.User.count();
        const ordersCount = await db.Order.count();
        const productsCount = await db.Product.count();

        const totalRevenue = await db.Order.sum('totalAmount', {
          where: { status: ['paid', 'shipped', 'delivered'] }
        }) || 0;

        const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
        const statusCounts = {};
        for (const st of statuses) {
           statusCounts[st] = await db.Order.count({ where: { status: st } });
        }

        const [recentOrdersRaw] = await db.sequelize.query(`
          SELECT DATE("createdAt") as date, COUNT(id) as count 
          FROM "Orders" 
          GROUP BY DATE("createdAt") 
          ORDER BY DATE("createdAt") DESC 
          LIMIT 14
        `);
        
        const ordersByDay = recentOrdersRaw.reverse().map(row => ({
           date: new Date(row.date).toLocaleDateString(),
           Orders: parseInt(row.count, 10)
        }));

        return { 
          usersCount, 
          ordersCount, 
          productsCount, 
          totalRevenue,
          statusCounts,
          ordersByDay,
        };
      },
    },
    branding: {
      companyName: 'Admin Dashboard',
    },
  };

  const admin = new AdminJS(adminOptions);

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => {
      console.log(`[AdminJS] Login attempt for email: ${String(email)}`);
      const user = await db.User.findOne({ where: { email } });
      if (user) {
        const matched = await bcrypt.compare(password, user.password);
        if (matched) {
          console.log(`[AdminJS] Login successful for: ${email}`);
          return user.toJSON();
        } else {
          console.log(`[AdminJS] Invalid password for: ${email}`);
        }
      } else {
        console.log(`[AdminJS] User not found: ${email}`);
      }
      return false;
    },
    cookiePassword: process.env.COOKIE_PASSWORD || 'very-secure-cookie-password-change-me',
    cookieName: 'adminjs',
  });

  return { admin, adminRouter };
}

module.exports = buildAdminRouter;
