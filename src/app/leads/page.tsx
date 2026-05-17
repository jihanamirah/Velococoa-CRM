"use client";

import { useEffect, useState } from 'react';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Building2, 
  Calendar,
  Plus,
  RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { getLeads, Lead } from '@/app/lib/crm-service';
import { cn } from '@/lib/utils';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getLeads().then(setLeads);
  }, []);

  const filteredLeads = leads.filter(l => {
    const matchesFilter = filter === 'Semua' || l.status === filter;
    const matchesSearch = l.namaPerusahaan.toLowerCase().includes(search.toLowerCase()) || 
                          l.namaLengkap.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statuses = ['Semua', 'Baru', 'Dihubungi', 'Negotiation', 'Qualified', 'Won', 'Lost'];

  return (
    <CRMLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daftar Leads</h1>
            <p className="text-muted-foreground">Kelola semua calon mitra PT VeloCocoa.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" asChild>
            <Link href="/leads/new">
              <Plus className="mr-2 h-4 w-4" /> Tambah Lead Manual
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari perusahaan atau nama lengkap..." 
              className="pl-10 bg-card/50 border-border/50 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {statuses.map((s) => (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded-full px-4 h-9",
                  filter === s ? "bg-primary text-white" : "bg-card/30 border-border/50"
                )}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`}>
              <Card className="border-none shadow-md bg-card/40 hover:bg-card/60 transition-all cursor-pointer group relative overflow-hidden">
                {lead.sudahSyncOdoo && (
                  <div className="absolute top-0 right-0 p-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] flex items-center gap-1">
                      <RefreshCcw className="h-3 w-3" /> Odoo Synced
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-widest">
                          <Building2 className="h-3 w-3" /> {lead.kategoriBisnis}
                        </div>
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{lead.namaPerusahaan}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {lead.namaLengkap.substring(0,2).toUpperCase()}
                      </div>
                      {lead.namaLengkap}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-3 py-1 uppercase tracking-widest font-bold border-none",
                          lead.status === 'Baru' && 'bg-blue-500/10 text-blue-500',
                          lead.status === 'Dihubungi' && 'bg-amber-500/10 text-amber-500',
                          lead.status === 'Negotiation' && 'bg-purple-500/10 text-purple-500',
                          lead.status === 'Qualified' && 'bg-green-500/10 text-green-500',
                          lead.status === 'Won' && 'bg-primary/20 text-primary',
                          lead.status === 'Lost' && 'bg-red-500/10 text-red-500',
                        )}
                      >
                        {lead.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {lead.kota}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {new Date(lead.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-primary/10 group-hover:bg-primary transition-all duration-300"></div>
              </Card>
            </Link>
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
               <div className="p-4 rounded-full bg-muted/20">
                 <Search className="h-12 w-12 opacity-20" />
               </div>
               <p>Tidak ada lead yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}