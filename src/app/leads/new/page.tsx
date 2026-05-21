"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { createLead } from '@/app/lib/crm-service';
import { useToast } from '@/hooks/use-toast';

export default function NewLeadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await createLead(data as any);
      toast({
        title: "Lead Berhasil Dibuat",
        description: "AI telah menganalisis segmentasi & prioritas follow-up.",
      });
      router.push('/leads');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Membuat Lead",
        description: "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CRMLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Lead Manual</h1>
            <p className="text-muted-foreground text-sm">Masukkan detail calon mitra baru PT VeloCocoa.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>Detail kontak dan perusahaan calon mitra.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaPerusahaan">Nama Perusahaan <span className="text-destructive">*</span></Label>
                    <Input id="namaPerusahaan" name="namaPerusahaan" placeholder="Contoh: Velo Cafe Senayan" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="namaLengkap">Nama Penanggung Jawab <span className="text-destructive">*</span></Label>
                    <Input id="namaLengkap" name="namaLengkap" placeholder="Nama Lengkap" required className="bg-background/50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input id="email" name="email" type="email" placeholder="email@perusahaan.com" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telepon">Nomor Telepon <span className="text-destructive">*</span></Label>
                    <Input id="telepon" name="telepon" placeholder="0812..." required className="bg-background/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kota">Kota <span className="text-destructive">*</span></Label>
                  <Input id="kota" name="kota" placeholder="Contoh: Jakarta Selatan" required className="bg-background/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Estimasi Penjualan</CardTitle>
                <CardDescription>Target pendapatan, probabilitas closing, dan tanggal penutupan lead.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedRevenue">Expected Revenue (Rp)</Label>
                    <Input 
                      id="expectedRevenue" 
                      name="expectedRevenue" 
                      type="number" 
                      placeholder="Contoh: 15000000" 
                      className="bg-background/50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="probability" className="flex items-center gap-1.5">
                      Probability (%)
                      <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 text-[9px] px-1 py-0.5 border-none font-bold uppercase tracking-wider">AI</Badge>
                    </Label>
                    <Input 
                      id="probability" 
                      name="probability" 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="0 - 100" 
                      className="bg-background/50" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateDeadline">Expected Closing Date</Label>
                  <Input 
                    id="dateDeadline" 
                    name="dateDeadline" 
                    type="date" 
                    className="bg-background/50 font-sans" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Detail Bisnis</CardTitle>
                <CardDescription>Informasi segmentasi dan minat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori Bisnis</Label>
                    <Select name="kategoriBisnis" defaultValue="Kafe & Kedai Kopi">
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kafe & Kedai Kopi">Kafe & Kedai Kopi</SelectItem>
                        <SelectItem value="Bakery & Pastry">Bakery & Pastry</SelectItem>
                        <SelectItem value="Hotel & Korporasi">Hotel & Korporasi</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimasiVolume">Estimasi Volume (per bulan)</Label>
                    <Input id="estimasiVolume" name="estimasiVolume" placeholder="Contoh: 50kg" className="bg-background/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promoMinat">Promo yang Diminati</Label>
                  <Input id="promoMinat" name="promoMinat" placeholder="Contoh: Diskon Bulk Order" className="bg-background/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan / Pesan</Label>
                  <Textarea id="catatan" name="catatan" placeholder="Detail tambahan dari calon mitra..." className="bg-background/50 min-h-[100px]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-primary text-white overflow-hidden relative">
              <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-white/10 rotate-12" />
              <CardHeader>
                <CardTitle className="text-xl">AI Assistant</CardTitle>
                <CardDescription className="text-white/80">VeloCocoa Intelligence akan memproses segmentasi & prioritas follow-up secara otomatis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 text-sm bg-white/10 p-3 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>Analisis minat promo & volume</span>
                </div>
                <div className="flex items-start gap-2 text-sm bg-white/10 p-3 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>Segmentasi bisnis otomatis</span>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses AI...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Simpan Lead
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Sumber Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <Select name="sumber" defaultValue="Langsung">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Pilih sumber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Langsung">Manual / Langsung</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Email Marketing">Email Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}