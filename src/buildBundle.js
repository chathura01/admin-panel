const fs = require('fs');
const path = require('path');
const buildAdminRouter = require('./admin/index.js');

async function build() {
  try {
    // Aggressively clear old cache to force a fresh production build
    const adminjsDir = path.join(__dirname, '..', '.adminjs');
    if (fs.existsSync(adminjsDir)) {
      fs.rmSync(adminjsDir, { recursive: true, force: true });
      console.log('[AdminJS] Cleared stale build directory.');
    }

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
