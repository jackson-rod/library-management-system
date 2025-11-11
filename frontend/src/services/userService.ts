import { api } from '@/config/axios';
import type { User } from '@/types/auth';
import type { PaginatedResponse } from '@/types/library';
import { normalizePaginator, type LaravelPaginator } from '@/utils/pagination';

interface UserListParams {
  search?: string;
  page?: number;
}

export type UserListResponse = PaginatedResponse<User>;

export const userService = {
  async list(params: UserListParams = {}): Promise<UserListResponse> {
    const response = await api.get<UserListResponse | LaravelPaginator<User>>('/users', {
      params,
    });

    return normalizePaginator<User>(response.data);
  },

  async create(payload: { name: string; email: string; password: string; role: 'Admin' | 'User'; library_id?: string }): Promise<User> {
    const response = await api.post<{ user: User }>('/users', payload);
    return response.data.user;
  },

  async update(
    id: number,
    payload: { name: string; email: string; role: 'Admin' | 'User'; password?: string }
  ): Promise<User> {
    const response = await api.put<{ user: User }>(`/users/${id}`, payload);
    return response.data.user;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
