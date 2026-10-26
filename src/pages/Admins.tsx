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
import { Plus, Edit, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const adminSchema = z.object({
  email: z.string().email('Noto\'g\'ri email'),
  name: z.string().min(1, 'Ism majburiy').max(100),
  password: z.string().optional(),
}).refine((data) => {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Adminlarni boshqarish</h1>
            <p className="text-muted-foreground">Tizim administratorlarini boshqarish</p>
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
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Admin qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAdmin ? 'Adminni tahrirlash' : 'Yangi admin yaratish'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    disabled={!!editingAdmin}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="name">Ism</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="password">
                    {editingAdmin ? 'Yangi parol (joriyni saqlash uchun bo\'sh qoldiring)' : 'Parol'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', { required: !editingAdmin })}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit">
                    {editingAdmin ? 'Yangilash' : 'Yaratish'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Administratorlar ({admins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Yuklanmoqda...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Ism</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.email}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>{admin.name}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(admin)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {admins.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Administratorlar topilmadi
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
