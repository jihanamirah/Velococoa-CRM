
"use client";

import { useEffect, useState, useCallback } from 'react';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  MapPin, 
  RefreshCcw,
  Sparkles,
  Trophy,
  XCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { getLeads, getStages, moveLeadToStage, markWon, markLost, Lead, OdooStage } from '@/app/lib/crm-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function KanbanPage() {
  const [stages, setStages] = useState<OdooStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const [allStages, allLeads] = await Promise.all([getStages(), getLeads()]);
      setStages(allStages);
      setLeads(allLeads);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memuat data", description: "Cek koneksi Odoo Anda." });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMove = async (leadId: string, stageId: number, stageName: string) => {
    const res = await moveLeadToStage(leadId, stageId);
    if (res.success) {
      toast({ title: "Stage Diperbarui", description: `Lead dipindahkan ke stage: ${stageName}` });
      fetchData(false);
    }
  };

  const handleWon = async (leadId: string) => {
    const res = await markWon(leadId);
    if (res.success) {
      toast({ title: "Lead Won!", description: "Target closing tercapai. Data disinkronkan ke Odoo." });
      fetchData(false);
    }
  };

  const handleLost = async (leadId: string) => {
    const res = await markLost(leadId);
    if (res.success) {
      toast({ variant: "destructive", title: "Lead Lost", description: "Opportunity ditandai gagal di Odoo." });
      fetchData(false);
    }
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Mengambil Pipeline Dinamis Odoo...</p>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
            <p className="text-muted-foreground">Sinkronisasi real-time dua arah dengan Odoo CRM.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()} 
            disabled={isRefreshing}
            className="bg-card/30 border-border/50"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh Data
          </Button>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {stages.map((stage) => {
            const stageLeads = leads.filter(l => l.stageId === stage.id && l.active);
            const isWonStage = stage.name.toLowerCase().includes('won') || stage.name.toLowerCase().includes('berhasil');
            const isLostStage = stage.name.toLowerCase().includes('lost') || stage.name.toLowerCase().includes('gagal');

            return (
              <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs uppercase tracking-widest">{stage.name}</h3>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground rounded-full h-5 px-1.5 text-[10px]">
                      {stageLeads.length}
                    </Badge>
                  </div>
                </div>

                <div className={cn(
                  "flex-1 rounded-2xl p-2 space-y-3 kanban-column-scroll overflow-y-auto border-t-2",
                  isWonStage ? "border-t-[#2D6A4F] bg-[#2D6A4F]/5" : 
                  isLostStage ? "border-t-[#C1121F] bg-[#C1121F]/5" : 
                  "border-t-[#C17B3A] bg-[#C17B3A]/5"
                )}>
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="border-none shadow-sm hover:shadow-md transition-all bg-card/60 backdrop-blur-sm group relative overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {lead.kategoriBisnis}
                          </div>
                          <Badge variant="outline" className="text-[9px] h-5 border-primary/30 text-primary">
                            {lead.probability}%
                          </Badge>
                        </div>
                        
                        <Link href={`/leads/${lead.id}`}>
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {lead.namaPerusahaan}
                          </h4>
                        </Link>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                           <div className="flex items-center gap-1">
                             <MapPin className="h-2.5 w-2.5" /> {lead.kota}
                           </div>
                           <div className="font-medium">{lead.namaLengkap}</div>
                        </div>

                        <div className="pt-3 border-t border-border/30 flex items-center justify-between gap-2">
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-[#2D6A4F] hover:bg-[#2D6A4F]/10"
                              onClick={() => handleWon(lead.id)}
                            >
                              <Trophy className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-[#C1121F] hover:bg-[#C1121F]/10"
                              onClick={() => handleLost(lead.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-1 overflow-hidden">
                             {stages.filter(s => s.sequence > stage.sequence).slice(0, 1).map(nextStage => (
                               <Button 
                                 key={nextStage.id}
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-7 text-[9px] px-2 font-bold uppercase"
                                 onClick={() => handleMove(lead.id, nextStage.id, nextStage.name)}
                               >
                                 Next <ChevronRight className="ml-1 h-3 w-3" />
                               </Button>
                             ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-muted-foreground/10 rounded-xl">
                      <p className="text-[10px] text-muted-foreground/40 italic">Stage Kosong</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CRMLayout>
  );
}
