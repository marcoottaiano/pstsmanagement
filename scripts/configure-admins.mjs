import { createClient } from "@supabase/supabase-js";

const adminEmails = [
  "camillares@gmail.com",
  "ilaria.magistrelli@libero.it",
  "marco.ottaiano00@gmail.com",
];

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !adminKey) {
  throw new Error(
    "Configura SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

async function listAllUsers() {
  const users = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error(`Impossibile leggere gli utenti Auth: ${error.message}`);
    }

    users.push(...data.users);
    if (data.users.length < 1000) {
      return users;
    }
  }
}

const users = await listAllUsers();
const usersByEmail = new Map(
  users.filter((user) => user.email).map((user) => [user.email.toLowerCase(), user]),
);
const missingEmails = adminEmails.filter((email) => !usersByEmail.has(email));

if (missingEmails.length > 0) {
  throw new Error(`Utenti Auth mancanti: ${missingEmails.join(", ")}`);
}

const adminIds = adminEmails.map((email) => usersByEmail.get(email).id);
const { error: updateError } = await supabase
  .from("profiles")
  .update({ role: "ADMIN" })
  .in("id", adminIds);

if (updateError) {
  throw new Error(`Impossibile assegnare il ruolo admin: ${updateError.message}`);
}

const { data: configuredProfiles, error: verificationError } = await supabase
  .from("profiles")
  .select("id, email, role")
  .in("id", adminIds);

if (verificationError) {
  throw new Error(`Impossibile verificare i ruoli admin: ${verificationError.message}`);
}

const configuredAdminIds = new Set(
  configuredProfiles.filter((profile) => profile.role === "ADMIN").map((profile) => profile.id),
);
const missingProfiles = adminIds.filter((userId) => !configuredAdminIds.has(userId));

if (missingProfiles.length > 0) {
  throw new Error("Uno o più profili non sono stati configurati come admin.");
}

configuredProfiles.forEach((profile) => {
  console.log(`Configurato admin: ${profile.email}`);
});
