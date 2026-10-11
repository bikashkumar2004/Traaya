import { NextResponse } from "next/server";
import postgres from "postgres";

export async function POST(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database URL is not configured." },
      { status: 500 }
    );
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    const body = await req.json();
    const {
      role,
      fullName,
      email,
      phone,
      gender,
      dob,
      age,
      addressLine1,
      state,
      district,
      city,
      block,
      postalCode,
      password,
      userId,
      // Patient specifics
      bloodGroup,
      disability,
      facilityId,
      primaryFacilityName,
      isAffilatedToOrg,
      organizationName,
      idInOrg,
      orgIdCard,
      chronicConditions,
      allergies,
      emergencyContactName,
      emergencyContactPhone,
      // Doctor specifics
      doctorId,
      medicalRegistrationNumber,
      specialization,
      qualification,
      department,
      roomNumber,
      shiftTimings,
      availabilityStatus,
      isAuthorizedReviewer,
      // Nurse specifics
      staffId,
      stateCouncilReg,
      hprId,
      designation,
      shiftSchedule,
      // Medical specifics
      pharmacyLicenseNumber,
      staffDesignation,
      counterNumber,
      isJanAushadhiIncharge,
      // Organization specifics
      orgCode,
      orgName,
      orgCategory,
      totalWorkforce,
      contactEmail,
      // Healthcamp specifics
      campId,
      mmuUnitCode,
      campName,
      assignedBlock,
      leadOfficer,
      operationalStatus,
    } = body;

    const assignedRole = role || "patient";
    const computedFullName = (fullName || "Test Administrator User").trim();
    const cleanEmail = email ? email.trim().toLowerCase() : `user_${Date.now()}@traaya.test`;
    const cleanDigits = phone ? phone.replace(/\D/g, "") : "";
    const digitsPhone = cleanDigits ? (cleanDigits.startsWith("91") ? cleanDigits : `91${cleanDigits.slice(-10)}`) : `91943710${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedPhone = `+91 ${digitsPhone.slice(-10)}`;
    const effectivePassword = password || "Triage@2026";

    // Compute standard universal Role ID
    let computedUserId = userId;
    if (!computedUserId) {
      if (assignedRole === "doctor") {
        computedUserId = doctorId || `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      } else if (assignedRole === "nurse") {
        computedUserId = staffId || `NUR-${Math.floor(1000 + Math.random() * 9000)}`;
      } else if (assignedRole === "facility" || assignedRole === "medical") {
        computedUserId = staffId || `FAC-${Math.floor(100 + Math.random() * 900)}`;
      } else if (assignedRole === "organization") {
        computedUserId = orgCode || `ORG-${Math.floor(100 + Math.random() * 900)}`;
      } else if (assignedRole === "healthcamp") {
        computedUserId = campId || `CMP-${Math.floor(100 + Math.random() * 900)}`;
      } else if (assignedRole === "admin") {
        computedUserId = `ADM-${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        computedUserId = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // 1. Search for existing users matching email or phone
    const existingUsers = await sql`
      SELECT id, email, phone FROM auth.users
      WHERE email = ${cleanEmail}::text OR phone = ${digitsPhone}::text
    `;

    let targetUserId: string;

    if (existingUsers.length > 0) {
      targetUserId = existingUsers[0].id;
      // Delete any duplicate colliding accounts
      for (const extra of existingUsers.slice(1)) {
        await sql`DELETE FROM public.patient_profiles WHERE profile_id = ${extra.id}::uuid`;
        await sql`DELETE FROM public.doctor_profiles WHERE profile_id = ${extra.id}::uuid`;
        await sql`DELETE FROM public.nurse_profiles WHERE profile_id = ${extra.id}::uuid`;
        await sql`DELETE FROM public.facility_profiles WHERE id = ${extra.id}::uuid`;
        await sql`DELETE FROM public.healthcamp_profiles WHERE profile_id = ${extra.id}::uuid`;
        await sql`DELETE FROM public.organization_profiles WHERE profile_id = ${extra.id}::uuid`;
        await sql`DELETE FROM public.profiles WHERE id = ${extra.id}::uuid`;
        await sql`DELETE FROM auth.users WHERE id = ${extra.id}::uuid`;
      }
    } else {
      const [newIdRow] = await sql`SELECT gen_random_uuid()::text AS id`;
      targetUserId = newIdRow.id;

      await sql`
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, phone,
          encrypted_password,
          email_confirmed_at, phone_confirmed_at,
          raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at
        ) VALUES (
          ${targetUserId}::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'authenticated',
          'authenticated',
          ${cleanEmail}::text,
          ${digitsPhone}::text,
          crypt(${effectivePassword}::text, gen_salt('bf', 10)),
          now(),
          now(),
          '{"provider":"email","providers":["email","phone"]}'::jsonb,
          jsonb_build_object(
            'full_name', ${computedFullName}::text,
            'phone', ${formattedPhone}::text,
            'role', ${assignedRole}::text,
            'user_id', ${computedUserId}::text,
            'patient_uhid', ${computedUserId}::text
          ),
          now(),
          now()
        )
      `;

      if (cleanEmail) {
        await sql`
          INSERT INTO auth.identities (
            id, user_id, provider_id, provider, identity_data,
            last_sign_in_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            ${targetUserId}::uuid,
            ${cleanEmail}::text,
            'email'::text,
            jsonb_build_object(
              'sub', ${targetUserId}::text,
              'email', ${cleanEmail}::text,
              'email_verified', true
            ),
            now(), now(), now()
          )
          ON CONFLICT (provider, provider_id) DO NOTHING
        `;
      }
    }

    // 2. Update auth.users credentials to ensure password, email & phone sync
    await sql`
      UPDATE auth.users
      SET
        email = ${cleanEmail}::text,
        phone = ${digitsPhone}::text,
        encrypted_password = crypt(${effectivePassword}::text, gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object(
          'full_name', ${computedFullName}::text,
          'phone', ${formattedPhone}::text,
          'role', ${assignedRole}::text,
          'user_id', ${computedUserId}::text,
          'patient_uhid', ${computedUserId}::text
        ),
        updated_at = now()
      WHERE id = ${targetUserId}::uuid
    `;

    // 3. Clear conflicting profile from other IDs if email matches
    await sql`DELETE FROM public.profiles WHERE email = ${cleanEmail}::text AND id != ${targetUserId}::uuid`;

    // 4. Upsert into public.profiles
    const [profile] = await sql`
      INSERT INTO public.profiles (
        id, user_id, email, phone, full_name, role,
        gender, date_of_birth, age,
        address_line1, state, district, city, block, postal_code,
        created_at, updated_at, metadata
      ) VALUES (
        ${targetUserId}::uuid,
        ${computedUserId}::text,
        ${cleanEmail}::text,
        ${formattedPhone}::text,
        ${computedFullName}::text,
        ${assignedRole}::text,
        ${gender || "other"}::text,
        ${dob ? sql`${dob}::date` : null},
        ${age ? Number(age) : null},
        ${addressLine1 || "Ward 4, Khandapada Road"}::text,
        ${state || "Odisha"}::text,
        ${district || "Nayagarh"}::text,
        ${city || "Nayagarh"}::text,
        ${block || "Khandapada"}::text,
        ${postalCode || "752077"}::text,
        now(),
        now(),
        '{}'::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        gender = EXCLUDED.gender,
        date_of_birth = EXCLUDED.date_of_birth,
        age = EXCLUDED.age,
        address_line1 = EXCLUDED.address_line1,
        state = EXCLUDED.state,
        district = EXCLUDED.district,
        city = EXCLUDED.city,
        block = EXCLUDED.block,
        postal_code = EXCLUDED.postal_code,
        updated_at = now()
      RETURNING *
    `;

    // 5. Upsert role-specific profile details
    let roleDetails: any = null;

    // Resolve facility ID if provided or find matching registered facility in profiles
    let resolvedFacilityId: string | null = null;
    let resolvedFacilityName: string = primaryFacilityName || "";

    if (facilityId && typeof facilityId === "string" && facilityId.trim()) {
      try {
        const [f] = await sql`
          SELECT id, full_name, user_id FROM public.profiles
          WHERE id = ${facilityId.trim()}::uuid
          LIMIT 1
        `;
        if (f) {
          resolvedFacilityId = f.id;
          resolvedFacilityName = f.full_name || resolvedFacilityName;
        }
      } catch (err) {
        console.warn("Invalid facilityId uuid lookup:", err);
      }
    }

    if (!resolvedFacilityId && resolvedFacilityName) {
      const trimmedFac = resolvedFacilityName.trim();
      const [f] = await sql`
        SELECT id, full_name, user_id FROM public.profiles
        WHERE role IN ('facility', 'medical')
          AND (
            user_id ILIKE ${trimmedFac}
            OR full_name ILIKE ${trimmedFac}
            OR ${trimmedFac} ILIKE ('%' || full_name || '%')
            OR id::text = ${trimmedFac}
          )
        LIMIT 1
      `;
      if (f) {
        resolvedFacilityId = f.id;
        resolvedFacilityName = f.full_name || resolvedFacilityName;
      }
    }

    if (assignedRole === "patient") {
      const [p] = await sql`
        INSERT INTO public.patient_profiles (
          profile_id, blood_group, disability, primary_facility_name,
          is_affilated_to_org, organization_name, id_in_org, org_id_card,
          chronic_conditions, allergies, emergency_contact_name, emergency_contact_phone,
          metadata, updated_at
        ) VALUES (
          ${targetUserId}::uuid,
          ${bloodGroup || "B+"}::text,
          ${disability || "No"}::text,
          ${resolvedFacilityName || primaryFacilityName || "Community Health Centre (CHC) Khandapada"}::text,
          ${Boolean(isAffilatedToOrg)},
          ${organizationName || null}::text,
          ${idInOrg || null}::text,
          ${orgIdCard || null}::text,
          ${JSON.stringify(chronicConditions || [])}::jsonb,
          ${JSON.stringify(allergies || [])}::jsonb,
          ${emergencyContactName || "Family Member"}::text,
          ${emergencyContactPhone || formattedPhone}::text,
          ${JSON.stringify({ organizationName: organizationName || null })}::jsonb,
          now()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
          blood_group = EXCLUDED.blood_group,
          disability = EXCLUDED.disability,
          primary_facility_name = EXCLUDED.primary_facility_name,
          is_affilated_to_org = EXCLUDED.is_affilated_to_org,
          organization_name = EXCLUDED.organization_name,
          id_in_org = EXCLUDED.id_in_org,
          org_id_card = EXCLUDED.org_id_card,
          chronic_conditions = EXCLUDED.chronic_conditions,
          allergies = EXCLUDED.allergies,
          emergency_contact_name = EXCLUDED.emergency_contact_name,
          emergency_contact_phone = EXCLUDED.emergency_contact_phone,
          metadata = COALESCE(public.patient_profiles.metadata, '{}'::jsonb) || EXCLUDED.metadata,
          updated_at = now()
        RETURNING *
      `;
      roleDetails = p;
    } else if (assignedRole === "doctor") {
      const regNo = medicalRegistrationNumber || stateCouncilReg || `MCI-OD-${Math.floor(2010 + Math.random() * 14)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const stateCouncilRegVal = stateCouncilReg || regNo;
      const hprIdVal = hprId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-4402@hpr`;
      const doctorDesig = designation || specialization || "Senior Attending Physician & Clinical Specialist";
      const shiftScheduleVal = shiftSchedule || shiftTimings || "Morning OPD (08:00 AM - 02:00 PM)";

      const [d] = await sql`
        INSERT INTO public.doctor_profiles (
          profile_id, medical_registration_number, state_council_reg, hpr_id,
          designation, qualification, department, room_number,
          facility_id, facility_name,
          shift_schedule, availability_status, aadhaar_ekyc_verified,
          active_cases_count, emergency_referrals_count, complete_cases_count, teleconsult_count,
          metadata, updated_at
        ) VALUES (
          ${targetUserId}::uuid,
          ${regNo}::text,
          ${stateCouncilRegVal}::text,
          ${hprIdVal}::text,
          ${doctorDesig}::text,
          ${qualification || "MBBS, MD"}::text,
          ${department || "Department of Medicine"}::text,
          ${roomNumber || "OPD Room 102"}::text,
          ${resolvedFacilityId || null}::uuid,
          ${resolvedFacilityName || primaryFacilityName || "Community Health Centre (CHC) Khandapada"}::text,
          ${shiftScheduleVal}::text,
          ${availabilityStatus || "Available"}::text,
          true,
          0,
          0,
          0,
          0,
          ${JSON.stringify({
            specialization: specialization || doctorDesig,
            is_authorized_reviewer: isAuthorizedReviewer !== false,
          })}::jsonb,
          now()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
          medical_registration_number = EXCLUDED.medical_registration_number,
          state_council_reg = EXCLUDED.state_council_reg,
          hpr_id = EXCLUDED.hpr_id,
          designation = EXCLUDED.designation,
          qualification = EXCLUDED.qualification,
          department = EXCLUDED.department,
          room_number = EXCLUDED.room_number,
          facility_id = EXCLUDED.facility_id,
          facility_name = EXCLUDED.facility_name,
          shift_schedule = EXCLUDED.shift_schedule,
          availability_status = EXCLUDED.availability_status,
          metadata = COALESCE(public.doctor_profiles.metadata, '{}'::jsonb) || EXCLUDED.metadata,
          updated_at = now()
        RETURNING *
      `;
      roleDetails = d;
    } else if (assignedRole === "nurse") {
      const [n] = await sql`
        INSERT INTO public.nurse_profiles (
          profile_id, state_council_reg, hpr_id, designation,
          facility_id, facility_name, shift_schedule, aadhaar_ekyc_verified,
          cases_triaged_count, doctor_handoffs_count, emergency_referrals_count,
          resolved_by_me_count, updated_at
        ) VALUES (
          ${targetUserId}::uuid,
          ${stateCouncilReg || `ONRC-${Math.floor(2015 + Math.random() * 9)}-${Math.floor(1000 + Math.random() * 9000)}`}::text,
          ${hprId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-2011@hpr`}::text,
          ${designation || "Senior Staff Nurse & Triage Specialist"}::text,
          ${resolvedFacilityId || null}::uuid,
          ${resolvedFacilityName || primaryFacilityName || "Community Health Centre (CHC) Khandapada"}::text,
          ${shiftSchedule || "Morning Roster (08:00 AM - 04:00 PM)"}::text,
          true,
          0, 0, 0, 0,
          now()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
          state_council_reg = EXCLUDED.state_council_reg,
          hpr_id = EXCLUDED.hpr_id,
          designation = EXCLUDED.designation,
          facility_id = EXCLUDED.facility_id,
          facility_name = EXCLUDED.facility_name,
          shift_schedule = EXCLUDED.shift_schedule,
          updated_at = now()
        RETURNING *
      `;
      roleDetails = n;
    } else if (assignedRole === "facility" || assignedRole === "medical") {
      const [m] = await sql`
        INSERT INTO public.facility_profiles (
          id, profile_id, hpr_id, department, updated_at
        ) VALUES (
          ${targetUserId}::uuid,
          ${targetUserId}::uuid,
          ${hprId || null}::text,
          ${department || "Central Pharmacy & Pathology Counter"}::text,
          now()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
          hpr_id = EXCLUDED.hpr_id,
          department = EXCLUDED.department,
          updated_at = now()
        RETURNING *
      `;
      roleDetails = m;
    } else if (assignedRole === "organization") {
      const orgUniqueCode = orgCode || computedUserId;
      const [o] = await sql`
        INSERT INTO public.organization_profiles (
          profile_id, org_code, name, category, city, state,
          total_workforce, active_screened, contact_email,
          updated_at
        ) VALUES (
          ${targetUserId}::uuid,
          ${orgUniqueCode}::text,
          ${orgName || computedFullName || "NALCO Smelter & Power Complex"}::text,
          ${orgCategory || "Public Sector Undertaking (PSU)"}::text,
          ${city || "Angul"}::text,
          ${state || "Odisha"}::text,
          ${totalWorkforce ? Number(totalWorkforce) : 3200},
          0,
          ${contactEmail || cleanEmail}::text,
          now()
        )
        ON CONFLICT (org_code) DO UPDATE SET
          profile_id = EXCLUDED.profile_id,
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          total_workforce = EXCLUDED.total_workforce,
          contact_email = EXCLUDED.contact_email,
          updated_at = now()
        RETURNING *
      `;
      roleDetails = o;
    } else if (assignedRole === "healthcamp") {
      const campUniqueId = campId || computedUserId;
      const [c] = await sql`
        INSERT INTO public.healthcamp_profiles (
          profile_id, camp_id, mmu_unit_code, camp_name,
          assigned_block, district, lead_officer, operational_status,
          updated_at
        ) VALUES (
          ${targetUserId}::uuid,
          ${campUniqueId}::text,
          ${mmuUnitCode || `MMU-OD-0${Math.floor(1 + Math.random() * 9)}`}::text,
          ${campName || `${district || "Nayagarh"} Rural Mobile Medical Unit #3`}::text,
          ${assignedBlock || block || "Khandapada Block"}::text,
          ${district || "Nayagarh"}::text,
          ${leadOfficer || computedFullName || "Dr. S. Mohapatra"}::text,
          ${operationalStatus || "Active"}::text,
          now()
        )
        ON CONFLICT (camp_id) DO UPDATE SET
          profile_id = EXCLUDED.profile_id,
          mmu_unit_code = EXCLUDED.mmu_unit_code,
          camp_name = EXCLUDED.camp_name,
          assigned_block = EXCLUDED.assigned_block,
          district = EXCLUDED.district,
          lead_officer = EXCLUDED.lead_officer,
          operational_status = EXCLUDED.operational_status,
          updated_at = now()
        RETURNING *
      `;
      roleDetails = c;
    }

    return NextResponse.json({
      success: true,
      message: `Account for ${computedFullName} (${assignedRole.toUpperCase()}) created successfully!`,
      user: {
        id: profile.id,
        userId: profile.user_id,
        email: profile.email,
        phone: profile.phone,
        fullName: profile.full_name,
        role: profile.role,
        gender: profile.gender,
        dateOfBirth: profile.date_of_birth,
        age: profile.age,
        addressLine1: profile.address_line1,
        state: profile.state,
        district: profile.district,
        city: profile.city,
        block: profile.block,
        postalCode: profile.postal_code,
        roleDetails,
      },
      credentials: {
        userId: profile.user_id,
        role: profile.role,
        phone: profile.phone,
        email: profile.email,
        password: effectivePassword,
      }
    });
  } catch (err: any) {
    console.error("Error in /api/admin/register:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Admin registration failed" },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}
