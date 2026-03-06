import fetch from 'node-fetch';

async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'operador1@demo.com', password: 'Developer1!' })
  });
  if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());
  const auth = await loginRes.json();
  const token = auth.access_token;
  console.log('Login OK');

  const res = await fetch('http://localhost:3000/api/field-records?limit=25&offset=0', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Records Status:', res.status);
  console.log('Records Body:', await res.text());
}
test().catch(console.error);
