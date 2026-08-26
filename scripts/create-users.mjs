import { createClient } from "@supabase/supabase-js";

const requiredEnvironment = ["SUPABASE_SERVICE_ROLE_KEY", "DEFAULT_USER_PASSWORD"];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length > 0) {
  throw new Error(`Variabili mancanti: ${missingEnvironment.join(", ")}`);
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Variabile mancante: SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL");
}

const users = ["ilaria.magistrelli@libero.it", "camillares@gmail.com"];
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getExistingUser(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error(`Impossibile cercare l’utente ${email}: ${error.message}`);
    }

    const existingUser = data.users.find((user) => user.email?.toLowerCase() === email);
    if (existingUser) {
      return existingUser;
    }
    if (data.users.length < 1000) {
      return null;
    }
  }
}

async function ensureUser(email) {
  const existingUser = await getExistingUser(email);
  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: process.env.DEFAULT_USER_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      throw new Error(`Impossibile aggiornare ${email}: ${error.message}`);
    }
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: process.env.DEFAULT_USER_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Impossibile creare ${email}: ${error?.message ?? "utente non restituito"}`);
  }
  return data.user;
}

async function assignSectors(userId, email) {
  const { data: sectors, error: sectorsError } = await supabase
    .from("sectors")
    .select("id, code")
    .in("code", ["artistic", "rhythmic"]);
  if (sectorsError) {
    throw new Error(`Impossibile leggere i settori per ${email}: ${sectorsError.message}`);
  }

  const sectorByCode = new Map(sectors.map((sector) => [sector.code, sector.id]));
  const missingSectors = ["artistic", "rhythmic"].filter((code) => !sectorByCode.has(code));
  if (missingSectors.length > 0) {
    throw new Error(`Settori mancanti: ${missingSectors.join(", ")}`);
  }

  const { error } = await supabase.from("user_sectors").upsert(
    ["artistic", "rhythmic"].map((code) => ({
      user_id: userId,
      sector_id: sectorByCode.get(code),
    })),
    { onConflict: "user_id,sector_id" },
  );
  if (error) {
    throw new Error(`Impossibile assegnare i settori a ${email}: ${error.message}`);
  }
}

for (const email of users) {
  const user = await ensureUser(email);
  await assignSectors(user.id, email);
  console.log(`Configurato ${email}: artistic, rhythmic`);
}