import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SEED_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'executive@thebridge.local',
    password: 'DevSeed!Executive#1',
    role_label: 'executive',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'controller@thebridge.local',
    password: 'DevSeed!Controller#1',
    role_label: 'controller',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'ap@thebridge.local',
    password: 'DevSeed!ApSpec#1',
    role_label: 'ap_specialist',
  },
];

async function main() {
  for (const user of SEED_USERS) {
    await admin.auth.admin.deleteUser(user.id).catch(() => {});

    const { error } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role_label: user.role_label },
    });

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
      process.exit(1);
    }
    console.log(`Created seed user: ${user.email} (${user.id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});