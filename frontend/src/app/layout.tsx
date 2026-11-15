import React from "react";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "Relieve Ecosystem - Zen Core Space",
  description: "Megalonska arhitektura mentalne stabilnosti i B2B telemetrije",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className="dark selection:bg-indigo-500/30 selection:text-indigo-200">
      <body className="bg-slate-950 text-slate-100 antialiased m-0 p-0 font-sans min-h-screen overflow-x-hidden relative">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
