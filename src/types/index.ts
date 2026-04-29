// User Types
export enum UserRole {
  WORKER = 'WORKER',
  TEAM_LEAD = 'TEAM_LEAD',
  HR = 'HR',
  ADMIN = 'ADMIN',
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  client_id: string;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  client_id: string;
  team_id?: string;
  active: boolean;
  created_at: Date;
}

// Heure Types
export enum HeureType {
  MO = 'MO',
  FRAIS = 'FRAIS',
}

export enum HeureStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SYNCED = 'SYNCED',
}

export interface Heure {
  id: string;
  user_id: string;
  client_id: string;
  chantier_id: string;
  date: Date;
  hours: number;
  type: HeureType;
  status: HeureStatus;
  notes?: string;
  synced_to_hfsql: boolean;
  hfsql_id?: number;
  created_at: Date;
  updated_at: Date;
}

// Chantier Types
export interface Chantier {
  id: string;
  name: string;
  code: string;
  description?: string;
  client_id: string;
  hfsql_id?: number;
  active: boolean;
  created_at: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface CreateHeureRequest {
  chantier_id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  type: HeureType;
  notes?: string;
}

export interface CreateHeureResponse {
  heure: Heure;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
