import { useAuth } from "@/hooks/useAuth";
import { createContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface ServerToClientEvents {
  result: (data: any) => void;
}

export interface SocketContextType {
  socket: Socket<ServerToClientEvents> | null;
}

const WEBSOCKET_SERVER_URL = import.meta.env.VITE_WEBSOCKET_SERVER_URL;

const SocketContext = createContext<SocketContextType>({ socket: null });

export function SocketProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket<ServerToClientEvents> | null>(null);
  useEffect(() => {
    if (!token) return;

    const newSocket: Socket = io(WEBSOCKET_SERVER_URL, {
      auth: {
        token,
      },
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const contextValue = useMemo(() => ({ socket }), [socket]);

  return (
    <SocketContext.Provider value={contextValue}>
        { children }
    </SocketContext.Provider>
  );
}

export { SocketContext }