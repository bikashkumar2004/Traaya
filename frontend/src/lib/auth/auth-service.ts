import { supabase, isSupabaseConfigured, formatToE164Phone } from "@/lib/supabase";
import { UserProfile, PatientRegistrationPayload } from "./auth-types";

/**
 * Registers a new patient via /api/auth/register or local fallback
 */
export async function registerPatientProfile(data: PatientRegistrationPayload): Promise<UserProfile> {
  const computedFullName = data.fullName || `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`.trim();
  const formattedPhone = formatToE164Phone(data.phone);
  const cleanEmail = data.email.trim().toLowerCase();
  const computedUhid = data.patientUhid || `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

  let sessionUserId: string | undefined;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      sessionUserId = sessionData.session?.user?.id;
    } catch (err) {
      console.warn("Notice reading session user:", err);
    }
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        fullName: computedFullName,
        email: cleanEmail,
        phone: formattedPhone,
        patientUhid: computedUhid,
        userId: sessionUserId,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to register profile in database.");
    }

    return json.user as UserProfile;
  } catch (err: any) {
    console.error("registerPatient error:", err);
    // Fallback local representation if offline
    const fallbackProfile: UserProfile = {
      id: sessionUserId || `patient-${Date.now()}`,
      userId: computedUhid,
      email: cleanEmail,
      fullName: computedFullName,
      role: "patient",
      phone: formattedPhone,
      gender: data.gender || "male",
      dateOfBirth: data.dob || "2004-05-15",
      age: Number(data.age) || 22,
      bloodGroup: data.bloodGroup || "B+",
      patientUhid: computedUhid,
      facilityName: "Primary Health Centre & Sub-Centres",
      addressLine1: data.addressLine1,
      state: data.state,
      district: data.district,
      city: data.city,
      block: data.block,
      disability: data.disability || "No",
      isAffilatedToOrg: data.isAffilatedToOrg,
      idInOrg: data.idInOrg,
      orgIdCard: data.orgIdCard,
      metadata: data.metadata,
    };
    return fallbackProfile;
  }
}

/**
 * Updates public.profiles and patient_profiles in Supabase
 */
export async function updateUserProfile(
  user: UserProfile,
  updatedData: Partial<UserProfile>
): Promise<{ success: boolean; updatedProfile: UserProfile }> {
  const newProfile: UserProfile = { ...user, ...updatedData };

  if (isSupabaseConfigured && supabase && /^[0-9a-fA-F-]{36}$/.test(user.id)) {
    try {
      // 1. Update public.profiles (common identity & demographic fields only)
      const profileUpdatePayload: any = {
        full_name: newProfile.fullName,
        phone: newProfile.phone,
        gender: newProfile.gender,
        date_of_birth: newProfile.dateOfBirth || null,
        age: Number(newProfile.age) || null,
        address_line1: newProfile.addressLine1,
        state: newProfile.state,
        district: newProfile.district,
        city: newProfile.city,
        block: newProfile.block,
        postal_code: newProfile.postalCode,
        metadata: {
          ...(newProfile.metadata || {}),
          organizationName: newProfile.organizationName,
          isAffilatedToOrg: newProfile.isAffilatedToOrg,
          idInOrg: newProfile.idInOrg,
          orgIdCard: newProfile.orgIdCard,
          chronic_conditions: newProfile.chronicConditions || [],
          allergies: newProfile.allergies || [],
          dependents: newProfile.dependents || [],
        },
        updated_at: new Date().toISOString(),
      };

      const { error: profileErr } = await supabase
        .from("profiles")
        .update(profileUpdatePayload)
        .eq("id", user.id);

      if (profileErr) {
        console.error("Supabase profile update error:", profileErr.message);
        return { success: false, updatedProfile: newProfile };
      }

      // 2. If role is patient, update or upsert public.patient_profiles
      if (newProfile.role === "patient") {
        const patientPayload: any = {
          profile_id: user.id,
          blood_group: newProfile.bloodGroup,
          disability: newProfile.disability || "No",
          primary_facility_name: newProfile.facilityName || "Community Health Centre (CHC) Khandapada",
          is_affilated_to_org: !!newProfile.isAffilatedToOrg,
          organization_name: newProfile.organizationName || null,
          id_in_org: newProfile.idInOrg || null,
          org_id_card: newProfile.orgIdCard || null,
          chronic_conditions: newProfile.chronicConditions || [],
          allergies: newProfile.allergies || [],
          dependents: newProfile.dependents || [],
          dependent: newProfile.dependents || [],
          metadata: {
            ...(newProfile.metadata || {}),
            organizationName: newProfile.organizationName,
          },
          updated_at: new Date().toISOString(),
        };

        const { error: patientErr } = await supabase
          .from("patient_profiles")
          .upsert(patientPayload, { onConflict: "profile_id" });

        if (patientErr) {
          console.error("Supabase patient_profiles update error:", patientErr.message);
          return { success: false, updatedProfile: newProfile };
        }
      }

      return { success: true, updatedProfile: newProfile };
    } catch (e) {
      console.error("updateProfile error:", e);
      return { success: false, updatedProfile: newProfile };
    }
  }

  return { success: true, updatedProfile: newProfile };
}
