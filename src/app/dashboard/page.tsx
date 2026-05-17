"use client";

import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Activity, 
  Trophy, 
  TrendingUp, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Link from 'next/link';

const chartData = [
  { name: 'Sen', leads: 4 },
  { name: 'Sel', leads: 7 },
  { name: 'Rab', leads: 5 },
  { name: 'Kam', leads: 8 },
  { name: 'Jum', leads: 12 },
  { name: 'Sab', leads: 9 },
  { name: 'Min', leads: 15 },
];

const metrics = [
  { title: 'Total Leads', value: '248', icon: Users, color: 'bg-primary/10 text-primary', sub: '+12% dari bulan lalu' },
  { title: 'Leads Baru', value: '14', icon: UserPlus, color: 'bg-blue-500/10 text-blue-500', sub: 'Butuh follow-up segera' },
  { title: 'Sedang Diproses', value: '42', icon: Activity, color: 'bg-amber-500/10 text-amber-500', sub: 'Status: Dihubungi' },
  { title: 'Closing Bulan Ini', value: '18', icon: Trophy, color: 'bg-green-500/10 text-green-500', sub: 'Target: 25 leads' },
];

const recentLeads = [
  { company: 'Kopi Kenangan Senja', contact: 'Budi Santoso', segment: 'Kafe', status: 'Baru', date: '2 jam lalu' },
  { company: 'Sweet Bakery', contact: 'Ani Wijaya', segment: 'Bakery', status: 'Dihubungi', date: '5 jam lalu' },
  { company: 'Grand Aston Hotel', contact: 'James Bond', segment: 'Hotel', status: 'Qualified', date: '1 hari lalu' },
  { company: 'IndoFood Corp', contact: 'Siti Aminah', segment: 'Korporasi', status: 'Baru', date: '1 hari lalu' },
  { company: 'Morning Toast', contact: 'Rendy K', segment: 'Kafe', status: 'Lost', date: '2 hari lalu' },
];

export default function DashboardPage() {
  return (
    <CRMLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Selamat datang, Jihan!</h1>
          <p className="text-muted-foreground">Monitor performa pipeline PT VeloCocoa hari ini.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => (
            <Card key={idx} className="border-none shadow-lg bg-card/40 backdrop-blur-sm overflow-hidden group hover:ring-1 hover:ring-primary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", m.color)}>
                    <m.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider opacity-70">Live</Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">{m.title}</h3>
                  <div className="text-3xl font-bold">{m.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
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
                Pertumbuhan Leads
              </CardTitle>
              <CardDescription>Visualisasi lead yang masuk dalam 7 hari terakhir.</CardDescription>
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
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dx={-10} />
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
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Aktivitas terbaru</CardDescription>
              </div>
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentLeads.map((lead, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm truncate max-w-[150px]">{lead.company}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {lead.date}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-2 py-0.5 border-none",
                        lead.status === 'Baru' && 'bg-blue-500/10 text-blue-500',
                        lead.status === 'Dihubungi' && 'bg-amber-500/10 text-amber-500',
                        lead.status === 'Qualified' && 'bg-green-500/10 text-green-500',
                        lead.status === 'Lost' && 'bg-red-500/10 text-red-500',
                      )}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}