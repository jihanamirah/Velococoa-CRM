"use client";

import { useEffect, useState, use, useRef } from 'react';
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
  User,
  Plus,
  PhoneCall,
  Calendar,
  X,
  Check,
  Send,
  Loader2,
  Search
} from 'lucide-react';
import { 
  getLeadById, 
  updateLeadStatus, 
  updateLeadDetails, 
  Lead, 
  LeadStatus,
  getCommunicationLogs,
  addCommunicationLog,
  getScheduledActivities,
  createScheduledActivity,
  getContacts
} from '@/app/lib/crm-service';
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

  // Communication logs & Scheduled activities states
  const [logs, setLogs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  // Call Customer Interface states
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callState, setCallState] = useState<'calling' | 'ongoing' | 'ended'>('calling');
  const [callDuration, setCallDuration] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [callResult, setCallResult] = useState('Interested');
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add Log / Schedule Activity Modal states
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [logType, setLogType] = useState('NOTE'); // NOTE, EMAIL, CALL, WHATSAPP, MEETING
  const [isScheduled, setIsScheduled] = useState(false);
  const [logSummary, setLogSummary] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logDeadline, setLogDeadline] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Upgraded Meeting states
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [meetingLocation, setMeetingLocation] = useState('Online'); // Online or Offline
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');

  // Load Odoo contacts for the meeting attendees picker
  useEffect(() => {
    if (isAddLogOpen && contactsList.length === 0) {
      setIsContactsLoading(true);
      getContacts().then((c) => {
        setContactsList(c);
        setIsContactsLoading(false);
      }).catch(err => {
        console.error("Failed to load contacts:", err);
        setIsContactsLoading(false);
      });
    }
  }, [isAddLogOpen, contactsList.length]);

  const fetchLogsAndActivities = async () => {
    try {
      setIsLogsLoading(true);
      const [fetchedLogs, fetchedActs] = await Promise.all([
        getCommunicationLogs(resolvedParams.id),
        getScheduledActivities(resolvedParams.id)
      ]);
      setLogs(fetchedLogs);
      setActivities(fetchedActs);
    } catch (err) {
      console.error("Failed to fetch logs and activities:", err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  // Call timer effect
  useEffect(() => {
    if (isCallModalOpen && callState === 'ongoing') {
      callIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
        callIntervalRef.current = null;
      }
    }
    return () => {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    };
  }, [isCallModalOpen, callState]);

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
    fetchLogsAndActivities();
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

  const handleWhatsAppClick = async () => {
    if (!lead) return;
    const cleanPhone = telepon.replace(/\D/g, '');
    const waText = encodeURIComponent(`Halo ${namaLengkap || 'Kak'}, saya Jihan dari PT VeloCocoa. Senang bisa terhubung dengan Anda!`);
    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;
    
    // Log WhatsApp transaction in Odoo
    toast({
      title: "Menghubungkan ke WhatsApp...",
      description: "Log aktivitas WhatsApp akan dicatat otomatis di Odoo CRM.",
    });

    await addCommunicationLog(lead.id, `Sent WhatsApp message: Halo ${namaLengkap || 'Kak'}, saya Jihan dari PT VeloCocoa...`);
    fetchLogsAndActivities();
    window.open(waUrl, '_blank');
  };

  const handleEmailClick = async () => {
    if (!lead) return;
    const emailSubject = encodeURIComponent("Follow-up Kemitraan Coklat Premium - PT VeloCocoa");
    const emailBody = encodeURIComponent(`Halo ${namaLengkap || 'Kak'},\n\nTerima kasih telah menyatakan minat pada produk coklat PT VeloCocoa.\n\nSalam,\nJihan Amirah\nSales Executive`);
    const mailtoUrl = `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;

    toast({
      title: "Membuka Klien Email...",
      description: "Log aktivitas Email akan dicatat otomatis di Odoo CRM.",
    });

    await addCommunicationLog(lead.id, `Sent email follow-up regarding VeloCocoa partnership to ${email}`);
    fetchLogsAndActivities();
    window.open(mailtoUrl, '_blank');
  };

  const handleSaveCallLog = async () => {
    if (!lead) return;
    setIsSubmittingLog(true);
    const durationMin = Math.floor(callDuration / 60);
    const durationSec = callDuration % 60;
    const logText = `Logged phone call. Duration: ${durationMin}m ${durationSec}s. Result: ${callResult}. Notes: ${callNotes || 'Tidak ada catatan.'}`;

    const res = await addCommunicationLog(lead.id, logText);
    if (res.success) {
      toast({
        title: "Call Log Tersimpan",
        description: "Hasil panggilan berhasil dicatat langsung ke Odoo CRM Chatter.",
      });
      setIsCallModalOpen(false);
      setCallState('calling');
      setCallDuration(0);
      setCallNotes('');
      setCallResult('Interested');
      fetchLogsAndActivities();
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan log telepon ke Odoo.",
      });
    }
    setIsSubmittingLog(false);
  };

  const handleSubmitCustomLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!logNote.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Catatan atau detail log tidak boleh kosong.",
      });
      return;
    }

    setIsSubmittingLog(true);
    try {
      if (isScheduled) {
        if (!logDeadline || !logSummary.trim()) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Judul dan Tanggal Jadwal wajib diisi untuk aktivitas terjadwal.",
          });
          setIsSubmittingLog(false);
          return;
        }

        let activityTypeId = 4; // To-Do / Default
        if (logType === 'MEETING') activityTypeId = 3;
        else if (logType === 'CALL') activityTypeId = 2;
        else if (logType === 'EMAIL') activityTypeId = 1;

        // Custom formatting for upgraded Meeting
        let finalSummary = logSummary;
        let finalNote = logNote;

        if (logType === 'MEETING') {
          const attendeeNames = selectedAttendees
            .map(id => contactsList.find(c => c.id === id)?.name)
            .filter(Boolean);
          
          finalSummary = `Meeting: ${logSummary} (${meetingLocation} @ ${meetingTime})`;
          finalNote = `Waktu Rapat: ${meetingTime} WIB | Lokasi: ${meetingLocation}\nPeserta Wajib: ${
            attendeeNames.length > 0 ? attendeeNames.join(', ') : 'Tidak ada'
          }\n\nAgenda:\n${logNote}`;
        }

        const res = await createScheduledActivity(
          lead.id,
          activityTypeId,
          finalSummary,
          finalNote,
          logDeadline
        );

        if (res.success) {
          toast({
            title: "Aktivitas Terjadwal",
            description: "Aktivitas berhasil direncanakan & disinkronkan ke Odoo CRM.",
          });
          setIsAddLogOpen(false);
          setLogSummary('');
          setLogNote('');
          setLogDeadline('');
          setMeetingTime('10:00');
          setMeetingLocation('Online');
          setSelectedAttendees([]);
          setAttendeeSearchQuery('');
          fetchLogsAndActivities();
        } else {
          throw new Error("Gagal membuat aktivitas di Odoo.");
        }
      } else {
        const logText = `[${logType}] ${logNote}`;
        const res = await addCommunicationLog(lead.id, logText);
        if (res.success) {
          toast({
            title: "Log Berhasil Ditambahkan",
            description: "Log aktivitas berhasil disimpan ke Odoo CRM Chatter.",
          });
          setIsAddLogOpen(false);
          setLogNote('');
          fetchLogsAndActivities();
        } else {
          throw new Error("Gagal menyimpan log ke Odoo.");
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: err.message || "Gagal menyelaraskan log ke Odoo CRM.",
      });
    } finally {
      setIsSubmittingLog(false);
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

                {/* Quick Action Buttons (Call, WhatsApp, Email) */}
                <div className="pt-2 flex flex-col gap-3">
                  <Button 
                    className="w-full bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold h-12 flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-orange-500/10 transition-all hover:scale-[1.01]"
                    onClick={() => {
                      setIsCallModalOpen(true);
                      setCallState('calling');
                      setCallDuration(0);
                      // Simulated call pickup for premium experience
                      setTimeout(() => {
                        setCallState('ongoing');
                      }, 1500);
                    }}
                  >
                    <PhoneCall className="h-4 w-4 animate-bounce" /> Call Customer Interface
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-10 flex items-center justify-center gap-2 rounded-lg transition-all"
                      onClick={handleWhatsAppClick}
                    >
                      <MessageSquare className="h-4 w-4 fill-current" /> WhatsApp
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-primary/20 hover:bg-primary/5 text-foreground font-bold h-10 flex items-center justify-center gap-2 rounded-lg transition-all"
                      onClick={handleEmailClick}
                    >
                      <Mail className="h-4 w-4" /> Send Email
                    </Button>
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

            {/* Odoo Communication Hub Card */}
            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm overflow-hidden border border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30 bg-muted/10">
                <CardTitle className="text-lg flex items-center gap-2 font-bold tracking-tight">
                  <Clock className="h-5 w-5 text-[#D05A1E]" /> Communication History
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => setIsAddLogOpen(true)}
                  className="bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold rounded-lg shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Log
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                {isLogsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D05A1E]" />
                    <span className="text-xs text-muted-foreground">Menghubungkan ke Odoo...</span>
                  </div>
                ) : (
                  <>
                    {/* SECTION 1: UPCOMING/SCHEDULED ACTIVITIES */}
                    <div>
                      <div className="text-xs text-[#D05A1E] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Aktivitas Terjadwal ({activities.length})
                      </div>
                      
                      {activities.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-3 bg-muted/20 border border-dashed rounded-lg text-center">
                          Tidak ada meeting atau follow-up terjadwal di Odoo.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activities.map((act) => (
                            <div 
                              key={act.id} 
                              className="p-3 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20 rounded-xl relative overflow-hidden transition-all"
                            >
                              <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-[#D05A1E] rounded-bl-full" />
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-[#D05A1E]/10 text-[#D05A1E] font-mono uppercase text-[9px]">
                                    {act.type}
                                  </span>
                                  {act.summary}
                                </div>
                                <div className="text-[10px] font-semibold text-[#D05A1E] flex items-center gap-1 shrink-0">
                                  <Clock className="h-3 w-3" /> {new Date(act.deadline).toLocaleDateString('id-ID')}
                                </div>
                              </div>
                              {act.note && (
                                <p className="text-[11px] leading-relaxed text-muted-foreground font-sans">
                                  {act.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    {/* SECTION 2: PAST LOGS (CHATTER) */}
                    <div>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5" /> Riwayat Komunikasi ({logs.length})
                      </div>

                      {logs.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-3 bg-muted/10 border border-dashed rounded-lg text-center">
                          Belum ada log komunikasi tercatat untuk lead ini.
                        </div>
                      ) : (
                        <div className="relative pl-4 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
                          {logs.map((log) => (
                            <div key={log.id} className="relative group">
                              {/* Icon bullet based on type */}
                              <div className={cn(
                                "absolute -left-[23px] top-0.5 w-5 h-5 rounded-full border border-background shadow-sm flex items-center justify-center text-white scale-90",
                                log.type === 'WHATSAPP' && 'bg-[#25D366]',
                                log.type === 'EMAIL' && 'bg-blue-500',
                                log.type === 'CALL' && 'bg-[#D05A1E]',
                                log.type === 'MEETING' && 'bg-purple-500',
                                log.type === 'NOTE' && 'bg-muted-foreground/60'
                              )}>
                                {log.type === 'WHATSAPP' && <MessageSquare className="h-2.5 w-2.5 fill-current" />}
                                {log.type === 'EMAIL' && <Mail className="h-2.5 w-2.5" />}
                                {log.type === 'CALL' && <PhoneCall className="h-2.5 w-2.5" />}
                                {log.type === 'MEETING' && <Calendar className="h-2.5 w-2.5" />}
                                {log.type === 'NOTE' && <History className="h-2.5 w-2.5" />}
                              </div>
                              
                              <div className="pl-1.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {new Date(log.date).toLocaleString('id-ID')}
                                  </span>
                                  <span className={cn(
                                    "text-[9px] px-1 rounded font-bold uppercase tracking-wider",
                                    log.type === 'WHATSAPP' && 'bg-[#25D366]/10 text-[#25D366]',
                                    log.type === 'EMAIL' && 'bg-blue-500/10 text-blue-500',
                                    log.type === 'CALL' && 'bg-[#D05A1E]/10 text-[#D05A1E]',
                                    log.type === 'MEETING' && 'bg-purple-500/10 text-purple-500',
                                    log.type === 'NOTE' && 'bg-muted-foreground/10 text-muted-foreground'
                                  )}>
                                    {log.type}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed text-foreground font-sans">
                                  {log.body}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Calling Interface Modal Backdrop */}
        {isCallModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-6 animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-500 via-primary to-orange-500 animate-pulse" />
              
              <div className="flex flex-col items-center space-y-4">
                <div className={cn(
                  "p-5 rounded-full bg-orange-500/10 text-[#D05A1E] shadow-xl relative",
                  callState === 'calling' && 'animate-ping duration-1000',
                  callState === 'ongoing' && 'animate-pulse'
                )}>
                  <PhoneCall className="h-10 w-10 text-[#D05A1E]" />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{namaLengkap || 'Calon Mitra'}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{namaPerusahaan} • {telepon}</p>
                </div>

                <div className="text-sm font-semibold tracking-wider font-mono px-3 py-1 bg-muted rounded-full">
                  {callState === 'calling' && "MENUNGGU PANGGILAN..."}
                  {callState === 'ongoing' && (
                    <>
                      CALL ONGOING • {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}
                    </>
                  )}
                  {callState === 'ended' && "PANGGILAN SELESAI"}
                </div>
              </div>

              {callState !== 'ended' ? (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => setCallState('ended')}
                    className="bg-[#C1121F] hover:bg-[#780116] text-white font-bold h-12 w-32 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20"
                  >
                    <X className="h-4 w-4" /> End Call
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-left border-t border-border/30 pt-4 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-bold text-foreground">Detail Laporan Panggilan</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-semibold">Hasil Telepon</label>
                    <select 
                      value={callResult} 
                      onChange={(e) => setCallResult(e.target.value)}
                      className="w-full bg-background border border-primary/20 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Interested">Mitra Tertarik (Interested)</option>
                      <option value="Callback">Hubungi Kembali (Callback Later)</option>
                      <option value="Not Interested">Kurang Tertarik (Not Interested)</option>
                      <option value="No Answer">Tidak Terjawab (No Answer)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-semibold">Catatan Panggilan</label>
                    <Textarea 
                      placeholder="Masukkan poin pembicaraan atau detail kelanjutan panggilan..." 
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      className="bg-background border border-primary/20 text-sm min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSaveCallLog}
                      disabled={isSubmittingLog}
                      className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold"
                    >
                      {isSubmittingLog ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                      Simpan Log di Odoo
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setIsCallModalOpen(false);
                        setCallState('calling');
                        setCallDuration(0);
                      }}
                      className="text-muted-foreground hover:bg-muted/10 font-medium"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Log / Schedule Activity Modal Backdrop */}
        {isAddLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <form 
              onSubmit={handleSubmitCustomLog}
              className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 animate-in zoom-in-95 duration-200 text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-[#D05A1E]" /> Tambah Log / Jadwalkan Aktivitas
                </h2>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddLogOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Tipe Log Selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-semibold">Tipe Komunikasi</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { val: 'NOTE', label: 'Note' },
                    { val: 'CALL', label: 'Call' },
                    { val: 'EMAIL', label: 'Email' },
                    { val: 'WHATSAPP', label: 'WA' },
                    { val: 'MEETING', label: 'Meeting' }
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setLogType(t.val)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold transition-all border",
                        logType === t.val 
                          ? 'bg-[#D05A1E] text-white border-[#D05A1E] shadow-sm'
                          : 'bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/50'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle to Schedule for the future */}
              <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-xl my-2">
                <div>
                  <div className="text-xs font-bold text-foreground">Rencanakan untuk Masa Depan?</div>
                  <div className="text-[10px] text-muted-foreground">Aktifkan untuk menjadwalkan ke Odoo Activities.</div>
                </div>
                <input 
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="h-4 w-4 rounded border-primary/20 text-[#D05A1E] focus:ring-[#D05A1E]"
                />
              </div>

              {isScheduled && (
                <div className="space-y-3 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-semibold">Judul Aktivitas / Meeting</label>
                    <Input 
                      placeholder={logType === 'MEETING' ? "Contoh: Meeting Negosiasi Bulk Order" : "Contoh: Diskusi Volume Bulk Order & Harga Spesial"}
                      value={logSummary}
                      onChange={(e) => setLogSummary(e.target.value)}
                      className="bg-background border-primary/20 text-sm h-9"
                      required={isScheduled}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-semibold">Tanggal Jadwal</label>
                    <Input 
                      type="date"
                      value={logDeadline}
                      onChange={(e) => setLogDeadline(e.target.value)}
                      className="bg-background border-primary/20 text-sm h-9"
                      required={isScheduled}
                    />
                  </div>

                  {logType === 'MEETING' && (
                    <>
                      {/* Grid for Time and Location */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground font-semibold">Waktu Meeting</label>
                          <Input 
                            type="time"
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            className="bg-background border-primary/20 text-sm h-9 w-full"
                            required={isScheduled && logType === 'MEETING'}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground font-semibold">Lokasi Meeting</label>
                          <select
                            value={meetingLocation}
                            onChange={(e) => setMeetingLocation(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-primary/20 bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="Online (Google Meet / Zoom)">Online (Meet / Zoom)</option>
                            <option value="Offline (Kantor / Tempat Mitra)">Offline (Kantor / Mitra)</option>
                          </select>
                        </div>
                      </div>

                      {/* Attendee Picker */}
                      <div className="space-y-2 border border-primary/10 rounded-xl p-3 bg-muted/10">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-muted-foreground font-semibold">Anggota Wajib Ikut (Contacts)</label>
                          {selectedAttendees.length > 0 && (
                            <span className="text-[10px] bg-[#D05A1E]/10 text-[#D05A1E] font-bold px-2 py-0.5 rounded-full">
                              {selectedAttendees.length} Terpilih
                            </span>
                          )}
                        </div>

                        {/* Render active badges for chosen contacts */}
                        {selectedAttendees.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {selectedAttendees.map(id => {
                              const attendee = contactsList.find(c => c.id === id);
                              if (!attendee) return null;
                              return (
                                <div 
                                  key={id} 
                                  className="flex items-center gap-1 bg-[#D05A1E]/20 text-[#D05A1E] text-[10px] font-bold px-2 py-0.5 rounded-lg border border-[#D05A1E]/30 animate-in zoom-in-95"
                                >
                                  <span>{attendee.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAttendees(prev => prev.filter(x => x !== id))}
                                    className="text-xs text-[#D05A1E] hover:text-[#B34914] font-bold ml-0.5"
                                  >
                                    &times;
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Search Bar for Contacts */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                          <Input 
                            placeholder="Cari kontak di Odoo..."
                            value={attendeeSearchQuery}
                            onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                            className="bg-background border-primary/20 text-xs h-8 pl-8"
                          />
                        </div>

                        {/* Scrollable list of Odoo Contacts */}
                        <div className="max-h-36 overflow-y-auto border border-primary/10 rounded-lg p-2 bg-background space-y-1">
                          {isContactsLoading ? (
                            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mr-1 text-[#D05A1E]" />
                              Memuat Kontak Odoo...
                            </div>
                          ) : (
                            (() => {
                              const filtered = contactsList.filter(c => 
                                c.name.toLowerCase().includes(attendeeSearchQuery.toLowerCase()) || 
                                c.email.toLowerCase().includes(attendeeSearchQuery.toLowerCase())
                              );
                              if (filtered.length === 0) {
                                return <div className="text-center py-3 text-[10px] text-muted-foreground">Kontak tidak ditemukan.</div>;
                              }
                              return filtered.map(c => {
                                const isChecked = selectedAttendees.includes(c.id);
                                return (
                                  <label 
                                    key={c.id} 
                                    className={cn(
                                      "flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors",
                                      isChecked ? 'bg-[#D05A1E]/5 text-foreground font-semibold' : 'hover:bg-muted/30 text-muted-foreground'
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setSelectedAttendees(prev => prev.filter(x => x !== c.id));
                                          } else {
                                            setSelectedAttendees(prev => [...prev, c.id]);
                                          }
                                        }}
                                        className="h-3.5 w-3.5 rounded border-primary/20 text-[#D05A1E] focus:ring-[#D05A1E]"
                                      />
                                      <span className="truncate max-w-[200px]">{c.name}</span>
                                    </div>
                                    {c.email && (
                                      <span className="text-[9px] text-muted-foreground/60 truncate max-w-[120px] font-mono">
                                        {c.email}
                                      </span>
                                    )}
                                  </label>
                                );
                              });
                            })()
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Catatan / Isi Detail */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-semibold">Catatan / Detail Aktivitas</label>
                <Textarea 
                  placeholder={isScheduled ? "Detail agenda meeting atau follow-up..." : "Catatan detail mengenai komunikasi yang dilakukan..."}
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="bg-background border-primary/20 text-sm min-h-[100px]"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button 
                  type="submit" 
                  disabled={isSubmittingLog}
                  className="flex-1 bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold"
                >
                  {isSubmittingLog ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Menyimpan ke Odoo...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      {isScheduled ? "Jadwalkan di Odoo" : "Simpan Log di Odoo"}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddLogOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10 font-medium"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
