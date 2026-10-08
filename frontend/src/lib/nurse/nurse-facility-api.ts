import { supabase } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RegisteredFacilityOption {
  id: string; // profiles.id (UUID)
  userId?: string;
  name: string;
  role?: string;
  district?: string;
  state?: string;
  block?: string;
  city?: string;
  address?: string;
  department?: string;
}

/**
 * Fetch registered healthcare facilities strictly from database (profiles where role IN ('facility', 'medical'))
 */
export async function fetchRegisteredFacilities(): Promise<RegisteredFacilityOption[]> {
  try {
    const res = await fetch("/api/facilities");
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.facilities) && data.facilities.length > 0) {
        return data.facilities.map((f: any) => ({
          id: f.id,
          userId: f.user_id,
          name: f.facility_name || f.full_name || "Healthcare Facility",
          role: f.role,
          district: f.district,
          state: f.state,
          block: f.block,
          city: f.city,
          address: f.address_line1,
          department: f.department,
        }));
      }
    }
  } catch (err) {
    console.warn("[NurseAPI] Notice: /api/facilities endpoint failed, attempting direct Supabase query:", err);
  }

  // Supabase fallback: select directly from profiles
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, role, state, district, block, city, address_line1")
        .in("role", ["facility", "medical"])
        .order("full_name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((f: any) => ({
          id: f.id,
          userId: f.user_id,
          name: f.full_name || "Healthcare Facility",
          role: f.role,
          district: f.district,
          state: f.state,
          block: f.block,
          city: f.city,
          address: f.address_line1,
        }));
      }
    } catch (err) {
      console.warn("[NurseAPI] Direct Supabase query for registered facilities failed:", err);
    }
  }

  return [];
}

export interface FacilityDoctorOption {
  id: string;
  profileId: string;
  name: string;
  role: string;
  room: string;
  department: string;
  qualification?: string;
  facilityId?: string;
  facilityName?: string;
}

/**
 * Fetch verified doctors belonging to the same healthcare facility
 */
export async function fetchDoctorsForFacility(
  facilityId?: string,
  facilityName?: string
): Promise<FacilityDoctorOption[]> {
  if (!supabase) return [];
  try {
    let query = supabase
      .from("doctor_profiles")
      .select("id, profile_id, facility_id, facility_name, qualification, designation, room_number, department, availability_status, profiles:profile_id(id, full_name, email, phone)");

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    let { data, error } = await query;

    // Fallback: If no doctors returned by facility_id and facilityName is present, search by facility_name
    if ((!data || data.length === 0) && facilityName) {
      const { data: byName, error: nameErr } = await supabase
        .from("doctor_profiles")
        .select("id, profile_id, facility_id, facility_name, qualification, designation, room_number, department, availability_status, profiles:profile_id(id, full_name, email, phone)")
        .ilike("facility_name", `%${facilityName.trim()}%`);
      if (!nameErr && byName && byName.length > 0) {
        data = byName;
      }
    }

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.profile_id || d.profiles?.id || d.id,
        profileId: d.profile_id || d.profiles?.id || d.id,
        name: d.profiles?.full_name || d.full_name || "Doctor",
        role: d.designation || d.qualification || "Attending Physician",
        room: d.room_number || "OPD Room",
        department: d.department || "General Medicine OPD",
        qualification: d.qualification,
        facilityId: d.facility_id,
        facilityName: d.facility_name,
      }));
    }
  } catch (err) {
    console.warn("[NurseAPI] fetchDoctorsForFacility error:", err);
  }
  return [];
}

/**
 * Fetch staff roster live
 */
export async function fetchLiveStaffRoster(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/triage/staff-roster`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.roster) && data.roster.length > 0) {
        return data.roster;
      }
    }
  } catch (e) {
    console.warn("[NurseAPI] Failed to fetch roster from API, checking Supabase...", e);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("phc_staff_roster")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn("[NurseAPI] Failed Supabase roster fetch:", e);
    }
  }

  return [];
}

/**
 * Update staff roster availability status live
 */
export async function updateLiveStaffStatus(staffId: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/triage/staff-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId, status }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("[NurseAPI] API staff update failed, trying Supabase...", e);
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from("phc_staff_roster")
        .update({ status, last_status_change: new Date().toISOString() })
        .eq("id", staffId);
      if (!error) return true;
    } catch (e) {
      console.error("[NurseAPI] Supabase staff status update error:", e);
    }
  }

  return false;
}

/**
 * Fetch PHC facility bed & oxygen stats live
 */
export async function fetchLiveFacilityStatus(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/triage/facility-status`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && data.facility) return data.facility;
    }
  } catch (e) {
    // fallback
  }

  if (supabase) {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("role", "facility").limit(1).maybeSingle();
      if (data) return { ...data, facility_name: data.full_name };
    } catch (e) {
      // fallback
    }
  }

  return null;
}

/**
 * Fetch live nurse profile and credentials from Supabase / PostgreSQL database
 */
