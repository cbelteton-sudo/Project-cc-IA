async function run() {
  try {
    const login = await fetch('http://localhost:4181/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'carlosbelteton@gmail.com',
        password: 'Password123!',
      }),
    });
    const loginData = await login.json();
    console.log('Login Status:', login.status);

    const token = loginData.accessToken;
    const cid = 'c6a328db-3d04-43dc-a132-479cb5e2cf23';

    const res = await fetch(
      `http://localhost:4181/api/contractors/${cid}/resources`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log('STATUS:', res.status);
    console.log('DATA:', await res.text());
  } catch (err) {
    console.error('Fetch ERR:', err);
  }
}
run();
