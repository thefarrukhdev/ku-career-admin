"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vacancyService, Vacancy } from '@/services/vacancyService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// ✅ Faqat kerakli maydonlar uchun validatsiya sxemasi
const vacancySchema = z.object({
  title: z.string().min(1, 'Sarlavha majburiy').max(200),
  description: z.string().min(1, 'Tavsif majburiy'),
});

type VacancyFormData = z.infer<typeof vacancySchema>;

export default function Vacancies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [deletingVacancy, setDeletingVacancy] = useState<Vacancy | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vacancies = [], isLoading } = useQuery({
    queryKey: ['vacancies'],
    queryFn: () => vacancyService.getVacancies(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VacancyFormData>({
    resolver: zodResolver(vacancySchema),
  });

  // Yaratish
  const createMutation = useMutation({
    mutationFn: (data: VacancyFormData) => vacancyService.createVacancy(data as Omit<Vacancy, 'id'>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      toast({ title: 'Muvaffaqiyatli', description: 'Vakansiya yaratildi' });
      setIsDialogOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: 'Xato', description: 'Vakansiya yaratishda xatolik', variant: 'destructive' });
    },
  });

  // Yangilash
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VacancyFormData> }) =>
      vacancyService.updateVacancy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      toast({ title: 'Yangilandi', description: 'Vakansiya muvaffaqiyatli yangilandi' });
      setIsDialogOpen(false);
      setEditingVacancy(null);
      reset();
    },
    onError: () => {
      toast({ title: 'Xato', description: 'Yangilashda xatolik', variant: 'destructive' });
    },
  });

  // O‘chirish
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vacancyService.deleteVacancy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      toast({ title: 'O‘chirildi', description: 'Vakansiya muvaffaqiyatli o‘chirildi' });
    },
    onError: () => {
      toast({ title: 'Xato', description: 'O‘chirishda xatolik', variant: 'destructive' });
    },
  });

  const onSubmit = (data: VacancyFormData) => {
    if (editingVacancy?.id) {
      updateMutation.mutate({ id: editingVacancy.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy);
    reset(vacancy);
    setIsDialogOpen(true);
  };

  const filteredVacancies = vacancies.filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vakansiyalar</h1>
            <p className="text-muted-foreground">Ish o‘rinlarini boshqarish</p>
          </div>

          {/* Modal ochish tugmasi */}
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
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Vakansiya qo‘shish
              </Button>
            </DialogTrigger>

            {/* Form Modal */}
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingVacancy ? 'Vakansiyani tahrirlash' : 'Yangi vakansiya yaratish'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Sarlavha */}
                <div>
                  <Label htmlFor="title">Sarlavha</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Tavsif */}
                <div>
                  <Label htmlFor="description">Tavsif</Label>
                  <Textarea id="description" {...register('description')} rows={4} />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Bekor qilish
                  </Button>
                  <Button type="submit">
                    {editingVacancy ? 'Yangilash' : 'Yaratish'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Qidiruv */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Vakansiyalarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vakansiyalar ro‘yxati */}
        {isLoading ? (
          <div className="text-center py-12">Yuklanmoqda...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVacancies.map((vacancy) => (
              <Card key={vacancy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{vacancy.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground mb-4">
                    {vacancy.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(vacancy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingVacancy(vacancy)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bo‘sh holat */}
        {filteredVacancies.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Vakansiyalar topilmadi
          </div>
        )}

        {/* O'chirishni tasdiqlash dialogi */}
        <AlertDialog open={!!deletingVacancy} onOpenChange={(open) => !open && setDeletingVacancy(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vakansiyani o‘chirish</AlertDialogTitle>
              <AlertDialogDescription>
                Haqiqatan ham <strong>{deletingVacancy?.title}</strong> vakansiyasini o‘chirmoqchimisiz? Ushbu amalni ortga qaytarib bo‘lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deletingVacancy?.id) {
                    deleteMutation.mutate(deletingVacancy.id);
                    setDeletingVacancy(null);
                  }
                }}
              >
                Ha, o‘chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
