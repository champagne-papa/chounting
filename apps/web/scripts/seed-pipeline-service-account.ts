// One-off: seed ONLY the pipeline service-account (SYSTEM_ACTOR_USER_ID) into auth.users.
//
// Fixes the missing audit_log.user_id FK target (audit_log_user_id_fkey ->
// auth.users(id)) that rolls back every automation state-transition and pins
// every document_case at 'received'. Run ONCE against PROD.
//
// Does NOT touch the dev human accounts in seed-auth-users.ts. Self-diagnosing:
// prints exactly where it stops so a failed run explains itself.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYSTEM_ACTOR_USER_ID = '00000000-0000-0000-0000-0000000000a1';
const PROD_PROJECT_REF = 'ollyqiiwdvbpbngqgjqk';

console.log('[seed-service-account] start');
console.log('[seed-service-account] NEXT_PUBLIC_SUPABASE_URL =', SUPABASE_URL ?? '(UNSET)');
console.log(
  '[seed-service-account] SUPABASE_SERVICE_ROLE_KEY =',
  SERVICE_ROLE_KEY ? `set (length ${SERVICE_ROLE_KEY.length})` : '(UNSET)',
);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.');
  process.exit(1);
}
// Wrong-project guard: refuse unless pointed at the PROD project ref.
if (!SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  console.error(
    `FATAL: URL (${SUPABASE_URL}) does not contain the prod project ref '${PROD_PROJECT_REF}'. ` +
      'Aborting (wrong-project guard).',
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log(`[seed-service-account] calling admin.createUser for ${SYSTEM_ACTOR_USER_ID} ...`);
  // NO deleteUser precursor — the row does not exist; never risk deleting.
  const { data, error } = await admin.auth.admin.createUser({
    id: SYSTEM_ACTOR_USER_ID, // MUST equal SYSTEM_ACTOR_USER_ID in serviceContext.ts
    email: 'pipeline@chou.ca',
    // No password: the service account never authenticates by password (the
    // pipeline acts AS it via the withInvariants system-actor bypass). A
    // passwordless row still satisfies the audit_log.user_id FK.
    email_confirm: true,
    user_metadata: { role_label: 'system_actor' },
  });

  if (error) {
    console.error('FAILED: admin.createUser returned an error:');
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }

  const createdId = data.user?.id;
  console.log('createUser returned id =', createdId, 'email =', data.user?.email);
  if (createdId !== SYSTEM_ACTOR_USER_ID) {
    console.error(
      `WARNING: created id (${createdId}) != target (${SYSTEM_ACTOR_USER_ID}). ` +
        'The explicit id param was NOT honored — the FK is still unsatisfied. Stop and report.',
    );
    process.exit(2);
  }
  console.log(`SUCCESS: seeded pipeline service account ${SYSTEM_ACTOR_USER_ID} into auth.users.`);
}

main().catch((e) => {
  console.error('UNCAUGHT:', e);
  process.exit(1);
});
