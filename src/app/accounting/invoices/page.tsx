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
  getContacts,
  getProducts,
  payInvoice,
  postInvoice
} from "@/app/lib/crm-service";
import { 
  Receipt,
  FileSpreadsheet,
  Plus, 
  Search, 
  Loader2,
  X,
  AlertCircle,
  CreditCard,
  Coins,
  CheckCircle,
  ArrowRight
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

interface OdooProduct {
  id: string;
  name: string;
  price: number;
  sku: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [contacts, setContacts] = useState<OdooContact[]>([]);
  const [products, setProducts] = useState<OdooProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment states
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payJournalType, setPayJournalType] = useState<'bank' | 'cash'>('bank');
  const [postingInvoiceId, setPostingInvoiceId] = useState<string | null>(null);
  const [payType, setPayType] = useState<'lunas' | 'cicilan'>('lunas');
  
  // Form states
  const [selectedPartnerId, setSelectedPartnerId] = useState('0');
  const [selectedProductId, setSelectedProductId] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [confirmAndPost, setConfirmAndPost] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newInvoiceDate, setNewInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days payment term default
    return d.toISOString().split('T')[0];
  });
  const [newNote, setNewNote] = useState('');

  const handleOpenPay = (inv: InvoiceRecord) => {
    setActiveInvoice(inv);
    setPayAmount(String(inv.amountTotal));
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayJournalType('bank');
    setPayType('lunas');
    setIsPayOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice || !payAmount) return;
    
    try {
      setIsPaying(true);
      const res = await payInvoice(
        parseInt(activeInvoice.id, 10),
        parseFloat(payAmount),
        payDate,
        payJournalType
      );
      
      if (res.success) {
        setIsPayOpen(false);
        setActiveInvoice(null);
        setPayAmount('');
        loadData();
      } else {
        alert("Gagal mencatat pembayaran di Odoo: " + res.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePostInvoice = async (invoiceId: string) => {
    try {
      setPostingInvoiceId(invoiceId);
      const res = await postInvoice(parseInt(invoiceId, 10));
      if (res.success) {
        loadData();
      } else {
        alert("Gagal mem-posting invoice di Odoo: " + res.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPostingInvoiceId(null);
    }
  };

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
      const [fetchedInvoices, fetchedContacts, fetchedProducts] = await Promise.all([
        getInvoices(),
        getContacts(),
        getProducts()
      ]);

      // Filter specifically for PT VeloCocoa relevant invoices
      const velococoaInvoices = fetchedInvoices.filter(inv => 
        inv.partnerName.toLowerCase().includes('velococoa')
      );

      // Filter specifically for PT VeloCocoa relevant contacts/partners
      const velococoaContacts = fetchedContacts.filter(c => 
        c.name.toLowerCase().includes('velococoa') ||
        c.name.toLowerCase().includes('harmoni') ||
        c.name.toLowerCase().includes('klasik') ||
        c.name.toLowerCase().includes('literasi') ||
        c.name.toLowerCase().includes('mitra')
      );

      setInvoices(velococoaInvoices);
      setContacts(velococoaContacts);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to load invoices page data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto calculate total amount & note when product or quantity changes
  useEffect(() => {
    if (selectedProductId !== '0') {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        const calculatedAmount = prod.price * parseFloat(quantity || '0');
        setNewAmount(String(calculatedAmount));
        setNewNote(`Pasokan ${prod.name} - Volume: ${quantity} pcs`);
      }
    }
  }, [selectedProductId, quantity, products]);

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
        newNote,
        selectedProductId !== '0' ? parseInt(selectedProductId, 10) : undefined,
        parseFloat(quantity || '1'),
        confirmAndPost
      );
      
      if (res.success) {
        setIsCreateOpen(false);
        setSelectedPartnerId('0');
        setSelectedProductId('0');
        setQuantity('1');
        setConfirmAndPost(false);
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
            <h2 className="text-3xl font-bold tracking-tight text-[#4C382D] dark:text-white flex items-center gap-2">
              <Receipt className="h-8 w-8 text-indigo-600 animate-pulse" /> Faktur Penjualan (Invoices)
            </h2>
            <p className="text-muted-foreground text-sm">
              Kelola tagihan penjualan customer PT VeloCocoa Indonesia yang disinkronkan secara langsung dari modul account.move Odoo.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 flex items-center gap-1.5"
          >
            <Plus className="h-5 w-5" /> Buat Invoice Baru
          </Button>
        </div>

        {/* Invoice Table Card */}
        <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-[#4C382D] dark:text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-500" /> Daftar Faktur Penjualan PT VeloCocoa
                </CardTitle>
                <CardDescription>Menampilkan daftar tagihan penjualan berlabel VeloCocoa di Odoo ERP.</CardDescription>
              </div>
              
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
                <span className="font-semibold text-[#4C382D] dark:text-white">Tidak ada invoice ditemukan</span>
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
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-600 max-w-xs truncate flex items-center gap-1.5">
                          <FileSpreadsheet className="h-4 w-4 text-indigo-400" /> {inv.name}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#4C382D] dark:text-white max-w-xs truncate">
                          {inv.partnerName}
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground text-xs font-medium">
                          {inv.invoiceDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground text-xs font-medium">
                          {inv.invoiceDateDue || "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#4C382D] dark:text-white">
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
                        <td className="px-6 py-4 text-center">
                          {inv.state === 'posted' && inv.paymentState !== 'paid' ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenPay(inv)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-md shadow-emerald-500/10 mx-auto"
                            >
                              <CreditCard className="h-3 w-3" /> Bayar
                            </Button>
                          ) : inv.state === 'draft' ? (
                            <Button 
                              size="sm" 
                              disabled={postingInvoiceId === inv.id}
                              onClick={() => handlePostInvoice(inv.id)}
                              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-md shadow-indigo-500/10 mx-auto animate-pulse"
                            >
                              {postingInvoiceId === inv.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Posting...
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="h-3 w-3" /> Post / Konfirmasi
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-0.5">
                              <CheckCircle className="h-3.5 w-3.5" /> Selesai
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
                  className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-indigo-600 focus-visible:ring-2 focus-visible:ring-offset-2 outline-none font-semibold text-foreground"
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

              {/* Product & Quantity (Volume) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="product" className="text-xs font-semibold">Pilih Produk Odoo (VeloCocoa Catalog)</Label>
                  <select 
                    id="product"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-indigo-600 focus-visible:ring-2 focus-visible:ring-offset-2 outline-none font-medium text-foreground"
                  >
                    <option value="0">--- Input Manual / Lainnya ---</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatRupiah(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantity" className="text-xs font-semibold">Volume Pembelian (Kuantitas)</Label>
                  <Input 
                    id="quantity"
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-background border-primary/20"
                    placeholder="Contoh: 10"
                  />
                </div>
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
                  className="bg-background border-primary/20 font-bold text-indigo-600 dark:text-indigo-400"
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
                  className="bg-background border-primary/20 text-sm font-medium"
                  required
                />
              </div>

              {/* Auto Confirm & Post option */}
              <div className="flex items-center space-x-2 p-3 bg-indigo-50/50 dark:bg-slate-900/30 rounded-xl border border-indigo-100 dark:border-slate-800">
                <input 
                  type="checkbox" 
                  id="confirmAndPost"
                  checked={confirmAndPost}
                  onChange={(e) => setConfirmAndPost(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="confirmAndPost" className="text-xs font-bold cursor-pointer text-indigo-950 dark:text-slate-200">
                  Konfirmasi & Posting Resmi (Ubah status Draft menjadi Diposting secara realtime di Odoo)
                </label>
              </div>

              {/* Info alert */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
                Submit invoice akan otomatis membuat faktur <b>{confirmAndPost ? "Diposting (Resmi)" : "Draft"}</b> baru di Odoo ERP lengkap dengan baris produk dan kuantitas volume yang dikalkulasi pajaknya secara instan.
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
                      Memproses di Odoo...
                    </>
                  ) : confirmAndPost ? "Posting Resmi & Konfirmasi" : "Buat Faktur Draft"}
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

        {/* Modal: Register Payment */}
        {isPayOpen && activeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <form 
              onSubmit={handlePaySubmit}
              className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <CreditCard className="h-6 w-6 text-emerald-600 animate-pulse" /> Catat Pembayaran Odoo
                </h2>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsPayOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Invoice Info */}
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider">Membayar Invoice</div>
                <div className="text-sm font-black">{activeInvoice.name}</div>
                <div className="text-xs font-medium text-emerald-800/80 dark:text-emerald-400/80">Customer: {activeInvoice.partnerName}</div>
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Total Tagihan: {formatRupiah(activeInvoice.amountTotal)}</div>
              </div>

              {/* Payment Type Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="payTypeSelect" className="text-xs font-semibold">Tipe Pembayaran</Label>
                <select 
                  id="payTypeSelect"
                  value={payType}
                  onChange={(e) => {
                    const selected = e.target.value as 'lunas' | 'cicilan';
                    setPayType(selected);
                    if (selected === 'lunas') {
                      setPayAmount(String(activeInvoice.amountTotal));
                    }
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-offset-2 outline-none font-semibold text-foreground"
                  required
                >
                  <option value="lunas">Lunas (Bayar Penuh)</option>
                  <option value="cicilan">Cicilan (Bayar Sebagian)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod" className="text-xs font-semibold">Metode Pembayaran (Journal)</Label>
                <select 
                  id="paymentMethod"
                  value={payJournalType}
                  onChange={(e) => setPayJournalType(e.target.value as 'bank' | 'cash')}
                  className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-offset-2 outline-none font-semibold text-foreground"
                  required
                >
                  <option value="bank">Bank Transfer (PT VeloCocoa Bank)</option>
                  <option value="cash">Cash / Tunai (Kas Kecil Jakarta)</option>
                </select>
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5">
                <Label htmlFor="payDate" className="text-xs font-semibold">Tanggal Pembayaran</Label>
                <Input 
                  id="payDate"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="bg-background border-primary/20 text-sm"
                  required
                />
              </div>

              {/* Payment Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="payAmount" className="text-xs font-semibold">Jumlah Pembayaran (IDR)</Label>
                  {payType === 'lunas' && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">Otomatis Terkunci Lunas</span>
                  )}
                </div>
                <Input 
                  id="payAmount"
                  type="number"
                  placeholder="Masukkan nominal bayar"
                  value={payAmount}
                  disabled={payType === 'lunas'}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="bg-background border-primary/20 font-bold text-emerald-600 dark:text-emerald-400 disabled:opacity-80 disabled:cursor-not-allowed"
                  required
                />
                {payType === 'cicilan' && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Masukkan nominal cicilan yang lebih kecil dari total tagihan.</p>
                )}
              </div>

              {/* Info alert */}
              <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-xl text-xs text-muted-foreground leading-relaxed">
                Pencatatan pembayaran ini akan otomatis membuat entri jurnal pembayaran baru di Odoo ERP dan merekonsiliasikannya ke invoice, sehingga status tagihan menjadi <b>{payType === 'lunas' ? "Lunas" : "Sebagian"}</b> secara realtime.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/30">
                <Button 
                  type="submit" 
                  disabled={isPaying}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Membayar...
                    </>
                  ) : payType === 'lunas' ? "Konfirmasi Pembayaran Lunas" : "Konfirmasi Pembayaran Cicilan"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsPayOpen(false)}
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
