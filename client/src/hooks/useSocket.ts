import { useEffect, useState } from 'react';
import { socket } from '#lib/socket';

interface SocketState {
    isConnected: boolean;
    socketId: string | undefined;
    error: string | null;
}

export function useSocket(): SocketState {
    const [state, setState] = useState<SocketState>({
        isConnected: socket.connected,
        socketId: socket.id,
        error: null,
    });

    useEffect(() => {
        const onConnect = () => {
            setState({
                isConnected: true,
                socketId: socket.id,
                error: null,
            });
        };

        const onDisconnect = () => {
            setState({
                isConnected: false,
                socketId: undefined,
                error: null,
            });
        };

        socket.on('connect', onConnect);
        const onError = (error: Error) => setState({ isConnected: false, socketId: undefined, error: error.message });
        socket.on('connect_error', onError);
        socket.on('disconnect', onDisconnect);

        if (socket.connected) {
            onConnect();
        } else {
            socket.connect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    return state;
}
