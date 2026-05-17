"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Phone, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  RefreshCcw,
  Sparkles,
  MessageSquare,
  History,
  User
} from 'lucide-react';
import { getLeadById, updateLeadStatus, updateLeadDetails, Lead, LeadStatus } from '@/app/lib/crm-service';
import { syncLeadToOdoo } from '@/services/odoo';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Editable fields states
  const [isEditing, setIsEditing] = useState(false);
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [kota, setKota] = useState('');
  const [kategoriBisnis, setKategoriBisnis] = useState('');
  const [catatan, setCatatan] = useState('');
  const [catatanInternal, setCatatanInternal] = useState('');

  useEffect(() => {
    getLeadById(resolvedParams.id).then((l) => {
      if (l) {
        setLead(l);
        setNamaPerusahaan(l.namaPerusahaan || '');
        setNamaLengkap(l.namaLengkap || '');
        setEmail(l.email || '');
        setTelepon(l.telepon || '');
        setKota(l.kota || '');
        setKategoriBisnis(l.kategoriBisnis || 'Lainnya');
        setCatatan(l.catatan || '');
        setCatatanInternal(l.catatanInternal || '');
      }
      setIsLoading(false);
    });
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    setIsLoading(true);
    const updated = await updateLeadStatus(lead.id, newStatus);
    if (updated) {
      setLead(updated);
      toast({
        title: `Status diperbarui`,
        description: `Lead sekarang berstatus: ${newStatus}`,
      });
    }
    setIsLoading(false);
  };

  const handleSaveDetails = async () => {
    if (!lead) return;
    setIsLoading(true);
    const updated = await updateLeadDetails(lead.id, {
      namaPerusahaan,
      namaLengkap,
      email,
      telepon,
      kota,
      kategoriBisnis,
      catatan
    });
    if (updated) {
      setLead(updated);
      setIsEditing(false);
      toast({
        title: "Data Diperbarui",
        description: "Detail lead berhasil disinkronkan ke Odoo CRM & Firestore secara realtime.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Gagal menyelaraskan data baru ke Odoo CRM.",
      });
    }
    setIsLoading(false);
  };

  const handleUpdateNotes = async () => {
    if (!lead) return;
    setIsLoading(true);
    const updated = await updateLeadDetails(lead.id, {
      catatanInternal
    });
    if (updated) {
      setLead(updated);
      toast({
        title: "Catatan Diperbarui",
        description: "Catatan internal sales berhasil disimpan ke Odoo & Firestore secara realtime.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Catatan",
        description: "Gagal menyimpan catatan sales ke Odoo.",
      });
    }
    setIsLoading(false);
  };

  const handleOdooSync = async () => {
    if (!lead) return;
    setIsSyncing(true);
    
    try {
      const result = await syncLeadToOdoo(lead);
      if (result.success) {
        setLead({ ...lead, sudahSyncOdoo: true, odooLeadId: result.odooId });
        toast({
          title: "Sinkronisasi Berhasil",
          description: `Lead telah dikirim ke Odoo dengan ID: ${result.odooId}`,
        });
      } else {
        throw new Error(result.error || "Gagal sinkronisasi");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sinkronisasi Gagal",
        description: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) return <CRMLayout><div className="flex items-center justify-center min-h-[50vh]">Loading...</div></CRMLayout>;
  if (!lead) return <CRMLayout><div className="text-center py-20">Lead tidak ditemukan.</div></CRMLayout>;

  return (
    <CRMLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest border-none",
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
                <span className="text-xs text-muted-foreground">• Lead masuk {new Date(lead.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{lead.namaPerusahaan}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lead.status === 'Qualified' && !lead.sudahSyncOdoo && (
              <Button 
                onClick={handleOdooSync} 
                disabled={isSyncing}
                className="bg-[#C17B3A] hover:bg-[#A0642D] text-white"
              >
                {isSyncing ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Sync ke Odoo CRM
              </Button>
            )}
            {lead.sudahSyncOdoo && (
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/5" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Synced with Odoo ({lead.odooLeadId})
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Detail Profil</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">Informasi kontak mitra.</CardDescription>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white" onClick={handleSaveDetails}>Simpan</Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setIsEditing(false)}>Batal</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="border-[#C17B3A]/40 text-[#C17B3A] hover:bg-[#C17B3A]/10" onClick={() => setIsEditing(true)}>Edit Profil</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Perusahaan</div>
                        {isEditing ? (
                          <Input 
                            className="bg-background/50 h-8 mt-1 border-primary/20 focus-visible:ring-primary" 
                            value={namaPerusahaan} 
                            onChange={(e) => setNamaPerusahaan(e.target.value)} 
                          />
                        ) : (
                          <div className="font-semibold">{lead.namaPerusahaan}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Penanggung Jawab</div>
                        {isEditing ? (
                          <Input 
                            className="bg-background/50 h-8 mt-1 border-primary/20 focus-visible:ring-primary" 
                            value={namaLengkap} 
                            onChange={(e) => setNamaLengkap(e.target.value)} 
                          />
                        ) : (
                          <div className="font-semibold">{lead.namaLengkap}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Lokasi</div>
                        {isEditing ? (
                          <Input 
                            className="bg-background/50 h-8 mt-1 border-primary/20 focus-visible:ring-primary" 
                            value={kota} 
                            onChange={(e) => setKota(e.target.value)} 
                          />
                        ) : (
                          <div className="font-semibold">{lead.kota}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Email</div>
                        {isEditing ? (
                          <Input 
                            className="bg-background/50 h-8 mt-1 border-primary/20 focus-visible:ring-primary" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                          />
                        ) : (
                          <div className="font-semibold">{lead.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Telepon</div>
                        {isEditing ? (
                          <Input 
                            className="bg-background/50 h-8 mt-1 border-primary/20 focus-visible:ring-primary" 
                            value={telepon} 
                            onChange={(e) => setTelepon(e.target.value)} 
                          />
                        ) : (
                          <div className="font-semibold">{lead.telepon}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Kategori Bisnis</div>
                        {isEditing ? (
                          <Input 
                            className="bg-background/50 h-8 mt-1 border-primary/20 focus-visible:ring-primary" 
                            value={kategoriBisnis} 
                            onChange={(e) => setKategoriBisnis(e.target.value)} 
                          />
                        ) : (
                          <div className="font-semibold">{lead.kategoriBisnis || 'Lainnya'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Promo Minat</div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm italic">
                      {lead.promoMinat || 'Tidak ada promo spesifik'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Estimasi Volume</div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
                      {lead.estimasiVolume || 'Belum diketahui'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Catatan Mitra</div>
                  {isEditing ? (
                    <Textarea 
                      className="bg-background/50 min-h-[80px] border-primary/20 focus-visible:ring-primary" 
                      value={catatan} 
                      onChange={(e) => setCatatan(e.target.value)} 
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-muted/20 text-sm leading-relaxed">
                      {lead.catatan || 'Tidak ada catatan tambahan.'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Catatan Internal Sales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Tambahkan observasi sales atau hasil meeting..." 
                  className="bg-background/50 min-h-[120px]"
                  value={catatanInternal}
                  onChange={(e) => setCatatanInternal(e.target.value)}
                />
                <div className="flex justify-end">
                   <Button size="sm" className="bg-[#C17B3A] hover:bg-[#A0642D] text-white" onClick={handleUpdateNotes}>Update Catatan</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-4">
               <Button 
                variant="outline" 
                className="flex-1 min-w-[150px] border-blue-500/50 text-blue-500 hover:bg-blue-500/5"
                onClick={() => handleStatusChange('Dihubungi')}
               >
                 Tandai Dihubungi
               </Button>
               <Button 
                variant="outline" 
                className="flex-1 min-w-[150px] border-purple-500/50 text-purple-500 hover:bg-purple-500/5"
                onClick={() => handleStatusChange('Negotiation')}
               >
                 Tandai Negosiasi
               </Button>
               <Button 
                variant="outline" 
                className="flex-1 min-w-[150px] border-green-500/50 text-green-500 hover:bg-green-500/5"
                onClick={() => handleStatusChange('Qualified')}
               >
                 Tandai Qualified
               </Button>
               <Button 
                className="flex-1 min-w-[150px] bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={() => handleStatusChange('Won')}
               >
                 Mark as WON
               </Button>
               <Button 
                variant="destructive" 
                className="flex-1 min-w-[150px] bg-[#C1121F] hover:bg-[#780116]"
                onClick={() => handleStatusChange('Lost')}
               >
                 Mark as LOST
               </Button>
            </div>
          </div>

          <div className="space-y-6">
            {lead.aiSuggestedSegment && (
              <Card className="border-none shadow-xl bg-primary text-white relative overflow-hidden">
                <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-white/10" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> AI Insight
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs text-white/70 mb-1">Suggested Segment</div>
                    <div className="font-bold text-lg">{lead.aiSuggestedSegment}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/70 mb-1">Follow-up Priority</div>
                    <Badge variant="outline" className="border-white/50 text-white bg-white/10 px-3 py-1 text-[10px] font-bold">
                      {lead.aiFollowUpPriority?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs leading-relaxed text-white/80 italic">
                    "{lead.aiReasoning}"
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Riwayat Aktivitas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4 p-4 pt-0">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted-foreground/20">
                    <div className="relative">
                       <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-primary border-4 border-background shadow-sm"></div>
                       <div className="text-xs font-semibold">Status diperbarui menjadi {lead.status}</div>
                       <div className="text-[10px] text-muted-foreground">Baru saja • oleh Jihan Amirah</div>
                    </div>
                    {lead.sudahSyncOdoo && (
                       <div className="relative">
                        <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-4 border-background shadow-sm"></div>
                        <div className="text-xs font-semibold">Sinkronisasi ke Odoo CRM</div>
                        <div className="text-[10px] text-muted-foreground">Hari ini, 10:45 • ID: {lead.odooLeadId}</div>
                      </div>
                    )}
                    <div className="relative">
                       <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-muted-foreground/30 border-4 border-background shadow-sm"></div>
                       <div className="text-xs font-semibold">Lead baru dibuat via {lead.sumber}</div>
                       <div className="text-[10px] text-muted-foreground">{new Date(lead.createdAt).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
