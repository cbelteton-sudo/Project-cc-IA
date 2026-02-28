const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { JwtService } = require('@nestjs/jwt');
const { PrismaService } = require('./dist/prisma/prisma.service');
const axios = require('axios');

async function testEndpoint() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jwtService = app.get(JwtService);
  const prisma = app.get(PrismaService);

  try {
    // 1. Get a user
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No users found');

    // 2. Generate token, matching JwtService payload logic
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    };
    const token = jwtService.sign(payload);

    console.log(`Generated token for user: ${user.email} (${user.role})`);

    // 3. Get projects via HTTP using the token
    const projRes = await axios.get('http://localhost:4181/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (projRes.data.length === 0) {
      console.log('No projects found for user');
      return;
    }
    const projectId = projRes.data[0].id;
    console.log(`Using Project ID: ${projectId}`);

    // 4. Test the PM Dashboard endpoint
    const pmRes = await axios.get(
      `http://localhost:4181/api/field/reports/pm/dashboard?projectId=${projectId}&days=3`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log('SUCCESS!');
    console.log(pmRes.data);
  } catch (error) {
    if (error.response) {
      console.log('ENDPOINT FAILED WITH STATUS:', error.response.status);
      console.log('DATA:', error.response.data);
    } else {
      console.error('ERROR:', error);
    }
  } finally {
    await app.close();
  }
}

testEndpoint();
