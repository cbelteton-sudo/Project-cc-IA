import axios from 'axios';

async function run() {
  try {
    const login = await axios.post('http://localhost:3001/auth/login', {
      email: 'carlosbelteton@gmail.com',
      password: 'Password123!',
    });

    const token = login.data.accessToken;
    const cid = 'c6a328db-3d04-43dc-a132-479cb5e2cf23';

    const res = await axios.get(
      `http://localhost:3001/contractors/${cid}/resources`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log('STATUS:', res.status);
    console.log('DATA:', res.data);
  } catch (err: any) {
    if (err.response) {
      console.log('ERR STATUS:', err.response.status);
      console.log('ERR DATA:', err.response.data);
    } else {
      console.log('ERR:', err.message);
    }
  }
}
run();
