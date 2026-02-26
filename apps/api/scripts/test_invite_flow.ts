import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jar = new CookieJar();
const client = wrapper(
  axios.create({
    baseURL: 'http://127.0.0.1:4180/api', // Using 4180 assuming backend is there, or 4181?
    // Backend was running on 4181 in previous steps. Let's use 4181.
    jar,
    withCredentials: true,
    validateStatus: () => true,
  } as any) as any,
);

// Override baseURL to 4181 if that's what's running
client.defaults.baseURL = 'http://127.0.0.1:4181/api';

async function runTest() {
  console.log('🔍 Testing Invite Flow...');

  const inviteEmail = 'invite_test@demo.com';

  // Cleanup potential previous run
  await prisma.user.deleteMany({ where: { email: inviteEmail } });

  // 1. Login Admin
  const loginRes = await client.post('/auth/login', {
    email: 'admin@demo.com',
    password: 'password123',
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error('❌ Admin Login failed', loginRes.status, loginRes.data);
    process.exit(1);
  }
  const adminToken = loginRes.data.access_token;
  client.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
  console.log('✅ Admin Logged In');

  // 2. Send Invite
  console.log('👉 Sending Invite...');
  const inviteRes = await client.post('/admin/invite', {
    email: inviteEmail,
    role: 'USER',
    name: 'Invited User',
  });

  if (inviteRes.status !== 201) {
    console.error('❌ Invite failed', inviteRes.status, inviteRes.data);
    process.exit(1);
  }

  const invitationToken = inviteRes.data.invitationToken;
  if (!invitationToken) {
    console.error('❌ No invitation token returned');
    process.exit(1);
  }
  console.log('✅ Invite Sent. Token:', invitationToken);

  // 3. Accept Invite (Public Endpoint - Clear Auth Header)
  delete client.defaults.headers.common['Authorization'];

  console.log('👉 Accepting Invite...');
  const newPassword = 'newPassword123!';
  const acceptRes = await client.post('/auth/accept-invite', {
    token: invitationToken,
    password: newPassword,
  });

  if (acceptRes.status !== 201) {
    console.error('❌ Accept Invite failed', acceptRes.status, acceptRes.data);
    process.exit(1);
  }

  if (!acceptRes.data.access_token || !acceptRes.data.user) {
    console.error('❌ Missing token/user in accept response');
    process.exit(1);
  }

  console.log('✅ Invite Accepted & Logged In as:', acceptRes.data.user.email);

  // 4. Verify DB Status
  const user = await prisma.user.findUnique({ where: { email: inviteEmail } });
  if (user?.status !== 'ACTIVE') {
    console.error('❌ User status is not ACTIVE:', user?.status);
    process.exit(1);
  }
  if (user?.password === null) {
    console.error('❌ User password is still null');
    process.exit(1);
  }

  console.log('✅ DB Verification Passed');

  // Cleanup
  await prisma.user.delete({ where: { email: inviteEmail } });
  console.log('🧹 Cleanup complete');
}

runTest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
