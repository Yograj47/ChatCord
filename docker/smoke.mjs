// Run against an isolated chatcord-check-* Compose project; never a shared database.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const [
  base = "http://127.0.0.1:18080",
  project = "chatcord-check-runtime",
  envFile = "docker/.env.smoke",
] = process.argv.slice(2);
const url = new URL(base);
assert(
  ["127.0.0.1", "localhost"].includes(url.hostname),
  "Smoke target must be loopback.",
);
assert(
  /^chatcord-check-[a-z0-9-]+$/.test(project),
  "Use a disposable chatcord-check-* project.",
);
const { io } = createRequire(
  new URL("../client/package.json", import.meta.url),
)("socket.io-client");
const compose = [
  "compose",
  "--env-file",
  envFile,
  "-p",
  project,
  "-f",
  "docker/docker-compose.yml",
];
function database(code, args = []) {
  return execFileSync(
    "docker",
    [
      ...compose,
      "exec",
      "-T",
      "api",
      "node",
      "-e",
      `
    const mongoose = require('mongoose');
    (async () => {
      const uri = new URL(process.env.MONGODB_URI);
      if (uri.hostname !== 'mongo' || uri.pathname !== '/chatcord') throw new Error('Smoke database must be the private Compose MongoDB.');
      await mongoose.connect(process.env.MONGODB_URI);
      try { ${code} } finally { await mongoose.disconnect(); }
    })().catch(error => { console.error(error.message); process.exitCode = 1; });
  `,
      ...args,
    ],
    { cwd: root, encoding: "utf8", windowsHide: true },
  ).trim();
}
async function api(path, { cookie, method = "GET", body, status = 200 } = {}) {
  const response = await fetch(new URL(`/api${path}`, base), {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${response.status} ${text}`,
  );
  return { response, data: text ? JSON.parse(text) : null };
}
const run = randomBytes(5).toString("hex");
const rooms = [];
const users = [];
let socket;
try {
  const seeded = JSON.parse(
    database(`
    const id = new mongoose.Types.ObjectId();
    const token = require('node:crypto').randomBytes(32).toString('hex');
    const now = new Date(); const expiry = new Date(Date.now() + 1800000);
    await mongoose.connection.collection('users').insertOne({ _id: id, type: 'registered', username: 'dock_${run}', displayName: 'Docker smoke owner', createdAt: now, updatedAt: now });
    await mongoose.connection.collection('sessions').insertOne({ userId: id, type: 'registered', tokenHash: require('node:crypto').createHash('sha256').update(token).digest('hex'), expiresAt: expiry, absoluteExpiresAt: expiry, lastActiveAt: now, createdAt: now, updatedAt: now });
    console.log(JSON.stringify({ id: id.toString(), token }));
  `),
  );
  users.push(seeded.id);
  const owner = `chatcord.sid=${seeded.token}`;
  assert.equal(
    (await api("/auth/me", { cookie: owner })).data.user.username,
    `dock_${run}`,
  );
  await api("/rooms", { status: 401 });
  const guestLogin = await api("/auth/guest", { method: "POST", status: 201 });
  const guest = guestLogin.response.headers.get("set-cookie").split(";")[0];
  const identity = (await api("/auth/me", { cookie: guest })).data;
  users.push(identity.id);
  assert.match(identity.user.username, /^guest_[a-f0-9]{12}$/);
  const room = (
    await api("/rooms", {
      method: "POST",
      cookie: owner,
      status: 201,
      body: {
        type: "group",
        name: `Docker check ${run}`,
        visibility: "public",
      },
    })
  ).data;
  rooms.push(room._id);
  const old = (
    await api(`/rooms/${room._id}/messages`, {
      method: "POST",
      cookie: owner,
      status: 201,
      body: { content: "Before the guest joined" },
    })
  ).data;
  const discovery = (await api(`/rooms/public?q=${run}`, { cookie: guest }))
    .data;
  assert(discovery.some((item) => item._id === room._id));
  await api(`/rooms/${room._id}/join`, {
    method: "POST",
    cookie: guest,
    status: 201,
  });
  await api(`/rooms/${room._id}/messages/${old._id}`, {
    cookie: guest,
    status: 404,
  });
  socket = io(new URL("/realtime", base).href, {
    autoConnect: false,
    transports: ["websocket"],
    extraHeaders: { Cookie: guest },
    reconnection: false,
  });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
    socket.connect();
  });
  assert.equal(
    (await socket.timeout(10000).emitWithAck("join-room", { roomId: room._id }))
      .ok,
    true,
  );
  const delivered = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Live message was not received.")),
      10000,
    );
    socket.once("new-message", (message) => {
      clearTimeout(timeout);
      resolve(message);
    });
  });
  const ack = await socket
    .timeout(10000)
    .emitWithAck("send-message", {
      roomId: room._id,
      content: `Container socket ${run}`,
    });
  assert.equal(ack.ok, true);
  assert.equal((await delivered).content, `Container socket ${run}`);
  const history = (
    await api(`/rooms/${room._id}/messages/page`, { cookie: guest })
  ).data;
  assert(
    history.items.some((item) => item.content === `Container socket ${run}`),
  );
  assert(
    history.items.some(
      (item) => item.kind === "system" && item.systemEvent === "joined",
    ),
  );
  assert(!history.items.some((item) => item._id === old._id));
  const page = await fetch(new URL(`/app/rooms/${room._id}`, base));
  assert.equal(page.status, 200);
  assert((await page.text()).includes('<div id="root">'));
  await api("/dms", { cookie: guest, status: 403 });
  await api("/auth/logout", { method: "POST", cookie: guest, status: 201 });
  await api("/auth/me", { cookie: guest, status: 401 });
  console.log(
    "PASS: proxied HTTP, session cookies, public discovery/join, join-time history, persisted activity, guest restrictions, SPA routes, and Socket.IO upgrade/send/receive.",
  );
} finally {
  socket?.disconnect();
  database(
    `
    const users = JSON.parse(process.argv[1]).map(id => new mongoose.Types.ObjectId(id));
    const rooms = JSON.parse(process.argv[2]).map(id => new mongoose.Types.ObjectId(id));
    await mongoose.connection.collection('messages').deleteMany({ roomId: { $in: rooms } });
    await mongoose.connection.collection('rooms').deleteMany({ _id: { $in: rooms } });
    await mongoose.connection.collection('sessions').deleteMany({ userId: { $in: users } });
    await mongoose.connection.collection('users').deleteMany({ _id: { $in: users } });
  `,
    [JSON.stringify(users), JSON.stringify(rooms)],
  );
}
