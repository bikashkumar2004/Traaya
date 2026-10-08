import { OrganizationPatient, RegisteredOrganization } from "@/lib/organization-data";

export interface OrganizationStatsProps {
  totalCount: number;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  verifiedIdCount: number;
  orgName: string;
}

export interface NewMemberFormData {
  name: string;
  age: number | string;
  gender: string;
  phone: string;
  bloodGroup: string;
  memberId: string;
  department: string;
  category: "Employee" | "Student";
  address: string;
  symptoms: string;
  idCardPreview: string;
  idCardFileName: string;
}
