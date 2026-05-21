"use client";

import React, { useState, useEffect } from 'react';
import { CRMLayout } from "@/components/layout/crm-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  getMailingLists,
  createMailingList,
  getMailingContacts,
  createMailingContact
} from "@/app/lib/crm-service";
import { 
  Users2,
  UserPlus,
  FolderPlus,
  Database,
  Search,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';

interface MailingListRecord {
  id: string;
  name: string;
  contactCount: number;
}

interface MailingContactRecord {
  id: string;
  name: string;
  email: string;
  listIds: number[];
}

export default function ListsPage() {
  const [mailingLists, setMailingLists] = useState<MailingListRecord[]>([]);
  const [mailingContacts, setMailingContacts] = useState<MailingContactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  
  // Form states (List & Contact)
  const [newListName, setNewListName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [selectedListId, setSelectedListId] = useState('0');
  const [isListSubmitting, setIsListSubmitting] = useState(false);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedLists, fetchedContacts] = await Promise.all([
        getMailingLists(),
        getMailingContacts()
      ]);
      
      // Filter specifically for PT VeloCocoa relevant mailing lists
      const velococoaLists = fetchedLists.filter(l => {
        const text = l.name.toLowerCase();
        return text.includes('velococoa') || 
               text.includes('mitra') || 
               text.includes('ethicocoa') || 
               text.includes('chocora') || 
               text.includes('cafe') || 
               text.includes('partnership') || 
               text.includes('distributor') || 
               text.includes('retail') ||
               text.includes('hospitality') ||
               text.includes('satyagraha');
      });

      setMailingLists(velococoaLists);
      setMailingContacts(fetchedContacts);
    } catch (error) {
      console.error("Failed to load marketing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      setIsListSubmitting(true);
      const res = await createMailingList(newListName);
      if (res.success) {
        setIsCreateListOpen(false);
        setNewListName('');
        loadData();
      } else {
        alert("Gagal membuat mailing list di Odoo: " + res.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsListSubmitting(false);
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactEmail.trim() || selectedListId === '0') return;
    try {
      setIsContactSubmitting(true);
      const res = await createMailingContact(
        newContactName || 'Pelanggan Anonim',
        newContactEmail,
        parseInt(selectedListId, 10)
      );
      if (res.success) {
        setIsAddContactOpen(false);
        setNewContactName('');
        setNewContactEmail('');
        setSelectedListId('0');
        loadData();
      } else {
        alert("Gagal menambah kontak di Odoo: " + res.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsContactSubmitting(false);
    }
  };

  // Filter contacts by search query
  const filteredContacts = mailingContacts.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query);
  });

  return (
    <CRMLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#4C382D] dark:text-white flex items-center gap-2">
              <Users2 className="h-8 w-8 text-[#D05A1E] animate-pulse" /> Mailing List & Database Prospek
            </h2>
            <p className="text-muted-foreground text-sm">
              Kelola daftar kontak dan segmentasi penerima untuk menyebarkan kampanye promosi PT VeloCocoa.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsCreateListOpen(true)}
              variant="outline"
              className="border-[#D05A1E] text-[#D05A1E] hover:bg-[#D05A1E]/10 font-bold rounded-xl flex items-center gap-1.5"
            >
              <FolderPlus className="h-4 w-4" /> Mailing List Baru
            </Button>
            <Button 
              onClick={() => setIsAddContactOpen(true)} 
              className="bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold rounded-xl shadow-lg shadow-orange-500/10 flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> Tambah Kontak
            </Button>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 1/3: Mailing Lists Segment List */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/20 bg-muted/10 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-[#4C382D] dark:text-white flex items-center gap-1.5">
                    <Database className="h-5 w-5 text-[#D05A1E]" /> Segmen List Odoo
                  </CardTitle>
                  <CardDescription className="text-xs">Segmen mailing list aktif di Odoo ERP.</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 divide-y divide-border/20">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#D05A1E]" />
                    <span className="text-xs">Memuat list Odoo...</span>
                  </div>
                ) : mailingLists.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground italic text-xs">
                    Tidak ada mailing list berlabel VeloCocoa.
                  </div>
                ) : (
                  mailingLists.map(list => (
                    <div key={list.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div>
                        <span className="block font-bold text-sm text-[#4C382D] dark:text-white">{list.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider bg-slate-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          ID Odoo: {list.id}
                        </span>
                      </div>
                      <span className="bg-[#D05A1E]/10 text-[#D05A1E] font-extrabold text-xs px-2.5 py-1 rounded-xl">
                        {list.contactCount} Prospek
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right 2/3: Subscriber Contacts Database */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg bg-white dark:bg-[#322F2C] rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-[#4C382D] dark:text-white flex items-center gap-2">
                      <Users2 className="h-6 w-6 text-[#D05A1E]" /> Database Pelanggan Mailing List
                    </CardTitle>
                    <CardDescription>Menampilkan daftar alamat email prospek yang terdaftar di Odoo mailing.contact.</CardDescription>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Cari prospek atau email..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background border-border"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#D05A1E]" />
                    <span>Menarik daftar kontak dari Odoo...</span>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                    <span className="font-semibold text-[#4C382D] dark:text-white">Tidak ada kontak ditemukan</span>
                    <span className="text-xs">Ubah kata kunci pencarian atau daftarkan kontak baru.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase">
                          <th className="px-6 py-4">Nama Prospek</th>
                          <th className="px-6 py-4">Alamat Email</th>
                          <th className="px-6 py-4">Daftar List Aktif (Odoo List IDs)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredContacts.map(contact => {
                          return (
                            <tr key={contact.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-6 py-4 font-bold text-[#4C382D] dark:text-white">
                                {contact.name === 'No Name' || !contact.name ? (
                                  <span className="italic text-muted-foreground/60 font-medium">Pelanggan Anonim</span>
                                ) : (
                                  contact.name
                                )}
                              </td>
                              <td className="px-6 py-4 font-semibold text-[#D05A1E]">
                                {contact.email}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {contact.listIds.length === 0 ? (
                                    <span className="text-[10px] text-muted-foreground/60 italic">Tanpa Segmentasi</span>
                                  ) : (
                                    contact.listIds.map(lid => {
                                      const listObj = mailingLists.find(l => String(l.id) === String(lid));
                                      return (
                                        <span key={lid} className="bg-slate-500/10 text-slate-600 dark:text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded">
                                          {listObj ? listObj.name : `List ${lid}`}
                                        </span>
                                      );
                                    })
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Modal: Create Mailing List */}
        {isCreateListOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <form 
              onSubmit={handleCreateListSubmit}
              className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <FolderPlus className="h-5 w-5 text-[#D05A1E]" /> Buat Mailing List Baru
                </h2>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsCreateListOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="listName" className="text-xs font-semibold">Nama Mailing List</Label>
                <Input 
                  id="listName"
                  placeholder="Contoh: Kemitraan VeloCocoa Cafe Jabodetabek"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="bg-background border-primary/20"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/30">
                <Button 
                  type="submit" 
                  disabled={isListSubmitting}
                  className="flex-1 bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold"
                >
                  {isListSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Membuat...
                    </>
                  ) : "Buat Mailing List"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsCreateListOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10 font-medium"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add Subscriber Contact */}
        {isAddContactOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <form 
              onSubmit={handleAddContactSubmit}
              className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-primary/20 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <UserPlus className="h-5 w-5 text-[#D05A1E]" /> Daftarkan Kontak Prospek
                </h2>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddContactOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-xs font-semibold">Nama Prospek (Opsional)</Label>
                <Input 
                  id="contactName"
                  placeholder="Contoh: Rian Hidayat"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="bg-background border-primary/20"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs font-semibold">Alamat Email Prospek</Label>
                <Input 
                  id="contactEmail"
                  type="email"
                  placeholder="Contoh: rian.hidayat@gmail.com"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="bg-background border-primary/20"
                  required
                />
              </div>

              {/* Select List */}
              <div className="space-y-1.5">
                <Label htmlFor="contactList" className="text-xs font-semibold">Masukkan ke Mailing List</Label>
                <select 
                  id="contactList"
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-primary/20 bg-background text-sm focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 outline-none font-semibold text-foreground"
                  required
                >
                  <option value="0">--- Pilih Target List ---</option>
                  {mailingLists.map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.contactCount} Kontak)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/30">
                <Button 
                  type="submit" 
                  disabled={isContactSubmitting}
                  className="flex-1 bg-[#D05A1E] hover:bg-[#B34914] text-white font-bold"
                >
                  {isContactSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Mendaftarkan...
                    </>
                  ) : "Daftarkan Kontak"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddContactOpen(false)}
                  className="text-muted-foreground hover:bg-muted/10 font-medium"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </CRMLayout>
  );
}
