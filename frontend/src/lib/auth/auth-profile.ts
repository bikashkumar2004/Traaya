import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { UserProfile, UserRole } from "./auth-types";

/**
 * Maps Supabase public.profiles row and role rows (patient_profiles, nurse_profiles, doctor_profiles)
 * to unified frontend UserProfile interface
 */
export const mapSupabaseProfile = (row: any, authUser?: any, roleRow?: any): UserProfile => {
  const chronicConditions = Array.isArray(roleRow?.chronic_conditions) && roleRow.chronic_conditions.length > 0
    ? roleRow.chronic_conditions
    : (Array.isArray(row.chronic_conditions) && row.chronic_conditions.length > 0
      ? row.chronic_conditions
      : (Array.isArray(row.metadata?.chronic_conditions) ? row.metadata.chronic_conditions : []));

  const allergies = Array.isArray(roleRow?.allergies) && roleRow.allergies.length > 0
    ? roleRow.allergies
    : (Array.isArray(row.allergies) && row.allergies.length > 0
      ? row.allergies
      : (Array.isArray(row.metadata?.allergies) ? row.metadata.allergies : []));

  const rawDependents =
    roleRow?.dependents ||
    roleRow?.dependent ||
    row.dependents ||
    row.dependent ||
    row.metadata?.dependents ||
    [];

  let parsedDependentsList: any[] = [];
  if (Array.isArray(rawDependents)) {
    parsedDependentsList = rawDependents;
  } else if (typeof rawDependents === "string") {
    try {
      const p = JSON.parse(rawDependents);
      if (Array.isArray(p)) parsedDependentsList = p;
    } catch {}
  }

  const dependents = parsedDependentsList.map((d: any, idx: number) => ({
    id: d.id || `dep-${idx + 1}`,
    fullName: d.fullName || d.full_name || d.name || "Family Member",
    relation: d.relation || d.relationship || "Dependent",
    age: d.age ? Number(d.age) : undefined,
    gender: d.gender || "",
    phone: d.phone || "",
    patientUhid: d.patientUhid || d.patient_uhid || d.uhid || `PAT-${1000 + idx}`,
  }));

  const isAffilatedToOrg = roleRow?.is_affilated_to_org ?? row.is_affilated_to_org ?? row.metadata?.is_affilated_to_org ?? false;
  const organizationName = roleRow?.organization_name || row.organization_name || row.metadata?.organizationName || row.metadata?.organization_name || "";
  const idInOrg = roleRow?.id_in_org || row.id_in_org || row.metadata?.idInOrg || row.metadata?.id_in_org || "";
  const orgIdCard = roleRow?.org_id_card || row.org_id_card || row.metadata?.orgIdCard || row.metadata?.org_id_card || "";

  const resolvedFacilityId =
    roleRow?.facility_id ||
    row.facility_id ||
    (row.role === "facility" || row.role === "medical" ? row.id : "") ||
    "";

  const resolvedFacilityName =
    roleRow?.facility_name ||
    row.facility_name ||
    roleRow?.primary_facility_name ||
    (row.role === "facility" || row.role === "medical" ? row.full_name : "") ||
    "";

  return {
    id: row.id || authUser?.id,
    userId: row.user_id || row.patient_uhid || authUser?.user_metadata?.user_id,
    email: row.email || authUser?.email || "",
    fullName: row.full_name || authUser?.user_metadata?.full_name || "",
    role: (row.role as UserRole) || (authUser?.user_metadata?.role as UserRole) || "patient",
    phone: row.phone || authUser?.phone || authUser?.user_metadata?.phone,
    patientUhid: row.user_id || row.patient_uhid || authUser?.user_metadata?.patient_uhid || "",
    gender: row.gender || "",
    dateOfBirth: row.date_of_birth,
    age: row.age,
    bloodGroup: roleRow?.blood_group || row.blood_group,
    facilityId: resolvedFacilityId,
    facilityName: resolvedFacilityName,
    addressLine1: row.address_line1,
    state: row.state,
    district: row.district,
    city: row.city,
    block: row.block,
    postalCode: row.postal_code,
    disability: roleRow?.disability || row.disability || "No",
    chronicConditions,
    allergies,
    dependents,
    isAffilatedToOrg,
    organizationName,
    idInOrg,
    orgIdCard,
    metadata: {
      ...(row.metadata || {}),
      ...(roleRow?.metadata || {}),
      organizationName,
    },
  };
};

/**
 * Fetches profile from Supabase public.profiles table and joins role tables
 */
export const fetchProfileFromSupabase = async (userId: string, authUser?: any): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId);

    let data: any = null;
    let error: any = null;

    if (isUuid) {
      const res = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      data = res.data;
      error = res.error;
    } else {
      // userId is not a UUID (e.g. "usr-kumarbik" or "PAT-8402"), search by user_id column
      const res = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }

    // If not found yet and authUser has a UUID id, try matching by authUser.id
    if (!data && authUser?.id && authUser.id !== userId) {
      const isAuthUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(authUser.id);
      if (isAuthUuid) {
        const authRes = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();
        if (authRes.data) {
          data = authRes.data;
          error = null;
        }
      }
    }

    if (error) {
      console.warn("Notice reading profile from Supabase:", error.message);
    }

    if (data) {
      let roleRow = null;
      if (data.role === "patient" && data.id) {
        const { data: pData, error: pError } = await supabase
          .from("patient_profiles")
          .select("*")
          .eq("profile_id", data.id)
          .maybeSingle();
        if (pError) {
          console.warn("Notice reading patient profile:", pError.message);
        } else {
          roleRow = pData;
        }
      } else if (data.role === "nurse" && data.id) {
        const { data: nData, error: nError } = await supabase
          .from("nurse_profiles")
          .select("*")
          .eq("profile_id", data.id)
          .maybeSingle();
        if (nError) {
          console.warn("Notice reading nurse profile:", nError.message);
        } else {
          roleRow = nData;
        }
      } else if (data.role === "doctor" && data.id) {
        const { data: dData, error: dError } = await supabase
          .from("doctor_profiles")
          .select("*")
          .eq("profile_id", data.id)
          .maybeSingle();
        if (dError) {
          console.warn("Notice reading doctor profile:", dError.message);
        } else {
          roleRow = dData;
        }
      }

      if (roleRow?.facility_id && !roleRow?.facility_name) {
        const { data: fData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", roleRow.facility_id)
          .maybeSingle();
        if (fData?.full_name) {
          roleRow.facility_name = fData.full_name;
        }
      }
      return mapSupabaseProfile(data, authUser, roleRow);
    }
  } catch (err) {
    console.error("fetchProfileFromSupabase exception:", err);
  }

  if (authUser) {
    return {
      id: authUser.id,
      email: authUser.email || "",
      fullName: authUser.user_metadata?.full_name || "",
      role: (authUser.user_metadata?.role as UserRole) || "patient",
      phone: authUser.phone || authUser.user_metadata?.phone,
      patientUhid: authUser.user_metadata?.patient_uhid || authUser.user_metadata?.user_id || "",
    };
  }
  return null;
};
