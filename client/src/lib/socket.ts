import { io } from 'socket.io-client';
import { resolveSocketUrl } from './socket-url';

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';

export const socket = io(resolveSocketUrl(SOCKET_URL), {
    autoConnect: false,
    withCredentials: true,
});

// Vite replaces this module during development; release its old connection.
if (import.meta.hot) {
    import.meta.hot.dispose(() => socket.disconnect());
}
