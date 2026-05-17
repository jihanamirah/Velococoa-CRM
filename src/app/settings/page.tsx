"use client";

import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Database, 
  Cpu, 
  Cloud, 
  CheckCircle2, 
  Globe, 
  User, 
  Key,
  ShieldCheck,
  Server
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <CRMLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
          <p className="text-muted-foreground">Kelola kredensial server dan integrasi API VeloCocoa CRM.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md bg-card/40 backdrop-blur-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Koneksi Odoo ERP 18
              </CardTitle>
              <CardDescription>Status sinkronisasi model crm.lead dan crm.stage via XML-RPC API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <div className="font-bold text-sm">Terhubung ke Odoo</div>
                    <div className="text-xs opacity-80">Sinkronisasi data lead berjalan aktif dua arah.</div>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-white border-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                  ACTIVE
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Server URL
                  </div>
                  <div className="font-mono font-medium truncate">https://www.ptrfserp.com/</div>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Server className="h-3 w-3" /> Database
                  </div>
                  <div className="font-mono font-medium">ASPK60</div>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Username
                  </div>
                  <div className="font-mono font-medium truncate">jihanamirahk1@gmail.com</div>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Key className="h-3 w-3" /> XML-RPC Port
                  </div>
                  <div className="font-mono font-medium">443 (HTTPS Secure)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                Cloud Database
              </CardTitle>
              <CardDescription>Status Firebase Firestore.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  <div className="font-bold text-sm">Realtime Active</div>
                </div>
                <Badge className="bg-blue-500 text-white border-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                  LIVE
                </Badge>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="font-semibold">Provider</span>
                  <span>Google Firebase</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="font-semibold">Koleksi Leads</span>
                  <span>leads</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="font-semibold">Koleksi Notif</span>
                  <span>notifications</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-md bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              AI Lead Intelligence Co-Pilot
            </CardTitle>
            <CardDescription>Status automasi pemrosesan segmentasi dan prioritas lead PT VeloCocoa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <div className="font-bold flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Segmentasi Bisnis
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menentukan segmentasi industri (Hotel, Kafe, Korporasi, Retail, dll) secara cerdas berdasarkan nama & catatan lead.
                </p>
                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold">AUTOMATED</Badge>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <div className="font-bold flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Prioritas Follow-Up
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menganalisis urgensi dan volume estimasi pemesanan untuk men-set prioritas (High, Medium, Low) bagi tim sales.
                </p>
                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold">AUTOMATED</Badge>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <div className="font-bold flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Gemini LLM Engine
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Memanfaatkan Generative AI untuk menyusun rekomendasi narasi sales co-pilot yang intuitif & berkonversi tinggi.
                </p>
                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold">GEMINI FLASH</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
