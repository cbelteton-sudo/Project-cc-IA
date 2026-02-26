const API_URL = 'http://localhost:4181';
const PROJECT_ALPHA = 'p0000001-0000-4000-a000-000000000000';
const PROJECT_GAMMA = 'p0000003-0000-4000-a000-000000000000'; // User 1 shouldn't have access

const users = [
  { role: 'PM/DIRECTOR', email: 'pm_1@uatcorp.com', password: 'Developer1!' },
  { role: 'SUPERVISOR', email: 'supervisor_1@uatcorp.com', password: 'Developer1!' },
  { role: 'RESIDENTE', email: 'residente_1@uatcorp.com', password: 'Developer1!' },
];

async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    return data.access_token;
  } catch (e) {
    console.error(`Login failed for ${email}`, e.message);
    return null;
  }
}

async function testEndpoint(roleName, token, method, url, data = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(`${API_URL}${url}`, options);
    const passed =
      res.status === expectedStatus ||
      (expectedStatus === 200 && res.status === 201) ||
      (expectedStatus === 403 && res.status === 403) ||
      res.status === 201;
    console.log(
      `[${roleName}] ${method} ${url} - Status: ${res.status} - ${passed ? 'PASS' : 'FAIL'}`,
    );

    // Check if JSON response is expected before parsing
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      const json = await res.json();
      if (!passed) console.log(json);
      return json;
    }
    return null;
  } catch (e) {
    console.log(
      `[${roleName}] ${method} ${url} - EXPECTED: ${expectedStatus} - Error: ${e.message}`,
    );
    return null;
  }
}

async function run() {
  console.log('--- STARTING UAT & SMOKE E2E ---');
  for (const u of users) {
    console.log(`\nTesting Role: ${u.role} (${u.email})`);
    const token = await login(u.email, u.password);
    if (!token) {
      console.error('No token. Is server running and seed ran?');
      continue;
    }

    // 1. Visibilidad por proyecto (Isolation)
    await testEndpoint(u.role, token, 'GET', `/projects/${PROJECT_GAMMA}`, null, 403);

    // 2. ISSUES
    const issueData = await testEndpoint(u.role, token, 'POST', '/field-records', {
      type: 'ISSUE',
      projectId: PROJECT_ALPHA,
      content: { title: `Issue from ${u.role}`, description: 'Test', severity: 'HIGH' },
    });
    if (issueData?.id) {
      await testEndpoint(
        u.role,
        token,
        'GET',
        `/field-records?projectId=${PROJECT_ALPHA}&type=ISSUE`,
      );
      await testEndpoint(
        u.role,
        token,
        'GET',
        `/field-records/${issueData.id}?projectId=${PROJECT_ALPHA}&type=ISSUE`,
      );
    }

    // 3. DAILY ENTRY
    const dailyData = await testEndpoint(u.role, token, 'POST', '/field-records', {
      type: 'DAILY_ENTRY',
      projectId: PROJECT_ALPHA,
      status: 'DRAFT',
      content: { note: `Daily note ${u.role}`, progressChip: 20 },
    });
    await testEndpoint(
      u.role,
      token,
      'GET',
      `/field-records?projectId=${PROJECT_ALPHA}&type=DAILY_ENTRY`,
    );

    // 4. INSPECTION
    const inspectionData = await testEndpoint(u.role, token, 'POST', '/field-records', {
      type: 'INSPECTION',
      projectId: PROJECT_ALPHA,
      content: { type: 'Safety', notes: `Safety notes ${u.role}`, status: 'PASSED' },
    });
    if (inspectionData?.id) {
      await testEndpoint(
        u.role,
        token,
        'GET',
        `/field-records?projectId=${PROJECT_ALPHA}&type=INSPECTION`,
      );
      await testEndpoint(
        u.role,
        token,
        'GET',
        `/field-records/${inspectionData.id}?projectId=${PROJECT_ALPHA}&type=INSPECTION`,
      );
    }

    // 5. MATERIAL REQUEST
    const matData = await testEndpoint(u.role, token, 'POST', '/field-records', {
      type: 'MATERIAL_REQUEST',
      projectId: PROJECT_ALPHA,
      content: { title: `Mat Req ${u.role}`, items: [{ materialId: 'm1', quantity: 5 }] },
    });
    if (matData?.id) {
      await testEndpoint(
        u.role,
        token,
        'GET',
        `/field-records?projectId=${PROJECT_ALPHA}&type=MATERIAL_REQUEST`,
      );
      await testEndpoint(
        u.role,
        token,
        'GET',
        `/field-records/${matData.id}?projectId=${PROJECT_ALPHA}&type=MATERIAL_REQUEST`,
      );
    }

    // 6. SYNC
    await testEndpoint(u.role, token, 'POST', '/field-records/sync', {
      projectId: PROJECT_ALPHA,
      date: new Date().toISOString(),
      records: [
        {
          status: 'DRAFT',
          content: { note: 'Sync note', progressChip: 50 },
          activityId: 'wk-a0000001-0000-4000-a000-000000000000',
        },
      ],
    });
  }
}

run().catch(console.error);
