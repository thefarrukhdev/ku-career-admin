"use client";

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscriptionService";
import { vacancyService } from "@/services/vacancyService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Phone,
  Inbox,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTH_NAMES = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
  "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"
];

export default function Dashboard() {
  // 1. Arizalar
  const { data: subscriptions = [], isLoading: isLoadingSubs } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionService.getSubscriptions(),
  });

  // 2. Vakansiyalar
  const { data: vacancies = [], isLoading: isLoadingVacs } = useQuery({
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

  // Oylik arizalar dinamikasi
  const monthlyChartData = useMemo(() => {
    const counts = new Array(12).fill(0);
    const now = new Date();
    const currentYear = now.getFullYear();

    subscriptions.forEach((sub) => {
      if (sub.created_at) {
        const d = new Date(sub.created_at);
        if (d.getFullYear() === currentYear) {
          counts[d.getMonth()]++;
        }
      }
    });

    return MONTH_NAMES.map((month, idx) => ({
      month,
      arizalar: counts[idx],
    }));
  }, [subscriptions]);

  // So'nggi 5 ta ariza
  const recentApplications = useMemo(() => {
    return [...subscriptions]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  const isLoading = isLoadingSubs || isLoadingVacs;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Sarlavha va tezkor tugmalar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Boshqaruv paneli
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Qo'qon Universiteti vakansiyalari va arizalarining umumiy holati
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/subscriptions">
                <Users className="w-4 h-4" />
                <span>Arizalarni ko'rish</span>
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/vacancies">
                <Plus className="w-4 h-4" />
                <span>Yangi vakansiya</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* 2 ta Asosiy KPI Kartochkasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Jami arizalar */}
          <Card className="border-border/70 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami arizalar
              </CardTitle>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {isLoading ? "—" : subscriptions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nomzodlar tomonidan yuborilgan barcha arizalar</span>
              </p>
            </CardContent>
          </Card>

          {/* Jami vakansiyalar */}
          <Card className="border-border/70 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mavjud vakansiyalar
              </CardTitle>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Briefcase className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {isLoading ? "—" : vacancies.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Saytda e'lon qilingan bo'sh ish o'rinlari
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Oylik arizalar grafigi */}
        <Card className="border-border/70 shadow-xs overflow-hidden">
          <CardHeader className="py-4 px-5 border-b bg-muted/20">
            <CardTitle className="text-sm font-medium">
              Arizalar dinamikasi (oylar kesimida)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-64 sm:h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorArizalar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9c1447" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9c1447" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="arizalar"
                    name="Arizalar soni"
                    stroke="#9c1447"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorArizalar)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* So'nggi arizalar */}
        <Card className="border-border/70 shadow-xs overflow-hidden">
          <CardHeader className="py-4 px-5 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              So'nggi kelib tushgan arizalar
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
              <Link to="/subscriptions">
                <span>Barchasini ko'rish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentApplications.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-1">
                <Inbox className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p>Hozircha arizalar kelib tushmagan</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentApplications.map((sub, idx) => {
                  const vacTitle = sub.vacansy_id
                    ? vacanciesMap.get(String(sub.vacansy_id)) || "Umumiy"
                    : "Umumiy";

                  return (
                    <div
                      key={sub.id || idx}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {sub.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" />
                            {sub.phone}
                          </span>
                          {sub.major && <span>• {sub.major}</span>}
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between items-center text-xs text-muted-foreground shrink-0 pt-1 sm:pt-0">
                        <span className="font-medium text-foreground/80">
                          {vacTitle}
                        </span>
                        <span>
                          {sub.created_at
                            ? new Date(sub.created_at).toLocaleDateString("uz-UZ", {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
