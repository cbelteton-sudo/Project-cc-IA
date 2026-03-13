const token = process.argv[2];

if (!token) {
  console.log('Usage: node fetchRefresh.js <token>');
  process.exit(1);
}

fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: `fieldclose_sess_v6=${token}`,
  },
  body: JSON.stringify({ refreshToken: token }),
})
  .then(async (res) => {
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  })
  .catch((err) => console.error(err));
