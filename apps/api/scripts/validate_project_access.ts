import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const jar = new CookieJar();
const client = wrapper(
  axios.create({
    baseURL: 'http://127.0.0.1:4181/api',
    jar,
    withCredentials: true,
  } as any) as any,
);

const ADMIN_EMAIL = 'admin@demo.com';
const PASSWORD = 'password123';
const INTRUDER_EMAIL = 'intruder@demo.com';

async function runTests() {
  console.log('🚀 Starting Project Access Control Validation...\n');

  try {
    // 0. Setup Data
    console.log('0️⃣  Setting up Test Data...');
    const project = await prisma.project.findFirst({
      where: { code: 'T-MAWI' },
    });
    if (!project)
      throw new Error('Project TORRE MAWI DEMO not found. Seed first.');
    console.log(`   - Project Found: ${project.name} (${project.id})`);

    const hash = await bcrypt.hash(PASSWORD, 10);
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
    if (!tenant) throw new Error('Tenant demo not found');

    const intruder = await prisma.user.upsert({
      where: { email: INTRUDER_EMAIL },
      update: { password: hash },
      create: {
        email: INTRUDER_EMAIL,
        name: 'Intruder User',
        password: hash,
        role: 'USER', // Normal user
        tenantId: tenant.id,
      },
    });
    console.log(`   - Intruder User Ready: ${intruder.email} (${intruder.id})`);

    // Ensure intruder is NOT member
    await prisma.projectMember.deleteMany({
      where: { userId: intruder.id, projectId: project.id },
    });
    console.log('   - Intruder removed from project members');

    // Helper for Login
    const login = async (email: string, password: string) => {
      console.log('   (Waiting 15s to avoid rate limit...)');
      await new Promise((resolve) => setTimeout(resolve, 15000));
      const res = await client.post('/auth/login', { email, password });
      const token = res.data.access_token;
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return res;
    };

    // 1. Admin Access Test
    console.log('\n1️⃣  Testing Admin Access...');
    // Login Admin
    await login(ADMIN_EMAIL, PASSWORD);
    console.log('   - Admin Logged In');

    // Get Project
    const adminProjectRes = await client.get(`/projects/${project.id}`);
    if (adminProjectRes.status === 200) {
      console.log('   ✅ Admin can access project details');
    }

    // Get Members
    const adminMembersRes = await client.get(
      `/admin/projects/${project.id}/members`,
    );
    if (adminMembersRes.status === 200) {
      console.log(
        `   ✅ Admin can list members (${adminMembersRes.data.length} members)`,
      );
    }

    // 2. Intruder Access Test (No Membership)
    console.log('\n2️⃣  Testing Intruder Access (No Membership)...');
    // Login Intruder
    await login(INTRUDER_EMAIL, PASSWORD);
    console.log('   - Intruder Logged In');

    // Try Get Project
    try {
      await client.get(`/projects/${project.id}`);
      console.error('   ❌ Intruder ACCESSED project (Should be 403)');
      process.exit(1);
    } catch (e: any) {
      if (e.response && e.response.status === 403) {
        console.log('   ✅ Intruder denied access to project details (403)');
      } else {
        console.error('   ❌ Unexpected error:', e.message, e.response?.status);
        process.exit(1);
      }
    }

    // List Projects (Should not see T-MAWI)
    const intruderListRes = await client.get('/projects');
    const hasProject = intruderListRes.data.some(
      (p: any) => p.id === project.id,
    );
    if (!hasProject) {
      console.log('   ✅ Intruder does not see T-MAWI in project list');
    } else {
      console.error('   ❌ Intruder SEES T-MAWI in project list');
      process.exit(1);
    }

    // Try Admin Endpoint as Intruder
    try {
      await client.get(`/admin/projects/${project.id}/members`);
      console.error(
        '   ❌ Intruder ACCESSED admin members endpoint (Should be 403)',
      );
      process.exit(1);
    } catch (e: any) {
      if (e.response && e.response.status === 403) {
        console.log('   ✅ Intruder denied access to admin endpoint (403)');
      } else {
        console.warn(
          '   ⚠️ Unexpected error on admin endpoint:',
          e.message,
          e.response?.status,
        );
      }
    }

    // 3. Grant Access
    console.log('\n3️⃣  Testing Access Grant...');
    // Login Admin Again
    await login(ADMIN_EMAIL, PASSWORD);
    console.log('   - Admin Logged In');

    const addRes = await client.post(`/admin/projects/${project.id}/members`, {
      email: INTRUDER_EMAIL,
      role: 'USER',
    });

    if (addRes.status === 201) {
      console.log('   ✅ Admin added Intruder as Member');
    }

    // 4. Verify Access
    console.log('\n4️⃣  Verifying Access Granted...');
    // Login Intruder
    await login(INTRUDER_EMAIL, PASSWORD);
    console.log('   - Intruder Logged In');

    const grantedRes = await client.get(`/projects/${project.id}`);
    if (grantedRes.status === 200) {
      console.log('   ✅ Intruder now has access to project details');
    }

    // List Projects (Should See T-MAWI)
    const grantedListRes = await client.get('/projects');
    const hasProjectNow = grantedListRes.data.some(
      (p: any) => p.id === project.id,
    );
    if (hasProjectNow) {
      console.log('   ✅ Intruder now sees T-MAWI in project list');
    } else {
      console.error(
        '   ❌ Intruder DOES NOT SEE T-MAWI in project list (List filtering failed?)',
      );
    }

    // 5. Revoke Access
    console.log('\n5️⃣  Testing Access Revocation...');
    // Login Admin
    await login(ADMIN_EMAIL, PASSWORD); // Re-login strictly
    await client.delete(`/admin/projects/${project.id}/members/${intruder.id}`);
    console.log('   ✅ Admin removed Intruder');

    // Login Intruder
    await login(INTRUDER_EMAIL, PASSWORD);
    try {
      await client.get(`/projects/${project.id}`);
      console.error(
        '   ❌ Intruder ACCESSED project after removal (Should be 403)',
      );
      process.exit(1);
    } catch (e: any) {
      if (e.response && e.response.status === 403) {
        console.log('   ✅ Intruder denied access after removal (403)');
      } else {
        console.error('   ❌ Unexpected error after removal:', e.message);
      }
    }

    console.log('\n✅ All Access Control Tests Passed!');
  } catch (e: any) {
    console.error('\n❌ Test Script Error:', e.message);
    console.error('Full Error:', JSON.stringify(e, null, 2));
    if (e.response) {
      console.error('Response Data:', e.response.data);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
