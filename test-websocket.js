#!/usr/bin/env node

/**
 * WebSocket Connection Test Utility
 * 
 * This script tests WebSocket connectivity to help debug connection issues.
 * Run with: node test-websocket.js [websocket-url]
 */

const WebSocket = require('ws');

// Get URL from command line or environment
const wsUrl = process.argv[2] || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003';

console.log('🧪 Testing WebSocket Connection');
console.log('📡 URL:', wsUrl);
console.log('⏳ Connecting...\n');

// Test basic HTTP endpoint first
const httpUrl = wsUrl.replace(/^wss?:\/\//, 'https://').replace(/^https:\/\/localhost/, 'http://localhost');
console.log('🌐 Testing HTTP endpoint:', httpUrl + '/health');

// Simple HTTP test using fetch (Node.js 18+)
if (typeof fetch !== 'undefined') {
  fetch(httpUrl + '/health')
    .then(response => response.json())
    .then(data => {
      console.log('✅ HTTP Health Check:', data);
    })
    .catch(error => {
      console.log('❌ HTTP Health Check failed:', error.message);
    });
} else {
  console.log('⚠️ Skipping HTTP test (Node.js < 18)');
}

// Test WebSocket connection
const ws = new WebSocket(wsUrl);

const timeout = setTimeout(() => {
  console.log('⏰ Connection timeout (10s)');
  ws.close();
  process.exit(1);
}, 10000);

ws.on('open', function open() {
  clearTimeout(timeout);
  console.log('✅ WebSocket connection established!');
  console.log('📤 Sending test message...');
  
  // Try to join a test room
  ws.send(JSON.stringify({
    method: 'joinOrCreate',
    roomName: 'test_room',
    options: {}
  }));
});

ws.on('message', function message(data) {
  console.log('📥 Received:', data.toString());
});

ws.on('error', function error(err) {
  clearTimeout(timeout);
  console.log('❌ WebSocket error:', err.message);
  
  // Provide helpful error messages
  if (err.code === 'ECONNREFUSED') {
    console.log('\n💡 Connection refused - possible causes:');
    console.log('   • WebSocket server is not running');
    console.log('   • Wrong URL or port');
    console.log('   • Firewall blocking connection');
  } else if (err.code === 'ENOTFOUND') {
    console.log('\n💡 Host not found - possible causes:');
    console.log('   • Wrong hostname/domain');
    console.log('   • DNS resolution failed');
    console.log('   • Service not deployed yet');
  }
  
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  clearTimeout(timeout);
  console.log('🔌 Connection closed. Code:', code, 'Reason:', reason.toString());
  
  if (code === 1000) {
    console.log('✅ Clean disconnect');
    process.exit(0);
  } else {
    console.log('❌ Unexpected disconnect');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted by user');
  clearTimeout(timeout);
  ws.close();
  process.exit(0);
});
