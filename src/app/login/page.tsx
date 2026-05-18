"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Loader2, 
  Lock, 
  Mail, 
  Megaphone, 
  Users, 
  Wallet, 
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'PORTAL' | 'LOGIN_CRM' | 'LOGIN_MARKETING' | 'LOGIN_ACCOUNTING'>('PORTAL');

  const handleLogin = (e: React.FormEvent, targetPath: string) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate Firebase / Odoo Auth
    setTimeout(() => {
      setIsLoading(false);
      router.push(targetPath);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] dark:bg-[#1F140F] flex items-center justify-center p-4 transition-all duration-500">
      
      {/* View 1: Portal / Module Selection */}
      {activeSection === 'PORTAL' && (
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl bg-white dark:bg-[#2A1D16] overflow-hidden p-2 border border-primary/10">
              <img src="/logo.png" alt="VeloCocoa Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#3B1A08] dark:text-white">
              VeloCocoa <span className="text-primary italic font-light">Enterprise Portal</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Silakan pilih portal modul ERP yang ingin Anda akses hari ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Marketing */}
            <div 
              onClick={() => setActiveSection('LOGIN_MARKETING')}
              className="group cursor-pointer bg-white dark:bg-[#2A1D16] rounded-3xl p-6 border border-border/50 hover:border-teal-500/50 shadow-lg hover:shadow-teal-500/5 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between h-64 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full group-hover:bg-teal-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#3B1A08] dark:text-white group-hover:text-teal-500 transition-colors">Marketing</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Automasi kampanye, prospek pelanggan (Lead Gen), analitik sosial, dan optimasi konversi produk.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs font-semibold text-teal-500 group-hover:translate-x-1 transition-transform">
                Masuk ke Portal <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>

            {/* Card 2: CRM (Active & Integrated) */}
            <div 
              onClick={() => setActiveSection('LOGIN_CRM')}
              className="group cursor-pointer bg-[#3B1A08] dark:bg-primary/10 rounded-3xl p-6 border-2 border-primary/40 hover:border-primary shadow-2xl hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between h-64 relative overflow-hidden text-white"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
              <div className="absolute top-3 right-3 bg-primary text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                Terintegrasi Odoo
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors flex items-center gap-1.5">
                    CRM & Mitra
                  </h3>
                  <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                    Kelola leads sales, sinkronisasi Odoo CRM realtime, riwayat komunikasi, dan penjadwalan meeting.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                Masuk ke Portal <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>

            {/* Card 3: Accounting */}
            <div 
              onClick={() => setActiveSection('LOGIN_ACCOUNTING')}
              className="group cursor-pointer bg-white dark:bg-[#2A1D16] rounded-3xl p-6 border border-border/50 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between h-64 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#3B1A08] dark:text-white group-hover:text-indigo-500 transition-colors">Accounting</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Pengawasan kas, manajemen invoice, laporan rugi laba, dan pencatatan ledger Odoo Accounting.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs font-semibold text-indigo-500 group-hover:translate-x-1 transition-transform">
                Masuk ke Portal <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>

          </div>

          <div className="text-center text-xs text-muted-foreground">
            © 2024 PT VeloCocoa Indonesia • Odoo ERP 18 Connected
          </div>
        </div>
      )}

      {/* View 2: CRM Login Form */}
      {activeSection === 'LOGIN_CRM' && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="border-2 border-primary/20 shadow-2xl bg-white dark:bg-[#2A1D16] overflow-hidden rounded-3xl">
            <div className="h-2 bg-primary w-full" />
            
            <CardHeader className="space-y-4 text-center pt-8 relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setActiveSection('PORTAL')}
                className="absolute left-4 top-4 text-muted-foreground hover:bg-muted/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2 overflow-hidden border border-primary/10 bg-white">
                <img src="/logo.png" alt="VeloCocoa Logo" className="w-full h-full object-cover" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-[#3B1A08] dark:text-white">
                VeloCocoa <span className="text-primary italic font-light">CRM</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Akses portal sales & manajemen mitra eksklusif
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={(e) => handleLogin(e, '/dashboard')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="sales@velococoa.com" 
                      className="pl-10 h-12 bg-background border-border focus-visible:ring-primary"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 h-12 bg-background border-border focus-visible:ring-primary"
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengautentikasi...
                    </>
                  ) : "Masuk ke Dashboard CRM"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center gap-4 pb-8">
              <p className="text-xs text-muted-foreground">
                © 2024 PT VeloCocoa Indonesia
              </p>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* View 3: Marketing Login Form */}
      {activeSection === 'LOGIN_MARKETING' && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="border-2 border-teal-500/20 shadow-2xl bg-white dark:bg-[#2A1D16] overflow-hidden rounded-3xl">
            <div className="h-2 bg-teal-500 w-full" />
            
            <CardHeader className="space-y-4 text-center pt-8 relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setActiveSection('PORTAL')}
                className="absolute left-4 top-4 text-muted-foreground hover:bg-muted/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2 overflow-hidden border border-teal-500/10 bg-white">
                <img src="/logo.png" alt="VeloCocoa Logo" className="w-full h-full object-cover" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-[#3B1A08] dark:text-white">
                VeloCocoa <span className="text-teal-500 italic font-light">Marketing</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Akses portal kampanye promosi & prospek email
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={(e) => handleLogin(e, '/marketing')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="marketing@velococoa.com" 
                      className="pl-10 h-12 bg-background border-border focus-visible:ring-teal-500"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 h-12 bg-background border-border focus-visible:ring-teal-500"
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-all duration-300 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengautentikasi...
                    </>
                  ) : "Masuk ke Dashboard Marketing"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center gap-4 pb-8">
              <p className="text-xs text-muted-foreground">
                © 2024 PT VeloCocoa Indonesia
              </p>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* View 4: Accounting Login Form */}
      {activeSection === 'LOGIN_ACCOUNTING' && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="border-2 border-indigo-500/20 shadow-2xl bg-white dark:bg-[#2A1D16] overflow-hidden rounded-3xl">
            <div className="h-2 bg-indigo-500 w-full" />
            
            <CardHeader className="space-y-4 text-center pt-8 relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setActiveSection('PORTAL')}
                className="absolute left-4 top-4 text-muted-foreground hover:bg-muted/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2 overflow-hidden border border-indigo-500/10 bg-white">
                <img src="/logo.png" alt="VeloCocoa Logo" className="w-full h-full object-cover" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-[#3B1A08] dark:text-white">
                VeloCocoa <span className="text-indigo-500 italic font-light">Accounting</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Akses portal keuangan, faktur & ledger mitra
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={(e) => handleLogin(e, '/accounting')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="finance@velococoa.com" 
                      className="pl-10 h-12 bg-background border-border focus-visible:ring-indigo-500"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 h-12 bg-background border-border focus-visible:ring-indigo-500"
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengautentikasi...
                    </>
                  ) : "Masuk ke Dashboard Accounting"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center gap-4 pb-8">
              <p className="text-xs text-muted-foreground">
                © 2024 PT VeloCocoa Indonesia
              </p>
            </CardFooter>
          </Card>
        </div>
      )}

    </div>
  );
}