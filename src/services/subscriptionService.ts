import axiosInstance, { API_BASE_URL } from './axiosInstance';

export type CandidateStatus = 'new' | 'reviewing' | 'interview' | 'accepted' | 'rejected';

export interface Subscription {
  id?: string;
  fullName: string;
  age?: string;
  gender?: string;
  resume_file?: string;
  phone: string;
  email?: string;
  major: string;
  vacansy_id?: string;
  vacancy_id?: string;
  status?: CandidateStatus;
  notes?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

const STATUS_KEY_PREFIX = 'candidate_status_';
const NOTES_KEY_PREFIX = 'candidate_notes_';

const VALID_STATUSES: readonly CandidateStatus[] = [
  'new',
  'reviewing',
  'interview',
  'accepted',
  'rejected',
];

export const subscriptionService = {
  getCandidateStatus(id: string): CandidateStatus {
    if (!id || typeof window === 'undefined') return 'new';
    try {
      const stored = localStorage.getItem(`${STATUS_KEY_PREFIX}${id}`);
      if (stored && VALID_STATUSES.includes(stored as CandidateStatus)) {
        return stored as CandidateStatus;
      }
    } catch (e) {
      console.error('Error reading candidate status from localStorage', e);
    }
    return 'new';
  },

  setCandidateStatus(id: string, status: CandidateStatus): void {
    if (!id || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STATUS_KEY_PREFIX}${id}`, status);
    } catch (e) {
      console.error('Error writing candidate status to localStorage', e);
    }
  },

  getCandidateNotes(id: string): string {
    if (!id || typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`${NOTES_KEY_PREFIX}${id}`) || '';
    } catch (e) {
      console.error('Error reading candidate notes from localStorage', e);
      return '';
    }
  },

  setCandidateNotes(id: string, notes: string): void {
    if (!id || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${NOTES_KEY_PREFIX}${id}`, notes);
    } catch (e) {
      console.error('Error writing candidate notes to localStorage', e);
    }
  },

  async getSubscriptions(): Promise<Subscription[]> {
    const response = await axiosInstance.get('/subscriptions');
    const rawData = Array.isArray(response.data)
      ? response.data
      : (response.data?.data || []);

    return rawData.map((sub: Record<string, unknown>): Subscription => {
      const id = sub.id ? String(sub.id) : '';
      const localStatus = id ? subscriptionService.getCandidateStatus(id) : 'new';
      const localNotes = id ? subscriptionService.getCandidateNotes(id) : '';

      const rawResume = sub.resume_file ? String(sub.resume_file) : '';
      const resume = rawResume
        ? (rawResume.startsWith('http')
            ? rawResume
            : `${API_BASE_URL}/${rawResume}`)
        : undefined;

      const backendStatus = typeof sub.status === 'string' && VALID_STATUSES.includes(sub.status as CandidateStatus)
        ? (sub.status as CandidateStatus)
        : undefined;

      const backendNotes = typeof sub.notes === 'string' && sub.notes.trim() !== ''
        ? sub.notes
        : undefined;

      return {
        id: sub.id ? String(sub.id) : undefined,
        fullName: String(sub.fullName || ''),
        age: sub.age !== undefined && sub.age !== null ? String(sub.age) : undefined,
        gender: sub.gender !== undefined && sub.gender !== null ? String(sub.gender) : undefined,
        resume_file: resume,
        phone: String(sub.phone || ''),
        email: sub.email !== undefined && sub.email !== null ? String(sub.email) : undefined,
        major: String(sub.major || ''),
        vacansy_id: (sub.vacansy_id || sub.vacancy_id) ? String(sub.vacansy_id || sub.vacancy_id) : undefined,
        vacancy_id: (sub.vacansy_id || sub.vacancy_id) ? String(sub.vacansy_id || sub.vacancy_id) : undefined,
        status: backendStatus || localStatus || 'new',
        notes: backendNotes !== undefined ? backendNotes : localNotes,
        is_active: sub.is_active as boolean | undefined,
        is_deleted: sub.is_deleted as boolean | undefined,
        created_at: sub.created_at ? String(sub.created_at) : undefined,
        updated_at: sub.updated_at ? String(sub.updated_at) : undefined,
        deleted_at: (sub.deleted_at as string | null | undefined) ?? null,
      };
    });
  },

  async getDeletedSubscriptions(): Promise<Subscription[]> {
    const response = await axiosInstance.get('/subscriptions/deleted');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  async createSubscription(subscription: Omit<Subscription, 'id'>): Promise<Subscription> {
    const response = await axiosInstance.post('/subscriptions', subscription);
    return response.data?.data || response.data;
  },

  async deleteSubscription(id: string, _token?: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/subscriptions/${id}`);
    return response.data;
  },
};
