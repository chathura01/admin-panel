const buildAdminRouter = require('./admin/index.js');

async function build() {
  try {
    const { admin } = await buildAdminRouter();
    // initialize() automatically generates the .adminjs/bundle.js based on loaded components
    await admin.initialize();
    console.log('[AdminJS] Production React Bundle successfully compiled.');
    process.exit(0);
  } catch (err) {
    console.error('[AdminJS] Bundling failed:', err);
    process.exit(1);
  }
}

build();