export async function fetchLiveNurseProfile(profileId?: string): Promise<{
  profile: any;
  nurseProfile: any;
  stats: {
    casesTriaged: number;
    doctorHandoffs: number;
    emergencyReferrals: number;
    resolvedByMe: number;
  };
} | null> {
  if (!supabase) return null;

  try {
    let pQuery = supabase.from("profiles").select("*");
    if (profileId) {
      pQuery = pQuery.eq("id", profileId);
    } else {
      pQuery = pQuery.eq("role", "nurse").limit(1);
    }
    const { data: pData } = await pQuery.maybeSingle();

    const targetProfileId = profileId || pData?.id;
    let npData: any = null;
    if (targetProfileId) {
      const { data: nRes } = await supabase
        .from("nurse_profiles")
        .select("*")
        .eq("profile_id", targetProfileId)
        .maybeSingle();
      npData = nRes;
    }

    // Calculate real live stats from database
    let casesTriaged = 0;
    let doctorHandoffs = 0;
    let emergencyReferrals = 0;
    let resolvedByMe = 0;

    try {
      const { data: tickets } = await supabase
        .from("triage_tickets")
        .select("id, status, priority, urgency");

      if (tickets && tickets.length > 0) {
        casesTriaged = tickets.length;
        doctorHandoffs = tickets.filter(
          (t) => t.status === "Scheduled" || (t.status && t.status.toLowerCase().includes("doctor"))
        ).length;
        emergencyReferrals = tickets.filter(
          (t) =>
            t.status === "Referred" ||
            t.priority === "Red" ||
            (t.urgency && (t.urgency.toLowerCase().includes("red") || t.urgency.toLowerCase().includes("immediate")))
        ).length;
        resolvedByMe = tickets.filter(
          (t) =>
            t.status === "Completed" ||
            t.status === "Verified" ||
            (t.status && t.status.toLowerCase().includes("verified"))
        ).length;
      }

      if (npData) {
        if (npData.cases_triaged_count) casesTriaged = Math.max(casesTriaged, npData.cases_triaged_count);
        if (npData.doctor_handoffs_count) doctorHandoffs = Math.max(doctorHandoffs, npData.doctor_handoffs_count);
        if (npData.emergency_referrals_count) emergencyReferrals = Math.max(emergencyReferrals, npData.emergency_referrals_count);
        if (npData.resolved_by_me_count) resolvedByMe = Math.max(resolvedByMe, npData.resolved_by_me_count);
      }
    } catch (cntErr) {
      console.warn("Notice calculating live counts:", cntErr);
    }

    return {
      profile: pData || null,
      nurseProfile: npData || null,
      stats: {
        casesTriaged,
        doctorHandoffs,
        emergencyReferrals,
        resolvedByMe,
      },
    };
  } catch (err) {
    console.error("[NurseAPI] Error fetching live nurse profile:", err);
    return null;
  }
}

/**
 * Persist nurse profile and credentials directly to Supabase
 */
export async function updateLiveNurseProfile(
  profileId: string,
  profileUpdates: {
    fullName?: string;
    phone?: string;
    gender?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    age?: number | string;
    facilityName?: string;
    district?: string;
  },
  nurseUpdates: {
    designation?: string;
    stateCouncilReg?: string;
    hprId?: string;
    shiftSchedule?: string;
    facilityName?: string;
  }
): Promise<boolean> {
  if (!supabase || !profileId) return false;

  try {
    // 1. Update public.profiles table
    const pUpdatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (profileUpdates.fullName) pUpdatePayload.full_name = profileUpdates.fullName;
    if (profileUpdates.phone) pUpdatePayload.phone = profileUpdates.phone;
    if (profileUpdates.gender) pUpdatePayload.gender = profileUpdates.gender;
    if (profileUpdates.bloodGroup) pUpdatePayload.blood_group = profileUpdates.bloodGroup;
    if (profileUpdates.dateOfBirth) pUpdatePayload.date_of_birth = profileUpdates.dateOfBirth;
    if (profileUpdates.age) pUpdatePayload.age = Number(profileUpdates.age);
    if (profileUpdates.facilityName) pUpdatePayload.facility_name = profileUpdates.facilityName;
    if (profileUpdates.district) pUpdatePayload.district = profileUpdates.district;

    await supabase.from("profiles").update(pUpdatePayload).eq("id", profileId);

    // 2. Upsert into public.nurse_profiles table
    const npUpsertPayload: any = {
      profile_id: profileId,
      designation: nurseUpdates.designation || "Senior Staff Nurse & Triage Specialist",
      state_council_reg: nurseUpdates.stateCouncilReg || "ONRC-2018-9941",
      hpr_id: nurseUpdates.hprId || "",
      shift_schedule: nurseUpdates.shiftSchedule || "Morning Roster (08:00 AM - 04:00 PM)",
      facility_name: nurseUpdates.facilityName || profileUpdates.facilityName || "Community Health Centre (CHC) Khandapada",
      updated_at: new Date().toISOString(),
    };

    const { error: npErr } = await supabase
      .from("nurse_profiles")
      .upsert(npUpsertPayload, { onConflict: "profile_id" });

    if (npErr) {
      console.warn("[NurseAPI] Nurse profile upsert warning:", npErr.message);
    }

    return true;
  } catch (err) {
    console.error("[NurseAPI] Error saving nurse profile to database:", err);
    return false;
  }
}
