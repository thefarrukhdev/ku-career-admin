"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService, Subscription } from "@/services/subscriptionService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Subscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  // ✅ Arizalarni olish
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: subscriptionService.getSubscriptions,
  });

  // ✅ Arizani o'chirish
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "✅ Ariza o‘chirildi",
        description: deleteTarget?.fullName || "",
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        title: "❌ O‘chirishda xato",
        description: deleteTarget?.fullName || "",
        variant: "destructive",
      });
      setDeleteTarget(null);
    },
  });

  const { mutate, status } = deleteMutation;

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Arizalar ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Yuklanmoqda...</div>
          ) : subscriptions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism</TableHead>
                  <TableHead>Telefon raqam</TableHead>
                  <TableHead>Izoh</TableHead>
                  <TableHead>Yuborilgan vaqti</TableHead>
                  <TableHead>Harakat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.fullName}</TableCell>
                    <TableCell>{sub.phone}</TableCell>
                    <TableCell>{sub.major}</TableCell>
                    <TableCell>{sub.created_at ? new Date(sub.created_at).toLocaleString() : "-"}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(sub)}
                      >
                        O‘chirish
                      </Button>

                      {/* ✅ Dialog confirmation */}
                      {deleteTarget?.id === sub.id && (
                        <Dialog open={true} onOpenChange={() => setDeleteTarget(null)}>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Arizani o‘chirish</DialogTitle>
                            </DialogHeader>
                            <p className="py-2">
                              Siz <strong>{sub.fullName}</strong> arizasini o‘chirishni tasdiqlaysizmi?
                            </p>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
                              <Button
                                variant="destructive"
                                disabled={status === "pending"}
                                onClick={() => mutate(sub.id!)}
                              >
                                {status === "pending" && deleteTarget?.id === sub.id
                                  ? "O‘chirilyapti..."
                                  : "Ha, o‘chirish"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Hech qanday ariza topilmadi
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
