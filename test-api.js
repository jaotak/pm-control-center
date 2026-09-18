const http = require('http');

const endpoints = [
  '/api/search?q=test',
  '/api/user/badges',
  '/api/notify/overdue'
];

async function testEndpoints() {
  console.log("🧪 เริ่มการทดสอบ API (ไม่มี Session)...\n");
  for (const endpoint of endpoints) {
    console.log(`\n🔹 Testing: GET ${endpoint}`);
    try {
      const res = await fetch(`http://localhost:3000${endpoint}`);
      const text = await res.text();
      console.log(`  Status: ${res.status} ${res.statusText}`);
      try {
        const json = JSON.parse(text);
        console.log(`  Response (JSON):`, JSON.stringify(json).slice(0, 100) + (text.length > 100 ? "..." : ""));
      } catch {
        console.log(`  Response (Text):`, text.slice(0, 100) + (text.length > 100 ? "..." : ""));
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
}

testEndpoints();
