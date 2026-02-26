async function test() {
  try {
    const res = await fetch('http://localhost:4181/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Admin123!' })
    });
    if (!res.ok) {
      console.log("Login failed:", await res.text());
      return;
    }
    const data = await res.json();
    const token = data.access_token;
    console.log("Token acquired.");
    
    // Add member
    const projectId = "12ad21cc-248e-4f22-a171-686682c391cb";
    const result = await fetch(`http://localhost:4181/api/admin/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        email: "test.creation.4@test.com",
        role: "MEMBER",
        name: "Test User",
        phone: "+123456789"
      })
    });
    const resultText = await result.text();
    console.log("Status:", result.status);
    console.log("Response:", resultText);
  } catch (error) {
    console.log("Error:", error);
  }
}
test();
