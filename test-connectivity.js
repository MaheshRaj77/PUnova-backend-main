#!/usr/bin/env node
/**
 * Backend Connectivity Test
 * Verifies backend is reachable from different addresses
 */

const http = require('http');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function testURL(url) {
  return new Promise((resolve) => {
    http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ success: true, data: json });
        } catch {
          resolve({ success: false, error: 'Invalid JSON response' });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

async function runTests() {
  const localIP = getLocalIP();
  const port = process.env.PORT || 3000;
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Backend Connectivity Test              ║');
  console.log('╚════════════════════════════════════════╝\n');

  const urls = [
    {
      name: 'Localhost',
      url: `http://localhost:${port}/api/v1/health`,
      device: 'This Computer'
    },
    {
      name: 'Local Network',
      url: `http://${localIP}:${port}/api/v1/health`,
      device: 'Other Devices (WiFi)'
    },
  ];

  console.log('🔍 Testing backend connectivity...\n');

  for (const { name, url, device } of urls) {
    process.stdout.write(`   ${name.padEnd(20)} ... `);
    const result = await testURL(url);
    
    if (result.success) {
      console.log('✅ Connected');
      console.log(`      Device: ${device}`);
      console.log(`      Status: ${result.data.status}`);
      console.log(`      Environment: ${result.data.environment}`);
    } else {
      console.log('❌ Failed');
      console.log(`      Error: ${result.error}`);
    }
    console.log();
  }

  console.log('📋 Configuration:\n');
  console.log(`   Local IP: ${localIP}`);
  console.log(`   Port: ${port}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   HOST: ${process.env.HOST || '0.0.0.0'}`);

  console.log('\n📱 Flutter Connection:\n');
  console.log(`   flutter run --dart-define=BACKEND_IP=${localIP}:${port}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runTests();
