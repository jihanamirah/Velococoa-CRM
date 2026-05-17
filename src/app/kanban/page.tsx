"use client";

import { useEffect, useState } from 'react';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MoreVertical, 
  MapPin, 
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { getLeads, Lead, LeadStatus } from '@/app/lib/crm-service';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const columns: LeadStatus[] = ['Baru', 'Dihubungi', 'Qualified', 'Won', 'Lost'];

const statusColors: Record<LeadStatus, string> = {
  'Baru': 'border-t-blue-500 bg-blue-500/5',
  'Dihubungi': 'border-t-amber-500 bg-amber-500/5',
  'Qualified': 'border-t-green-500 bg-green-500/5',
  'Won': 'border-t-primary bg-primary/10',
  'Lost': 'border-t-red-500 bg-red-500/5',
};

export default function KanbanPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    getLeads().then(setLeads);
  }, []);

  return (
    <CRMLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">Visualisasi alur calon mitra PT VeloCocoa.</p>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {columns.map((col) => (
            <div key={col} className="min-w-[300px] w-[300px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm uppercase tracking-widest">{col}</h3>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground rounded-full h-5 px-1.5 text-[10px]">
                    {leads.filter(l => l.status === col).length}
                  </Badge>
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>

              <div className={cn(
                "flex-1 rounded-xl p-2 space-y-3 kanban-column-scroll overflow-y-auto border-t-2",
                statusColors[col]
              )}>
                {leads.filter(l => l.status === col).map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}>
                    <Card className="border-none shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/30 transition-all bg-card/60 backdrop-blur-sm group relative">
                      {lead.aiFollowUpPriority === 'High' && (
                         <div className="absolute top-2 right-2 text-primary animate-pulse">
                           <Sparkles className="h-3 w-3" />
                         </div>
                      )}
                      <CardContent className="p-4 space-y-3">
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {lead.kategoriBisnis}
                        </div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{lead.namaPerusahaan}</h4>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                              {lead.namaLengkap.substring(0,2).toUpperCase()}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{lead.namaLengkap}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" /> {lead.kota}
                          </div>
                        </div>

                        {lead.sudahSyncOdoo && (
                          <div className="pt-2 border-t border-border/30 flex justify-end">
                             <RefreshCcw className="h-3 w-3 text-primary/60" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CRMLayout>
  );
}