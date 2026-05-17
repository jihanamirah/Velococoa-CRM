"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SplashScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      router.push('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#3B1A08] flex flex-col items-center justify-center animate-in fade-in duration-1000">
      <div className="relative">
        <div className="text-5xl font-bold tracking-tighter text-[#C17B3A] mb-4">
          VeloCocoa
          <span className="text-white ml-2 italic">CRM</span>
        </div>
        <div className="absolute -top-12 -right-8 w-16 h-16 bg-[#C17B3A]/20 blur-2xl rounded-full"></div>
      </div>
      
      <p className="text-[#C17B3A]/60 text-sm font-medium tracking-widest uppercase mb-12">
        Artisanal Chocolate Manufacturer
      </p>

      {loading && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#C17B3A] animate-spin" />
          <span className="text-[#C17B3A]/40 text-xs animate-pulse">Menghubungkan ke Odoo ERP...</span>
        </div>
      )}
    </div>
  );
}