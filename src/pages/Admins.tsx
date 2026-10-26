import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Admin } from '@/services/adminService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Shield, Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const adminSchema = z.object({
  email: z.string().email('Noto\'g\'ri email'),
  name: z.string().min(1, 'Ism majburiy').max(100),
  password: z.string().optional(),
}).refine(() => {
  // Password is required when creating, optional when editing
  return true;
}, {
  message: "Parol majburiy",
  path: ["password"],
});

type AdminFormData = z.infer<typeof adminSchema>;

export default function Admins() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => adminService.getAdmins(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: Admin) => adminService.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({ title: 'Muvaffaqiyatli', description: 'Admin muvaffaqiyatli yaratildi' });
      setIsDialogOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: 'Xato', description: 'Admin yaratishda xatolik yuz berdi', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ email, data }: { email: string; data: Partial<Admin> }) =>
      adminService.updateAdmin(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({ title: 'Muvaffaqiyatli', description: 'Admin muvaffaqiyatli yangilandi' });
      setIsDialogOpen(false);
      setEditingAdmin(null);
      reset();
    },
    onError: () => {
      toast({ title: 'Xato', description: 'Admin yangilashda xatolik yuz berdi', variant: 'destructive' });
    },
  });

  const onSubmit = (data: AdminFormData) => {
    if (editingAdmin) {
      const updateData: Partial<Admin> = { name: data.name };
      if (data.password && data.password.length > 0) {
        updateData.password = data.password;
      }
      updateMutation.mutate({ email: editingAdmin.email, data: updateData });
    } else {
      if (!data.password || data.password.length < 6) {
        toast({ title: 'Xato', description: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak', variant: 'destructive' });
        return;
      }
      createMutation.mutate(data as Admin);
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    reset({ email: admin.email, name: admin.name, password: '' });
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
              <span>Adminlarni boshqarish</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Tizim administratorlarini boshqarish</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingAdmin(null);
                reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[40px] w-full sm:w-auto gap-2 shadow-xs">
                <Plus className="h-4 w-4 shrink-0" />
                <span>Admin qo'shish</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>{editingAdmin ? 'Adminni tahrirlash' : 'Yangi admin yaratish'}</span>
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    disabled={!!editingAdmin}
                    className="min-h-[40px] text-sm"
                    placeholder="admin@kokand.uz"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Ism</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className="min-h-[40px] text-sm"
                    placeholder="Ism-familiya"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                    {editingAdmin ? 'Yangi parol (joriyni saqlash uchun bo\'sh qoldiring)' : 'Parol'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', { required: !editingAdmin })}
                    className="min-h-[40px] text-sm"
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="min-h-[38px]"
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    type="submit"
                    className="min-h-[38px]"
                    disabled={createMutation.status === 'pending' || updateMutation.status === 'pending'}
                  >
                    {createMutation.status === 'pending' || updateMutation.status === 'pending'
                      ? 'Saqlanmoqda...'
                      : editingAdmin
                      ? 'Yangilash'
                      : 'Yaratish'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-xs overflow-hidden">
          <CardHeader className="py-3 sm:py-4 px-4 sm:px-6 border-b bg-muted/20">
            <CardTitle className="text-base font-semibold">Administratorlar ({admins.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Yuklanmoqda...</div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Administratorlar topilmadi
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead>Email</TableHead>
                      <TableHead>Ism</TableHead>
                      <TableHead className="w-[100px] text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.email} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-sm">{admin.email}</TableCell>
                        <TableCell className="text-sm">{admin.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(admin)}
                            className="h-8 w-8 p-0"
                            title="Tahrirlash"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
