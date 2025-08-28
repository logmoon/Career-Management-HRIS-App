import { EmployeeDto } from "./base.models";

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  employee: EmployeeDto | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  token: string;
  user: User;
  message: string;
}