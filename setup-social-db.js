// This script sets up the social database tables
// Run with: node setup-social-db.js

import('./src/scripts/setupSocialDatabase.js')
  .then(() => {
    console.log('Setup script executed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error executing setup script:', err);
    process.exit(1);
  });
