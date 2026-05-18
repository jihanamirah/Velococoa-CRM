"use client";

import React, { useState, useEffect } from 'react';
import { CRMLayout } from "@/components/layout/crm-layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  getJournalEntries
} from "@/app/lib/crm-service";
import { 
  BookOpen, 
  Search, 
  Loader2,
  AlertCircle,
  FileText,
  CheckSquare
} from 'lucide-react';

interface JournalEntryRecord {
  id: string;
  name: string;
  ref: string;
  date: string;
  amountTotal: number;
  state: string;
}

export default function JournalsPage() {
  const [journalEntries, setJournalEntries] = useState<JournalEntryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      const fetchedJournals = await getJournalEntries();

      // Filter specifically for PT VeloCocoa journal entries (bank/cash ref to invoices)
      const velococoaJournals = fetchedJournals.filter(entry => {
        const text = (entry.name + ' ' + entry.ref).toLowerCase();
        return text.includes('inv/') || 
               text.includes('bill/') || 
               text.includes('pcsh') || 
               text.includes('pbnk') ||
               text.includes('velococoa');
      });

      setJournalEntries(velococoaJournals);
    } catch (error) {
      console.error("Failed to load journals page data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredJournals = journalEntries.filter(entry => 
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.ref.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CRMLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#3b1a08] dark:text-white flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-slate-600 animate-bounce" /> Journal Entries (Jurnal)
            </h2>
            <p className="text-muted-foreground text-sm">
              Pantau entri pembukuan kas, bank, mutasi debit/kredit, dan rekonsiliasi umum PT VeloCocoa Indonesia yang terdaftar di Odoo.
            </p>
          </div>
        </div>

        {/* Journal Entries Table Card */}
        <Card className="border-none shadow-lg bg-white dark:bg-[#2A1D16] rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-[#3b1a08] dark:text-white flex items-center gap-1.5">
                  <BookOpen className="h-5 w-5 text-slate-500" /> Buku Jurnal & Ledger
                </CardTitle>
                <CardDescription>Menampilkan log entri jurnal umum yang tersinkronisasi dari Odoo.</CardDescription>
              </div>
              
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari kode jurnal atau referensi..." 
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
                <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
                <span>Menarik data entri jurnal dari Odoo ERP...</span>
              </div>
            ) : filteredJournals.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                <span className="font-semibold text-[#3b1a08] dark:text-white">Tidak ada entri jurnal ditemukan</span>
                <span className="text-xs">Ubah filter pencarian atau pastikan transaksi sinkron.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase">
                      <th className="px-6 py-4">Kode Jurnal (Journal Entry)</th>
                      <th className="px-6 py-4">Referensi Dokumen</th>
                      <th className="px-6 py-4 text-center">Tanggal Transaksi</th>
                      <th className="px-6 py-4 text-right">Nilai Mutasi</th>
                      <th className="px-6 py-4 text-center">Status Pembukuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredJournals.map(entry => (
                      <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 max-w-xs truncate flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-slate-400" /> {entry.name}
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-600 max-w-xs truncate">
                          {entry.ref || <span className="italic text-muted-foreground/50">Manual Entry</span>}
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground text-xs font-medium">
                          {entry.date}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                          {formatRupiah(entry.amountTotal)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {entry.state === 'posted' ? (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-black flex items-center justify-center mx-auto w-fit gap-1">
                              <CheckSquare className="h-3.5 w-3.5" /> Terposting
                            </span>
                          ) : (
                            <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full text-xs font-black flex items-center justify-center mx-auto w-fit gap-1">
                              <FileText className="h-3.5 w-3.5" /> Draft
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </CRMLayout>
  );
}
