import { PrismaClient } from '@prisma/client';
// @ts-ignore
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

const prisma = new PrismaClient();
const secret = 'super-secret-key-12345';

async function run() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const tempPassword = 'testpassword123';
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(tempPassword, 10) },
    });

    console.log('User identified:', user.email || user.username);

    // Login
    const loginRes = await axios.post(
      'http://localhost:3000/api/auth/login',
      {
        email: user.email || user.username,
        password: tempPassword,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) throw new Error('No cookies returned from login');
    const refreshCookies = cookies.filter((c: string) =>
      c.startsWith('fieldclose_sess_v6='),
    );
    if (!refreshCookies.length) throw new Error('Refresh cookie missing');
    const refreshCookie = refreshCookies[refreshCookies.length - 1]; // get the LAST one
    const token = refreshCookie
      .split(';')[0]
      .substring('fieldclose_sess_v6='.length);

    console.log('FULL_TOKEN=' + token);
    process.exit(0);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
