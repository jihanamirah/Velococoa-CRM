"use client";

import React, { useState, useEffect } from 'react';
import { CRMLayout } from "@/components/layout/crm-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  getInvoices, 
  createInvoice, 
  getContacts 
} from "@/app/lib/crm-service";
import { 
  Wallet, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  Search, 
  Loader2,
  X,
  AlertCircle,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

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

interface OdooContact {
  id: string;
  name: string;
  email: string;
}

export default function AccountingPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [contacts, setContacts] = useState<OdooContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [selectedPartnerId, setSelectedPartnerId] = useState('0');
  const [newAmount, setNewAmount] = useState('');
  const [newInvoiceDate, setNewInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days payment term default
    return d.toISOString().split('T')[0];
  });
  const [newNote, setNewNote] = useState('');

  // Currency Formatter
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

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

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedInvoices, fetchedContacts] = await Promise.all([
        getInvoices(),
        getContacts()
      ]);
      setInvoices(fetchedInvoices);
      setContacts(fetchedContacts);
    } catch (error) {
      console.error("Failed to load accounting data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPartnerId === '0' || !newAmount) return;
    
    try {
      setIsSubmitting(true);
      const res = await createInvoice(
        parseInt(selectedPartnerId, 10),
        parseFloat(newAmount),
        newInvoiceDate,
        newDueDate,
        newNote
      );
      
      if (res.success) {
        setIsCreateOpen(false);
        setSelectedPartnerId('0');
        setNewAmount('');
        setNewNote('');
        loadData();
      } else {
        alert("Gagal membuat invoice di Odoo: " + res.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CRMLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#3b1a08] dark:text-white flex items-center gap-2">
              <Receipt className="h-8 w-8 text-indigo-600" /> Accounting Portal
            </h2>
            <p className="text-muted-foreground text-sm">
              Kelola penagihan customer, cetak faktur draft, dan sinkronisasi pembayaran piutang dengan Odoo Accounting secara realtime.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 flex items-center gap-1.5"
          >
            <Plus className="h-5 w-5" /> Buat Invoice Baru
          </Button>
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
            <Card className="border-none shadow-md bg-white dark:bg-[#2A1D16] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Piutang</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500 dark:text-red-400">{formatRupiah(totalReceivables)}</div>
                <p className="text-xs text-muted-foreground mt-1">Invoice Belum Terbayar</p>
              </CardContent>
            </Card>

            {/* Card 2: Total Invoices Count */}
            <Card className="border-none shadow-md bg-white dark:bg-[#2A1D16] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Invoices</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#3b1a08] dark:text-white">{totalInvoicesCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Faktur Dibuat</p>
              </CardContent>
            </Card>

            {/* Card 3: Collection Rate */}
            <Card className="border-none shadow-md bg-white dark:bg-[#2A1D16] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Collection Rate</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{collectionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Rasio Invoice Lunas</p>
              </CardContent>
            </Card>

            {/* Card 4: Net Revenue Collected */}
            <Card className="border-none shadow-md bg-white dark:bg-[#2A1D16] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pendapatan Lunas</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(totalPaidRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Kas Masuk dari Invoice</p>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Invoices List */}
        <Card className="border-none shadow-lg bg-white dark:bg-[#2A1D16] rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-[#3b1a08] dark:text-white">Daftar Invoices Mitra</CardTitle>
                <CardDescription>Menampilkan tagihan finansial terintegrasi modul Odoo account.move.</CardDescription>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari nomor invoice atau customer..." 
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
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span>Menarik data invoices dari Odoo ERP...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                <span className="font-semibold text-[#3b1a08] dark:text-white">Tidak ada invoice ditemukan</span>
                <span className="text-xs">Ubah filter pencarian atau buat invoice baru.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase">
                      <th className="px-6 py-4">Faktur / Invoice</th>
                      <th className="px-6 py-4">Mitra Customer</th>
                      <th className="px-6 py-4 text-center">Tanggal</th>
                      <th className="px-6 py-4 text-center">Jatuh Tempo</th>
                      <th className="px-6 py-4 text-right">Total Tagihan</th>
                      <th className="px-6 py-4 text-center">Bayar</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredInvoices.map(inv => {
                      return (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-indigo-600 max-w-xs truncate flex items-center gap-1.5">
                            <FileSpreadsheet className="h-4 w-4 text-indigo-400" /> {inv.name}
                          </td>
                          <td className="px-6 py-4 font-semibold text-[#3b1a08] dark:text-white max-w-xs truncate">
                            {inv.partnerName}
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground text-xs font-medium">
                            {inv.invoiceDate || "-"}
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground text-xs font-medium">
                            {inv.invoiceDateDue || "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#3b1a08] dark:text-white">
                            {formatRupiah(inv.amountTotal)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {inv.paymentState === 'paid' && (
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-black">
                                Lunas
                              </span>
                            )}
                            {inv.paymentState === 'not_paid' && (
                              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full text-xs font-black">
                                Belum Lunas
                              </span>
                            )}
                            {inv.paymentState === 'partial' && (
                              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-black">
                                Sebagian
                              </span>
                            )}
                            {inv.paymentState === 'in_payment' && (
                              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-black animate-pulse">
                                Proses Bayar
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {inv.state === 'posted' && (
                              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Diposting
                              </span>
                            )}
                            {inv.state === 'draft' && (
                              <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Draft
                              </span>
                            )}
                            {inv.state === 'cancel' && (
                              <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Dibatalkan
                              </span>
                            )}
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

        {/* Modal: Create Invoice */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <form 
              onSubmit={handleSubmit}
              className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Receipt className="h-6 w-6 text-indigo-600" /> Buat Invoice Baru (Odoo Sync)
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

              {/* Customer */}
              <div className="space-y-1.5">
                <Label htmlFor="partner" className="text-xs font-semibold">Mitra Customer (Odoo Contact)</Label>
                <select 
                  id="partner"
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-indigo-600 focus-visible:ring-2 focus-visible:ring-offset-2 outline-none"
                  required
                >
                  <option value="0">--- Pilih Kontak Customer ---</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-semibold">Total Nilai Tagihan (IDR)</Label>
                <Input 
                  id="amount"
                  type="number"
                  placeholder="Contoh: 5000000 (untuk Rp 5.000.000)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="bg-background border-primary/20"
                  required
                />
              </div>

              {/* Invoice Date & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invDate" className="text-xs font-semibold">Tanggal Faktur</Label>
                  <Input 
                    id="invDate"
                    type="date"
                    value={newInvoiceDate}
                    onChange={(e) => setNewInvoiceDate(e.target.value)}
                    className="bg-background border-primary/20 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate" className="text-xs font-semibold">Jatuh Tempo</Label>
                  <Input 
                    id="dueDate"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="bg-background border-primary/20 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Note / Item Description */}
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs font-semibold">Deskripsi Tagihan / Memo Invoice</Label>
                <Textarea 
                  id="note"
                  placeholder="Contoh: Pembelian Cokelat Couverture Buttons 100kg & Toppings untuk Cafe Harmoni"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="bg-background border-primary/20 text-sm"
                  required
                />
              </div>

              {/* Info alert */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
                Submit invoice akan otomatis membuat faktur <b>Draft</b> baru di Odoo ERP lengkap dengan baris invoice yang dikalkulasi pajaknya secara instan.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/30">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Membuat di Odoo...
                    </>
                  ) : "Buat Faktur Draft"}
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
