const http = require('http');

const API_URL = 'http://localhost:4181/api';

const USERS = [
  { email: 'director@demo.com', role: 'PM/DIRECTOR' },
  { email: 'supervisor@demo.com', role: 'SUPERVISOR' },
  { email: 'operador@demo.com', role: 'RESIDENTE' },
];

async function fetchJSON(url, options = {}) {
  const fetchOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };
  const response = await fetch(`${API_URL}${url}`, fetchOptions);
  let body = '';
  try {
    const text = await response.text();
    if (text) body = JSON.parse(text);
  } catch (e) {
    if (typeof text !== 'undefined') body = text;
  }
  return {
    status: response.status,
    headers: response.headers,
    body,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('🚀 Starting Smoke E2E & Fast UAT (Field Module V1)\n');

  const results = {};
  let projectId = null;

  for (const user of USERS) {
    console.log(`\n===========================================`);
    console.log(`▶️ Testing Role: ${user.role} (${user.email})`);
    console.log(`===========================================\n`);

    // Add delay to prevent 429 Rate Limit
    await sleep(2000);

    // 1. Login
    const loginRes = await fetchJSON('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: 'password123' }),
    });

    if (loginRes.status !== 201 && loginRes.status !== 200) {
      console.error(
        `❌ Login failed for ${user.email} - Status: ${loginRes.status}`,
      );
      process.exit(1);
    }

    const token = loginRes.body.access_token;
    console.log(`✅ Login Success! Token acquired.`);

    if (!projectId) {
      const projRes = await fetchJSON('/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projRes.body && projRes.body.length > 0) {
        projectId = projRes.body[0].id;
        console.log(
          `✅ Retrieved Project: ${projRes.body[0].name} (ID: ${projectId})`,
        );
      } else {
        console.error(
          '❌ No projects found to run tests against.',
          projRes.body,
        );
        process.exit(1);
      }
    }

    await sleep(500);

    // 2. Test Access Denied (Out of Scope - Fake Project)
    console.log(`\n--- UAT Matrix: Access Denied (Bad Project) ---`);
    const badProjRes = await fetchJSON(
      `/daily-log/2026-02-25?projectId=fake-project-123`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log(
      `   GET /daily-log (Bad Project) -> Status: ${badProjRes.status}`,
    );
    if (badProjRes.status === 200) {
      console.log(
        `   ⚠️ WARNING: Received 200 OK. Body:`,
        JSON.stringify(badProjRes.body).substring(0, 100),
      );
    }

    await sleep(500);

    // 3. Smoke Test: Unified Contract (sync-draft)
    console.log(`\n--- E2E Smoke: Sync Draft (Offline Manager) ---`);
    const syncRes = await fetchJSON(`/field/reports/sync-draft`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        projectId: projectId, // Pass projectId in body for ProjectAuthGuard
        date: '2026-02-25',
        entries: [
          { type: 'DAILY_LOG', description: `Log from ${user.role}`, data: {} },
        ],
      }),
    });
    console.log(
      `   POST /field/reports/sync-draft -> Status: ${syncRes.status}`,
    );
    if (syncRes.status !== 201 && syncRes.status !== 200) {
      console.log(`   ⚠️ Failed Response Body:`, syncRes.body);
    }

    await sleep(500);

    // 4. Validation: Deprecation Headers check on Legacy endpoint
    console.log(`\n--- Validation: Backward Compatibility & Headers ---`);
    const legacyRes = await fetchJSON(
      `/daily-log/2026-02-25?projectId=${projectId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log(`   GET /daily-log/:date -> Status: ${legacyRes.status}`);
    const legacyDeprecated = legacyRes.headers.get('x-deprecated');
    const legacyReplacement = legacyRes.headers.get('x-replacement-endpoint');
    console.log(
      `   HEADERS -> X-Deprecated: ${legacyDeprecated || 'MISSING'}, X-Replacement-Endpoint: ${legacyReplacement || 'MISSING'}`,
    );

    await sleep(500);

    // 5. Smoke Test: Legacy Creation (Issue) - Create allowed?
    console.log(`\n--- UAT Matrix: Issue Creation (Legacy) ---`);
    const issueRes = await fetchJSON(`/issues?projectId=${projectId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: `Smoke test Issue by ${user.role}`,
        description: 'Testing legacy mapped issue',
        priority: 'MEDIUM',
      }),
    });
    console.log(`   POST /issues -> Status: ${issueRes.status}`);
    if (issueRes.status !== 200 && issueRes.status !== 201) {
      console.log(`   ⚠️ Issue Creation Failed Body:`, issueRes.body);
    }
    const issueDeprecated = issueRes.headers.get('x-deprecated');
    const issueReplacement = issueRes.headers.get('x-replacement-endpoint');
    console.log(
      `   HEADERS -> X-Deprecated: ${issueDeprecated || 'MISSING'}, X-Replacement-Endpoint: ${issueReplacement || 'MISSING'}`,
    );

    results[user.role] = {
      syncDraft: syncRes.status,
      legacyRead: legacyRes.status,
      legacyCreate: issueRes.status,
      headersAttached: !!legacyDeprecated || !!issueDeprecated,
    };
  }

  console.log(`\n===========================================`);
  console.log(`🏁 Test Summary Matrix`);
  console.table(results);
  console.log(`===========================================\n`);
}

run().catch(console.error);
