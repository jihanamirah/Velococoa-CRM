"use client";

import React, { useState, useEffect } from 'react';
import { CRMLayout } from "@/components/layout/crm-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  getInvoices, 
  getJournalEntries
} from "@/app/lib/crm-service";
import { 
  Wallet, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Loader2,
  Receipt,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface InvoiceRecord {
  id: string;
  name: string;
  state: string;
  paymentState: string;
  invoiceDate: string;
  invoiceDateDue: string;
  amountTotal: number;
  partnerId: number;
  partnerName: string;
}

interface JournalEntryRecord {
  id: string;
  name: string;
  ref: string;
  date: string;
  amountTotal: number;
  state: string;
}

export default function AccountingDashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Currency Formatter
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedInvoices, fetchedJournals] = await Promise.all([
        getInvoices(),
        getJournalEntries()
      ]);

      // Filter specifically for PT VeloCocoa relevant invoices
      const velococoaInvoices = fetchedInvoices.filter(inv => {
        const name = inv.partnerName.toLowerCase();
        return name.includes('velococoa') ||
               name.includes('harmoni') ||
               name.includes('klasik') ||
               name.includes('literasi') ||
               name.includes('mitra') ||
               name.includes('grand') ||
               name.includes('hilton');
      });

      // Filter specifically for PT VeloCocoa journal entries
      const velococoaJournals = fetchedJournals.filter(entry => {
        const text = (entry.name + ' ' + entry.ref).toLowerCase();
        return text.includes('inv/') || 
               text.includes('bill/') || 
               text.includes('pcsh') || 
               text.includes('pbnk') ||
               text.includes('velococoa');
      });

      setInvoices(velococoaInvoices);
      setJournalEntries(velococoaJournals);
    } catch (error) {
      console.error("Failed to load accounting data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats Calculations
  const totalInvoicesCount = invoices.length;
  
  const totalReceivables = invoices
    .filter(inv => inv.paymentState !== 'paid')
    .reduce((sum, inv) => sum + inv.amountTotal, 0);

  const totalPaidRevenue = invoices
    .filter(inv => inv.paymentState === 'paid')
    .reduce((sum, inv) => sum + inv.amountTotal, 0);

  const collectionRate = totalInvoicesCount > 0
    ? ((invoices.filter(inv => inv.paymentState === 'paid').length / totalInvoicesCount) * 100).toFixed(1)
    : '0.0';

  // Get recent 5 invoices & 5 journal entries for overview
  const recentInvoices = invoices.slice(0, 5);
  const recentJournals = journalEntries.slice(0, 5);

  return (
    <CRMLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#4C382D] dark:text-white flex items-center gap-2">
              <Wallet className="h-8 w-8 text-indigo-600 animate-bounce" /> Accounting Dashboard
            </h2>
            <p className="text-muted-foreground text-sm">
              Analisis metrik keuangan realtime, performa tagihan, dan ringkasan mutasi kas PT VeloCocoa Indonesia.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-28 bg-muted rounded-2xl border border-border/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Card 1: Total Receivables */}
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Piutang</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500 dark:text-red-400">{formatRupiah(totalReceivables)}</div>
                <p className="text-xs text-muted-foreground mt-1">Tagihan Belum Lunas (VeloCocoa)</p>
              </CardContent>
            </Card>

            {/* Card 2: Total Invoices Count */}
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Faktur Terbit</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4C382D] dark:text-white">{totalInvoicesCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Faktur Customer Odoo</p>
              </CardContent>
            </Card>

            {/* Card 3: Collection Rate */}
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Rasio Lunas</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{collectionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Rasio Pembayaran Faktur</p>
              </CardContent>
            </Card>

            {/* Card 4: Net Revenue Collected */}
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Kas Masuk</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(totalPaidRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Pendapatan Terbayar Lunas</p>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Dynamic Navigation Cards & Shortcuts */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Box 1: Faktur Penjualan Shortcut */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-[#4C382D] dark:text-white flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-indigo-600" /> Modul Faktur Penjualan (Invoices)
                </CardTitle>
                <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1 rounded-full font-bold">
                  Odoo Active Sync
                </span>
              </div>
              <CardDescription className="pt-2">
                Kelola customer billing PT VeloCocoa, integrasikan dengan katalog produk Odoo, kelola volume pembelian customer, serta post faktur secara instan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between items-center text-xs border-b border-border/40 pb-2">
                  <span className="font-semibold text-muted-foreground">INVOICE TERBARU</span>
                  <span className="font-semibold text-muted-foreground">NILAI</span>
                </div>
                {isLoading ? (
                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-1 text-indigo-600" /> Memuat data...
                  </div>
                ) : recentInvoices.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-2">Tidak ada invoice aktif</div>
                ) : (
                  recentInvoices.map(inv => (
                    <div key={inv.id} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {inv.name} - {inv.partnerName}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(inv.amountTotal)}</span>
                    </div>
                  ))
                )}
              </div>
              <Link href="/accounting/invoices" className="w-full block">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10">
                  Buka Faktur Penjualan <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Box 2: Journal Entries Shortcut */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-[#4C382D] dark:text-white flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-slate-600" /> Modul Journal Entries (Jurnal)
                </CardTitle>
                <span className="text-xs bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
                  Buku Besar
                </span>
              </div>
              <CardDescription className="pt-2">
                Pantau log pembukuan kas/bank secara akurat, kelola debit/kredit mutasi, dan lakukan auditing transaksi internal ERP secara tersinkronisasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between items-center text-xs border-b border-border/40 pb-2">
                  <span className="font-semibold text-muted-foreground">KODE JURNAL</span>
                  <span className="font-semibold text-muted-foreground">MUTASI KAS</span>
                </div>
                {isLoading ? (
                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-1 text-slate-600" /> Memuat data...
                  </div>
                ) : recentJournals.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-2">Tidak ada entri jurnal aktif</div>
                ) : (
                  recentJournals.map(j => (
                    <div key={j.id} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {j.name} - {j.ref || "Manual"}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(j.amountTotal)}</span>
                    </div>
                  ))
                )}
              </div>
              <Link href="/accounting/journals" className="w-full block">
                <Button variant="outline" className="w-full hover:bg-muted font-bold rounded-xl flex items-center justify-center gap-1.5">
                  Buka Entri Jurnal <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

        {/* Security / Connection Footer Widget */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-emerald-800 dark:text-emerald-400 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-bold">Koneksi ERP Odoo Aman & Terenkripsi</span>
              <p className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80">
                Semua data invoice, katalog produk, volume kuantitas, dan mutasi entri jurnal disinkronkan secara langsung menggunakan XML-RPC API yang aman.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-bold bg-emerald-600 text-white px-3 py-1 rounded-lg w-fit">
            <Activity className="h-3.5 w-3.5" /> Terhubung Realtime
          </div>
        </div>

      </div>
    </CRMLayout>
  );
}
