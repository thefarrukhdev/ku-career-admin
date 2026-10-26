"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService, Subscription } from "@/services/subscriptionService";
import { vacancyService } from "@/services/vacancyService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  FileSpreadsheet,
  Trash2,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  Inbox,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function Subscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  // 1. Arizalar
  const { data: subscriptions = [], isLoading: isLoadingSubs } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionService.getSubscriptions(),
  });

  // 2. Vakansiyalar (nomini chiqarish uchun)
  const { data: vacancies = [] } = useQuery({
    queryKey: ["vacancies"],
    queryFn: () => vacancyService.getVacancies(),
  });

  // Vakansiyalar xaritasi
  const vacanciesMap = useMemo(() => {
    const map = new Map<string, string>();
    vacancies.forEach((v) => {
      if (v.id) map.set(String(v.id), v.title);
    });
    return map;
  }, [vacancies]);

  // Arizani o'chirish
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "Ariza o'chirildi",
        description: deleteTarget?.fullName ? `${deleteTarget.fullName} arizasi o'chirildi.` : "",
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Arizani o'chirishda xatolik yuz berdi.",
        variant: "destructive",
      });
      setDeleteTarget(null);
    },
  });

  // Qidiruv
  const filteredSubscriptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subscriptions;

    return subscriptions.filter((sub) => {
      const name = (sub.fullName || "").toLowerCase();
      const phone = (sub.phone || "").toLowerCase();
      const major = (sub.major || "").toLowerCase();
      const vacTitle = (sub.vacansy_id ? vacanciesMap.get(String(sub.vacansy_id)) || "" : "").toLowerCase();
      return name.includes(q) || phone.includes(q) || major.includes(q) || vacTitle.includes(q);
    });
  }, [subscriptions, searchQuery, vacanciesMap]);

  // Pagination hisoblash
  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredSubscriptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Excel / CSV eksport
  const handleExportCSV = () => {
    if (!filteredSubscriptions.length) {
      toast({
        title: "Eksport uchun ma'lumot yo'q",
        variant: "destructive",
      });
      return;
    }

    const headers = ["#", "Ism-familiya", "Telefon raqami", "Yo'nalishi", "Vakansiya", "Sana"];
    const rows = filteredSubscriptions.map((sub, idx) => {
      const vacTitle = sub.vacansy_id ? vacanciesMap.get(String(sub.vacansy_id)) || "-" : "-";
      const date = sub.created_at ? new Date(sub.created_at).toLocaleDateString("uz-UZ") : "-";
      return [idx + 1, sub.fullName || "-", sub.phone || "-", sub.major || "-", vacTitle, date];
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((row) => row.map((val) => `"${val}"`).join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Arizalar_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Muvaffaqiyatli",
      description: `${filteredSubscriptions.length} ta ariza yuklab olindi.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Sarlavha va harakatlar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Arizalar
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sayt orqali kelib tushgan barcha nomzod arizalari
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!filteredSubscriptions.length}
            className="w-full sm:w-auto gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excelga yuklab olish</span>
          </Button>
        </div>

        {/* Qidiruv qatori */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ism, telefon yoki yo'nalish bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Arizalar jadvali */}
        <Card className="border-border/70 overflow-hidden shadow-xs">
          <CardHeader className="py-3 px-5 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Jami: {totalItems} ta ariza
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSubs ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Yuklanmoqda...
              </div>
            ) : paginatedItems.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Qidiruv bo'yicha hech qanday ariza topilmadi" : "Hozircha arizalar mavjud emas"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Ism-familiya</TableHead>
                      <TableHead>Telefon raqam</TableHead>
                      <TableHead>Yo'nalishi</TableHead>
                      <TableHead>Topshirgan vakansiyasi</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead className="w-20 text-right">O'chirish</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((sub, index) => {
                      const rowNum = startIndex + index + 1;
                      const vacTitle = sub.vacansy_id
                        ? vacanciesMap.get(String(sub.vacansy_id)) || "Umumiy"
                        : "Umumiy";

                      return (
                        <TableRow key={sub.id || index} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="text-center text-xs text-muted-foreground font-mono">
                            {rowNum}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {sub.fullName}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`tel:${sub.phone}`}
                              className="text-foreground/90 hover:text-primary transition-colors flex items-center gap-1.5 font-mono text-xs"
                            >
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              {sub.phone}
                            </a>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sub.major || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {vacTitle}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {sub.created_at
                              ? new Date(sub.created_at).toLocaleDateString("uz-UZ", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(sub)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t text-xs text-muted-foreground">
                <div>
                  {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} / {totalItems} ta
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Oldingi
                  </Button>
                  <span className="px-2 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5"
                  >
                    Keyingi
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* O'chirishni tasdiqlash dialogi */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Arizani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham <strong>{deleteTarget?.fullName}</strong> nomzod arizasini o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget?.id && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? "O'chirilmoqda..." : "Ha, o'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
