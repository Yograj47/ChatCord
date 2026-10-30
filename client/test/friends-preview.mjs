// Local-only UI fixture. Run: node test/friends-preview.mjs
// Uses synthetic profiles and in-memory data; never connects to the real backend.
import { createServer } from "vite";
import process from "node:process";

const mode = process.argv[2] ?? "normal";

const people = [
  {
    _id: "000000000000000000000001",
    username: "morgan",
    displayName: "Morgan Chen",
  },
  {
    _id: "000000000000000000000002",
    username: "alex",
    displayName: "Alex Rivera",
  },
  {
    _id: "000000000000000000000003",
    username: "avery",
    displayName: "Avery Stone",
  },
  {
    _id: "000000000000000000000004",
    username: "ari",
    displayName: "Ari Patel",
  },
  {
    _id: "000000000000000000000005",
    username: "anna",
    displayName: "Anna Park",
  },
];
let friends = [{ id: "friend-alex", user: people[1] }];
let requests = [
  {
    _id: "incoming-avery",
    requester: people[2],
    recipient: people[0],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "outgoing-ari",
    requester: people[0],
    recipient: people[3],
    createdAt: new Date().toISOString(),
  },
];
let nextId = 1;
const makeRoom = (id, name, role, user = people[0]._id) => ({
  _id: id,
  name,
  type: "group",
  visibility: "private",
  capabilities: ["text"],
  createdBy: people[0]._id,
  members: [{ userId: user, role, joinedAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const ownedRoom = makeRoom(
  "000000000000000000000101",
  "Design Studio",
  mode === "member" ? "member" : "owner",
);
const memberRoom = makeRoom("000000000000000000000102", "Community", "member");
const invitedRooms = [
  makeRoom("000000000000000000000103", "Product Lab", "owner", people[1]._id),
  makeRoom(
    "000000000000000000000104",
    "Weekend Workshop",
    "owner",
    people[1]._id,
  ),
];
const myRooms = [ownedRoom, memberRoom];
let invitations = invitedRooms.map((room, i) => ({
  id: `00000000000000000000020${i}`,
  roomId: room._id,
  roomName: room.name,
  invitedBy: people[1]._id,
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
}));
const sentInvitations = new Set();
const server = await createServer({
  server: { host: "127.0.0.1", port: 4177, strictPort: true },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("/api"),
    "import.meta.env.VITE_SOCKET_URL": JSON.stringify("http://127.0.0.1:4177"),
  },
  plugins: [
    {
      name: "synthetic-social-api",
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url ?? "/", "http://127.0.0.1:4177");
          if (!url.pathname.startsWith("/api/")) return next();
          res.setHeader("Content-Type", "application/json");
          const send = (body, status = 200) => {
            res.statusCode = status;
            res.end(JSON.stringify(body));
          };
          if (url.pathname === "/api/auth/me")
            return send(
              mode === "guest"
                ? {
                    type: "guest",
                    sessionId: "fixture",
                    requiresOnboarding: false,
                  }
                : {
                    id: people[0]._id,
                    type: "registered",
                    sessionId: "fixture",
                    user: {
                      ...people[0],
                      id: people[0]._id,
                      type: "registered",
                    },
                    requiresOnboarding: false,
                  },
            );
          if (mode === "error" && url.pathname.startsWith("/api/friendships"))
            return send({ message: "Synthetic connection failure." }, 503);
          if (mode === "error" && url.pathname.startsWith("/api/rooms"))
            return send({ message: "Synthetic room API failure." }, 503);
          if (url.pathname === "/api/rooms/invitations")
            return send(invitations);
          if (url.pathname === "/api/rooms") return send(myRooms);
          const invitationAction = url.pathname.match(
            /^\/api\/rooms\/([^/]+)\/invitations\/([^/]+)(\/accept)?$/,
          );
          if (invitationAction) {
            const item = invitations.find(
              (invitation) =>
                invitation.id === invitationAction[2] &&
                invitation.roomId === invitationAction[1],
            );
            if (!item)
              return send({ message: "Invitation no longer available." }, 409);
            invitations = invitations.filter(
              (invitation) => invitation.id !== item.id,
            );
            if (mode === "stale")
              return send(
                { message: "Invitation was handled elsewhere." },
                409,
              );
            if (req.method === "DELETE") return send({ success: true });
            const room = invitedRooms.find((room) => room._id === item.roomId);
            room.members.push({
              userId: people[0]._id,
              role: "member",
              joinedAt: new Date().toISOString(),
            });
            myRooms.push(room);
            return send(room, 201);
          }
          const memberInvite = url.pathname.match(
            /^\/api\/rooms\/([^/]+)\/members$/,
          );
          if (memberInvite && req.method === "POST") {
            let text = "";
            for await (const chunk of req) text += chunk;
            const { userId } = JSON.parse(text);
            if (mode === "member" || memberInvite[1] !== ownedRoom._id)
              return send({ message: "Only managers may invite." }, 403);
            if (
              userId === people[3]._id ||
              ownedRoom.members.some((member) => member.userId === userId) ||
              sentInvitations.has(userId)
            )
              return send({ message: "Already a member or invited." }, 409);
            sentInvitations.add(userId);
            return send(
              {
                id: `sent-room-${nextId++}`,
                roomId: ownedRoom._id,
                expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
              },
              201,
            );
          }
          const roomMessages = url.pathname.match(
            /^\/api\/rooms\/([^/]+)\/messages$/,
          );
          if (roomMessages) return send([]);
          const roomRead = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
          if (roomRead) {
            const room = myRooms.find((room) => room._id === roomRead[1]);
            return room
              ? send(room)
              : send({ message: "Room not found." }, 404);
          }
          if (url.pathname === "/api/dms") return send([]);
          if (url.pathname === "/api/auth/users/search")
            return send(
              people
                .slice(1)
                .filter((user) =>
                  user.username.startsWith(url.searchParams.get("q") ?? ""),
                )
                .map(({ _id, ...user }) => ({ ...user, id: _id })),
            );
          if (url.pathname === "/api/friendships" && req.method === "GET")
            return send(friends);
          if (
            url.pathname === "/api/friendships/requests" &&
            req.method === "GET"
          )
            return send(requests);
          if (
            url.pathname === "/api/friendships/requests" &&
            req.method === "POST"
          ) {
            let text = "";
            for await (const chunk of req) text += chunk;
            const { recipientId } = JSON.parse(text);
            const user = people.find((person) => person._id === recipientId);
            if (!user)
              return send({ message: "Registered user not found." }, 404);
            if (
              friends.some((friend) => friend.user._id === recipientId) ||
              requests.some(
                (request) =>
                  request.recipient?._id === recipientId ||
                  request.requester?._id === recipientId,
              )
            )
              return send(
                {
                  message:
                    "A request or friendship already exists between these users.",
                },
                409,
              );
            const id = `sent-${nextId++}`;
            requests.push({
              _id: id,
              requester: people[0],
              recipient: user,
              createdAt: new Date().toISOString(),
            });
            return send({ id, status: "pending" }, 201);
          }
          const action = url.pathname.match(
            /^\/api\/friendships\/requests\/([^/]+)\/(accept|decline|cancel)$/,
          );
          if (action) {
            const pending = requests.find(
              (request) => request._id === action[1],
            );
            if (!pending)
              return send({ message: "Pending request not found." }, 404);
            requests = requests.filter((request) => request._id !== action[1]);
            if (action[2] === "accept")
              friends.push({
                id: `friend-${nextId++}`,
                user: pending.requester,
              });
            return send({ success: true });
          }
          if (
            url.pathname.startsWith("/api/friendships/") &&
            req.method === "DELETE"
          ) {
            friends = friends.filter(
              (friend) => friend.id !== url.pathname.split("/").at(-1),
            );
            return send({ success: true });
          }
          return send(
            {
              message:
                "This synthetic preview does not implement this endpoint.",
            },
            404,
          );
        });
      },
    },
  ],
});
await server.listen();
console.log("Synthetic Friends UI preview: http://127.0.0.1:4177/app/friends");
const close = () => {
  void server.close().then(() => process.exit(0));
};
process.on("SIGINT", close);
process.on("SIGTERM", close);
