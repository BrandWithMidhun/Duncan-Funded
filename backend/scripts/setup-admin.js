// Admin setup — creates (or updates) the admin account from environment
// variables. Run once after deployment:  npm run setup:admin
//
// Required env vars:
//   ADMIN_EMAIL     — login email for the admin
//   ADMIN_PASSWORD  — login password (choose a strong one)
//   ADMIN_NAME      — display name (optional, defaults to "Site Admin")
import 'dotenv/config';
import { initDb, closeDb } from '../src/lib/db.js';
import { upsertAdmin } from '../src/services/authService.js';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Site Admin';

  if (!email || !password) {
    console.error(
      'ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  console.log('🔐 Setting up admin account...');
  await initDb();
  const result = await upsertAdmin({ email, password, name });
  console.log(
    result.created
      ? `✅ Admin account created: ${result.email}`
      : `✅ Admin account updated: ${result.email}`,
  );
  console.log('   You can now sign in at /admin/login on the site.');
}

main()
  .then(() => closeDb())
  .catch(async (e) => {
    console.error(e);
    await closeDb();
    process.exit(1);
  });
