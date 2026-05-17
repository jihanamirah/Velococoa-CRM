"use client";

import { CRMLayout } from '@/components/layout/crm-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useState } from 'react';

const initialNotifications = [
  { id: '1', type: 'lead_baru', title: 'Lead Baru Masuk!', body: 'Kopi Kenangan Senja - Kafe & Kedai Kopi', date: '2 jam lalu', read: false, color: 'text-blue-500 bg-blue-500/10' },
  { id: '2', type: 'follow_up', title: 'Follow Up Diperlukan!', body: 'Sweet Bakery belum dihubungi lebih dari 24 jam', date: 'Kemarin', read: false, color: 'text-amber-500 bg-amber-500/10' },
  { id: '3', type: 'keputusan', title: 'Keputusan Diperlukan!', body: 'Grand Aston Hotel menunggu keputusan Won atau Lost', date: '2 hari lalu', read: true, color: 'text-red-500 bg-red-500/10' },
  { id: '4', type: 'lead_baru', title: 'Lead Baru Masuk!', body: 'IndoFood Corp - Hotel & Korporasi', date: '3 hari lalu', read: true, color: 'text-blue-500 bg-blue-500/10' },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifications);

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = (id: string) => {
    setNotifs(notifs.filter(n => n.id !== id));
  };

  return (
    <CRMLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
            <p className="text-muted-foreground">Pantau aktivitas lead secara realtime.</p>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} className="bg-card/30 border-border/50">
            Tandai Semua Dibaca
          </Button>
        </div>

        <div className="space-y-3">
          {notifs.map((n) => (
            <Card key={n.id} className={cn(
              "border-none shadow-md bg-card/40 transition-all group overflow-hidden",
              !n.read && "ring-1 ring-primary/20"
            )}>
              <CardContent className="p-0">
                <div className="flex items-center p-4 gap-4">
                  <div className={cn("p-3 rounded-xl flex-shrink-0", n.color)}>
                    {n.type === 'lead_baru' && <UserPlus className="h-5 w-5" />}
                    {n.type === 'follow_up' && <AlertCircle className="h-5 w-5" />}
                    {n.type === 'keputusan' && <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm flex items-center gap-2">
                        {n.title}
                        {!n.read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{n.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{n.body}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteNotif(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {!n.read && <div className="h-0.5 bg-primary w-full"></div>}
              </CardContent>
            </Card>
          ))}
          {notifs.length === 0 && (
             <div className="text-center py-20 text-muted-foreground space-y-4">
               <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto">
                 <Bell className="h-12 w-12 opacity-20" />
               </div>
               <p>Kotak masuk Anda bersih.</p>
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}