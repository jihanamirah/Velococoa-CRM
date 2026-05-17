"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate Firebase Auth
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] dark:bg-[#1F140F] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white dark:bg-[#2A1D16] overflow-hidden">
        <div className="h-2 bg-primary w-full"></div>
        <CardHeader className="space-y-4 text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
             <div className="text-2xl font-bold text-primary">V</div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-[#3B1A08] dark:text-white">
            VeloCocoa <span className="text-primary italic font-light">CRM</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Akses portal sales & manajemen mitra eksklusif
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@velococoa.com" 
                  className="pl-10 h-12 bg-background border-border focus-visible:ring-primary"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengautentikasi...
                </>
              ) : "Masuk ke Dashboard"}
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
  );
}