import axiosInstance from './axiosInstance';

export interface Vacancy {
  id?: string;
  title: string;
  description: string;
  location: string;
  image?: string;
  experience: string;
  requirement: string;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
}

export type CreateVacancyPayload = {
  title: string;
  description: string;
  location?: string;
  experience?: string;
  requirement?: string;
  image?: string;
  is_active?: boolean;
};

export type UpdateVacancyPayload = Partial<CreateVacancyPayload> & {
  is_deleted?: boolean;
};

export const vacancyService = {
  async getVacancies(): Promise<Vacancy[]> {
    const response = await axiosInstance.get('/vacancies');
    const raw = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return raw.map((item: Record<string, unknown>): Vacancy => ({
      id: item.id !== undefined && item.id !== null ? String(item.id) : undefined,
      title: String(item.title || ''),
      description: String(item.description || ''),
      location: String(item.location || 'Kokand University'),
      image: item.image ? String(item.image) : undefined,
      experience: String(item.experience || 'Talab etilmaydi'),
      requirement: String(item.requirement || ''),
      is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
      is_deleted: Boolean(item.is_deleted),
      created_at: item.created_at ? String(item.created_at) : undefined,
      updated_at: item.updated_at ? String(item.updated_at) : undefined,
      deleted_at: (item.deleted_at as string | null | undefined) ?? null,
      created_by: (item.created_by as string | null | undefined) ?? null,
      updated_by: (item.updated_by as string | null | undefined) ?? null,
      deleted_by: (item.deleted_by as string | null | undefined) ?? null,
    }));
  },

  async getVacancy(id: string): Promise<Vacancy> {
    const response = await axiosInstance.get(`/vacancies/${id}`);
    const item = response.data?.data || response.data;
    return {
      id: item.id !== undefined && item.id !== null ? String(item.id) : undefined,
      title: String(item.title || ''),
      description: String(item.description || ''),
      location: String(item.location || 'Kokand University'),
      image: item.image ? String(item.image) : undefined,
      experience: String(item.experience || 'Talab etilmaydi'),
      requirement: String(item.requirement || ''),
      is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
      is_deleted: Boolean(item.is_deleted),
      created_at: item.created_at ? String(item.created_at) : undefined,
      updated_at: item.updated_at ? String(item.updated_at) : undefined,
      deleted_at: (item.deleted_at as string | null | undefined) ?? null,
    };
  },

  async getDeletedVacancies(): Promise<Vacancy[]> {
    const response = await axiosInstance.get('/vacancies/deleted');
    const raw = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return raw.map((item: Record<string, unknown>): Vacancy => ({
      id: item.id !== undefined && item.id !== null ? String(item.id) : undefined,
      title: String(item.title || ''),
      description: String(item.description || ''),
      location: String(item.location || 'Kokand University'),
      image: item.image ? String(item.image) : undefined,
      experience: String(item.experience || 'Talab etilmaydi'),
      requirement: String(item.requirement || ''),
      is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
      is_deleted: Boolean(item.is_deleted),
      created_at: item.created_at ? String(item.created_at) : undefined,
      updated_at: item.updated_at ? String(item.updated_at) : undefined,
      deleted_at: (item.deleted_at as string | null | undefined) ?? null,
    }));
  },

  async createVacancy(vacancy: CreateVacancyPayload | Omit<Vacancy, 'id'>): Promise<Vacancy> {
    const payload = {
      title: vacancy.title.trim(),
      description: vacancy.description.trim(),
      location: vacancy.location?.trim() || 'Kokand University',
      experience: vacancy.experience?.trim() || 'Talab etilmaydi',
      requirement: vacancy.requirement?.trim() || '',
      is_active: vacancy.is_active ?? true,
      ...(vacancy.image ? { image: vacancy.image } : {}),
    };
    const response = await axiosInstance.post('/vacancies', payload);
    return response.data?.data || response.data;
  },

  async updateVacancy(id: string, vacancy: UpdateVacancyPayload | Partial<Vacancy>): Promise<Vacancy> {
    const payload: Record<string, unknown> = {};
    if (vacancy.title !== undefined) payload.title = vacancy.title.trim();
    if (vacancy.description !== undefined) payload.description = vacancy.description.trim();
    if (vacancy.location !== undefined) payload.location = vacancy.location.trim();
    if (vacancy.experience !== undefined) payload.experience = vacancy.experience.trim();
    if (vacancy.requirement !== undefined) payload.requirement = vacancy.requirement.trim();
    if (vacancy.is_active !== undefined) payload.is_active = vacancy.is_active;
    if (vacancy.is_deleted !== undefined) payload.is_deleted = vacancy.is_deleted;
    if (vacancy.image !== undefined) payload.image = vacancy.image;

    const response = await axiosInstance.put(`/vacancies/${id}`, payload);
    return response.data?.data || response.data;
  },

  async toggleVacancyStatus(id: string, is_active: boolean): Promise<Vacancy> {
    const response = await axiosInstance.put(`/vacancies/${id}`, { is_active });
    return response.data?.data || response.data;
  },

  async deleteVacancy(id: string): Promise<void> {
    await axiosInstance.delete(`/vacancies/${id}`);
  },
};
