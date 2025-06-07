import { AuthContext, type AuthContextType } from "@/context/AuthContext";
import { useContext } from "react";

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
};