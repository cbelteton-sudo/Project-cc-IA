import axios from 'axios';

async function testPatch() {
  try {
    const loginRes = await axios.post('http://localhost:4181/api/auth/login', {
      email: 'carlos@torremawi.com',
      password: 'password123',
    });
    const token = loginRes.data.access_token;
    const projectId = '12ad21cc-248e-4f22-a171-686682c391cb';

    const membersRes = await axios.get(
      `http://localhost:4181/api/admin/projects/${projectId}/members`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const dayana = membersRes.data.find((m: any) =>
      m.user.email.includes('dayana'),
    );
    if (!dayana) throw new Error('Dayana not found');

    console.log('Dayana ID:', dayana.user.id);

    const patchData = {
      role: 'PM',
      contractorId: '9d74de92-65c1-4ab9-ad64-c20564c9b0a5',
    };

    console.log('Sending patch:', patchData);

    const res = await axios.patch(
      `http://localhost:4181/api/admin/projects/${projectId}/members/${dayana.user.id}`,
      patchData,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log('Response:', res.data);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPatch();
