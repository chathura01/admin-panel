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

  // Helper: robust check to guarantee only admins can modify
  const canModify = (context) => {
    const role = context?.currentAdmin?.role;
    // Log for debugging
    // console.log('[AdminJS canModify check] User role is:', role);
    return role === 'admin';
  };

  // Helper: rigorous hook to block execution
  const strictAccessHook = async (request, context) => {
    if (context?.currentAdmin?.role !== 'admin') {
      throw new Error('Forbidden: You do not have permission to execute this action.');
    }
    return request;
  };

  const restrictedAction = {
    isAccessible: canModify,
    isVisible: canModify,
    before: strictAccessHook,
  };

  const resources = [
    // ── Users: admin-only ─────────────────────────────────────────────────────
    {
      resource: db.User,
      options: {
        properties: { password: { isVisible: false } },
        actions: {
          list:   { isAccessible: canModify },
          show:   { isAccessible: canModify },
          search: { isAccessible: canModify },
          new:     restrictedAction,
          edit:   restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // ── Categories: visible to all, editable by admin only ────────────────────
    {
      resource: db.Category,
      options: {
        actions: {
          new:        restrictedAction,
          edit:       restrictedAction,
          delete:     restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // ── Products: visible to all, editable by admin only ─────────────────────
    {
      resource: db.Product,
      options: {
        actions: {
          new:        restrictedAction,
          edit:       restrictedAction,
          delete:     restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // ── Orders: users see only their own orders ───────────────────────────────
    {
      resource: db.Order,
      options: {
        actions: {
          new:        restrictedAction,
          edit:       restrictedAction,
          delete:     restrictedAction,
          bulkDelete: restrictedAction,

          // Before listing, inject a userId filter for regular users
          list: {
            before: async (request, context) => {
              const { currentAdmin } = context;
              if (currentAdmin && currentAdmin.role !== 'admin') {
                request.query = request.query || {};
                request.query['filters.userId'] = currentAdmin.id;
              }
              return request;
            },
          },

          // Only allow show if the order belongs to the logged-in user (or admin)
          show: {
            isAccessible: ({ currentAdmin, record }) => {
              if (!currentAdmin) return false;
              if (currentAdmin.role === 'admin') return true;
              return record && record.params && record.params.userId === currentAdmin.id;
            },
          },
        },
      },
    },

    // ── OrderItems: admin-only ────────────────────────────────────────────────
    {
      resource: db.OrderItem,
      options: {
        actions: {
          list:   { isAccessible: canModify },
          show:   { isAccessible: canModify },
          new:    restrictedAction,
          edit:   restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // ── Settings: admin-only ──────────────────────────────────────────────────
    {
      resource: db.Setting,
      options: {
        actions: {
          list:   { isAccessible: canModify },
          show:   { isAccessible: canModify },
          search: { isAccessible: canModify },
          new:    restrictedAction,
          edit:   restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },
  ];

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
        const { currentAdmin } = context;

        // Regular users get profile + their own orders only
        if (currentAdmin && currentAdmin.role !== 'admin') {
          const myOrders = await db.Order.findAll({
            where: { userId: currentAdmin.id },
            order: [['createdAt', 'DESC']],
            limit: 10,
          });
          return {
            profile: {
              name: currentAdmin.name,
              email: currentAdmin.email,
              role: currentAdmin.role,
            },
            myOrders: myOrders.map(o => ({
              id: o.id,
              status: o.status,
              totalAmount: o.totalAmount,
              date: new Date(o.createdAt).toLocaleDateString(),
            })),
          };
        }

        // Admins get full analytics
        const usersCount = await db.User.count();
        const ordersCount = await db.Order.count();
        const productsCount = await db.Product.count();

        const totalRevenue = await db.Order.sum('totalAmount', {
          where: { status: ['paid', 'shipped', 'delivered'] },
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
          Orders: parseInt(row.count, 10),
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
