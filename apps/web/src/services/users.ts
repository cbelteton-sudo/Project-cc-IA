import { api } from '../lib/api';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const usersService = {
  findAll: async (): Promise<UserDTO[]> => {
    const { data } = await api.get<UserDTO[]>('/users');
    return data;
  },
};
