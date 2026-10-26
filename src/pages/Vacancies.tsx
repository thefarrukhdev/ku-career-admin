"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { vacancyService, Vacancy } from "@/services/vacancyService";
import { subscriptionService } from "@/services/subscriptionService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  MapPin,
  Briefcase,
  Calendar,
  Eye,
  ExternalLink,
  LayoutGrid,
  List,
  X,
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FilterX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ============================================================================
// VALIDATION SCHEMA (ZOD)
// ============================================================================
const vacancySchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: z.string().min(5, "Tavsif kiritilishi shart"),
  location: z.string().optional().default("Kokand University"),
  experience: z.string().optional().default("Talab etilmaydi"),
  requirement: z.string().optional().default(""),
  is_active: z.boolean().default(true),
});

type VacancyFormData = z.infer<typeof vacancySchema>;

type StatusFilter = "all" | "active" | "inactive";
type ViewMode = "grid" | "table";

const ITEMS_PER_PAGE = 10;

const EXPERIENCE_OPTIONS = [
  "Talab etilmaydi",
  "1 yilgacha",
  "1-2 yil",
  "3-5 yil",
  "5+ yil",
];

const LOCATION_PRESETS = [
  "Kokand University",
  "Qo'qon shahar",
  "Farg'ona",
  "Masofaviy (Remote)",
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "-";
  }
}

