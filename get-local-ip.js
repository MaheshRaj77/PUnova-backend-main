#!/usr/bin/env node
/**
 * Get Local IP Address
 * Useful for connecting Flutter app to backend from another device
 */

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const ip = getLocalIP();
const port = process.env.PORT || 3000;

console.log('\n╔══════════════════════════════════════════╗');
console.log('║  PUnova Backend - Local IP Configuration ║');
console.log('╚══════════════════════════════════════════╝\n');

console.log('✅ Local IP Address:', ip);
console.log('📍 Port:', port);
console.log('\n🔧 Use these URLs:\n');
console.log('   • Localhost (Current Machine)');
console.log(`     http://localhost:${port}/api/v1\n`);

console.log('   • Local Network (Other Devices)');
console.log(`     http://${ip}:${port}/api/v1\n`);

console.log('   • Android Emulator');
console.log(`     http://10.0.2.2:${port}/api/v1\n`);

console.log('📱 Flutter Configuration:\n');
console.log('   For development, set API_BASE_URL to:');
console.log(`   http://${ip}:${port}/api/v1\n`);

console.log('   Command:');
console.log(`   flutter run --dart-define=BACKEND_IP=${ip}:${port}\n`);

console.log('🔗 Test the connection:\n');
console.log(`   curl http://${ip}:${port}/api/v1/health\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
