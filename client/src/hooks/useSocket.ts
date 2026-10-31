import { useEffect, useState } from "react";
import { socket } from "#lib/socket";

interface SocketState {
  isConnected: boolean;
  socketId: string | undefined;
  error: string | null;
}

export function useSocket(manageConnection?: boolean): SocketState {
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

    socket.on("connect", onConnect);
    const onError = (error: Error) =>
      setState({
        isConnected: false,
        socketId: undefined,
        error: error.message,
      });
    socket.on("connect_error", onError);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (manageConnection === undefined) return;
    if (manageConnection) socket.connect();
    else socket.disconnect();
    return () => {
      if (manageConnection) socket.disconnect();
    };
  }, [manageConnection]);

  return state;
}
