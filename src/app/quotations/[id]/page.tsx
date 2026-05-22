"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Save, 
  Send, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Receipt,
  X
} from 'lucide-react';
import Link from 'next/link';
import { 
  getQuotationById, 
  getQuotationLines, 
  getProducts, 
  getPaymentTerms,
  getContacts,
  updateQuotation,
  confirmQuotation,
  cancelQuotation,
  updateLeadStatus,
  Quotation, 
  QuotationLine,
  createInvoiceFromQuotation
} from '@/app/lib/crm-service';
import { cn } from '@/lib/utils';

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [lines, setLines] = useState<QuotationLine[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Form fields
  const [partnerId, setPartnerId] = useState<number>(0);
  const [validityDate, setValidityDate] = useState<string>('');
  const [paymentTermId, setPaymentTermId] = useState<number | undefined>(undefined);

  // Invoice modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'regular' | 'percentage' | 'fixed'>('regular');
  const [downPaymentValue, setDownPaymentValue] = useState<number>(0);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Load details
        const qData = await getQuotationById(resolvedParams.id);
        if (!qData) {
          toast({
            title: "Error",
            description: "Penawaran tidak ditemukan",
            variant: "destructive"
          });
          router.push('/quotations');
          return;
        }
        setQuotation(qData);
        setPartnerId(qData.partnerId);
        setValidityDate(qData.validityDate);
        setPaymentTermId(qData.paymentTermId);

        // Load lines
        if (qData.orderLineIds.length > 0) {
          const linesData = await getQuotationLines(qData.orderLineIds);
          setLines(linesData);
        } else {
          setLines([]);
        }

        // Load products, terms, contacts only if quotation is editable
        if (qData.state !== 'sale' && qData.state !== 'cancel') {
          const [prodList, termList, contactList] = await Promise.all([
            getProducts(),
            getPaymentTerms(),
            getContacts()
          ]);
          setProducts(prodList);
          setPaymentTerms(termList);
          setContacts(contactList);
        }
      } catch (err) {
        console.error("Gagal memuat detail penawaran:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  const handleAddLine = () => {
    const newLine: QuotationLine = {
      id: `temp_${Date.now()}`,
      productId: 0,
      productName: '',
      name: '',
      quantity: 1,
      priceUnit: 0,
      priceSubtotal: 0
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const handleLineProductChange = (tempId: string, prodIdVal: string) => {
    const pId = parseInt(prodIdVal, 10);
    const selectedProd = products.find(p => p.id === String(pId));
    if (!selectedProd) return;

    setLines(lines.map(line => {
      if (line.id === tempId) {
        const qty = line.quantity || 1;
        const price = selectedProd.price || 0;
        return {
          ...line,
          productId: pId,
          productName: selectedProd.name,
          name: selectedProd.name,
          priceUnit: price,
          priceSubtotal: qty * price
        };
      }
      return line;
    }));
  };

  const handleLineQtyChange = (tempId: string, qty: number) => {
    setLines(lines.map(line => {
      if (line.id === tempId) {
        return {
          ...line,
          quantity: qty,
          priceSubtotal: qty * line.priceUnit
        };
      }
      return line;
    }));
  };

  const handleLinePriceChange = (tempId: string, price: number) => {
    setLines(lines.map(line => {
      if (line.id === tempId) {
        return {
          ...line,
          priceUnit: price,
          priceSubtotal: line.quantity * price
        };
      }
      return line;
    }));
  };

  const calculateUntaxedAmount = () => {
    return lines.reduce((sum, line) => sum + (line.priceSubtotal || 0), 0);
  };

  const calculateTax = () => {
    return calculateUntaxedAmount() * 0.11; // 11% Tax rate
  };

  const calculateTotal = () => {
    return calculateUntaxedAmount() + calculateTax();
  };

  const handleSaveChanges = async () => {
    if (!quotation) return;
    try {
      setIsSaving(true);

      // Validate lines
      const invalidLines = lines.some(l => l.productId === 0 || l.quantity <= 0);
      if (invalidLines) {
        toast({
          title: "Gagal Menyimpan",
          description: "Harap pilih produk dan kuantitas valid untuk semua baris order.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      const orderLinesParam = lines.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        priceUnit: l.priceUnit,
        name: l.name || l.productName
      }));

      const res = await updateQuotation(quotation.id, {
        partnerId,
        validityDate: validityDate || undefined,
        paymentTermId: paymentTermId || undefined,
        orderLines: orderLinesParam
      });

      if (res.success) {
        toast({
          title: "Berhasil",
          description: "Perubahan penawaran disimpan ke Odoo.",
        });
        
        // Refresh detail
        const updated = await getQuotationById(quotation.id);
        if (updated) {
          setQuotation(updated);
          setPartnerId(updated.partnerId);
          setValidityDate(updated.validityDate);
          setPaymentTermId(updated.paymentTermId);
          if (updated.orderLineIds.length > 0) {
            const linesData = await getQuotationLines(updated.orderLineIds);
            setLines(linesData);
          }
        }
      } else {
        toast({
          title: "Gagal",
          description: res.error || "Gagal memperbarui penawaran.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!quotation) return;
    try {
      setIsConfirming(true);
      
      // Save changes first to ensure the Odoo quotation lines are synced
      await handleSaveChanges();

      const res = await confirmQuotation(quotation.id);
      if (res.success) {
        toast({
          title: "Quotation Dikonfirmasi",
          description: "Status diubah menjadi Sales Order.",
        });

        // Also if it is linked to a lead, update the lead's status to Won
        if (quotation.opportunityId) {
          await updateLeadStatus(String(quotation.opportunityId), 'Won');
        }

        // Refresh detail
        const updated = await getQuotationById(quotation.id);
        if (updated) setQuotation(updated);
      } else {
        toast({
          title: "Gagal Konfirmasi",
          description: res.error || "Gagal mengonfirmasi penawaran.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!quotation) return;
    try {
      setIsCancelling(true);
      const res = await cancelQuotation(quotation.id);
      if (res.success) {
        toast({
          title: "Penawaran Dibatalkan",
          description: "Status diubah menjadi Cancelled.",
        });
        
        // Refresh detail
        const updated = await getQuotationById(quotation.id);
        if (updated) setQuotation(updated);
      } else {
        toast({
          title: "Gagal Pembatalan",
          description: res.error || "Gagal membatalkan penawaran.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSend = () => {
    // Write state 'sent' directly to mimic Quotation Sent
    if (!quotation) return;
    updateQuotation(quotation.id, { state: 'sent' }).then((res) => {
      if (res.success) {
        toast({
          title: "Penawaran Dikirim",
          description: "Status penawaran diperbarui menjadi Quotation Sent.",
        });
        getQuotationById(quotation.id).then(u => { if (u) setQuotation(u); });
      }
    });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;

    try {
      setIsCreatingInvoice(true);
      const res = await createInvoiceFromQuotation(
        quotation.id,
        invoiceType,
        invoiceType === 'regular' ? undefined : downPaymentValue
      );

      if (res.success && res.invoiceId) {
        toast({
          title: "Invoice Dibuat",
          description: "Draft invoice berhasil dibuat di Odoo dan disinkronkan ke Accounting.",
        });
        setIsInvoiceModalOpen(false);
        router.push('/accounting/invoices');
      } else {
        toast({
          title: "Gagal Membuat Invoice",
          description: res.error || "Gagal membuat invoice di Odoo.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handlePrint = () => {
    toast({
      title: "Cetak Dokumen",
      description: "Menyiapkan file PDF untuk diunduh / dicetak...",
    });
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <Loader2 className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Memuat rincian penawaran...</p>
        </div>
      </CRMLayout>
    );
  }

  if (!quotation) return null;

  return (
    <CRMLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Navigation & Actions Header */}
        <div className="flex flex-col gap-4 border-b border-border/20 pb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/quotations" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Penawaran
            </Link>
            <span>/</span>
            {quotation.opportunityName && (
              <>
                <Link href={`/leads/${quotation.opportunityId}`} className="hover:text-primary transition-colors">
                  {quotation.opportunityName}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="font-medium text-foreground">{quotation.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{quotation.name}</h1>
                {quotation.state === 'cancel' && (
                  <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Pelanggan: <span className="font-semibold text-foreground">{quotation.partnerName}</span>
              </p>
            </div>

            {/* Stage indicator (Odoo-like workflow bar) */}
            <div className="flex items-center self-start md:self-auto border border-border/40 rounded-lg overflow-hidden bg-card/30">
              <div className={cn(
                "px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-r border-border/40",
                quotation.state === 'draft' ? "bg-primary text-white" : "text-muted-foreground bg-transparent"
              )}>
                Quotation
              </div>
              <div className={cn(
                "px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-r border-border/40",
                quotation.state === 'sent' ? "bg-primary text-white" : "text-muted-foreground bg-transparent"
              )}>
                Quotation Sent
              </div>
              <div className={cn(
                "px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                quotation.state === 'sale' ? "bg-primary text-white" : "text-muted-foreground bg-transparent"
              )}>
                Sales Order
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {quotation.state === 'sale' && (
            <Button onClick={() => setIsInvoiceModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-md font-bold">
              <Receipt className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          )}

          {quotation.state === 'sent' && (
            <Button onClick={handleConfirmOrder} disabled={isConfirming} className="bg-primary hover:bg-primary/90 text-white shadow-md font-bold">
              {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Confirm
            </Button>
          )}

          {quotation.state !== 'cancel' && (
            <Button onClick={handleSend} variant="outline" className="border-border/60 hover:bg-muted font-medium">
              <Send className="mr-2 h-4 w-4 text-purple-500" /> Send
            </Button>
          )}

          {quotation.state !== 'cancel' && (
            <Button onClick={handlePrint} variant="outline" className="border-border/60 hover:bg-muted font-medium">
              <Printer className="mr-2 h-4 w-4 text-blue-500" /> Preview
            </Button>
          )}

          {quotation.state !== 'cancel' && (
            <Button onClick={handleCancelOrder} disabled={isCancelling} variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 font-medium">
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Cancel
            </Button>
          )}
          
          <div className="flex-1"></div>
          
          {quotation.state !== 'sale' && quotation.state !== 'cancel' && (
            <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan
            </Button>
          )}
        </div>

        {/* Sheet Content Card */}
        <Card className="border-none shadow-xl bg-card/40 relative overflow-hidden backdrop-blur-md">
          <CardContent className="p-6 md:p-8 space-y-8">
            
            {/* Header Fields Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</label>
                  {quotation.state === 'sale' || quotation.state === 'cancel' ? (
                    <div className="bg-card/30 border border-border/40 h-11 rounded-lg px-3.5 flex items-center text-sm font-medium text-foreground">
                      🏢 {quotation.partnerName || 'Mitra Umum'}
                    </div>
                  ) : (
                    <Select 
                      value={String(partnerId)} 
                      onValueChange={(val) => setPartnerId(parseInt(val, 10))}
                    >
                      <SelectTrigger className="bg-card/50 border-border/50 h-11">
                        <SelectValue placeholder="Pilih Pelanggan" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} {c.email ? `(${c.email})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> Expiration
                  </label>
                  <Input
                    type="date"
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    disabled={quotation.state === 'sale' || quotation.state === 'cancel'}
                    className="bg-card/50 border-border/50 h-11 disabled:bg-card/30 disabled:border-border/40 disabled:opacity-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Terms</label>
                  {quotation.state === 'sale' || quotation.state === 'cancel' ? (
                    <div className="bg-card/30 border border-border/40 h-11 rounded-lg px-3.5 flex items-center text-sm font-medium text-foreground">
                      💳 {quotation.paymentTermName || 'Immediate Payment'}
                    </div>
                  ) : (
                    <Select 
                      value={paymentTermId ? String(paymentTermId) : 'none'} 
                      onValueChange={(val) => setPaymentTermId(val === 'none' ? undefined : parseInt(val, 10))}
                    >
                      <SelectTrigger className="bg-card/50 border-border/50 h-11">
                        <SelectValue placeholder="Immediate Payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Immediate Payment</SelectItem>
                        {paymentTerms.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs for Order Lines / Other Info */}
            <Tabs defaultValue="lines" className="w-full">
              <TabsList className="bg-muted/30 border border-border/20 p-1 rounded-lg">
                <TabsTrigger value="lines" className="px-5 py-2">Order Lines</TabsTrigger>
                <TabsTrigger value="other" className="px-5 py-2">Other Info</TabsTrigger>
              </TabsList>

              {/* Order Lines Grid */}
              <TabsContent value="lines" className="space-y-4 mt-4">
                <div className="border border-border/30 rounded-xl overflow-hidden bg-card/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="p-4 w-[40%]">Product</th>
                        <th className="p-4 w-[15%] text-right">Quantity</th>
                        <th className="p-4 w-[20%] text-right">Unit Price</th>
                        <th className="p-4 w-[10%] text-center">Taxes</th>
                        <th className="p-4 w-[20%] text-right">Amount</th>
                        {quotation.state !== 'sale' && quotation.state !== 'cancel' && (
                          <th className="p-4 w-[5%]"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10 text-sm">
                      {lines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                            Belum ada produk. Klik "Add a product" di bawah untuk menambahkan.
                          </td>
                        </tr>
                      ) : (
                        lines.map((line) => (
                          <tr key={line.id} className="hover:bg-muted/10 transition-colors">
                            {/* Product Select / Name */}
                            <td className="p-3">
                              {quotation.state === 'sale' || quotation.state === 'cancel' ? (
                                <div className="text-sm font-medium text-foreground px-2 py-1 bg-muted/10 border border-transparent">
                                  📦 {line.productName || line.name || `Produk #${line.productId}`}
                                </div>
                              ) : (
                                <Select
                                  value={line.productId ? String(line.productId) : ''}
                                  onValueChange={(val) => handleLineProductChange(line.id, val)}
                                >
                                  <SelectTrigger className="w-full border-border/30 bg-card/30">
                                    <SelectValue placeholder="Pilih produk..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.sku ? `[${p.sku}] ` : ''}{p.name} ({formatIDR(p.price)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </td>

                            {/* Quantity Input / Text */}
                            <td className="p-3 text-right">
                              {quotation.state === 'sale' || quotation.state === 'cancel' ? (
                                <div className="text-sm font-medium text-foreground pr-4">
                                  {line.quantity}
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  min="1"
                                  value={line.quantity}
                                  onChange={(e) => handleLineQtyChange(line.id, parseInt(e.target.value, 10) || 1)}
                                  className="text-right border-border/30 bg-card/30 w-full"
                                />
                              )}
                            </td>

                            {/* Unit Price Input / Text */}
                            <td className="p-3 text-right">
                              {quotation.state === 'sale' || quotation.state === 'cancel' ? (
                                <div className="text-sm font-medium text-foreground pr-4">
                                  {formatIDR(line.priceUnit)}
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  value={line.priceUnit}
                                  onChange={(e) => handleLinePriceChange(line.id, parseFloat(e.target.value) || 0)}
                                  className="text-right border-border/30 bg-card/30 w-full"
                                />
                              )}
                            </td>

                            {/* Taxes hardcode PPN 11% */}
                            <td className="p-3 text-center text-xs font-medium text-muted-foreground">
                              PPN 11%
                            </td>

                            {/* Amount Display */}
                            <td className="p-3 text-right font-semibold">
                              {formatIDR(line.priceSubtotal)}
                            </td>

                            {/* Remove Icon */}
                            {quotation.state !== 'sale' && quotation.state !== 'cancel' && (
                              <td className="p-3 text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleRemoveLine(line.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Add Product actions */}
                  {quotation.state !== 'sale' && quotation.state !== 'cancel' && (
                    <div className="p-4 bg-muted/10 border-t border-border/10">
                      <Button variant="outline" size="sm" onClick={handleAddLine} className="border-primary/20 text-primary hover:bg-primary/5">
                        <Plus className="mr-1 h-4 w-4" /> Add a product
                      </Button>
                    </div>
                  )}
                </div>

                {/* Subtotals & Taxes calculation */}
                <div className="flex justify-end pt-4">
                  <div className="w-[320px] space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Untaxed Amount</span>
                      <span className="font-semibold">{formatIDR(calculateUntaxedAmount())}</span>
                    </div>
                    <div className="flex justify-between text-sm pb-2 border-b border-border/20">
                      <span className="text-muted-foreground">Taxes (PPN 11%)</span>
                      <span className="font-semibold">{formatIDR(calculateTax())}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-base">Total</span>
                      <span className="font-extrabold text-primary text-xl">
                        {formatIDR(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Other Info */}
              <TabsContent value="other" className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border/10">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tipe Dokumen</h4>
                      <p className="font-medium text-sm">Penawaran Penjualan (Sales Quotation)</p>
                    </div>
                    {quotation.opportunityName && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-emerald-500" /> Linked CRM Lead
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{quotation.opportunityName}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" asChild>
                            <Link href={`/leads/${quotation.opportunityId}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">ERP Synced ID</h4>
                      <p className="font-mono text-xs bg-card/60 p-2 rounded border border-border/10 inline-block">
                        sale.order ({quotation.id})
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </CardContent>
        </Card>
      </div>

      {/* Modal: Create Invoice */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <form 
            onSubmit={handleCreateInvoice}
            className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-6 text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                Create invoice(s)
              </h2>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-muted-foreground hover:bg-muted/10 h-8 w-8 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Radio Group options */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block">
                Create Invoice?
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 border border-transparent transition-colors">
                  <input 
                    type="radio" 
                    name="invoiceType" 
                    value="regular"
                    checked={invoiceType === 'regular'}
                    onChange={() => setInvoiceType('regular')}
                    className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground">Regular invoice</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 border border-transparent transition-colors">
                  <input 
                    type="radio" 
                    name="invoiceType" 
                    value="percentage"
                    checked={invoiceType === 'percentage'}
                    onChange={() => setInvoiceType('percentage')}
                    className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground">Down payment (percentage)</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 border border-transparent transition-colors">
                  <input 
                    type="radio" 
                    name="invoiceType" 
                    value="fixed"
                    checked={invoiceType === 'fixed'}
                    onChange={() => setInvoiceType('fixed')}
                    className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground">Down payment (fixed amount)</span>
                </label>
              </div>
            </div>

            {/* Dynamic input for Down Payment values */}
            {invoiceType === 'percentage' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Down Payment?
                </label>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={downPaymentValue || ''}
                    onChange={(e) => setDownPaymentValue(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-card border-border text-foreground font-bold"
                    required
                  />
                  <span className="text-sm font-bold text-muted-foreground">%</span>
                </div>
              </div>
            )}

            {invoiceType === 'fixed' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Down Payment Amount?
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-muted-foreground">Rp</span>
                  <Input 
                    type="number"
                    min="0"
                    step="any"
                    value={downPaymentValue || ''}
                    onChange={(e) => setDownPaymentValue(parseFloat(e.target.value) || 0)}
                    className="w-48 bg-card border-border text-foreground font-bold"
                    placeholder="Contoh: 1000000"
                    required
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/20">
              <Button 
                type="submit" 
                disabled={isCreatingInvoice}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center"
              >
                {isCreatingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Draft"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsInvoiceModalOpen(false)}
                className="border-border/60 hover:bg-muted font-semibold px-6 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </CRMLayout>
  );
}
