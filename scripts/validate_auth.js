const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(
  axios.create({
    baseURL: 'http://localhost:4180/api',
    jar,
    withCredentials: true,
  }),
);

const ADMIN_EMAIL = 'admin@demo.com';
const ADMIN_PASSWORD = 'password123';

async function runTests() {
  console.log('🚀 Starting Auth Validation Tests...\n');

  try {
    // 1. Login
    console.log('1️⃣  Testing Login...');
    let loginRes;
    try {
      loginRes = await client.post('/auth/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
    } catch (e) {
      console.error('❌ Login Failed:', e.message);
      if (e.response) console.error(e.response.data);
      process.exit(1);
    }

    if (loginRes.status === 201 && loginRes.data.access_token) {
      console.log('✅ Login Successful');
    } else {
      console.error('❌ Login Failed (No Token)');
      process.exit(1);
    }

    // 2. Refresh Token / Rotation
    console.log('\n2️⃣  Testing Token Refresh & Rotation...');
    const cookiesBefore = await jar.getCookies('http://localhost:4180');
    // Find checking path or domain might vary
    // Just find any refreshToken
    const oldRefreshToken = cookiesBefore.find((c) => c.key === 'refreshToken')?.value;

    if (!oldRefreshToken) {
      console.error('❌ No refresh token cookie found after login');
      console.log('Cookies found:', cookiesBefore);
      process.exit(1);
    } else {
      console.log('Old Refresh Token found:', oldRefreshToken.substring(0, 10) + '...');
    }

    // Wait 1s
    await new Promise((r) => setTimeout(r, 1000));

    let refreshRes;
    try {
      refreshRes = await client.post('/auth/refresh');
    } catch (e) {
      console.error('❌ Refresh Call Failed:', e.message);
      if (e.response) console.error(e.response.data);
      process.exit(1);
    }

    if (refreshRes.status === 201 && refreshRes.data.access_token) {
      console.log('✅ Refresh Request Successful');

      const cookiesAfter = await jar.getCookies('http://localhost:4180');
      const newRefreshToken = cookiesAfter.find((c) => c.key === 'refreshToken')?.value;

      if (newRefreshToken && newRefreshToken !== oldRefreshToken) {
        console.log('✅ Token Rotation Verified (New Token Issued)');
        console.log('New Refresh Token:', newRefreshToken.substring(0, 10) + '...');
      } else {
        console.error('❌ Token Rotation Failed (Token mismatch or same token)');
        console.log('Old:', oldRefreshToken);
        console.log('New:', newRefreshToken);
      }
    }

    // 3. Logout
    console.log('\n3️⃣  Testing Logout...');
    try {
      await client.post('/auth/logout');
      console.log('✅ Logout Call Successful (200 OK)');
    } catch (e) {
      console.error('❌ Logout Failed:', e.message);
    }

    // Verify cookie cleared/expired
    const cookiesFinal = await jar.getCookies('http://localhost:4180');
    // Check if refreshToken is gone or expired
    const validRefreshToken = cookiesFinal.find(
      (c) => c.key === 'refreshToken' && new Date(c.expires) > new Date(),
    );

    if (!validRefreshToken) {
      console.log('✅ Cookie Cleared/Expired');
    } else {
      console.warn('⚠️ Refresh Token still present and valid:', validRefreshToken);
    }

    // Try Refresh - Should Fail
    console.log('\n4️⃣  Verify Refresh Fails after Logout...');
    try {
      await client.post('/auth/refresh');
      console.error('❌ Refresh SUCCEEDED after logout! (Security Failure)');
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('✅ Refresh Denied (401 Unauthorized) as expected');
      } else {
        console.error('❌ Unexpected Error:', e.message);
      }
    }

    // 5. Rate Limiting
    console.log('\n5️⃣  Testing Rate Limiting (Login)...');
    let hitLimit = false;
    for (let i = 0; i < 8; i++) {
      try {
        await client.post('/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        process.stdout.write('.');
      } catch (e) {
        if (e.response && e.response.status === 429) {
          console.log('\n✅ Rate Limit Hit (429 Too Many Requests)');
          hitLimit = true;
          break;
        }
      }
    }
    if (!hitLimit) console.warn('\n⚠️ Rate Limit NOT hit (increase attempts or check config)');
  } catch (e) {
    console.error('\n❌ Unexpected Script Error:', e);
  }
}

runTests();
