import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { token, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !token) {
        // Ako je učitavanje završeno, a tokena nema unutar registra, evakuišemo klijenta
        router.push('/login');
      }
    }, [token, loading, router]);

    if (loading || !token) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest font-mono">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Verifikujem mrezni potpis...</span>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
