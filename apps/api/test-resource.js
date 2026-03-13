const fs = require('fs');

async function test() {
  const loginRes = await fetch('http://localhost:4181/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: "administrator@fluxori.io", password: "Vg45&5L-F.xE5M$" })
  });
  
  if (!loginRes.ok) {
    console.log("LOGIN FAILED", loginRes.status, await loginRes.text());
    return;
  }
  
  const token = (await loginRes.json()).accessToken;
  
  const contRes = await fetch('http://localhost:4181/api/contractors', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const contractors = await contRes.json();
  console.log("CONTRACTORS:", contractors.map(c => ({ id: c.id, name: c.name })));
  
  if (contractors.length > 0) {
    const cId = contractors[0].id; // We'll just check the first one
    const res = await fetch(`http://localhost:4181/api/contractors/${cId}/resources`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`RESOURCES FOR ${cId}:`, await res.json());
  }
}

test();
