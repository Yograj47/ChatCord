import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { io } from 'socket.io-client';

const source = await readFile(new URL('../src/lib/socket-url.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { resolveSocketUrl } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
for (const input of [undefined, 'http://localhost:3000', 'http://localhost:3000/', 'http://localhost:3000/realtime', ' http://localhost:3000/realtime/ ']) {
    const socket = io(resolveSocketUrl(input), { autoConnect: false, forceNew: true });
    assert.equal(socket.nsp, '/realtime', `Wrong namespace for ${input}`);
    assert.equal(socket.io.uri, 'http://localhost:3000/realtime');
    socket.disconnect();
}
const remote = io(resolveSocketUrl('https://chat.example.test/realtime'), { autoConnect: false });
assert.equal(remote.nsp, '/realtime');
assert.equal(remote.io.uri, 'https://chat.example.test/realtime');
remote.disconnect();
console.log('PASS: base/full socket URLs target exactly /realtime, including trailing slashes.');
