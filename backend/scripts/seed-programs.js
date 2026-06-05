// Seed the programs table with the default lineup defined in
// src/data/defaultPrograms.js. Idempotent — skips if any rows exist.
// Pass --force to wipe and reseed.
import 'dotenv/config';
import { initDb, closeDb, run, get } from '../src/lib/db.js';
import { genId, now, toSlug } from '../src/lib/helpers.js';
import { DEFAULT_PROGRAMS } from '../src/data/defaultPrograms.js';

const force = process.argv.includes('--force');

async function main() {
  console.log(force ? '🌱 Force-seeding programs...' : '🌱 Seeding programs...');
  await initDb();

  if (force) {
    await run('DELETE FROM programs', []);
  } else {
    const existing = await get('SELECT COUNT(*) AS n FROM programs', []);
    if (Number(existing.n) > 0) {
      console.log('• Programs already populated — pass --force to reseed. Skipped.');
      return;
    }
  }

  let i = 0;
  for (const p of DEFAULT_PROGRAMS) {
    const id = genId();
    let slug = toSlug(p.name);
    let n = 2;
    while (await get('SELECT 1 FROM programs WHERE slug = ?', [slug])) {
      slug = `${toSlug(p.name)}-${n++}`;
    }
    const ts = now();
    await run(
      `INSERT INTO programs
       (id, slug, category, name, popular, platforms, sizes, prices, rules, addons, "order", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        p.category,
        p.name,
        p.popular || false,
        JSON.stringify(p.platforms || []),
        JSON.stringify(p.sizes || []),
        JSON.stringify(p.prices || {}),
        JSON.stringify(p.rules || []),
        JSON.stringify(p.addons || []),
        i++,
        ts,
        ts,
      ],
    );
  }
  console.log(`✅ Seeded ${i} programs.`);
}

main()
  .then(() => closeDb())
  .catch(async (e) => {
    console.error(e);
    await closeDb();
    process.exit(1);
  });
