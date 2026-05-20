import { supabase } from "./client";

type AuthResult = { userId: string; needsConfirmation?: boolean } | { error: string };
type IdResult   = { id: string }     | { error: string };

function friendlyAuthError(msg: string): string {
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "This email already has an account.";
  if (msg.includes("Password should") || (msg.includes("password") && msg.includes("length")))
    return "Password must be at least 8 characters.";
  if (msg.includes("invalid") && msg.includes("email"))
    return "Please enter a valid email address.";
  if (msg.includes("Email not confirmed"))
    return "Please confirm your email before signing in.";
  return "Something went wrong. Please try again.";
}

export async function signUpUser(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { name: displayName } },
  });
  if (error) return { error: friendlyAuthError(error.message) };
  if (!data.user) return { error: "Sign up failed — please try again." };
  // session is null when email confirmation is required
  return { userId: data.user.id, needsConfirmation: !data.session };
}

export async function signInUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { error: "Incorrect email or password." };
  if (!data.user) return { error: "Sign in failed — please try again." };
  return { userId: data.user.id };
}

export async function createHousehold(name: string): Promise<IdResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not signed in." };
  const res = await fetch("/api/household/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name: name.trim() }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error ?? "Couldn't create your family home. Try again." };
  return { id: String(json.id) };
}

export async function createChild(
  name: string,
  age:  string,
  householdId: string,
): Promise<IdResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not signed in." };
  const res = await fetch("/api/household/create-child", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name: name.trim(), age, householdId }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error ?? "Couldn't save your child's profile. Try again." };
  return { id: String(json.id) };
}

export async function createInvite(
  email:       string,
  householdId: string,
  inviterName: string,
  childName:   string,
  note?:       string,
): Promise<void> {
  await supabase.rpc("create_household_invite", {
    p_email:        email.trim().toLowerCase(),
    p_household_id: householdId,
    p_inviter_name: inviterName,
    p_child_name:   childName,
    p_note:         note ?? null,
  });
}

export async function lookupInvite(email: string): Promise<{
  invite_id:      string;
  household_id:   string;
  household_name: string;
  inviter_name:   string | null;
  child_name:     string | null;
} | null> {
  const res = await fetch("/api/invites/lookup", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!json.found) return null;
  return json;
}

export async function acceptInvite(inviteId: string, userId: string): Promise<{ error?: string }> {
  const res = await fetch("/api/invites/accept", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ invite_id: inviteId, user_id: userId }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error ?? "Failed to join household." };
  return {};
}
