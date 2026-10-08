import { OrganizationPatient } from "@/lib/organization-data";

export interface OrgVerificationStatus {
  verified: boolean;
  member?: OrganizationPatient;
  message: string;
}
