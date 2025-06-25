import type { Request } from 'express';

export interface UserParams {
  id: string;
}

export interface UpdateUserRoleBody {
  role: string;
}

export interface AdminRequest extends Request {
  admin?: {
    id: number;
    role: string;
  };
} 