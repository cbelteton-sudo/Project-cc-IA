import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req1 = urllib.request.Request("http://localhost:4181/api/auth/login", data=json.dumps({"email":"admin@demo.com","password":"Admin123!"}).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req1, context=ctx) as f:
        resp = json.loads(f.read().decode('utf-8'))
        token = resp['access_token']
        print("Token acquired")
except Exception as e:
    print("Login error:", e)
    token = None

if token:
    req2 = urllib.request.Request("http://localhost:4181/api/admin/projects/12ad21cc-248e-4f22-a171-686682c391cb/members", data=json.dumps({"email":"test.creation.6@test.com","role":"MEMBER","name":"Test","phone":"123"}).encode('utf-8'), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='POST')
    try:
        with urllib.request.urlopen(req2, context=ctx) as f:
            print("Status:", f.status)
            print("Response:", f.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        print("Error details:", e.read().decode('utf-8'))
    except Exception as e:
        print("Error:", e)
