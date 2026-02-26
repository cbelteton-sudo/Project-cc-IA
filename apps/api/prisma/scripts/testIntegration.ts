import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApi() {
  const dayana = await prisma.user.findFirst({
    where: { email: { contains: 'dayana' } },
  });
  if (!dayana) throw new Error('Dayana not found');

  const contractor = await prisma.contractor.findFirst({
    where: { name: { contains: 'SmartBusiness' } },
  });

  console.log('Dayana ID:', dayana.id);
  console.log('Contractor ID:', contractor?.id);

  // Generate a mock response by logging in as carlos to get the token
  const loginRes = await axios.post('http://localhost:4181/api/auth/login', {
    email: 'carlos@torremawi.com',
    password: 'password123',
  });
  const token = loginRes.data.access_token;
  const projectId = '12ad21cc-248e-4f22-a171-686682c391cb'; // Demo project

  // Test 1: Set to None ("")
  console.log('--- TEST 1: Unset to "" ---');
  let patchData = { role: 'PM', contractorId: '' };
  let res = await axios.patch(
    `http://localhost:4181/api/admin/projects/${projectId}/members/${dayana.id}`,
    patchData,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log('Status:', res.status);

  let check = await prisma.user.findUnique({ where: { id: dayana.id } });
  console.log('DB contractorId after unset:', check?.contractorId);

  // Test 2: Set to SmartBusiness
  console.log('--- TEST 2: Set to SmartBusiness ---');
  patchData = { role: 'PM', contractorId: contractor!.id };
  res = await axios.patch(
    `http://localhost:4181/api/admin/projects/${projectId}/members/${dayana.id}`,
    patchData,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log('Status:', res.status);

  check = await prisma.user.findUnique({ where: { id: dayana.id } });
  console.log('DB contractorId after set:', check?.contractorId);
}

testApi()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
