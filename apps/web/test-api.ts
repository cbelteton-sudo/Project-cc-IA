import axios from 'axios';

async function test() {
  try {
    // We don't have a token, but let's try calling an unauthorized endpoint or something to see response shape
    // Wait, let's login
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'administrator@fluxori.io',
      password: 'password123!' // assuming default password
    });
    
    const token = loginRes.data.access_token;
    
    const res1 = await axios.get('http://localhost:3000/api/projects/d171b59f-f1a5-4681-9cfe-09c40550802b/members', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Members type:', Array.isArray(res1.data) ? 'Array' : 'Object', 'Length:', res1.data.length || Object.keys(res1.data));
    console.log(JSON.stringify(res1.data).substring(0, 100));
    
    const res2 = await axios.get('http://localhost:3000/api/contractors/c6a328db-3d04-43dc-a132-479cb5e2cf23/resources', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Resources type:', Array.isArray(res2.data) ? 'Array' : 'Object', 'Length:', res2.data.length || Object.keys(res2.data));
    console.log(JSON.stringify(res2.data).substring(0, 100));
    
  } catch(e: any) {
    console.error('Error:', e.response?.data || e.message);
  }
}
test();
