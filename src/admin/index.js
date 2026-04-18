const path = require('path');
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
  const DashboardComponent = componentLoader.add('Dashboard', path.join(__dirname, 'components', 'Dashboard.jsx'));
  const SettingsComponent = componentLoader.add('Settings', path.join(__dirname, 'components', 'Settings.jsx'));
  const OrderShowComponent = componentLoader.add('OrderShow', path.join(__dirname, 'components', 'OrderShow.jsx'));

  // only admins can modify
  const canModify = (context) => {
    const role = context?.currentAdmin?.role;
    return role === 'admin';
  };

  const canViewAdminResource = ({ currentAdmin }) => currentAdmin?.role === 'admin';
  const canViewCustomerResource = ({ currentAdmin }) => !!currentAdmin && currentAdmin.role !== 'admin';
  const withoutFields = (model, fieldsToHide) =>
    Object.keys(model.rawAttributes || {}).filter(
      (field) => !fieldsToHide.includes(field)
    );

  // block execution
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
    // admin-only 
    {
      resource: db.User,
      options: {
        properties: { password: { isVisible: false } },
        actions: {
          list: { isAccessible: canModify },
          show: { isAccessible: canModify },
          search: { isAccessible: canModify },
          new: restrictedAction,
          edit: restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // Categories (admin view)
    {
      resource: db.Category,
      options: {
        actions: {
          list: { isAccessible: canViewAdminResource },
          show: { isAccessible: canViewAdminResource },
          search: { isAccessible: canViewAdminResource },
          new: restrictedAction,
          edit: restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // Products (admin view)
    {
      resource: db.Product,
      options: {
        actions: {
          list: { isAccessible: canViewAdminResource },
          show: { isAccessible: canViewAdminResource },
          search: { isAccessible: canViewAdminResource },
          new: restrictedAction,
          edit: restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // Orders (admin view)
    {
      resource: db.Order,
      options: {
        actions: {
          list: { isAccessible: canViewAdminResource },
          search: { isAccessible: canViewAdminResource },
          new: restrictedAction,
          edit: restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,

          // Show view with detailed items list
          show: {
            component: OrderShowComponent,
            isAccessible: ({ currentAdmin, record }) => {
              if (!currentAdmin) return false;
              return currentAdmin.role === 'admin' && !!record;
            },
            handler: async (request, response, context) => {
              const { record, currentAdmin, resource } = context;

              let targetRecord = record;
              if (!targetRecord && request.params.recordId) {
                targetRecord = await resource.findOne(request.params.recordId);
              }

              if (!targetRecord) {
                console.log(`[OrderShow Handler] No record found for ID: ${request.params.recordId}`);
                return { record: null, items: [] };
              }

              const recordData = targetRecord.toJSON(currentAdmin);
              const orderId = targetRecord.id();

              // Fetch items
              const items = await db.OrderItem.findAll({
                where: { orderId: orderId },
                include: [{ model: db.Product, as: 'product' }]
              });

              console.log(`[OrderShow Handler] Order: ${orderId}, Found ${items.length} items.`);

              // Inject items into record.params
              recordData.params.itemsList = items.map(item => ({
                id: item.id,
                productName: item.product?.name || 'Unknown Product',
                quantity: item.quantity,
                price: item.price,
                subtotal: (item.quantity * item.price).toFixed(2)
              }));

              return {
                record: recordData
              };
            }
          },
        },
      },
    },

    // OrderItems: admin-only
    {
      resource: db.OrderItem,
      options: {
        actions: {
          list: { isAccessible: canModify },
          show: { isAccessible: canModify },
          new: restrictedAction,
          edit: restrictedAction,
          delete: restrictedAction,
          bulkDelete: restrictedAction,
        },
      },
    },

    // Settings: admin-only
    {
      resource: db.Setting,
      options: {
        navigation: false,
        actions: {
          list: { isAccessible: canModify },
          show: { isAccessible: canModify },
          search: { isAccessible: canModify },
          new: restrictedAction,
          edit: restrictedAction,
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
      Admin_Shop_Settings: {
        label: 'Shop Settings',
        component: SettingsComponent,
        icon: 'SetAsCurrentProject',
        isVisible: ({ currentAdmin }) => currentAdmin?.role === 'admin',
        isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin',
        handler: async (request, response, context) => {
          const defaultKeys = ['shopName', 'supportEmail'];

          if (request.method === 'post') {
            const updates = request.payload?.settings || {};
            for (const key of Object.keys(updates)) {
              await db.Setting.upsert({ key, value: String(updates[key]) });
            }
            return { settings: updates };
          }

          const settingsRaw = await db.Setting.findAll({
            where: { key: defaultKeys }
          });
          
          const settings = {};
          defaultKeys.forEach(k => {
            const found = settingsRaw.find(s => s.key === k);
            settings[k] = found ? found.value : '';
          });

          return { settings };
        },
      },
    },
    dashboard: {
      component: DashboardComponent,
      handler: async (request, response, context) => {
        const { currentAdmin } = context;

        // Fetch store settings for both admin and customer views
        const settingsRaw = await db.Setting.findAll({
          where: { key: ['shopName', 'supportEmail'] }
        });
        const settings = {};
        ['shopName', 'supportEmail'].forEach(k => {
          const found = settingsRaw.find(s => s.key === k);
          settings[k] = found ? found.value : (k === 'shopName' ? 'Admin Dashboard' : '');
        });

        // profile + their own orders - regular users
        if (currentAdmin && currentAdmin.role !== 'admin') {
          const myOrders = await db.Order.findAll({
            where: { userId: currentAdmin.id },
            order: [['createdAt', 'DESC']],
            limit: 10,
          });
          return {
            shopName: settings.shopName,
            supportEmail: settings.supportEmail,
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

        // full analytics - admin
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
          shopName: settings.shopName,
          supportEmail: settings.supportEmail,
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

  // Force-compile React components (Dashboard, Settings, OrderShow) regardless of NODE_ENV.
  // AdminJS skips bundling when NODE_ENV=production (Railway's default).
  // Using @adminjs/bundler directly guarantees compilation in ALL environments.
  const { bundle } = await import('@adminjs/bundler');
  await bundle({ componentLoader, destinationDir: '.adminjs' });
  console.log('[AdminJS] React components force-bundled successfully.');

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
