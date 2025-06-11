import { SocketContext, type SocketContextType } from "@/context/SocketContext";
import { useContext } from "react";

export function useSocket(): SocketContextType {
  return useContext(SocketContext);
};