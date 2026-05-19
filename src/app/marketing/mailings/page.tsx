"use client";

import React, { useState, useEffect } from 'react';
import { CRMLayout } from "@/components/layout/crm-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  getMailings, 
  createMailing, 
  getUtmCampaigns 
} from "@/app/lib/crm-service";
import { 
  Megaphone, 
  Send, 
  MailOpen, 
  MousePointerClick, 
  Plus, 
  Search, 
  Sparkles, 
  ExternalLink,
  FileText,
  Loader2,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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
  userId?: [number, string];
}

interface UtmCampaign {
  id: string;
  name: string;
  title: string;
}

export default function MailingsPage() {
  const [mailings, setMailings] = useState<MailingCampaign[]>([]);
  const [utmCampaigns, setUtmCampaigns] = useState<UtmCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('ALL');
  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMailing, setSelectedMailing] = useState<MailingCampaign | null>(null);
  
  // Form states (Campaign)
  const [newSubject, setNewSubject] = useState('');
  const [selectedUtmId, setSelectedUtmId] = useState('0');
  const [selectedTemplate, setSelectedTemplate] = useState('CUSTOM');
  const [newBodyHtml, setNewBodyHtml] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    let body = "";
    
    if (templateKey === "CAFE") {
      body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #3b1a08; border-bottom: 2px solid #D05A1E; padding-bottom: 10px; font-weight: bold;">Penawaran Cokelat Premium Spesial Kafe</h2>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Dear Owner/Manager Café,</p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Kami dari <b>PT VeloCocoa Indonesia</b> menawarkan kerja sama pasokan bahan baku cokelat premium artisanal untuk memperkaya menu minuman dan dessert di kafe Anda.</p>
        <div style="background-color: #f7fafc; border-left: 4px solid #D05A1E; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; color: #3b1a08; font-size: 15px;">Daftar Produk Unggulan Kafe:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a5568; line-height: 1.5;">
            <li><b>Chocolate Couverture Buttons</b> - Meleleh sempurna untuk hot chocolate</li>
            <li><b>Artisanal Cocoa Powder 100%</b> - Aroma murni chocolatey premium</li>
            <li><b>Chocolate Toppings & Shavings</b> - Mempercantik visual latte dan waffle</li>
          </ul>
        </div>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Dapatkan <b>Diskon Perdana 15%</b> untuk pesanan pertama Anda bulan ini.</p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6; margin-top: 30px;">Salam Hangat,<br><b>VeloCocoa Sales Representative Team</b></p>
      </div>`;
    } else if (templateKey === "HOTEL") {
      body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #3b1a08; border-bottom: 2px solid #D05A1E; padding-bottom: 10px; font-weight: bold;">Kerja Sama Banquet & Hotel Supplies</h2>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Kepada Yth.<br><b>Purchasing Manager / F&B Director Hotel</b></p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">VeloCocoa menghadirkan produk cokelat banquet berkualitas tinggi dengan rasa otentik khas artisanal untuk kebutuhan hidangan tamu hotel Anda. Kami siap mensuplai cokelat premium custom dengan standard sertifikasi internasional.</p>
        <div style="background-color: #f7fafc; border-left: 4px solid #D05A1E; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; color: #3b1a08; font-size: 15px;">Keuntungan Bermitra dengan VeloCocoa:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a5568; line-height: 1.5;">
            <li>Sertifikasi Halal & BPOM Lengkap</li>
            <li>Kapasitas produksi skala besar dengan jadwal kirim terjamin</li>
            <li>Bisa custom profil rasa cokelat (dark, milk, white) sesuai permintaan Chef</li>
          </ul>
        </div>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Kami siap membawakan sampel produk gratis ke hotel Anda untuk sesi testing rasa.</p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6; margin-top: 30px;">Hormat Kami,<br><b>PT VeloCocoa Indonesia Supply Division</b></p>
      </div>`;
    } else if (templateKey === "BAKERY") {
      body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #3b1a08; border-bottom: 2px solid #D05A1E; padding-bottom: 10px; font-weight: bold;">Tingkatkan Kualitas Roti & Cake Anda</h2>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Halo Rekan Bakery,</p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Tingkatkan kualitas cake, cookies, dan pastry Anda menggunakan chocolate chunks dan cocoa powder murni beraroma premium dari VeloCocoa.</p>
        <div style="background-color: #f7fafc; border-left: 4px solid #D05A1E; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; color: #3b1a08; font-size: 15px;">Chocolate Supplies Terpopuler:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a5568; line-height: 1.5;">
            <li><b>Bake-Stable Chocolate Chips</b> - Tidak lumer saat dipanggang di oven</li>
            <li><b>Dark Chocolate Block 58% & 72%</b> - Ideal untuk filling dan ganache</li>
            <li><b>Pure Chocolate Spread</b> - Olesan premium dengan cita rasa hazelnut cocoa murni</li>
          </ul>
        </div>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Hubungi sales kami untuk mendapatkan katalog harga grosir industri khusus produsen bakery.</p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6; margin-top: 30px;">Salam Cokelat,<br><b>VeloCocoa Artisanal Supply</b></p>
      </div>`;
    } else {
      body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <p style="font-size: 14px; color: #4a5568;">Tulis isi email kampanye Anda di sini...</p>
      </div>`;
    }
    
    setNewBodyHtml(body);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    
    try {
      setIsSubmitting(true);
      const res = await createMailing(
        newSubject, 
        parseInt(selectedUtmId, 10), 
        newBodyHtml
      );
      
      if (res.success) {
        setIsCreateOpen(false);
        setNewSubject('');
        setSelectedUtmId('0');
        setSelectedTemplate('CUSTOM');
        setNewBodyHtml('');
        loadData();
      } else {
        alert("Gagal membuat mailing di Odoo: " + res.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get list of unique creators
  const uniqueCreators = Array.from(
    new Set(
      mailings
        .map(m => m.userId ? m.userId[1] : 'OdooBot')
        .filter(Boolean)
    )
  );

  // Filter campaigns
  const filteredMailings = mailings.filter(m => {
    const creatorName = m.userId ? m.userId[1] : 'OdooBot';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = m.subject.toLowerCase().includes(query) ||
                          m.campaignName.toLowerCase().includes(query) ||
                          creatorName.toLowerCase().includes(query);
                          
    const matchesCreator = selectedCreator === 'ALL' || creatorName === selectedCreator;
    const matchesCampaign = selectedCampaignId === 'ALL' || String(m.campaignId) === selectedCampaignId;
    
    return matchesSearch && matchesCreator && matchesCampaign;
  });

  return (
    <CRMLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#3b1a08] dark:text-white flex items-center gap-2">
              <MailOpen className="h-8 w-8 text-[#D05A1E] animate-pulse" /> Mailing Broadcast
            </h2>
            <p className="text-muted-foreground text-sm">
              Buat, desain template, dan kirimkan email promosi massal (mass mailing) PT VeloCocoa melalui Odoo ERP.
            </p>
          </div>
          
          <Button 
            onClick={() => {
              handleTemplateChange('CAFE');
              setIsCreateOpen(true);
            }} 
            className="bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold rounded-xl shadow-lg shadow-orange-500/10 flex items-center gap-1.5"
          >
            <Plus className="h-5 w-5" /> Buat Mailing Baru
          </Button>
        </div>

        {/* Mini Stats Grid */}
        {!isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow bg-white dark:bg-[#2A1D16] p-4 flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">Aktif</span>
                <span className="text-lg font-black">{totalCampaigns} Broadcast</span>
              </div>
            </Card>
            <Card className="border-none shadow bg-white dark:bg-[#2A1D16] p-4 flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">Terkirim</span>
                <span className="text-lg font-black">{totalSent} Peneriman</span>
              </div>
            </Card>
            <Card className="border-none shadow bg-white dark:bg-[#2A1D16] p-4 flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <MailOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">Open Rate</span>
                <span className="text-lg font-black text-amber-500">{avgOpenRate}%</span>
              </div>
            </Card>
            <Card className="border-none shadow bg-white dark:bg-[#2A1D16] p-4 flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">Click Rate (CTR)</span>
                <span className="text-lg font-black text-indigo-500">{avgClickRate}%</span>
              </div>
            </Card>
          </div>
        )}

        {/* Campaign Table Card */}
        <Card className="border-none shadow-lg bg-white dark:bg-[#2A1D16] rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-[#3b1a08] dark:text-white">Daftar Mailing Broadcast</CardTitle>
                <CardDescription>Menampilkan log pengiriman dari modul Odoo mass.mailing.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:max-w-2xl justify-end">
                {/* Search Input */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari subjek email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background border-border w-full"
                  />
                </div>
                
                {/* Creator Filter */}
                <select
                  value={selectedCreator}
                  onChange={(e) => setSelectedCreator(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus-visible:ring-[#D05A1E] outline-none shadow-sm cursor-pointer dark:text-white"
                >
                  <option value="ALL">👤 Semua Pembuat</option>
                  {uniqueCreators.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                {/* UTM Campaign Filter */}
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus-visible:ring-[#D05A1E] outline-none shadow-sm cursor-pointer max-w-[180px] truncate dark:text-white"
                >
                  <option value="ALL">🎯 Semua Kampanye</option>
                  {utmCampaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#D05A1E]" />
                <span>Menarik data email dari Odoo ERP...</span>
              </div>
            ) : filteredMailings.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                <span className="font-semibold text-[#3b1a08] dark:text-white">Tidak ada email ditemukan</span>
                <span className="text-xs">Ubah filter pencarian atau buat email baru.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase">
                      <th className="px-6 py-4">Subjek Broadcast</th>
                      <th className="px-6 py-4">Induk UTM</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Terkirim</th>
                      <th className="px-6 py-4 text-center">Rasio Terbuka</th>
                      <th className="px-6 py-4 text-center">Rasio Klik</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredMailings.map(m => {
                      const openPct = m.sent > 0 ? ((m.opened / m.sent) * 100).toFixed(0) : '0';
                      const clickPct = m.sent > 0 ? ((m.clicked / m.sent) * 100).toFixed(0) : '0';

                      return (
                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 max-w-xs">
                            <div className="font-bold text-[#3b1a08] dark:text-white truncate">{m.subject}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-semibold">
                              <span>Pembuat:</span>
                              <span className="text-neutral-600 dark:text-neutral-400 font-bold">{m.userId ? m.userId[1] : 'OdooBot'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                            {m.campaignName ? (
                              <span className="bg-[#D05A1E]/10 text-[#D05A1E] px-2 py-0.5 rounded-full font-bold">
                                {m.campaignName}
                              </span>
                            ) : (
                              <span className="italic text-muted-foreground/60">Tidak Terikat</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {m.state === 'done' && (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <CheckCircle className="h-3.5 w-3.5" /> Selesai
                              </span>
                            )}
                            {m.state === 'sending' && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengirim
                              </span>
                            )}
                            {m.state === 'in_queue' && (
                              <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <Loader2 className="h-3.5 w-3.5" /> Antrean
                              </span>
                            )}
                            {m.state === 'draft' && (
                              <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <FileText className="h-3.5 w-3.5" /> Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-[#3b1a08] dark:text-white">
                            {m.sent}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-orange-500">{openPct}%</span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${openPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-indigo-500">{clickPct}%</span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${clickPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              onClick={() => {
                                  setSelectedMailing(m);
                                  setIsDetailOpen(true);
                              }}
                              variant="ghost" 
                              size="sm" 
                              className="text-xs font-semibold text-[#D05A1E] hover:text-[#B34914] hover:bg-[#D05A1E]/10"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Detail
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Create Mailing */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <form 
              onSubmit={handleSubmit}
              className="bg-card w-full max-w-2xl p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <MailOpen className="h-6 w-6 text-[#D05A1E]" /> Buat Broadcast Baru
                </h2>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsCreateOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-semibold">Subjek Email Broadcast</Label>
                <Input 
                  id="subject"
                  placeholder="Contoh: Spesial Ramadhan: Penawaran Cokelat Premium VeloCocoa"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="bg-background border-primary/20"
                  required
                />
              </div>

              {/* UTM Campaign Link */}
              <div className="space-y-1.5">
                <Label htmlFor="utm" className="text-xs font-semibold">Kampanye Induk UTM (Odoo Campaign)</Label>
                <select 
                  id="utm"
                  value={selectedUtmId}
                  onChange={(e) => setSelectedUtmId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 outline-none font-semibold text-foreground"
                >
                  <option value="0">--- Tidak Dikaitkan ---</option>
                  {utmCampaigns.map(utm => (
                    <option key={utm.id} value={utm.id}>
                      {utm.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="template" className="text-xs font-semibold text-[#D05A1E] flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Template Cokelat VeloCocoa (Auto-Fill)
                </Label>
                <select 
                  id="template"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-primary outline-none font-semibold text-[#D05A1E]"
                >
                  <option value="CAFE">☕ Template Kemitraan Kafe / Coffee Shop</option>
                  <option value="HOTEL">🏨 Template Pasokan Hotel Supplies / Banquet</option>
                  <option value="BAKERY">🍞 Template Supplier Roti / Bakery</option>
                  <option value="CUSTOM">🖋️ Buat Konten Kosong / Custom</option>
                </select>
              </div>

              {/* Body HTML */}
              <div className="space-y-1.5">
                <Label htmlFor="body" className="text-xs font-semibold">Desain & Konten Email (HTML Editor)</Label>
                <Textarea 
                  id="body"
                  placeholder="Tulis kode HTML atau tulisan email Anda..."
                  value={newBodyHtml}
                  onChange={(e) => setNewBodyHtml(e.target.value)}
                  className="bg-background border-primary/20 font-mono text-xs min-h-[220px]"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/30">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Memproses di Odoo...
                    </>
                  ) : "Simpan di Odoo (Draft)"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsCreateOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10 font-medium"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Detail Preview */}
        {isDetailOpen && selectedMailing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="bg-card w-full max-w-2xl p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-[#D05A1E]" /> Detail Broadcast
                </h2>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsDetailOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 border border-primary/10 rounded-xl text-xs text-muted-foreground">
                <div>
                  <span className="block font-semibold">Subjek:</span>
                  <span className="text-[#3b1a08] dark:text-white font-bold text-sm">{selectedMailing.subject}</span>
                </div>
                <div>
                  <span className="block font-semibold">Kampanye UTM:</span>
                  <span className="text-[#D05A1E] font-bold text-sm">
                    {selectedMailing.campaignName || "--- Tidak Terikat ---"}
                  </span>
                </div>
                <div>
                  <span className="block font-semibold">Status Pengiriman:</span>
                  <span className="capitalize font-bold text-sm">{selectedMailing.state}</span>
                </div>
                <div>
                  <span className="block font-semibold">Penerima Sukses:</span>
                  <span className="font-bold text-sm text-[#3b1a08] dark:text-white">{selectedMailing.sent} Email</span>
                </div>
              </div>

              {/* HTML Body preview */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Pratinjau Isi Email:</Label>
                <div className="border border-primary/10 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto p-4">
                  {selectedMailing.bodyHtml ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedMailing.bodyHtml }} 
                      className="text-sm text-foreground bg-white"
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground/60 italic text-xs">
                      Isi email tidak menggunakan template HTML / kosong.
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex pt-2 border-t border-border/30">
                <Button 
                  type="button" 
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold"
                >
                  Tutup Detail
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </CRMLayout>
  );
}
