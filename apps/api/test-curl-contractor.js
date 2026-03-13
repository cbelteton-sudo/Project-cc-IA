async function run() {
  const loginRes = await fetch('http://localhost:4181/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'administrator@fluxori.io',
      password: 'Vg45&5L-F.xE5M$',
    }),
  });
  const data = await loginRes.json();
  const token = data.access_token || data.token;

  const constructorId = 'c6a328db-3d04-43dc-a132-479cb5e2cf23'; // Contratista Estructura

  const res = await fetch(
    `http://localhost:4181/api/contractors/${constructorId}/resources`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  console.log('STATUS:', res.status);
  const resources = await res.json();
  console.log('RESOURCES:');
  console.log(JSON.stringify(resources, null, 2));
}
run();
