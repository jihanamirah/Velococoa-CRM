"use client";

import * as React from "react";
import { ChevronDown, Search, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Option {
  id: number;
  name: string;
  [key: string]: any; // Allow other fields like code, email, etc.
}

interface OdooMany2OneProps {
  value?: number;
  onChange: (id: number | undefined, name?: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function OdooMany2One({
  value,
  onChange,
  options = [],
  placeholder = "Pilih opsi...",
  className,
  disabled = false,
  label = "Opsi",
}: OdooMany2OneProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [modalSearch, setModalSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.id === value);
  }, [options, value]);

  // Filtered options for the quick dropdown (limit to 5 items)
  const quickFilteredOptions = React.useMemo(() => {
    if (!search) return options.slice(0, 5);
    const queryText = search.toLowerCase().trim();
    return options
      .filter((opt) => opt.name?.toLowerCase().includes(queryText))
      .slice(0, 5);
  }, [options, search]);

  // Filtered options for the "Search More" Modal
  const modalFilteredOptions = React.useMemo(() => {
    if (!modalSearch) return options;
    const queryText = modalSearch.toLowerCase().trim();
    return options.filter((opt) => opt.name?.toLowerCase().includes(queryText));
  }, [options, modalSearch]);

  // Pagination for Modal
  const totalPages = Math.ceil(modalFilteredOptions.length / itemsPerPage) || 1;
  const paginatedOptions = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return modalFilteredOptions.slice(start, start + itemsPerPage);
  }, [modalFilteredOptions, currentPage]);

  // Reset page when search term changes in modal
  React.useEffect(() => {
    setCurrentPage(1);
  }, [modalSearch]);

  const handleSelect = (id: number, name: string) => {
    onChange(id, name);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, "");
    setSearch("");
  };

  const handleOpenSearchMore = () => {
    setOpen(false);
    setModalSearch(search); // carry over quick search query to modal
    setShowModal(true);
  };

  return (
    <>
      <div className={cn("relative w-full", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left",
                !selectedOption && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {selectedOption ? selectedOption.name : placeholder}
              </span>
              <div className="flex items-center gap-1">
                {selectedOption && !disabled && (
                  <span
                    onClick={handleClear}
                    className="rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder={`Cari ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {quickFilteredOptions.length === 0 ? (
                <div className="py-2 text-center text-sm text-muted-foreground">
                  Tidak ada hasil ditemukan.
                </div>
              ) : (
                quickFilteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id, opt.name)}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                      opt.id === value && "bg-accent/50 font-medium"
                    )}
                  >
                    <span className="truncate flex-1">{opt.name}</span>
                    {opt.id === value && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </button>
                ))
              )}
              <div className="border-t my-1" />
              <button
                onClick={handleOpenSearchMore}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs font-semibold text-primary/95 hover:bg-primary/10 text-left transition-colors"
              >
                <Search className="mr-2 h-3.5 w-3.5" />
                Cari lebih banyak (Search more...)
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Full search dialogue modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-lg">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Cari Lebih Banyak: {label}
            </DialogTitle>
          </DialogHeader>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Cari berdasarkan nama ${label.toLowerCase()}...`}
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Options List Table */}
          <div className="border rounded-md overflow-hidden bg-card">
            <div className="grid grid-cols-12 bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">ID</div>
              <div className="col-span-9">Nama</div>
            </div>
            <div className="divide-y max-h-[280px] overflow-y-auto">
              {paginatedOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Tidak ada data yang cocok.
                </div>
              ) : (
                paginatedOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id, opt.name);
                      setShowModal(false);
                    }}
                    className={cn(
                      "grid grid-cols-12 px-4 py-2.5 text-sm items-center hover:bg-accent/60 cursor-pointer transition-colors",
                      opt.id === value && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    <div className="col-span-3 text-muted-foreground font-mono text-xs">
                      #{opt.id}
                    </div>
                    <div className="col-span-9 flex justify-between items-center truncate">
                      <span>{opt.name}</span>
                      {opt.id === value && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-xs text-muted-foreground">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, modalFilteredOptions.length)} dari{" "}
                {modalFilteredOptions.length} data
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-2">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
