import { initSocket, getIO } from '../socket/socket.js';
import http from 'http';

function runTest() {
  console.log('🏁 Starting WebSocket Module Verification...');

  const mockServer = http.createServer();
  
  // 1. Assert that initSocket initializes the IO server without error
  const io = initSocket(mockServer);
  if (!io) {
    throw new Error('Socket.io initialization returned null/undefined!');
  }
  console.log('✅ Socket.io initialized successfully.');

  // 2. Assert that getIO retrieves the active instance
  const activeIo = getIO();
  if (activeIo !== io) {
    throw new Error('getIO() did not return the active Socket.io instance!');
  }
  console.log('✅ getIO() retrieved active instance successfully.');

  mockServer.close();
  console.log('🎉 Socket.io configuration and imports verified successfully!');
  process.exit(0);
}

try {
  runTest();
} catch (err) {
  console.error('❌ Socket.io verification failed:', err);
  process.exit(1);
}
