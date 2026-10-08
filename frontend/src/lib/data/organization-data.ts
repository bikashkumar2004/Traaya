"use client";

export interface RegisteredOrganization {
  id: string;
  name: string;
  code: string;
  type: "Industrial & PSU" | "Educational & Campus" | "Government & Defense" | "Healthcare & Research";
  location: string;
  district: string;
  contactPerson: string;
  contactPhone: string;
}

export interface OrganizationPatient {
  id: string;
  patientUhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  bloodGroup: string;
  address: string;
  organizationId: string;
  organizationName: string;
  memberId: string;
  department: string;
  category: "Employee" | "Student" | "Staff" | "Faculty";
  idCardUrl?: string;
  idCardVerified: boolean;
  latestVitals: {
    bp: string;
    pulse: number;
    spo2: number;
    temp: string;
  };
  latestSymptoms?: string[];
  triagePriority: "Immediate" | "Urgent" | "Less Urgent" | "Routine / Fit";
  lastScreened: string;
  healthNotes: string;
}

export const REGISTERED_ORGANIZATIONS: RegisteredOrganization[] = [
  {
    id: "org-nalco",
    name: "NALCO Smelter & Power Complex",
    code: "NALCO-ANG-01",
    type: "Industrial & PSU",
    location: "Nalco Nagar, Angul",
    district: "Angul, Odisha",
    contactPerson: "Dr. B. K. Jena (Chief Medical Officer)",
    contactPhone: "+91 6764 220192",
  },
  {
    id: "org-tatasteel",
    name: "Tata Steel Kalinganagar Industrial Division",
    code: "TSK-JJP-02",
    type: "Industrial & PSU",
    location: "Duburi, Kalinganagar",
    district: "Jajpur, Odisha",
    contactPerson: "Dr. R. C. Mohanty (Head, Occupational Health)",
    contactPhone: "+91 6726 264000",
  },
  {
    id: "org-nitr",
    name: "National Institute of Technology (NIT) Rourkela",
    code: "NITR-ROU-03",
    type: "Educational & Campus",
    location: "Sector 1, Rourkela",
    district: "Sundargarh, Odisha",
    contactPerson: "Dr. Champak Bhattacharyya (Health Centre Incharge)",
    contactPhone: "+91 661 2462000",
  },
  {
    id: "org-soa",
    name: "Siksha 'O' Anusandhan (SOA) Deemed University",
    code: "SOA-BBI-04",
    type: "Educational & Campus",
    location: "Khandagiri Square, Bhubaneswar",
    district: "Khordha, Odisha",
    contactPerson: "Dr. Nilamadhab Sahoo (Medical Advisor)",
    contactPhone: "+91 674 2377400",
  },
];

// Initial organization patients initialized empty, populated from live database
export const INITIAL_ORGANIZATION_PATIENTS: OrganizationPatient[] = [];

const STORAGE_KEY = "triage_organization_patients";

export function getStoredOrganizationPatients(): OrganizationPatient[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map((p: any) => ({
      ...p,
      latestSymptoms: Array.isArray(p.latestSymptoms) && p.latestSymptoms.length > 0
        ? p.latestSymptoms
        : p.symptoms
        ? (Array.isArray(p.symptoms) ? p.symptoms : [p.symptoms])
        : ["None (Routine Checkup)"],
      triagePriority: (p.triagePriority || "")
        .replace(/\s*\(Red\)/gi, "")
        .replace(/\s*\(Yellow\)/gi, "")
        .replace(/\s*\(Green\)/gi, "")
        .trim(),
    }));
  } catch (err) {
    console.error("Error reading stored organization patients:", err);
    return [];
  }
}

export function saveOrganizationPatient(patient: OrganizationPatient): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredOrganizationPatients();
    // Prepend new patient or update existing
    const existingIndex = current.findIndex((p) => p.id === patient.id || p.patientUhid === patient.patientUhid);
    let updated: OrganizationPatient[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...patient };
    } else {
      updated = [patient, ...current];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving organization patient:", err);
  }
}

export function verifyOrganizationMember(
  orgId: string,
  memberId: string
): {
  verified: boolean;
  member?: OrganizationPatient;
  message: string;
} {
  if (!memberId || !memberId.trim()) {
    return {
      verified: false,
      message: "Please enter your Employee / Student / Member ID to verify affiliation.",
    };
  }

  const stored = getStoredOrganizationPatients();
  const cleanId = memberId.trim().toLowerCase();

  const match = stored.find(
    (p) =>
      p.organizationId === orgId &&
      p.memberId.trim().toLowerCase() === cleanId
  );

  const org = REGISTERED_ORGANIZATIONS.find((o) => o.id === orgId);
  const orgName = org?.name || "Organisation";

  if (match) {
    return {
      verified: true,
      member: match,
      message: `Affiliation Verified: ${match.name} (${match.category} • ${match.department || "Operations"}) enrolled in ${match.organizationName}.`,
    };
  }

  return {
    verified: false,
    message: `Member ID "${memberId.trim()}" not found in ${orgName}'s employee/student roster. Please check your ID or contact your organization administrator to add you.`,
  };
}
