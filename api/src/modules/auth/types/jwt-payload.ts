export type Role = 'USER' | 'ADMIN';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}