export default function Vacancies() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [previewVacancy, setPreviewVacancy] = useState<Vacancy | null>(null);
  const [deletingVacancy, setDeletingVacancy] = useState<Vacancy | null>(null);

  // ==========================================================================
  // DATA FETCHING (Vacancies & Subscriptions)
  // ==========================================================================
  const {
    data: vacancies = [],
    isLoading: isLoadingVacancies,
    isError: isErrorVacancies,
  } = useQuery({
    queryKey: ["vacancies"],
    queryFn: () => vacancyService.getVacancies(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionService.getSubscriptions(),
  });

  // Calculate candidate count map for O(1) lookups
  const candidateCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const vId = sub.vacansy_id || sub.vacancy_id;
      if (vId) {
        const key = String(vId);
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [subscriptions]);

  const getCandidateCount = (vacancyId?: string): number => {
    if (!vacancyId) return 0;
    return candidateCountMap[String(vacancyId)] || 0;
  };

  // ==========================================================================
  // FORM SETUP
  // ==========================================================================
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<VacancyFormData>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      description: "",
      location: "Kokand University",
      experience: "Talab etilmaydi",
      requirement: "",
      is_active: true,
    },
  });

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingVacancy(null);
    reset({
      title: "",
      description: "",
      location: "Kokand University",
      experience: "Talab etilmaydi",
      requirement: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy);
    reset({
      title: vacancy.title || "",
      description: vacancy.description || "",
      location: vacancy.location || "Kokand University",
      experience: vacancy.experience || "Talab etilmaydi",
      requirement: vacancy.requirement || "",
      is_active: vacancy.is_active !== false,
    });
    setIsDialogOpen(true);
  };

  // ==========================================================================
  // MUTATIONS (Create, Update, Toggle, Delete)
  // ==========================================================================
  const createMutation = useMutation({
    mutationFn: (data: VacancyFormData) => vacancyService.createVacancy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast({
        title: "Vakansiya yaratildi",
        description: "Yangi ish o'rni muvaffaqiyatli e'lon qilindi.",
      });
      setIsDialogOpen(false);
      reset();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Vakansiya yaratishda xatolik yuz berdi. Qaytadan urinib ko'ring.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VacancyFormData> }) =>
      vacancyService.updateVacancy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast({
        title: "Vakansiya yangilandi",
        description: "Ma'lumotlar muvaffaqiyatli saqlandi.",
      });
      setIsDialogOpen(false);
      setEditingVacancy(null);
      reset();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Vakansiyani yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      vacancyService.toggleVacancyStatus(id, is_active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast({
        title: variables.is_active ? "Vakansiya faollashtirildi" : "Vakansiya to'xtatildi",
        description: variables.is_active
          ? "Ushbu vakansiya nomzodlar uchun ochiq."
          : "Ushbu vakansiya nofaol holatga o'tkazildi.",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Holatni o'zgartirishda xatolik yuz berdi.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vacancyService.deleteVacancy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast({
        title: "Vakansiya o'chirildi",
        description: "Ish o'rni muvaffaqiyatli o'chirildi.",
      });
      setDeletingVacancy(null);
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "O'chirishda xatolik yuz berdi.",
        variant: "destructive",
      });
      setDeletingVacancy(null);
    },
  });

  const onSubmit = (data: VacancyFormData) => {
    if (editingVacancy?.id) {
      updateMutation.mutate({ id: editingVacancy.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // ==========================================================================
  // METRICS / KPI SUMMARY
  // ==========================================================================
  const metrics = useMemo(() => {
    const total = vacancies.length;
    const active = vacancies.filter((v) => v.is_active !== false && !v.is_deleted).length;
    const inactive = total - active;
    const totalCandidates = subscriptions.length;
    return { total, active, inactive, totalCandidates };
  }, [vacancies, subscriptions]);

  // ==========================================================================
  // FILTERING LOGIC
  // ==========================================================================
  const filteredVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      // 1. Search term match (title, description, location, requirement)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = v.title.toLowerCase().includes(q);
        const matchesDesc = v.description.toLowerCase().includes(q);
        const matchesLoc = v.location?.toLowerCase().includes(q);
        const matchesReq = v.requirement?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesReq) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter === "active") {
        if (v.is_active === false || v.is_deleted) return false;
      } else if (statusFilter === "inactive") {
        if (v.is_active !== false && !v.is_deleted) return false;
      }

      // 3. Experience filter
      if (experienceFilter !== "all") {
        if ((v.experience || "Talab etilmaydi") !== experienceFilter) {
          return false;
        }
      }

      return true;
    });
  }, [vacancies, searchTerm, statusFilter, experienceFilter]);

  // ==========================================================================
  // PAGINATION LOGIC
  // ==========================================================================
  const totalItems = filteredVacancies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedVacancies = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredVacancies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredVacancies, validCurrentPage]);

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(validCurrentPage * ITEMS_PER_PAGE, totalItems);

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }
    if (validCurrentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "ellipsis",
      validCurrentPage - 1,
      validCurrentPage,
      validCurrentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" || statusFilter !== "all" || experienceFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setExperienceFilter("all");
    setCurrentPage(1);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ================================================================= */}
        {/* PAGE HEADER                                                       */}
        {/* ================================================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vakansiyalar</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Kokand University ish o'rinlarini yaratish, tahrirlash va arizalar oqimini nazorat qilish
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button onClick={handleOpenCreate} className="w-full sm:w-auto gap-2 shadow-xs">
              <Plus className="h-4 w-4" />
              Yangi vakansiya qo'shish
            </Button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KPI / STATS SUMMARY CARDS                                         */}
        {/* ================================================================= */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Jami vakansiyalar
              </CardTitle>
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{metrics.total}</div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">
                Barcha e'lon qilingan lavozimlar
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Faol ish o'rinlari
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.active}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">
                Arizalar qabul qilinmoqda
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Yopilgan / Nofaol
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                {metrics.inactive}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">
                Vaqtincha to'xtatilgan
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/subscriptions")}
            className="border-border/60 shadow-xs hover:border-primary/50 cursor-pointer transition-colors group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Jami nomzodlar
              </CardTitle>
              <Users className="h-4 w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-primary flex items-center justify-between">
                <span>{metrics.totalCandidates}</span>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">
                Barcha arizalarni ko'rish &rarr;
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================= */}
        {/* SEARCH, FILTER TABS & VIEW TOGGLE                                 */}
        {/* ================================================================= */}
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Vakansiya sarlavhasi, talab yoki tavsif bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-9 text-xs sm:text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label="Qidiruvni tozalash"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Experience Select Filter & View Switcher */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full lg:w-auto">
              <Select
                value={experienceFilter}
                onValueChange={(val) => {
                  setExperienceFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[190px] text-xs">
                  <SelectValue placeholder="Tajriba talabi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha tajribalar</SelectItem>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Switcher */}
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  className="h-8 px-2.5"
                  onClick={() => setViewMode("grid")}
                  title="Kartochkalar ko'rinishi"
                  aria-label="Kartochkalar ko'rinishi"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  className="h-8 px-2.5"
                  onClick={() => setViewMode("table")}
                  title="Jadval ko'rinishi"
                  aria-label="Jadval ko'rinishi"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Status Tabs and Quick Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
            <Tabs
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as StatusFilter);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-9 w-full sm:w-auto grid grid-cols-3 sm:flex">
                <TabsTrigger value="all" className="text-xs px-2 sm:px-3">
                  Barchasi ({vacancies.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs px-2 sm:px-3">
                  Faol <span className="hidden sm:inline">ish o'rinlari</span> ({metrics.active})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="text-xs px-2 sm:px-3">
                  Nofaol <span className="hidden sm:inline">/ Yopilgan</span> ({metrics.inactive})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5 self-start sm:self-auto"
              >
                <FilterX className="h-3.5 w-3.5" />
                Filtrlarni tozalash
              </Button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* VACANCIES LIST (GRID OR TABLE)                                    */}
        {/* ================================================================= */}
        {isLoadingVacancies ? (
          /* Loading Skeleton */
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border/60">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-7 w-28 rounded-full" />
                </CardContent>
                <CardFooter className="flex justify-between pt-3 border-t">
                  <Skeleton className="h-8 w-20" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isErrorVacancies ? (
          /* Error State */
          <Card className="border-destructive/30 bg-destructive/5 py-12 text-center">
            <CardContent className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Vakansiyalarni yuklashda xatolik yuz berdi</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Server bilan bog'lanishda muammo yuz berdi. Iltimos sahifani yangilang yoki internet aloqasini tekshiring.
              </p>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["vacancies"] })}
              >
                Qayta yuklash
              </Button>
            </CardContent>
          </Card>
        ) : filteredVacancies.length === 0 ? (
          /* Empty State */
          <Card className="border-dashed py-14 text-center">
            <CardContent className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {hasActiveFilters
                    ? "Mos keladigan vakansiyalar topilmadi"
                    : "Hozircha birorta ham vakansiya mavjud emas"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {hasActiveFilters
                    ? "Qidiruv parametrlarini o'zgartirib ko'ring yoki filtrlarni bekor qiling."
                    : "Kokand University uchun yangi ish o'rni e'lon qilish uchun quyidagi tugmani bosing."}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <FilterX className="h-4 w-4" />
                  Filtrlarni tozalash
                </Button>
              ) : (
                <Button onClick={handleOpenCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Vakansiya qo'shish
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          /* Card Grid View */
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {paginatedVacancies.map((vacancy) => {
              const candidateCount = getCandidateCount(vacancy.id);
              const isActive = vacancy.is_active !== false && !vacancy.is_deleted;

              return (
                <Card
                  key={vacancy.id}
                  className="flex flex-col justify-between border-border/70 hover:shadow-md transition-all duration-200"
                >
                  <CardHeader className="space-y-3 pb-3">
                    {/* Top Status & Quick Toggle */}
                    <div className="flex items-center justify-between">
                      {isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs py-0.5 font-medium"
                        >
                          Faol
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-muted/50 text-muted-foreground text-xs py-0.5 font-medium"
                        >
                          Nofaol
                        </Badge>
                      )}

                      <div className="flex items-center gap-2" title="Tezkor status almashtirish">
                        <Switch
                          checked={isActive}
                          disabled={toggleStatusMutation.isPending}
                          onCheckedChange={(checked) => {
                            if (vacancy.id) {
                              toggleStatusMutation.mutate({
                                id: vacancy.id,
                                is_active: checked,
                              });
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Title & Metadata */}
                    <div>
                      <CardTitle
                        className="text-base sm:text-lg font-bold leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => setPreviewVacancy(vacancy)}
                      >
                        {vacancy.title}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-2">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {vacancy.location || "Kokand University"}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span>{vacancy.experience || "Talab etilmaydi"}</span>
                        </span>
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-4">
                    {/* Description excerpt */}
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {vacancy.description}
                    </p>

                    {/* Candidate Count Badge (Clickable ATS Link) */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (vacancy.id) {
                            navigate(`/subscriptions?vacancyId=${vacancy.id}`);
                          }
                        }}
                        className={`h-7 text-xs font-semibold gap-1.5 px-2.5 transition-colors ${
                          candidateCount > 0
                            ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/15"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Ushbu vakansiyaga topshirilgan arizalarni ko'rish"
                      >
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>{candidateCount} ta nomzod</span>
                        <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                      </Button>

                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(vacancy.created_at)}
                      </span>
                    </div>
                  </CardContent>

                  {/* Actions Footer */}
                  <CardFooter className="flex items-center justify-between pt-3 border-t bg-muted/10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 gap-1.5 px-2"
                      onClick={() => setPreviewVacancy(vacancy)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Batafsil
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs gap-1"
                        onClick={() => handleOpenEdit(vacancy)}
                        title="Tahrirlash"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Tahrirlash</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingVacancy(vacancy)}
                        title="O'chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Table View Mode with horizontal scroll container */
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%] min-w-[200px]">Vakansiya sarlavhasi</TableHead>
                    <TableHead className="min-w-[130px]">Joylashuv</TableHead>
                    <TableHead className="min-w-[110px]">Tajriba</TableHead>
                    <TableHead className="min-w-[100px]">Holati</TableHead>
                    <TableHead className="min-w-[100px]">Nomzodlar</TableHead>
                    <TableHead className="min-w-[110px]">Yaratilgan</TableHead>
                    <TableHead className="min-w-[110px] text-right">Harakatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVacancies.map((vacancy) => {
                    const candidateCount = getCandidateCount(vacancy.id);
                    const isActive = vacancy.is_active !== false && !vacancy.is_deleted;

                    return (
                      <TableRow key={vacancy.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div
                            className="font-semibold text-sm hover:text-primary cursor-pointer line-clamp-1"
                            onClick={() => setPreviewVacancy(vacancy)}
                          >
                            {vacancy.title}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {vacancy.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary/70 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {vacancy.location || "Kokand University"}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="font-normal text-[11px]">
                            {vacancy.experience || "Talab etilmaydi"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isActive}
                              disabled={toggleStatusMutation.isPending}
                              onCheckedChange={(checked) => {
                                if (vacancy.id) {
                                  toggleStatusMutation.mutate({
                                    id: vacancy.id,
                                    is_active: checked,
                                  });
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {isActive ? "Faol" : "Nofaol"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (vacancy.id) {
                                navigate(`/subscriptions?vacancyId=${vacancy.id}`);
                              }
                            }}
                            className={`h-7 text-xs font-semibold gap-1.5 px-2 ${
                              candidateCount > 0
                                ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/15"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>{candidateCount}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(vacancy.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setPreviewVacancy(vacancy)}
                              title="Batafsil ko'rish"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEdit(vacancy)}
                              title="Tahrirlash"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeletingVacancy(vacancy)}
                              title="O'chirish"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PAGINATION CONTROLS                                               */}
        {/* ================================================================= */}
        {!isLoadingVacancies && !isErrorVacancies && filteredVacancies.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            {/* Results Counter */}
            <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
              Jami <span className="font-semibold text-foreground">{totalItems}</span> ta vakansiyadan{" "}
              <span className="font-semibold text-foreground">
                {startIndex}-{endIndex}
              </span>{" "}
              ko'rsatilmoqda
            </p>

            {/* Pagination Buttons (Oldingi / Sahifalar / Keyingi) */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs gap-1"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={validCurrentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Oldingi</span>
                </Button>

                {getPageNumbers().map((page, idx) => {
                  if (page === "ellipsis") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="h-8 w-6 sm:w-8 flex items-center justify-center text-xs text-muted-foreground"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = validCurrentPage === page;
                  return (
                    <Button
                      type="button"
                      key={page}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs font-medium ${
                        isCurrent ? "pointer-events-none shadow-xs" : ""
                      }`}
                      onClick={() => setCurrentPage(page as number)}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs gap-1"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={validCurrentPage >= totalPages}
                >
                  <span>Keyingi</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* CREATE / EDIT DIALOG                                              */}
        {/* ================================================================= */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingVacancy(null);
              reset();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {editingVacancy ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {editingVacancy ? "Vakansiyani tahrirlash" : "Yangi vakansiya yaratish"}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Nomzodlar uchun ish o'rni talablari va tavsiflarini to'ldiring
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              {/* Sarlavha (Title) */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Lavozim sarlavhasi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Masalan: Ingliz tili kafedrasi o'qituvchisi"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs font-medium text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Grid 1 ustun (mobilda), 2 ustun (planshet/desktopda): Joylashuv & Tajriba */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Joylashuv (Location) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location" className="text-sm font-semibold">
                      Joylashuv
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Standart: Kokand University</span>
                  </div>
                  <Input
                    id="location"
                    placeholder="Masalan: Kokand University, Qo'qon"
                    {...register("location")}
                  />
                  {errors.location && (
                    <p className="text-xs font-medium text-destructive">{errors.location.message}</p>
                  )}
                  {/* Quick Preset Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {LOCATION_PRESETS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setValue("location", loc, { shouldValidate: true })}
                        className="text-[10px] px-2 py-0.5 rounded-md border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tajriba (Experience) */}
                <div className="space-y-1.5">
                  <Label htmlFor="experience" className="text-sm font-semibold">
                    Talab qilinadigan tajriba
                  </Label>
                  <Controller
                    name="experience"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || "Talab etilmaydi"} onValueChange={field.onChange}>
                        <SelectTrigger id="experience">
                          <SelectValue placeholder="Tajriba darajasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.experience && (
                    <p className="text-xs font-medium text-destructive">{errors.experience.message}</p>
                  )}
                </div>
              </div>

              {/* Holati (is_active) Switch */}
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 shadow-xs">
                    <div className="space-y-0.5 pr-2">
                      <Label htmlFor="form-is-active" className="text-sm font-semibold cursor-pointer">
                        Vakansiya holati
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {field.value
                          ? "Faol — vakansiya saytda ochiq ko'rinadi va nomzodlar ariza topshira oladi"
                          : "Nofaol — qabul to'xtatilgan yoki vakansiya vaqtincha yopilgan"}
                      </p>
                    </div>
                    <Switch
                      id="form-is-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* Talablar (Requirement) */}
              <div className="space-y-1.5">
                <Label htmlFor="requirement" className="text-sm font-semibold">
                  Nomzodga qo'yiladigan talablar va ko'nikmalar
                </Label>
                <Textarea
                  id="requirement"
                  placeholder="Nomzod bilishi kerak bo'lgan texnologiyalar, diplom darajasi, chet tili sertifikatlari (IELTS 7.0+), ish ko'nikmalari..."
                  rows={3}
                  {...register("requirement")}
                />
                {errors.requirement && (
                  <p className="text-xs font-medium text-destructive">{errors.requirement.message}</p>
                )}
              </div>

              {/* To'liq tavsif (Description) */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-semibold">
                  To'liq tavsif va vazifalar <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Lavozim majburiyatlari, dars soatlari, talabalar bilan ishlash, universitet taklif qilayotgan sharoitlar va imtiyozlar..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
                )}
              </div>

              <DialogFooter className="pt-3 gap-2 flex-col-reverse sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                  {isSaving
                    ? "Saqlanmoqda..."
                    : editingVacancy
                    ? "O'zgarishlarni saqlash"
                    : "Vakansiyani e'lon qilish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================================================================= */}
        {/* PREVIEW / DETAILS DIALOG                                          */}
        {/* ================================================================= */}
        {previewVacancy && (
          <Dialog open={true} onOpenChange={() => setPreviewVacancy(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                  <div className="flex items-center gap-2">
                    {previewVacancy.is_active !== false && !previewVacancy.is_deleted ? (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
                        Faol
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs font-medium">
                        Nofaol
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ID: {previewVacancy.id || "-"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => {
                      if (previewVacancy.id) {
                        navigate(`/subscriptions?vacancyId=${previewVacancy.id}`);
                      }
                    }}
                  >
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{getCandidateCount(previewVacancy.id)} ta nomzod</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-bold pt-2">
                  {previewVacancy.title}
                </DialogTitle>

                <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs pt-1">
                  <span className="flex items-center gap-1 text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{previewVacancy.location || "Kokand University"}</span>
                  </span>
                  <span className="flex items-center gap-1 text-foreground">
                    <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{previewVacancy.experience || "Talab etilmaydi"}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    E'lon qilingan: {formatDate(previewVacancy.created_at)}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Requirements block */}
                {previewVacancy.requirement && (
                  <div className="rounded-lg border bg-muted/20 p-3 sm:p-4 space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                      <FileText className="h-4 w-4 shrink-0" />
                      Nomzodga qo'yiladigan talablar:
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                      {previewVacancy.requirement}
                    </p>
                  </div>
                )}

                {/* Description block */}
                <div className="rounded-lg border p-3 sm:p-4 space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                    <Building2 className="h-4 w-4 shrink-0" />
                    Lavozim tavsifi va universitet sharoitlari:
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {previewVacancy.description}
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-3 gap-2 flex-col-reverse sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setPreviewVacancy(null)}
                >
                  Yopish
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto gap-1.5"
                  onClick={() => {
                    const target = previewVacancy;
                    setPreviewVacancy(null);
                    handleOpenEdit(target);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Tahrirlash
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ================================================================= */}
        {/* DELETE CONFIRMATION ALERT DIALOG                                  */}
        {/* ================================================================= */}
        <AlertDialog
          open={!!deletingVacancy}
          onOpenChange={(open) => !open && setDeletingVacancy(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5 shrink-0" />
                Vakansiyani o'chirishni tasdiqlaysizmi?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm pt-2">
                Siz haqiqatan ham{" "}
                <strong className="text-foreground">{deletingVacancy?.title}</strong>{" "}
                vakansiyasini o'chirmoqchimisiz?
                <br />
                <span className="text-xs text-muted-foreground mt-1 inline-block">
                  Agar ushbu lavozimga topshirilgan arizalar bo'lsa, ularni ko'rishda davom etishingiz mumkin.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-3 gap-2 flex-col-reverse sm:flex-row sm:justify-end">
              <AlertDialogCancel disabled={deleteMutation.isPending} className="w-full sm:w-auto">
                Bekor qilish
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deletingVacancy?.id) {
                    deleteMutation.mutate(deletingVacancy.id);
                  }
                }}
              >
                {deleteMutation.isPending ? "O'chirilmoqda..." : "Ha, o'chirilsin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
