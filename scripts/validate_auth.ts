import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

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
    } catch (e: any) {
      console.error('❌ Login Failed:', e.message);
      if (e.response) console.error(e.response.data);
      process.exit(1);
    }

    if (loginRes.status === 201 && loginRes.data.access_token) {
      console.log('✅ Login Successful');
    } else {
      console.error('❌ Login Failed');
      process.exit(1);
    }

    // 2. Refresh Token / Rotation
    console.log('\n2️⃣  Testing Token Refresh & Rotation...');
    // Introduce a small delay to ensure times are different if needed by DB resolution
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const cookiesBefore = await jar.getCookies('http://localhost:4180');
    const oldRefreshToken = cookiesBefore.find((c) => c.key === 'refreshToken')?.value;

    if (!oldRefreshToken) {
      console.error('❌ No refresh token cookie found after login');
      console.log('Cookies:', cookiesBefore);
      process.exit(1);
    } else {
      console.log(`Old Token: ${oldRefreshToken.substring(0, 10)}...`);
    }

    let refreshRes;
    try {
      refreshRes = await client.post('/auth/refresh');
    } catch (e: any) {
      console.error('❌ Refresh Failed:', e.message);
      if (e.response) console.error(e.response.data);
      process.exit(1);
    }

    if (refreshRes.status === 201 && refreshRes.data.access_token) {
      console.log('✅ Refresh Request Successful');

      const cookiesAfter = await jar.getCookies('http://localhost:4180');
      const newRefreshToken = cookiesAfter.find((c) => c.key === 'refreshToken')?.value;

      if (newRefreshToken && newRefreshToken !== oldRefreshToken) {
        console.log('✅ Token Rotation Verified (New Token Issued)');
        console.log(`New Token: ${newRefreshToken?.substring(0, 10)}...`);
      } else {
        console.error('❌ Token Rotation Failed (Token mismatch or same token)');
        console.log('Old:', oldRefreshToken);
        console.log('New:', newRefreshToken);
      }
    }

    // 3. Logout
    console.log('\n3️⃣  Testing Logout...');
    const logoutRes = await client.post('/auth/logout');
    if (logoutRes.status === 200) {
      // Verify cookie is gone or expired
      const cookiesFinal = await jar.getCookies('http://localhost:4180');
      const refreshTokenFinal = cookiesFinal.find(
        (c: any) => c.key === 'refreshToken' && c.expires > new Date(),
      );

      if (!refreshTokenFinal) {
        console.log('✅ Logout Successful (Cookie cleared/expired)');
      } else {
        console.log('⚠️ Cookie still present after logout', refreshTokenFinal);
      }

      // Try to refresh again - should fail
      console.log('\n4️⃣  Verifying Refresh Fails after Logout...');
      try {
        await client.post('/auth/refresh');
        console.error('❌ Refresh succeeded after logout (Security Failure)');
      } catch (e: any) {
        if (e.response && e.response.status === 401) {
          console.log('✅ Refresh denied after logout (Expected 401)');
        } else {
          console.error('❌ Unexpected error on refresh after logout:', e.message);
        }
      }
    } else {
      console.error('❌ Logout Request Failed');
    }

    // 5. Rate Limiting check
    console.log('\n5️⃣  Testing Rate Limiting (Login)...');
    let rateLimitHit = false;
    for (let i = 0; i < 8; i++) {
      try {
        await client.post('/auth/login', {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        process.stdout.write('.');
      } catch (e: any) {
        if (e.response && e.response.status === 429) {
          console.log('\n✅ Rate Limit Hit (429 Too Many Requests) as expected');
          rateLimitHit = true;
          break;
        }
      }
    }

    if (!rateLimitHit) {
      console.warn('\n⚠️ Rate Limit NOT hit after 8 attempts (Check Throttler config)');
    }
  } catch (e: any) {
    console.error('\n❌ Test Script Error:', e.message);
  }
}

runTests();
