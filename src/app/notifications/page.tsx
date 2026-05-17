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
  Trash2,
  MoreVertical,
  Check
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: any;
  read: boolean;
  color: string;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to notifications in real-time
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: NotificationItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          type: data.type || 'lead_baru',
          title: data.title || 'Notifikasi',
          body: data.body || '',
          createdAt: data.createdAt,
          read: !!data.read,
          color: data.color || 'text-blue-500 bg-blue-500/10'
        });
      });
      setNotifs(list);
      setIsLoading(false);
    }, (err) => {
      console.warn("Failed to listen to notifications page:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAllRead = async () => {
    try {
      const q = query(collection(db, "notifications"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        if (!d.data().read) {
          batch.update(doc(db, "notifications", d.id), { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.warn("Failed to mark single notification as read:", err);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  };

  const formatNotifDate = (createdAt: any): string => {
    if (!createdAt) return 'Baru Saja';
    let date: Date;
    if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else {
      date = new Date(createdAt);
    }
    
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Baru Saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffHours < 48) return 'Kemarin';
    return date.toLocaleDateString('id-ID');
  };

  return (
    <CRMLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
            <p className="text-muted-foreground">Pantau aktivitas lead secara realtime.</p>
          </div>
          {notifs.some(n => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="bg-card/30 border-border/50 hover:bg-card/50">
              Tandai Semua Dibaca
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifs.map((n) => (
            <Card key={n.id} className={cn(
              "border-none shadow-md bg-card/40 transition-all group overflow-hidden hover:bg-card/60 cursor-pointer",
              !n.read && "ring-1 ring-primary/20 bg-card/60"
            )} onClick={() => !n.read && markSingleRead(n.id)}>
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
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{formatNotifDate(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{n.body}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => markSingleRead(n.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteNotif(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {!n.read && <div className="h-0.5 bg-primary w-full"></div>}
              </CardContent>
            </Card>
          ))}
          {isLoading && (
             <div className="text-center py-20 text-muted-foreground">
               Loading notifikasi...
             </div>
          )}
          {!isLoading && notifs.length === 0 && (
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