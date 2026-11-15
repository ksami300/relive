"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../lib/api";

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  isAudioPlaying: boolean;
  socket: Socket | null;
  login: (accessToken: string, refreshToken: string, userData: any) => void;
  logout: () => void;
  pokreniGlobalniAmbijent: () => void;
  toggleGlobalniAmbijent: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (SOCKET_URL) {
          const noviSocket = io(SOCKET_URL, { withCredentials: true, transports: ["websocket"] });
          noviSocket.emit("b2b:pretplati", 1);
          setSocket(noviSocket);
        }
      }
    } catch (error) {
      console.warn("AuthContext boot warning:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const pokreniGlobalniAmbijent = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (!oscillatorRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(432, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        setIsAudioPlaying(true);
        console.log("🔊 432Hz Zen zvuk generisan direktno na maticnoj ploci!");
      }
    } catch (err) {
      console.log("Audio API greska:", err);
    }
  };

  const toggleGlobalniAmbijent = () => {
    if (isAudioPlaying && oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
      setIsAudioPlaying(false);
    } else {
      pokreniGlobalniAmbijent();
    }
  };

  const login = (accessToken: string, refreshToken: string, userData: any) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    if (SOCKET_URL) {
      const noviSocket = io(SOCKET_URL, { withCredentials: true, transports: ["websocket"] });
      noviSocket.emit("b2b:pretplati", 1);
      setSocket(noviSocket);
    }
    pokreniGlobalniAmbijent();
  };

  const logout = () => {
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); oscillatorRef.current.disconnect(); } catch (e) {}
      oscillatorRef.current = null;
    }
    if (socket) { socket.disconnect(); setSocket(null); }
    setIsAudioPlaying(false);
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAudioPlaying, socket, login, logout, pokreniGlobalniAmbijent, toggleGlobalniAmbijent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth krah.");
  return context;
};
