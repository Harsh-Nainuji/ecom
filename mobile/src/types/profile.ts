export type UserRole = 'buyer' | 'seller' | 'delivery' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_blocked: boolean;
}
