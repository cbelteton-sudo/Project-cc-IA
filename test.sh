#!/bin/bash
export TOKEN=$(curl -s -X POST http://localhost:4181/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@demo.com","password":"Admin123!"}' | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
echo "Token is: $TOKEN"
curl -s -v -X POST http://localhost:4181/api/admin/projects/12ad21cc-248e-4f22-a171-686682c391cb/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test.creation.5@test.com","role":"MEMBER","name":"Test","phone":"123"}'
