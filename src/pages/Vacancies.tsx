"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vacancyService, Vacancy } from "@/services/vacancyService";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Briefcase,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const vacancySchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: z.string().min(5, "Tavsif kiritilishi shart"),
});

type VacancyFormData = z.infer<typeof vacancySchema>;

export default function Vacancies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [deletingVacancy, setDeletingVacancy] = useState<Vacancy | null>(null);
  const [previewVacancy, setPreviewVacancy] = useState<Vacancy | null>(null);

  // Vakansiyalarni yuklash
  const { data: vacancies = [], isLoading } = useQuery({
    queryKey: ["vacancies"],
    queryFn: () => vacancyService.getVacancies(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VacancyFormData>({
    resolver: zodResolver(vacancySchema),
    defaultValues: { title: "", description: "" },
  });

  // Yaratish
  const createMutation = useMutation({
    mutationFn: (data: VacancyFormData) =>
      vacancyService.createVacancy(data as Omit<Vacancy, "id">),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast({ title: "Muvaffaqiyatli", description: "Yangi vakansiya yaratildi" });
      setIsDialogOpen(false);
      reset();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Vakansiya yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Yangilash
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VacancyFormData> }) =>
      vacancyService.updateVacancy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast({ title: "Yangilandi", description: "Vakansiya muvaffaqiyatli yangilandi" });
      setIsDialogOpen(false);
      setEditingVacancy(null);
      reset();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Vakansiyani yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // O'chirish
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vacancyService.deleteVacancy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast({ title: "O'chirildi", description: "Vakansiya muvaffaqiyatli o'chirildi" });
      setDeletingVacancy(null);
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Vakansiyani o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
      setDeletingVacancy(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingVacancy(null);
    reset({ title: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (v: Vacancy) => {
    setEditingVacancy(v);
    setValue("title", v.title);
    setValue("description", v.description);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: VacancyFormData) => {
    if (editingVacancy?.id) {
      updateMutation.mutate({ id: editingVacancy.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Qidiruv
  const filteredVacancies = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return vacancies;

    return vacancies.filter(
      (v) =>
        (v.title || "").toLowerCase().includes(q) ||
        (v.description || "").toLowerCase().includes(q)
    );
  }, [vacancies, searchTerm]);

  // Sahifalash
  const totalItems = filteredVacancies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredVacancies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Sarlavha va yangi qo'shish */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Vakansiyalar
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Universitetda e'lon qilingan bo'sh ish o'rinlari ro'yxati
            </p>
          </div>

          <Button onClick={handleOpenCreate} className="w-full sm:w-auto gap-2">
            <Plus className="w-4 h-4" />
            <span>Yangi vakansiya qo'shish</span>
          </Button>
        </div>

        {/* Qidiruv va ko'rinish tanlash */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Vakansiya sarlavhasi yoki tavsifi bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grid vs Table Ko'rinish tugmalari */}
          <div className="flex items-center rounded-lg border border-border/70 bg-muted/30 p-0.5 self-end sm:self-auto shrink-0">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-2.5 gap-1.5 text-xs font-medium"
              title="Katakchalar (Grid) ko'rinishi"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kataklar</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-2.5 gap-1.5 text-xs font-medium"
              title="Jadval (Table) ko'rinishi"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Jadval</span>
            </Button>
          </div>
        </div>

        {/* Vakansiyalar ro'yxati (Grid yoki Table) */}
        <Card className="border-border/70 overflow-hidden shadow-xs">
          <CardHeader className="py-3 px-5 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Jami: {totalItems} ta vakansiya
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Yuklanmoqda...
              </div>
            ) : paginatedItems.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Qidiruv bo'yicha vakansiya topilmadi" : "Hozircha vakansiyalar mavjud emas"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID KO'RINIShI */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {paginatedItems.map((vacancy, index) => {
                  const rowNum = startIndex + index + 1;
                  return (
                    <div
                      key={vacancy.id || index}
                      className="rounded-xl border border-border/70 bg-card p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-xs transition-all duration-200"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => setPreviewVacancy(vacancy)}
                            className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer line-clamp-1 leading-snug"
                          >
                            {vacancy.title}
                          </h3>
                          <span className="text-[11px] font-mono text-muted-foreground/70 shrink-0">
                            #{rowNum}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {vacancy.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {vacancy.created_at
                            ? new Date(vacancy.created_at).toLocaleDateString("uz-UZ", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })
                            : "—"}
                        </span>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewVacancy(vacancy)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Ko'rish"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(vacancy)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Tahrirlash"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingVacancy(vacancy)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* JADVAL (TABLE) KO'RINIShI */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead className="w-[35%]">Sarlavha</TableHead>
                      <TableHead>Tavsif</TableHead>
                      <TableHead className="w-32">Sana</TableHead>
                      <TableHead className="w-24 text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((vacancy, index) => {
                      const rowNum = startIndex + index + 1;

                      return (
                        <TableRow key={vacancy.id || index} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="text-center text-xs text-muted-foreground font-mono">
                            {rowNum}
                          </TableCell>
                          <TableCell>
                            <div
                              onClick={() => setPreviewVacancy(vacancy)}
                              className="font-medium text-foreground hover:text-primary cursor-pointer line-clamp-1"
                            >
                              {vacancy.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">
                              {vacancy.description}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {vacancy.created_at
                              ? new Date(vacancy.created_at).toLocaleDateString("uz-UZ", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewVacancy(vacancy)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Ko'rish"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(vacancy)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Tahrirlash"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingVacancy(vacancy)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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

      {/* Yaratish / Tahrirlash Dialogi */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVacancy ? "Vakansiyani tahrirlash" : "Yangi vakansiya yaratish"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">
                Vakansiya sarlavhasi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Masalan: Dasturlash o'qituvchisi"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Tavsif va talablar <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                rows={6}
                placeholder="Vakansiya haqida batafsil ma'lumot..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Saqlanmoqda..."
                  : editingVacancy
                  ? "O'zgarishlarni saqlash"
                  : "E'lon qilish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Batafsil ko'rish dialogi */}
      {previewVacancy && (
        <Dialog open={true} onOpenChange={() => setPreviewVacancy(null)}>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg leading-snug">
                {previewVacancy.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground bg-muted/20 p-4 rounded-lg border">
                {previewVacancy.description}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between border-t pt-2">
                <span>Yaratilgan sana:</span>
                <span className="font-medium text-foreground">
                  {previewVacancy.created_at
                    ? new Date(previewVacancy.created_at).toLocaleDateString("uz-UZ")
                    : "—"}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewVacancy(null)}>
                Yopish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* O'chirishni tasdiqlash */}
      <AlertDialog open={!!deletingVacancy} onOpenChange={(open) => !open && setDeletingVacancy(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Vakansiyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham <strong>{deletingVacancy?.title}</strong> vakansiyasini o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingVacancy?.id && deleteMutation.mutate(deletingVacancy.id)}
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
