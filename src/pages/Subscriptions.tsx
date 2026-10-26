"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionService,
  Subscription,
  CandidateStatus,
} from "@/services/subscriptionService";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Check,
  NotebookPen,
  FileSpreadsheet,
  AlertCircle,
  X,
  User,
  GraduationCap,
} from "lucide-react";

// Status configuration for ATS Pipeline
interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: typeof Sparkles;
}

const STATUS_CONFIG: Record<CandidateStatus, StatusMeta> = {
  new: {
    label: "Yangi",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
    icon: Sparkles,
  },
  reviewing: {
    label: "Ko'rib chiqilmoqda",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
    icon: Clock,
  },
  interview: {
    label: "Suhbatda",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
    icon: MessageSquare,
  },
  accepted: {
    label: "Qabul qilindi",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rad etildi",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
    icon: XCircle,
  },
};

const STATUS_KEYS: CandidateStatus[] = [
  "new",
  "reviewing",
  "interview",
  "accepted",
  "rejected",
];

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function Subscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const vacancyIdParam = searchParams.get("vacancyId");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVacancy, setSelectedVacancy] = useState(vacancyIdParam || "all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Sync selected vacancy when query parameter changes
  useEffect(() => {
    if (vacancyIdParam) {
      setSelectedVacancy(vacancyIdParam);
    }
  }, [vacancyIdParam]);

  // Dialogs state
  const [previewResumeSub, setPreviewResumeSub] = useState<Subscription | null>(null);
  const [profileSub, setProfileSub] = useState<Subscription | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  // Sync note draft whenever profile dialog opens
  useEffect(() => {
    if (profileSub) {
      setNoteDraft(profileSub.notes || "");
    }
  }, [profileSub]);

  // Fetch Subscriptions
  const {
    data: subscriptions = [],
    isLoading: isLoadingSubscriptions,
    isError: isErrorSubscriptions,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: subscriptionService.getSubscriptions,
  });

  // Fetch Vacancies to match vacancy titles
  const { data: vacancies = [], isLoading: isLoadingVacancies } = useQuery({
    queryKey: ["vacancies"],
    queryFn: vacancyService.getVacancies,
  });

  // Map vacancies for fast O(1) title lookup
  const vacanciesMap = useMemo(() => {
    const map = new Map<string, Vacancy>();
    vacancies.forEach((v) => {
      if (v.id) map.set(String(v.id), v);
    });
    return map;
  }, [vacancies]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "Arizani o'chirish muvaffaqiyatli",
        description: `${deleteTarget?.fullName || "Nomzod"} arizasi bazadan o'chirildi.`,
      });
      setDeleteTarget(null);
      if (profileSub?.id === deleteTarget?.id) {
        setProfileSub(null);
      }
    },
    onError: (err: unknown) => {
      console.error("Delete error:", err);
      toast({
        title: "O'chirishda xatolik yuz berdi",
        description: "Server bilan bog'lanishda xato. Qaytadan urinib ko'ring.",
        variant: "destructive",
      });
      setDeleteTarget(null);
    },
  });

  // Update Status handler
  const handleUpdateStatus = (
    candidateId: string,
    newStatus: CandidateStatus,
    candidateName: string
  ) => {
    // Persist in localStorage via service
    subscriptionService.setCandidateStatus(candidateId, newStatus);

    // Optimistically update React Query cache
    queryClient.setQueryData<Subscription[]>(["subscriptions"], (old) => {
      if (!old) return [];
      return old.map((sub) =>
        sub.id === candidateId ? { ...sub, status: newStatus } : sub
      );
    });

    // Update active profile modal if open
    setProfileSub((prev) =>
      prev && prev.id === candidateId ? { ...prev, status: newStatus } : prev
    );

    toast({
      title: "Status yangilandi",
      description: `${candidateName} nomzod holati "${STATUS_CONFIG[newStatus].label}" ga o'zgartirildi.`,
    });
  };

  // Save Note handler
  const handleSaveNote = () => {
    if (!profileSub?.id) return;
    setIsSavingNote(true);

    try {
      const trimmedNote = noteDraft.trim();
      subscriptionService.setCandidateNotes(profileSub.id, trimmedNote);

      queryClient.setQueryData<Subscription[]>(["subscriptions"], (old) => {
        if (!old) return [];
        return old.map((sub) =>
          sub.id === profileSub.id ? { ...sub, notes: trimmedNote } : sub
        );
      });

      setProfileSub((prev) => (prev ? { ...prev, notes: trimmedNote } : null));

      toast({
        title: "Eslatma saqlandi",
        description: "HR izohi nomzod profiliga muvaffaqiyatli biriktirildi.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Eslatmani saqlashda xato",
        variant: "destructive",
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Status counts for pipeline summary
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: subscriptions.length,
      new: 0,
      reviewing: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
    };
    subscriptions.forEach((sub) => {
      const st = sub.status || "new";
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });
    return counts;
  }, [subscriptions]);

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return subscriptions.filter((sub) => {
      // 1. Search Query Filter
      if (q) {
        const nameMatch = sub.fullName?.toLowerCase().includes(q);
        const phoneMatch = sub.phone?.toLowerCase().includes(q);
        const majorMatch = sub.major?.toLowerCase().includes(q);
        const emailMatch = sub.email?.toLowerCase().includes(q);
        const notesMatch = sub.notes?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !majorMatch && !emailMatch && !notesMatch) {
          return false;
        }
      }

      // 2. Vacancy Filter
      if (selectedVacancy !== "all") {
        if (String(sub.vacansy_id || "") !== selectedVacancy) {
          return false;
        }
      }

      // 3. Status Filter
      if (selectedStatus !== "all") {
        const currentStatus = sub.status || "new";
        if (currentStatus !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [subscriptions, searchQuery, selectedVacancy, selectedStatus]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedVacancy("all");
    setSelectedStatus("all");
  };

  const hasActiveFilters =
    Boolean(searchQuery) || selectedVacancy !== "all" || selectedStatus !== "all";

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    if (!filteredSubscriptions.length) {
      toast({
        title: "Eksport uchun ma'lumot yo'q",
        description: "Hozirgi filtrlarga mos arizalar topilmadi.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Ism-familiya",
      "Yoshi",
      "Jinsi",
      "Telefon raqami",
      "Email",
      "Mutaxassislik (Major)",
      "Topshirgan vakansiyasi",
      "Ariza holati (Status)",
      "HR Eslatmalari",
      "Rezyume (CV) havolasi",
      "Yuborilgan sana",
    ];

    const rows = filteredSubscriptions.map((sub) => {
      const vacTitle = sub.vacansy_id
        ? vacanciesMap.get(String(sub.vacansy_id))?.title || "Topilmadi"
        : "Umumiy ariza";
      const statusLabel = sub.status
        ? STATUS_CONFIG[sub.status]?.label || sub.status
        : "Yangi";
      const dateStr = sub.created_at ? formatDateTime(sub.created_at) : "";

      const values = [
        sub.fullName || "",
        sub.age || "",
        sub.gender || "",
        sub.phone || "",
        sub.email || "",
        sub.major || "",
        vacTitle,
        statusLabel,
        sub.notes || "",
        sub.resume_file || "",
        dateStr,
      ];

      return values
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(";");
    });

    const csvContent =
      "\uFEFF" + [headers.map((h) => `"${h}"`).join(";"), ...rows].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateFormatted = new Date().toISOString().slice(0, 10);
    link.download = `Arizalar_Nomzodlar_${dateFormatted}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Excel/CSV yuklab olindi",
      description: `${filteredSubscriptions.length} ta nomzod ma'lumotlari muvaffaqiyatli eksport qilindi.`,
    });
  };

  const isLoading = isLoadingSubscriptions || isLoadingVacancies;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title & Quick Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              Nomzodlar va Arizalar (ATS)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Universitet vakansiyalariga kelib tushgan barcha rezyumelar, nomzodlar quvuri (Pipeline) va eslatmalar boshqaruvi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isLoading || !filteredSubscriptions.length}
              className="gap-2 shadow-sm border-primary/20 hover:border-primary text-foreground"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel / CSV Eksport</span>
            </Button>
          </div>
        </div>

        {/* Pipeline KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card
            onClick={() => setSelectedStatus("all")}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-l-4 border-l-slate-400",
              selectedStatus === "all"
                ? "ring-2 ring-primary ring-offset-2 bg-accent/40"
                : "hover:bg-muted/30"
            )}
          >
            <CardContent className="p-3.5">
              <div className="text-xs font-medium text-muted-foreground">Barcha arizalar</div>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : statusCounts.all}
              </div>
            </CardContent>
          </Card>

          {STATUS_KEYS.map((key) => {
            const meta = STATUS_CONFIG[key];
            const Icon = meta.icon;
            const isSelected = selectedStatus === key;

            return (
              <Card
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-l-4",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 bg-accent/40"
                    : "hover:bg-muted/30",
                  key === "new" && "border-l-blue-500",
                  key === "reviewing" && "border-l-amber-500",
                  key === "interview" && "border-l-purple-500",
                  key === "accepted" && "border-l-emerald-500",
                  key === "rejected" && "border-l-rose-500"
                )}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span className="truncate">{meta.label}</span>
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <div className="text-2xl font-bold mt-1 text-foreground">
                    {isLoading ? <Skeleton className="h-7 w-10" /> : statusCounts[key] || 0}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ism, telefon, mutaxassislik, email yoki izoh bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Qidiruvni tozalash"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Vacancy Filter Select */}
              <div className="w-full lg:w-72">
                <Select value={selectedVacancy} onValueChange={setSelectedVacancy}>
                  <SelectTrigger className="w-full">
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Barcha vakansiyalar" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Barcha vakansiyalar ({vacancies.length})</SelectItem>
                    {vacancies.map((v) => (
                      <SelectItem key={v.id || v.title} value={String(v.id)}>
                        {v.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter Select (for quick dropdown switch) */}
              <div className="w-full lg:w-56">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Barcha statuslar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha statuslar ({statusCounts.all})</SelectItem>
                    {STATUS_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[key].dotClass)} />
                          <span>{STATUS_CONFIG[key].label} ({statusCounts[key] || 0})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Filtrlarni tozalash</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table Card */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="py-4 px-6 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <span>Nomzodlar ro'yxati</span>
              <Badge variant="secondary" className="font-semibold text-xs">
                {filteredSubscriptions.length} ta
              </Badge>
            </CardTitle>
            {hasActiveFilters && (
              <span className="text-xs text-muted-foreground">
                Jami {subscriptions.length} tadan filtrlangan
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-32 hidden md:block" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : isErrorSubscriptions ? (
              <div className="text-center py-12 px-4 space-y-3">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                <h3 className="font-semibold text-foreground text-lg">Arizalarni yuklashda xatolik</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Server bilan bog'lanishda muammo yuz berdi. Iltimos, internet aloqasini tekshiring yoki qayta urinib ko'ring.
                </p>
                <Button variant="outline" onClick={() => refetchSubscriptions()} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Qayta yuklash
                </Button>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground text-base">Hech qanday ariza topilmadi</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {hasActiveFilters
                      ? "Qidiruv yoki filtr mezonlariga mos keladigan nomzodlar mavjud emas."
                      : "Hozircha tizimga hech qanday ariza kelib tushmagan."}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="gap-2">
                    <RotateCcw className="w-3.5 h-3.5" /> Filtrlarni bekor qilish
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="w-[260px]">Nomzod</TableHead>
                      <TableHead className="w-[200px]">Aloqa</TableHead>
                      <TableHead className="w-[220px]">Vakansiya & Mutaxassislik</TableHead>
                      <TableHead className="w-[130px]">Rezyume (CV)</TableHead>
                      <TableHead className="w-[180px]">Status (Pipeline)</TableHead>
                      <TableHead className="w-[150px]">Yuborilgan sana</TableHead>
                      <TableHead className="w-[100px] text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub) => {
                      const vacancy = sub.vacansy_id
                        ? vacanciesMap.get(String(sub.vacansy_id))
                        : undefined;
                      const currentStatus: CandidateStatus = sub.status || "new";
                      const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.new;

                      return (
                        <TableRow key={sub.id || sub.phone} className="hover:bg-muted/30 transition-colors">
                          {/* Nomzod ustuni */}
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border shadow-xs shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {getInitials(sub.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setProfileSub(sub)}
                                  className="font-medium text-sm text-foreground hover:text-primary transition-colors text-left block truncate max-w-[190px]"
                                  title={sub.fullName}
                                >
                                  {sub.fullName}
                                </button>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  {sub.age && <span>{sub.age} yosh</span>}
                                  {sub.age && sub.gender && <span>•</span>}
                                  {sub.gender && <span>{sub.gender}</span>}
                                  {!sub.age && !sub.gender && <span className="opacity-70">Ma'lumot yo'q</span>}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Aloqa ustuni */}
                          <TableCell className="align-middle">
                            <div className="space-y-1 text-xs">
                              {sub.phone ? (
                                <a
                                  href={`tel:${sub.phone}`}
                                  className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-medium"
                                  title="Qo'ng'iroq qilish"
                                >
                                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <span>{sub.phone}</span>
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                              {sub.email ? (
                                <a
                                  href={`mailto:${sub.email}`}
                                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors truncate max-w-[170px]"
                                  title={`Xat yozish: ${sub.email}`}
                                >
                                  <Mail className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{sub.email}</span>
                                </a>
                              ) : null}
                            </div>
                          </TableCell>

                          {/* Vakansiya & Mutaxassislik */}
                          <TableCell className="align-middle">
                            <div className="space-y-1">
                              <div>
                                {vacancy ? (
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal bg-background/60 truncate max-w-[200px]"
                                    title={vacancy.title}
                                  >
                                    <Briefcase className="w-3 h-3 mr-1 text-primary shrink-0" />
                                    <span className="truncate">{vacancy.title}</span>
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs font-normal text-muted-foreground bg-muted/60"
                                  >
                                    Umumiy ariza
                                  </Badge>
                                )}
                              </div>
                              <div
                                className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]"
                                title={sub.major}
                              >
                                <GraduationCap className="w-3 h-3 shrink-0 opacity-70" />
                                <span className="truncate">{sub.major || "Ko'rsatilmagan"}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Rezyume (CV) */}
                          <TableCell className="align-middle">
                            {sub.resume_file ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewResumeSub(sub)}
                                className="h-8 gap-1.5 text-xs border-primary/30 hover:border-primary text-foreground shadow-xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                <span>CV ko'rish</span>
                              </Button>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-xs font-normal text-muted-foreground bg-muted/50"
                              >
                                Yuklanmagan
                              </Badge>
                            )}
                          </TableCell>

                          {/* Status (Pipeline) */}
                          <TableCell className="align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all shadow-xs",
                                    statusMeta.badgeClass
                                  )}
                                >
                                  <span className={cn("w-2 h-2 rounded-full", statusMeta.dotClass)} />
                                  <span>{statusMeta.label}</span>
                                  <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                  Statusni o'zgartirish
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {STATUS_KEYS.map((key) => {
                                  const itemMeta = STATUS_CONFIG[key];
                                  const isCurrent = currentStatus === key;
                                  return (
                                    <DropdownMenuItem
                                      key={key}
                                      onClick={() =>
                                        sub.id &&
                                        handleUpdateStatus(sub.id, key, sub.fullName)
                                      }
                                      className="flex items-center gap-2 text-xs cursor-pointer"
                                    >
                                      <span
                                        className={cn("w-2 h-2 rounded-full", itemMeta.dotClass)}
                                      />
                                      <span className="flex-1">{itemMeta.label}</span>
                                      {isCurrent && (
                                        <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                                      )}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>

                          {/* Yuborilgan sana */}
                          <TableCell className="align-middle text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 opacity-60 shrink-0" />
                              <span>{formatDateTime(sub.created_at)}</span>
                            </div>
                          </TableCell>

                          {/* Amallar */}
                          <TableCell className="align-middle text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setProfileSub(sub)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Nomzod profili va eslatmalar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(sub)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                title="Arizani o'chirish"
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
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* DIALOG 1: REZYUME (CV) PREVIEW MODAL                         */}
      {/* ============================================================ */}
      {previewResumeSub && (
        <Dialog open={true} onOpenChange={() => setPreviewResumeSub(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
              <div>
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {previewResumeSub.fullName} — Rezyume (CV)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {previewResumeSub.major} • {previewResumeSub.phone}
                </DialogDescription>
              </div>

              {previewResumeSub.resume_file && (
                <div className="flex items-center gap-2 mr-6">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-1.5 text-xs h-8"
                  >
                    <a
                      href={previewResumeSub.resume_file}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Yangi oynada ochish
                    </a>
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="gap-1.5 text-xs h-8"
                  >
                    <a
                      href={previewResumeSub.resume_file}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Yuklab olish
                    </a>
                  </Button>
                </div>
              )}
            </DialogHeader>

            <div className="flex-1 min-h-[500px] mt-4 relative bg-muted/20 rounded-lg overflow-hidden border">
              {previewResumeSub.resume_file ? (
                <iframe
                  src={previewResumeSub.resume_file}
                  title={`${previewResumeSub.fullName} CV`}
                  className="w-full h-full min-h-[500px] border-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
                  <FileText className="w-12 h-12 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">Rezyume fayli biriktirilmagan</p>
                  <p className="text-xs text-muted-foreground">Ushbu nomzod ariza topshirishda CV yuklamagan.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ============================================================ */}
      {/* DIALOG 2: NOMZOD TO'LIQ PROFILI VA HR ESLATMALARI            */}
      {/* ============================================================ */}
      {profileSub && (
        <Dialog open={true} onOpenChange={() => setProfileSub(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {getInitials(profileSub.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl font-bold text-foreground">
                      {profileSub.fullName}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>Ariza ID: {profileSub.id || "-"}</span>
                      <span>•</span>
                      <span>{formatDateTime(profileSub.created_at)}</span>
                    </DialogDescription>
                  </div>
                </div>

                {/* Status Switcher in Profile Header */}
                <div className="shrink-0">
                  <Select
                    value={profileSub.status || "new"}
                    onValueChange={(val) => {
                      if (profileSub.id) {
                        handleUpdateStatus(
                          profileSub.id,
                          val as CandidateStatus,
                          profileSub.fullName
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_KEYS.map((st) => (
                        <SelectItem key={st} value={st}>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                STATUS_CONFIG[st].dotClass
                              )}
                            />
                            <span>{STATUS_CONFIG[st].label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogHeader>

            {/* Candidate Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Telefon raqami
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {profileSub.phone ? (
                    <a
                      href={`tel:${profileSub.phone}`}
                      className="hover:underline text-primary"
                    >
                      {profileSub.phone}
                    </a>
                  ) : (
                    "Ko'rsatilmagan"
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Elektron pochta
                </div>
                <div className="text-sm font-semibold text-foreground truncate">
                  {profileSub.email ? (
                    <a
                      href={`mailto:${profileSub.email}`}
                      className="hover:underline text-primary truncate block"
                    >
                      {profileSub.email}
                    </a>
                  ) : (
                    "Ko'rsatilmagan"
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Topshirilgan vakansiya
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {profileSub.vacansy_id
                    ? vacanciesMap.get(String(profileSub.vacansy_id))?.title ||
                      "Umumiy ariza"
                    : "Umumiy ariza"}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" /> Mutaxassislik (Major)
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {profileSub.major || "Ko'rsatilmagan"}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-primary" /> Yoshi va Jinsi
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {profileSub.age ? `${profileSub.age} yosh` : "Yosh noma'lum"}
                  {profileSub.gender ? ` • ${profileSub.gender}` : ""}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-primary" /> Rezyume hujjati
                </div>
                <div>
                  {profileSub.resume_file ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewResumeSub(profileSub)}
                      className="h-7 text-xs gap-1.5 mt-0.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" /> Rezyumeni ko'rish
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Yuklanmagan</span>
                  )}
                </div>
              </div>
            </div>

            {/* HR Notes / Eslatmalar Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="hr-note-textarea"
                  className="text-sm font-semibold flex items-center gap-2 text-foreground"
                >
                  <NotebookPen className="w-4 h-4 text-primary" />
                  HR Eslatmalari va Izohlar
                </Label>
                <span className="text-xs text-muted-foreground">
                  Faqat HR xodimlari uchun ko'rinadi
                </span>
              </div>

              <Textarea
                id="hr-note-textarea"
                placeholder="Nomzod bo'yicha izoh yoki eslatma yozing (masalan: 1-bosqich suhbatdan o'tdi, B2 ingliz tili, kutilayotgan maosh $800, keyingi suhbat dushanba 11:00 da)..."
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
                className="w-full text-sm resize-none"
              />

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  size="sm"
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  {isSavingNote ? "Saqlanmoqda..." : "Eslatmani saqlash"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ============================================================ */}
      {/* DIALOG 3: ARIZANI O'CHIRISHNI TASDIQLASH (ALERT DIALOG)      */}
      {/* ============================================================ */}
      {deleteTarget && (
        <AlertDialog open={true} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Arizani o'chirishni tasdiqlaysizmi?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
                Siz haqiqatan ham nomzod{" "}
                <strong className="text-foreground">{deleteTarget.fullName}</strong>{" "}
                tomonidan yuborilgan arizani o'chirmoqchimisiz?
                <br />
                <span className="text-xs text-destructive mt-1 inline-block">
                  * Ushbu amalni bekor qilib bo'lmaydi.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel
                disabled={deleteMutation.status === "pending"}
                onClick={() => setDeleteTarget(null)}
              >
                Bekor qilish
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteMutation.status === "pending"}
                onClick={() => deleteMutation.mutate(deleteTarget.id!)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.status === "pending"
                  ? "O'chirilmoqda..."
                  : "Ha, o'chirilsin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </DashboardLayout>
  );
}
