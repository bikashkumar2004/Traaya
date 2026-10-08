import { UserRole } from "@/lib/auth-context";

export interface AdminRecentAccount {
  role: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  destination: string;
}

export interface RegisteredFacility {
  id: string;
  user_id: string;
  facility_name: string;
  city?: string;
  district?: string;
  state?: string;
  department?: string;
}

export interface AdminRoleTabItem {
  id: UserRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
}
