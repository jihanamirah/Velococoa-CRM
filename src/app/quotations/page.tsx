"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  User, 
  Calendar,
  Receipt,
  FileText,
  DollarSign,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { getQuotations, Quotation } from '@/app/lib/crm-service';
import { cn } from '@/lib/utils';

function QuotationsContent() {
  const searchParams = useSearchParams();
  const leadIdFilter = searchParams.get('leadId');

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getQuotations(leadIdFilter || undefined)
      .then((data) => {
        setQuotations(data);
      })
      .catch((err) => {
        console.error("Gagal mengambil quotations:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [leadIdFilter]);

  const filteredQuotations = quotations.filter(q => {
    let matchesFilter = true;
    if (filter === 'Draft') {
      matchesFilter = q.state === 'draft';
    } else if (filter === 'Sent') {
      matchesFilter = q.state === 'sent';
    } else if (filter === 'Sale') {
      matchesFilter = q.state === 'sale';
    } else if (filter === 'Cancel') {
      matchesFilter = q.state === 'cancel';
    }

    const matchesSearch = 
      q.name.toLowerCase().includes(search.toLowerCase()) || 
      q.partnerName.toLowerCase().includes(search.toLowerCase()) ||
      (q.opportunityName && q.opportunityName.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const stateBadges: Record<string, { label: string; className: string }> = {
    draft: { label: 'Quotation', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    sent: { label: 'Quotation Sent', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    sale: { label: 'Sales Order', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    cancel: { label: 'Cancelled', className: 'bg-red-500/10 text-red-500 border-red-500/20' }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daftar Penawaran Harga (Quotations)</h1>
          <p className="text-muted-foreground">
            {leadIdFilter 
              ? `Menampilkan penawaran untuk Lead #${leadIdFilter}` 
              : "Kelola quotations dan sales orders VeloCocoa yang terhubung ke Odoo."}
          </p>
        </div>
        {leadIdFilter && (
          <Button variant="outline" asChild>
            <Link href={`/leads/${leadIdFilter}`}>
              Kembali ke Lead Detail
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari kode penawaran, customer, atau lead..." 
            className="pl-10 bg-card/50 border-border/50 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['Semua', 'Draft', 'Sent', 'Sale', 'Cancel'].map((s) => (
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
              {s === 'Semua' ? 'Semua' : s === 'Draft' ? 'Quotation' : s === 'Sent' ? 'Quotation Sent' : s === 'Sale' ? 'Sales Order' : 'Cancelled'}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium">Memuat data penawaran dari Odoo...</p>
        </div>
      ) : filteredQuotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/50 rounded-2xl bg-card/10 space-y-4">
          <Receipt className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium text-lg">Tidak ada penawaran ditemukan.</p>
          {leadIdFilter && (
            <Button asChild>
              <Link href={`/leads/${leadIdFilter}`}>Buat Quotation Pertama</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotations.map((quote) => {
            const badge = stateBadges[quote.state] || { label: quote.state, className: '' };
            return (
              <Link key={quote.id} href={`/quotations/${quote.id}`}>
                <Card className="border-none shadow-md bg-card/40 hover:bg-card/60 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-4">
                    <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wider", badge.className)}>
                      {badge.label}
                    </Badge>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> {quote.name}
                      </div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors flex items-center gap-2">
                        {quote.partnerName}
                      </h3>
                      {quote.opportunityName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          Lead: {quote.opportunityName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Customer ID</span>
                        <span className="font-medium">{quote.partnerId}</span>
                      </div>
                      {quote.validityDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Kedaluwarsa</span>
                          <span className="font-medium text-destructive/80">{quote.validityDate}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-semibold">Total Nilai</span>
                        <span className="font-bold text-primary text-base">
                          {formatIDR(quote.amountTotal)}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="px-6 py-4 bg-muted/20 border-t border-border/10 flex items-center justify-between text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    <span>Lihat Detail Penawaran</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <CRMLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium">Memuat data penawaran...</p>
        </div>
      }>
        <QuotationsContent />
      </Suspense>
    </CRMLayout>
  );
}
