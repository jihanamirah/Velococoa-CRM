"use client";

import { useEffect, useState, useMemo } from 'react';
import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  Activity, 
  Trophy, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getLeads, Lead } from '@/app/lib/crm-service';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLeads().then((data) => {
      setLeads(data);
      setIsLoading(false);
    });
  }, []);

  // Calculate real-time metrics from Odoo data
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'Baru').length;
    const inProgress = leads.filter(l => l.status === 'Dihubungi' || l.status === 'Qualified').length;
    const wonLeads = leads.filter(l => l.status === 'Won').length;

    return [
      { title: 'Total Opportunities', value: totalLeads.toString(), icon: Users, color: 'bg-primary/10 text-primary', sub: 'Semua pipeline di Odoo' },
      { title: 'New Leads', value: newLeads.toString(), icon: UserPlus, color: 'bg-blue-500/10 text-blue-500', sub: 'Butuh kualifikasi segera' },
      { title: 'In Pipeline', value: inProgress.toString(), icon: Activity, color: 'bg-amber-500/10 text-amber-500', sub: 'Status: Dihubungi/Qualified' },
      { title: 'Closed Won', value: wonLeads.toString(), icon: Trophy, color: 'bg-green-500/10 text-green-500', sub: 'Target Closing Bulan Ini' },
    ];
  }, [leads]);

  // Aggregate leads by day for the chart
  const chartData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map(day => {
      const count = leads.filter(l => isSameDay(new Date(l.createdAt), day)).length;
      return {
        name: format(day, 'EEE', { locale: id }),
        leads: count
      };
    });
  }, [leads]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [leads]);

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse text-sm">Mengambil data dari Odoo ERP...</p>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Overview</h1>
            <p className="text-muted-foreground">Monitoring sinkronisasi data real-time dari Odoo CRM.</p>
          </div>
          <div className="text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Terhubung ke: <span className="text-foreground">ASPK60 Database</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => (
            <Card key={idx} className="border-none shadow-lg bg-card/40 backdrop-blur-sm overflow-hidden group hover:ring-1 hover:ring-primary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", m.color)}>
                    <m.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider opacity-70">Odoo 18</Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">{m.title}</h3>
                  <div className="text-3xl font-bold">{m.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {m.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-xl bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Pertumbuhan Pipeline
              </CardTitle>
              <CardDescription>Visualisasi lead yang terdaftar di Odoo 7 hari terakhir.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dx={-10} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>Aktivitas terbaru di ERP</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                asChild
              >
                <Link href="/leads">
                  Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentLeads.map((lead, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1 max-w-[180px]">
                      <div className="font-semibold text-sm truncate">{lead.namaPerusahaan}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {format(new Date(lead.createdAt), 'dd MMM, HH:mm', { locale: id })}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-2 py-0.5 border-none",
                        lead.status === 'Baru' && 'bg-blue-500/10 text-blue-500',
                        lead.status === 'Dihubungi' && 'bg-amber-500/10 text-amber-500',
                        lead.status === 'Qualified' && 'bg-green-500/10 text-green-500',
                        lead.status === 'Won' && 'bg-primary/10 text-primary',
                        lead.status === 'Lost' && 'bg-red-500/10 text-red-500',
                      )}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                ))}
                {recentLeads.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Belum ada data opportunity.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  );
}
