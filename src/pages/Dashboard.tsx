"use client";

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Briefcase,
  Users,
  TrendingUp,
  Calendar,
  PlusCircle,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { vacancyService } from "@/services/vacancyService";
import { subscriptionService } from "@/services/subscriptionService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

const MONTH_NAMES_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

export default function Dashboard() {
  const { isSuperAdmin } = useAuth();

  const { data: vacancies = [], isLoading: isLoadingVacancies } = useQuery({
    queryKey: ["vacancies"],
    queryFn: vacancyService.getVacancies,
  });

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: subscriptionService.getSubscriptions,
  });

  const safeVacancies = useMemo(
    () => (Array.isArray(vacancies) ? vacancies : []),
    [vacancies]
  );
  const safeSubscriptions = useMemo(
    () => (Array.isArray(subscriptions) ? subscriptions : []),
    [subscriptions]
  );

  // 1. Dynamic Calculations & Trends
  const dynamicStats = useMemo(() => {
    const totalVacancies = safeVacancies.length;
    const activeVacancies = safeVacancies.filter(
      (v) => v.is_active !== false && !v.is_deleted
    ).length;
    const archivedVacancies = totalVacancies - activeVacancies;
    const activeRate =
      totalVacancies > 0 ? Math.round((activeVacancies / totalVacancies) * 100) : 0;

    const totalSubs = safeSubscriptions.length;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthSubs = safeSubscriptions.filter((s) => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const prevMonthSubs = safeSubscriptions.filter((s) => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    }).length;

    let monthTrendText = "0%";
    let monthTrendIsPositive = true;
    if (prevMonthSubs === 0) {
      monthTrendText = thisMonthSubs > 0 ? `+${thisMonthSubs} yangi` : "0 o'zgarish";
      monthTrendIsPositive = thisMonthSubs >= 0;
    } else {
      const diffPct = Math.round(
        ((thisMonthSubs - prevMonthSubs) / prevMonthSubs) * 100
      );
      monthTrendText = `${diffPct >= 0 ? "+" : ""}${diffPct}%`;
      monthTrendIsPositive = diffPct >= 0;
    }

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const nowTime = now.getTime();
    const thisWeekSubs = safeSubscriptions.filter((s) => {
      if (!s.created_at) return false;
      const t = new Date(s.created_at).getTime();
      return nowTime - t <= oneWeekMs;
    }).length;

    const prevWeekSubs = safeSubscriptions.filter((s) => {
      if (!s.created_at) return false;
      const t = new Date(s.created_at).getTime();
      return nowTime - t > oneWeekMs && nowTime - t <= 2 * oneWeekMs;
    }).length;

    let weekTrendText = "0%";
    let weekTrendIsPositive = true;
    if (prevWeekSubs === 0) {
      weekTrendText = thisWeekSubs > 0 ? `+${thisWeekSubs} bu hafta` : "0 o'zgarish";
      weekTrendIsPositive = thisWeekSubs >= 0;
    } else {
      const diffPct = Math.round(
        ((thisWeekSubs - prevWeekSubs) / prevWeekSubs) * 100
      );
      weekTrendText = `${diffPct >= 0 ? "+" : ""}${diffPct}%`;
      weekTrendIsPositive = diffPct >= 0;
    }

    return {
      totalVacancies,
      activeVacancies,
      archivedVacancies,
      activeRate,
      totalSubs,
      thisMonthSubs,
      prevMonthSubs,
      monthTrendText,
      monthTrendIsPositive,
      thisWeekSubs,
      weekTrendText,
      weekTrendIsPositive,
    };
  }, [safeVacancies, safeSubscriptions]);

  // 2. Monthly Dynamic Timeline Data for AreaChart (Last 6 Months)
  const monthlyChartData = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = targetDate.getMonth();
      const y = targetDate.getFullYear();
      const monthLabel = `${MONTH_NAMES_UZ[m].slice(0, 3)} ${y % 100}`;

      const count = safeSubscriptions.filter((s) => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
      }).length;

      result.push({
        name: monthLabel,
        arizalar: count,
      });
    }

    return result;
  }, [safeSubscriptions]);

  // 3. Vacancy Status Breakdown for Donut Chart
  const vacancyStatusData = useMemo(() => {
    const active = dynamicStats.activeVacancies;
    const archived = dynamicStats.archivedVacancies;
    if (active === 0 && archived === 0) {
      return [{ name: "Ma'lumot yo'q", value: 1, color: "#64748b" }];
    }
    return [
      { name: "Faol vakansiyalar", value: active, color: "#9c1447" },
      { name: "Arxivlangan / No-faol", value: archived, color: "#334155" },
    ];
  }, [dynamicStats]);

  // 4. Top Applicant Majors
  const topMajors = useMemo(() => {
    const counts: Record<string, number> = {};
    safeSubscriptions.forEach((sub) => {
      const major = sub.major?.trim() || "Boshqa yo'nalish";
      counts[major] = (counts[major] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [safeSubscriptions]);

  const statCards = [
    {
      title: "Jami vakansiyalar",
      value: dynamicStats.totalVacancies,
      description: `${dynamicStats.activeRate}% faol holatda`,
      icon: Briefcase,
      trendText: `${dynamicStats.activeVacancies} faol`,
      isPositive: true,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Jami arizalar",
      value: dynamicStats.totalSubs,
      description: "Universitet bo'yicha jami",
      icon: Users,
      trendText: dynamicStats.weekTrendText,
      isPositive: dynamicStats.weekTrendIsPositive,
      subText: "o'tgan haftadan",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Faol vakansiyalar",
      value: dynamicStats.activeVacancies,
      description: `${dynamicStats.archivedVacancies} ta no-faol/arxivda`,
      icon: TrendingUp,
      trendText: `${dynamicStats.activeRate}% qamrov`,
      isPositive: dynamicStats.activeRate >= 50,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Bu oylik arizalar",
      value: dynamicStats.thisMonthSubs,
      description: `O'tgan oy: ${dynamicStats.prevMonthSubs} ta`,
      icon: Calendar,
      trendText: dynamicStats.monthTrendText,
      isPositive: dynamicStats.monthTrendIsPositive,
      subText: "o'tgan oydan",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const isLoading = isLoadingVacancies || isLoadingSubscriptions;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 glass-card p-6 sm:p-8">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Kokand University Boshqaruv Markazi</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Xush kelibsiz!
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Universitet ishga qabul qilish, vakansiyalar e'lon qilish va nomzodlar
                arizalarini boshqarish tizimining real vaqt statistikasi.
              </p>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <Link to="/vacancies">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yangi Vakansiya
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-border/80 hover:bg-accent">
                <Link to="/subscriptions">
                  <FileText className="mr-2 h-4 w-4" />
                  Arizalarni Ko'rish
                </Link>
              </Button>
              {isSuperAdmin && (
                <Button asChild variant="secondary" className="border">
                  <Link to="/admins">
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    Adminlar
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className="glass-card hover:border-primary/40 transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-3xl font-extrabold text-foreground">
                  {isLoading ? "..." : stat.value}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {stat.isPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  )}
                  <span
                    className={
                      stat.isPositive
                        ? "text-emerald-500 font-semibold"
                        : "text-rose-500 font-semibold"
                    }
                  >
                    {stat.trendText}
                  </span>
                  {stat.subText && (
                    <span className="text-muted-foreground">{stat.subText}</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Main Area Chart: Monthly Application Trends (4 cols) */}
          <Card className="lg:col-span-4 glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Arizalar Dinamikasi
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  So'nggi 6 oylik kelib tushgan arizalar soni
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs font-medium">
                Oylik statistika
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="burgundyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9c1447" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#9c1447" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "currentColor" }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      allowDecimals={false}
                      tick={{ fill: "currentColor" }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                        fontSize: "12px",
                      }}
                      labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
                      formatter={(val: number) => [`${val} ta ariza`, "Arizalar"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="arizalar"
                      stroke="#9c1447"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#burgundyGradient)"
                      activeDot={{ r: 6, stroke: "#bd1e5c", strokeWidth: 2, fill: "#ffffff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Vacancy Breakdown & Top Majors (3 cols) */}
          <Card className="lg:col-span-3 glass-card flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                Vakansiyalar & Yo'nalishlar
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Holat va eng ko'p talab qilingan mutaxassisliklar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Donut Chart / Status Progress */}
              <div className="flex items-center justify-around gap-4 py-1">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vacancyStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {vacancyStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Faol
                    </span>
                    <span className="font-bold text-foreground">
                      {dynamicStats.activeVacancies} ta ({dynamicStats.activeRate}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      Arxivlangan
                    </span>
                    <span className="font-bold text-foreground">
                      {dynamicStats.archivedVacancies} ta
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/60 flex items-center justify-between font-semibold">
                    <span>Jami vakansiyalar</span>
                    <span className="text-primary">{dynamicStats.totalVacancies} ta</span>
                  </div>
                </div>
              </div>

              {/* Top Majors Breakdown List */}
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Top Arizalar Yo'nalishi
                </p>
                {topMajors.length > 0 ? (
                  topMajors.map((item, idx) => {
                    const pct =
                      dynamicStats.totalSubs > 0
                        ? Math.round((item.count / dynamicStats.totalSubs) * 100)
                        : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[180px]">
                            {item.name}
                          </span>
                          <span className="font-semibold text-foreground">
                            {item.count} ta ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Hali arizalar ma'lumotlari mavjud emas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Applications Card */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  So'nggi kelib tushgan arizalar
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Yangi nomzodlar va ularning mutaxassisliklari
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-primary gap-1">
                <Link to="/subscriptions">
                  Barchasi
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {safeSubscriptions.slice(0, 5).map((sub) => {
                  const initials = sub.fullName
                    ? sub.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "KU";

                  return (
                    <div
                      key={sub.id || sub.email}
                      className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-border/60 hover:border-primary/40 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-primary/20 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {sub.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {sub.major || "Mutaxassislik ko'rsatilmagan"} • {sub.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          {sub.created_at
                            ? new Date(sub.created_at).toLocaleDateString("uz-UZ", {
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {safeSubscriptions.length === 0 && !isLoadingSubscriptions && (
                  <div className="text-center py-10 space-y-2">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <p className="text-xs text-muted-foreground">
                      Hozircha arizalar kelib tushmagan
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Vacancies Card */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  So'nggi vakansiyalar
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Universitetdagi ochiq ish o'rinlari
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-primary gap-1">
                <Link to="/vacancies">
                  Barchasi
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {safeVacancies.slice(0, 5).map((vacancy) => (
                  <div
                    key={vacancy.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-border/60 hover:border-primary/40 transition-all duration-200"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {vacancy.title}
                        </p>
                        {vacancy.is_active !== false && !vacancy.is_deleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Faol
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            Arxiv
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {vacancy.location} • {vacancy.experience}
                      </p>
                    </div>

                    <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0">
                      <Link to="/vacancies">
                        Ko'rish
                      </Link>
                    </Button>
                  </div>
                ))}

                {safeVacancies.length === 0 && !isLoadingVacancies && (
                  <div className="text-center py-10 space-y-2">
                    <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <p className="text-xs text-muted-foreground">
                      Hozircha faol vakansiyalar yo'q
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
