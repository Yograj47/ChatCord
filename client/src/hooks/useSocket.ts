import { useEffect, useState } from 'react';
import { socket } from '#lib/socket';

interface SocketState {
    isConnected: boolean;
    socketId: string | undefined;
}

export function useSocket(): SocketState {
    const [state, setState] = useState<SocketState>({
        isConnected: socket.connected,
        socketId: socket.id,
    });

    useEffect(() => {
        const onConnect = () => {
            setState({
                isConnected: true,
                socketId: socket.id,
            });
        };

        const onDisconnect = () => {
            setState({
                isConnected: false,
                socketId: undefined,
            });
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        if (socket.connected) {
            onConnect();
        } else {
            socket.connect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    return state;
}