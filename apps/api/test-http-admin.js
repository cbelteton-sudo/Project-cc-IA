const axios = require('axios');

async function testApi() {
  try {
    // Login as admin@demo.com
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:4181/api/auth/login', {
      identifier: 'admin@demo.com',
      password: 'password123',
    });
    const token = loginRes.data.access_token;
    console.log('Logged in!');

    // Get projects
    console.log('Fetching projects...');
    const projRes = await axios.get('http://localhost:4181/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (projRes.data.length === 0) {
      console.log('No projects found for admin');
      return;
    }
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
