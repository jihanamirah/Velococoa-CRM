"use client";

import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  RefreshCcw,
  CheckCheck,
  ArrowUpRight,
  Activity,
  Loader2,
  CalendarClock,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getOdooNotifications, OdooNotification } from '@/app/lib/crm-service';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const TYPE_CONFIG: Record<OdooNotification['type'], {
  icon: React.ElementType;
  color: string;
  label: string;
}> = {
  activity_overdue: {
    icon: AlertCircle,
    color: 'text-red-500 bg-red-500/10',
    label: 'Terlambat'
  },
  activity_upcoming: {
    icon: CalendarClock,
    color: 'text-amber-500 bg-amber-500/10',
    label: 'Aktivitas'
  },
  stage_change: {
    icon: TrendingUp,
    color: 'text-purple-500 bg-purple-500/10',
    label: 'Perubahan Stage'
  },
  lead_baru: {
    icon: UserPlus,
    color: 'text-blue-500 bg-blue-500/10',
    label: 'Lead Baru'
  },
  message: {
    icon: Activity,
    color: 'text-primary bg-primary/10',
    label: 'Pesan'
  }
};

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Baru Saja';
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru Saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<OdooNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | OdooNotification['type']>('all');
  const { toast } = useToast();

  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const data = await getOdooNotifications();
      setNotifs(data);
    } catch (err) {
      console.error('Failed to fetch Odoo notifications:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat notifikasi',
        description: 'Tidak dapat terhubung ke Odoo. Periksa koneksi Anda.'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifs = filter === 'all'
    ? notifs
    : notifs.filter(n => n.type === filter);

  const overdueCnt = notifs.filter(n => n.type === 'activity_overdue').length;
  const upcomingCnt = notifs.filter(n => n.type === 'activity_upcoming').length;
  const stageCnt = notifs.filter(n => n.type === 'stage_change').length;
  const newLeadCnt = notifs.filter(n => n.type === 'lead_baru').length;

  const FILTERS: { key: 'all' | OdooNotification['type']; label: string; count: number }[] = [
    { key: 'all', label: 'Semua', count: notifs.length },
    { key: 'activity_overdue', label: 'Terlambat', count: overdueCnt },
    { key: 'activity_upcoming', label: 'Aktivitas', count: upcomingCnt },
    { key: 'stage_change', label: 'Perubahan Stage', count: stageCnt },
    { key: 'lead_baru', label: 'Lead Baru', count: newLeadCnt },
  ];

  return (
    <CRMLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
            <p className="text-muted-foreground mt-1">
              Data real-time dari Odoo CRM — aktivitas, perubahan stage, dan lead baru.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(false)}
            disabled={isRefreshing}
            className="bg-card/30 border-border/50"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Summary stats */}
        {!isLoading && notifs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{overdueCnt}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Aktivitas Terlambat</div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-500">{upcomingCnt}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Aktivitas Mendatang</div>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-500">{stageCnt}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Perubahan Stage</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-500">{newLeadCnt}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Lead Baru (7 Hari)</div>
            </div>
          </div>
        )}

        {/* Filter chips */}
        {!isLoading && notifs.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <Button
                key={f.key}
                variant={filter === f.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full h-8 px-3 text-xs font-semibold",
                  filter !== f.key && "bg-card/30 border-border/50"
                )}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={cn(
                    "ml-1.5 text-[10px] rounded-full px-1.5 py-0.5",
                    filter === f.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {f.count}
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Notifications list */}
        <div className="space-y-3">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse text-sm">Mengambil data notifikasi dari Odoo...</p>
            </div>
          )}

          {!isLoading && filteredNotifs.length === 0 && (
            <div className="text-center py-20 text-muted-foreground space-y-4">
              <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto">
                <Bell className="h-12 w-12 opacity-20" />
              </div>
              <div>
                <p className="font-medium">Tidak ada notifikasi</p>
                <p className="text-sm opacity-60 mt-1">
                  {filter === 'all' 
                    ? 'Semua lead dan aktivitas Odoo dalam kondisi baik.' 
                    : `Tidak ada notifikasi untuk kategori ini.`}
                </p>
              </div>
            </div>
          )}

          {!isLoading && filteredNotifs.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.message;
            const IconComponent = config.icon;

            return (
              <Card
                key={n.id}
                className={cn(
                  "border-none shadow-md bg-card/40 transition-all group overflow-hidden hover:bg-card/60",
                  n.type === 'activity_overdue' && "ring-1 ring-red-500/30"
                )}
              >
                <CardContent className="p-0">
                  <div className="flex items-start p-4 gap-4">
                    <div className={cn("p-2.5 rounded-xl flex-shrink-0 mt-0.5", config.color)}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm leading-snug">{n.title}</div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest shrink-0">
                          {formatDate(n.date)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-border/50">
                          {config.label}
                        </Badge>
                        {n.deadline && (
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider flex items-center gap-1",
                            n.deadline < new Date().toISOString().split('T')[0] 
                              ? "text-red-500" 
                              : "text-amber-500"
                          )}>
                            <Clock className="h-2.5 w-2.5" />
                            {n.deadline}
                          </span>
                        )}
                        {n.author && (
                          <span className="text-[9px] text-muted-foreground/60">
                            oleh {n.author}
                          </span>
                        )}
                        {n.leadId && (
                          <Link
                            href={`/leads/${n.leadId}`}
                            className="ml-auto text-[10px] text-primary hover:underline flex items-center gap-0.5 font-semibold"
                            onClick={e => e.stopPropagation()}
                          >
                            Buka Lead <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  {n.type === 'activity_overdue' && (
                    <div className="h-0.5 bg-gradient-to-r from-red-500 to-red-500/0 w-full" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Odoo source badge */}
        {!isLoading && notifs.length > 0 && (
          <div className="text-center py-4">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium">
              ✓ Data sinkronisasi langsung dari Odoo CRM
            </span>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}