"use client";

import React, { useState, useEffect } from 'react';
import { CRMLayout } from "@/components/layout/crm-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getMailings, 
  getUtmCampaigns 
} from "@/app/lib/crm-service";
import { 
  Megaphone, 
  Send, 
  MailOpen, 
  MousePointerClick, 
  Sparkles, 
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  Award,
  Users2
} from 'lucide-react';
import Link from 'next/link';

interface MailingCampaign {
  id: string;
  subject: string;
  state: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bodyHtml: string;
  campaignId: number;
  campaignName: string;
}

interface UtmCampaign {
  id: string;
  name: string;
  title: string;
}

export default function MarketingPage() {
  const [mailings, setMailings] = useState<MailingCampaign[]>([]);
  const [utmCampaigns, setUtmCampaigns] = useState<UtmCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats calculation
  const totalCampaigns = mailings.length;
  const totalSent = mailings.reduce((sum, m) => sum + m.sent, 0);
  
  const totalOpened = mailings.reduce((sum, m) => sum + m.opened, 0);
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0';
  
  const totalClicked = mailings.reduce((sum, m) => sum + m.clicked, 0);
  const avgClickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0';

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedMailings, fetchedUtms] = await Promise.all([
        getMailings(),
        getUtmCampaigns()
      ]);
      
      // Filter specifically for PT VeloCocoa relevant campaign data
      const velococoaMailings = fetchedMailings.filter(m => {
        const text = (m.subject + ' ' + m.campaignName + ' ' + m.bodyHtml).toLowerCase();
        return text.includes('velococoa') || 
               text.includes('mitra') || 
               text.includes('ethicocoa') || 
               text.includes('chocora') || 
               text.includes('ramadan') || 
               text.includes('cokelat') || 
               text.includes('cafe') || 
               text.includes('bakery') || 
               text.includes('hotel');
      });

      const velococoaUtms = fetchedUtms.filter(u => {
        const text = (u.title + ' ' + u.name).toLowerCase();
        return text.includes('velococoa') || 
               text.includes('mitra') || 
               text.includes('ethicocoa') || 
               text.includes('chocora') || 
               text.includes('campaign');
      });

      setMailings(velococoaMailings);
      setUtmCampaigns(velococoaUtms);
    } catch (error) {
      console.error("Failed to load marketing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <CRMLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#4C382D] dark:text-white flex items-center gap-2">
              <Megaphone className="h-8 w-8 text-[#D05A1E] animate-pulse" /> Marketing Dashboard
            </h2>
            <p className="text-muted-foreground text-sm">
              Analisis performa kampanye promosi dan pelacakan segmen pemasaran PT VeloCocoa Indonesia secara terpadu.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-28 bg-muted rounded-2xl border border-border/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Card 1: Total Campaigns */}
            <Card className="border-none shadow-md bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Kampanye</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-[#D05A1E]/10 text-[#D05A1E] flex items-center justify-center">
                  <Megaphone className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4C382D] dark:text-white">{totalCampaigns}</div>
                <p className="text-xs text-muted-foreground mt-1">Broadcast VeloCocoa di Odoo</p>
              </CardContent>
            </Card>

            {/* Card 2: Total Sent */}
            <Card className="border-none shadow-md bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Email Terkirim</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4C382D] dark:text-white">{totalSent}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Broadcast Sukses</p>
              </CardContent>
            </Card>

            {/* Card 3: Open Rate */}
            <Card className="border-none shadow-md bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Rata-rata Terbuka</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <MailOpen className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{avgOpenRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Open Rate Terbaca</p>
              </CardContent>
            </Card>

            {/* Card 4: Click Rate */}
            <Card className="border-none shadow-md bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Rata-rata Klik</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <MousePointerClick className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{avgClickRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Click Through Rate (CTR)</p>
              </CardContent>
            </Card>

          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* UTM Campaigns List Widget */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-[#4C382D] dark:text-white flex items-center gap-1.5">
                  <Award className="h-5 w-5 text-[#D05A1E]" /> Induk Kampanye UTM Pemasaran (Odoo)
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar kampanye promosi berlabel khusus PT VeloCocoa di sistem Odoo ERP.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#D05A1E]" />
                    <span className="text-xs">Memuat data UTM...</span>
                  </div>
                ) : utmCampaigns.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground italic text-xs">
                    Tidak ada UTM Campaign bertema VeloCocoa yang terdeteksi di Odoo.
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {utmCampaigns.map(utm => (
                      <div key={utm.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <div>
                          <span className="block font-bold text-sm text-[#4C382D] dark:text-white">{utm.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">Kode UTM: {utm.name}</span>
                        </div>
                        <span className="bg-[#D05A1E]/10 text-[#D05A1E] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          ID: {utm.id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Navigator Widget */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-[#4C382D] dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-[#D05A1E]" /> Pintasan Pemasaran
                </CardTitle>
                <CardDescription className="text-xs">Akses cepat menu fungsional promosi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                
                <Link href="/marketing/campaigns">
                  <Button className="w-full bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold rounded-xl flex items-center justify-between px-4 py-6 shadow-md shadow-orange-500/10">
                    <span className="flex items-center gap-2">
                      <Send className="h-5 w-5" /> Kelola Kampanye Email
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/marketing/lists">
                  <Button variant="outline" className="w-full border-border hover:bg-muted/15 font-bold rounded-xl flex items-center justify-between px-4 py-6 text-foreground">
                    <span className="flex items-center gap-2">
                      <Users2 className="h-5 w-5 text-[#D05A1E]" /> Database Mailing List
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>

                <div className="p-3 bg-muted/20 border border-primary/5 rounded-xl text-[11px] text-muted-foreground leading-relaxed">
                  Semua broadcast email, segmentasi list kontak prospek, dan campaign tag disinkronisasikan langsung ke modul <b>Odoo Mass Mailing</b> secara realtime.
                </div>

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </CRMLayout>
  );
}

// Minimal loader component just in case
function Loader2({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
