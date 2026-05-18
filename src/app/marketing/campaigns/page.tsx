"use client";

import React, { useState, useEffect } from 'react';
import { CRMLayout } from "@/components/layout/crm-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  getUtmCampaigns, 
  createUtmCampaign 
} from "@/app/lib/crm-service";
import { 
  Target, 
  Plus, 
  Search, 
  Loader2, 
  X,
  CheckCircle,
  AlertCircle,
  Tag
} from 'lucide-react';

interface UtmCampaign {
  id: string;
  name: string;
  title: string;
}

export default function CampaignsPage() {
  const [utmCampaigns, setUtmCampaigns] = useState<UtmCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form states (UTM Campaign)
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const fetchedUtms = await getUtmCampaigns();
      
      // Filter specifically for PT VeloCocoa relevant campaign tags
      const velococoaUtms = fetchedUtms.filter(u => {
        const text = (u.title + ' ' + u.name).toLowerCase();
        return text.includes('velococoa') || 
               text.includes('mitra') || 
               text.includes('ethicocoa') || 
               text.includes('chocora') || 
               text.includes('campaign');
      });

      setUtmCampaigns(velococoaUtms);
    } catch (error) {
      console.error("Failed to load UTM campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignTitle.trim() || !newCampaignName.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Sanitizing code name (lowercase and underscores)
      const sanitizedName = newCampaignName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      const res = await createUtmCampaign(
        newCampaignTitle, 
        sanitizedName
      );
      
      if (res.success) {
        setIsCreateOpen(false);
        setNewCampaignTitle('');
        setNewCampaignName('');
        loadData();
      } else {
        alert("Gagal membuat kampanye di Odoo: " + res.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate slug/code name when typing title
  const handleTitleChange = (val: string) => {
    setNewCampaignTitle(val);
    // Convert to lowercase and replace spaces with underscores for code name
    const autoSlug = val
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    setNewCampaignName(autoSlug);
  };

  // Filter campaigns
  const filteredCampaigns = utmCampaigns.filter(u => 
    u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CRMLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#3b1a08] dark:text-white flex items-center gap-2">
              <Target className="h-8 w-8 text-[#D05A1E] animate-pulse" /> Kampanye Pemasaran
            </h2>
            <p className="text-muted-foreground text-sm">
              Kelola induk kampanye pemasaran (UTM Campaign) dari Odoo ERP untuk melacak asal usul penjualan dan leads.
            </p>
          </div>
          
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold rounded-xl shadow-lg shadow-orange-500/10 flex items-center gap-1.5"
          >
            <Plus className="h-5 w-5" /> Buat Kampanye Baru
          </Button>
        </div>

        {/* Campaign Table Card */}
        <Card className="border-none shadow-lg bg-white dark:bg-[#2A1D16] rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-[#3b1a08] dark:text-white flex items-center gap-1.5">
                  <Tag className="h-5 w-5 text-[#D05A1E]" /> Daftar Kampanye Odoo (UTM)
                </CardTitle>
                <CardDescription>Menampilkan daftar tag induk kampanye yang terdaftar di Odoo ERP.</CardDescription>
              </div>
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari nama atau kode kampanye..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#D05A1E]" />
                <span>Menarik data kampanye dari Odoo ERP...</span>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                <span className="font-semibold text-[#3b1a08] dark:text-white">Tidak ada kampanye ditemukan</span>
                <span className="text-xs">Ubah filter pencarian atau buat kampanye baru.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase">
                      <th className="px-6 py-4">ID Odoo</th>
                      <th className="px-6 py-4">Judul Kampanye (Title)</th>
                      <th className="px-6 py-4">Kode Pelacakan UTM (Name)</th>
                      <th className="px-6 py-4">Status Integrasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredCampaigns.map(c => {
                      return (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground">
                            <span className="bg-[#D05A1E]/10 text-[#D05A1E] px-2.5 py-1 rounded-lg font-black">
                              {c.id}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-[#3b1a08] dark:text-white">
                            {c.title}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                            {c.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <CheckCircle className="h-3.5 w-3.5" /> Terhubung Realtime
                            </span>
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

        {/* Modal: Create UTM Campaign */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <form 
              onSubmit={handleSubmit}
              className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Target className="h-5 w-5 text-[#D05A1E]" /> Buat Kampanye Baru (UTM)
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

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">Judul Kampanye (Title)</Label>
                <Input 
                  id="title"
                  placeholder="Contoh: Kemitraan Kafe Jabodetabek 2026"
                  value={newCampaignTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-background border-primary/20"
                  required
                />
              </div>

              {/* Name (slug code name) */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">Kode Pelacakan UTM (Auto-Generated / URL-safe)</Label>
                <Input 
                  id="name"
                  placeholder="Contoh: kemitraan_kafe_jabodetabek_2026"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="bg-background border-primary/20 font-mono text-xs"
                  required
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Kode ini digunakan dalam link pelacakan UTM untuk mengaitkan prospek/leads secara otomatis di Odoo ERP.
                </p>
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
                      Membuat di Odoo...
                    </>
                  ) : "Buat Kampanye"}
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

      </div>
    </CRMLayout>
  );
}
