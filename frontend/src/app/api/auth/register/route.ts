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
      firstName,
      middleName,
      lastName,
      fullName,
      dob,
      age,
      phone,
      email,
      gender,
      bloodGroup,
      addressLine1,
      state,
      district,
      city,
      block,
      postalCode,
      disability,
      password,
      patientUhid,
      userId,
      isAffilatedToOrg,
      organizationName,
      idInOrg,
      orgIdCard,
    } = body;

    const computedFullName = (
      fullName ||
      `${firstName || ""} ${middleName ? middleName + " " : ""}${lastName || ""}`
    ).trim() || "Healthcare User";

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanDigits = phone ? phone.replace(/\D/g, "") : "";
    const digitsPhone = cleanDigits ? (cleanDigits.startsWith("91") ? cleanDigits : `91${cleanDigits.slice(-10)}`) : null;
    const formattedPhone = cleanDigits ? `+91 ${cleanDigits.slice(-10)}` : null;
    const computedUhid = patientUhid || `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Search for existing users matching email or phone or userId
    let existingUsers: any[] = [];
    if (cleanEmail && digitsPhone) {
      existingUsers = await sql`
        SELECT id, email, phone FROM auth.users
        WHERE email = ${cleanEmail}::text OR phone = ${digitsPhone}::text
      `;
    } else if (cleanEmail) {
      existingUsers = await sql`
        SELECT id, email, phone FROM auth.users
        WHERE email = ${cleanEmail}::text
      `;
    } else if (digitsPhone) {
      existingUsers = await sql`
        SELECT id, email, phone FROM auth.users
        WHERE phone = ${digitsPhone}::text
      `;
    }

    let targetUserId: string;
    let duplicateIds: string[] = [];

    if (existingUsers.length > 0) {
      targetUserId = existingUsers[0].id;
      duplicateIds = existingUsers.slice(1).map((u: any) => u.id);
    } else if (userId && /^[0-9a-fA-F-]{36}$/.test(userId)) {
      targetUserId = userId;
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
          crypt(${password || "Triage@2026"}::text, gen_salt('bf', 10)),
          now(),
          now(),
          '{"provider":"email","providers":["email","phone"]}'::jsonb,
          jsonb_build_object(
            'full_name', ${computedFullName}::text,
            'phone', ${formattedPhone}::text,
            'role', 'patient'::text,
            'user_id', ${computedUhid}::text,
            'patient_uhid', ${computedUhid}::text
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

    // 2. Delete duplicate accounts to eliminate collision
    for (const dId of duplicateIds) {
      await sql`DELETE FROM public.patient_profiles WHERE profile_id = ${dId}::uuid`;
      await sql`DELETE FROM public.profiles WHERE id = ${dId}::uuid`;
      await sql`DELETE FROM auth.users WHERE id = ${dId}::uuid`;
    }

    // 3. Update primary user in auth.users so BOTH email and phone belong to this single user
    await sql`
      UPDATE auth.users
      SET
        email = COALESCE(${cleanEmail}::text, email),
        phone = COALESCE(${digitsPhone}::text, phone),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object(
          'full_name', ${computedFullName}::text,
          'phone', ${formattedPhone}::text,
          'role', 'patient'::text,
          'user_id', ${computedUhid}::text,
          'patient_uhid', ${computedUhid}::text
        ),
        updated_at = now()
      WHERE id = ${targetUserId}::uuid
    `;

    if (password) {
      await sql`
        UPDATE auth.users
        SET encrypted_password = crypt(${password}::text, gen_salt('bf', 10))
        WHERE id = ${targetUserId}::uuid
      `;
    }

    // 4. Remove any conflicting profiles from other accounts with same email
    if (cleanEmail) {
      await sql`DELETE FROM public.profiles WHERE email = ${cleanEmail}::text AND id != ${targetUserId}::uuid`;
    }

    // 5. Upsert common demographic details into public.profiles
    const [profile] = await sql`
      INSERT INTO public.profiles (
        id, user_id, email, phone, full_name, role,
        gender, date_of_birth, age,
        address_line1, state, district, city, block, postal_code,
        created_at, updated_at, metadata
      ) VALUES (
        ${targetUserId}::uuid,
        ${computedUhid}::text,
        ${cleanEmail}::text,
        ${formattedPhone}::text,
        ${computedFullName}::text,
        'patient'::text,
        ${gender || "male"}::text,
        ${dob ? sql`${dob}::date` : null},
        ${age ? Number(age) : null},
        ${addressLine1 || ""}::text,
        ${state || ""}::text,
        ${district || ""}::text,
        ${city || ""}::text,
        ${block || ""}::text,
        ${postalCode || ""}::text,
        now(),
        now(),
        '{}'::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        user_id = COALESCE(public.profiles.user_id, EXCLUDED.user_id),
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

    // 6. Upsert patient-specific clinical & affiliation details into public.patient_profiles
    const [patientProfile] = await sql`
      INSERT INTO public.patient_profiles (
        profile_id, blood_group, disability, primary_facility_name,
        is_affilated_to_org, organization_name, id_in_org, org_id_card,
        metadata, updated_at
      ) VALUES (
        ${profile.id}::uuid,
        ${bloodGroup || "B+"}::text,
        ${disability || "No"}::text,
        'Community Health Centre (CHC) Khandapada'::text,
        ${Boolean(isAffilatedToOrg)},
        ${organizationName || null}::text,
        ${idInOrg || null}::text,
        ${orgIdCard || null}::text,
        ${JSON.stringify({ organizationName: organizationName || null })}::jsonb,
        now()
      )
      ON CONFLICT (profile_id) DO UPDATE SET
        blood_group = EXCLUDED.blood_group,
        disability = EXCLUDED.disability,
        is_affilated_to_org = EXCLUDED.is_affilated_to_org,
        organization_name = EXCLUDED.organization_name,
        id_in_org = EXCLUDED.id_in_org,
        org_id_card = EXCLUDED.org_id_card,
        metadata = COALESCE(public.patient_profiles.metadata, '{}'::jsonb) || EXCLUDED.metadata,
        updated_at = now()
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        userId: profile.user_id,
        email: profile.email,
        phone: profile.phone,
        fullName: profile.full_name,
        firstName: profile.full_name.split(" ")[0],
        lastName: profile.full_name.includes(" ") ? profile.full_name.split(" ").slice(1).join(" ") : "",
        role: profile.role,
        patientUhid: profile.user_id,
        gender: profile.gender,
        dateOfBirth: profile.date_of_birth,
        age: profile.age,
        bloodGroup: patientProfile?.blood_group || bloodGroup,
        facilityName: patientProfile?.primary_facility_name || "Community Health Centre (CHC) Khandapada",
        addressLine1: profile.address_line1,
        state: profile.state,
        district: profile.district,
        city: profile.city,
        block: profile.block,
        postalCode: profile.postal_code,
        disability: patientProfile?.disability || disability,
        isAffilatedToOrg: patientProfile?.is_affilated_to_org ?? Boolean(isAffilatedToOrg),
        organizationName: patientProfile?.organization_name || organizationName || "",
        idInOrg: patientProfile?.id_in_org || idInOrg,
        orgIdCard: patientProfile?.org_id_card || orgIdCard,
      }
    });
  } catch (err: any) {
    console.error("Error in /api/auth/register:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Registration failed" },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}
