const axios = require('axios');

async function testApi() {
  try {
    // Login as operario_1@uat.com
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:4181/api/auth/login', {
      identifier: 'operario_1@uat.com',
      password: 'CConstructions2026!',
    });
    const token = loginRes.data.access_token;

    // Get projects
    console.log('Fetching projects...');
    const projRes = await axios.get('http://localhost:4181/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const projectId = projRes.data[0].id;

    // Call PM Dashboard
    console.log(`Fetching PM Dashboard for Project ID: ${projectId}...`);
    const pmRes = await axios.get(
      `http://localhost:4181/api/field/reports/pm/dashboard?projectId=${projectId}&days=3`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log('SUCCESS!');
    console.log(pmRes.data);
  } catch (err) {
    if (err.response) {
      console.log('FAIL:', err.response.status);
      console.log(err.response.data);
    } else {
      console.log('FAIL:', err.message);
    }
  }
}

testApi();
