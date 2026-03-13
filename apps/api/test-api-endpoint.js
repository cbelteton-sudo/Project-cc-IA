async function run() {
  try {
    const loginRes = await fetch('http://localhost:4181/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'Developer1!',
      }),
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      console.log('Login failed:', loginData);
      return;
    }

    const token = loginData.access_token;
    console.log('Got token.');

    const id = 'c6a328db-3d04-43dc-a132-479cb5e2cf23'; // Contratista Estructura
    console.log('Fetching resources for contractor:', id);

    const res = await fetch(
      `http://localhost:4181/api/contractors/${id}/resources`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${data}`);
  } catch (err) {
    console.error(err);
  }
}

run();
