// Opt-in frontend for server/test/verify-realtime.ts --serve. No mock APIs.
import { createServer } from 'vite';
import process from 'node:process';

const server = await createServer({
  server: { host: '127.0.0.1', port: 4187, strictPort: true, allowedHosts: ['chatcord-verify.localhost'], proxy: { '/api': { target: 'http://127.0.0.1:4188', changeOrigin: false } } },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api'), 'import.meta.env.VITE_SOCKET_URL': JSON.stringify('http://chatcord-verify.localhost:4188') },
});
await server.listen();
console.log('Live verification frontend ready at http://chatcord-verify.localhost:4187');
const close = () => { void server.close().then(() => process.exit(0)); };
process.on('SIGINT', close); process.on('SIGTERM', close);
