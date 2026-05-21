"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

const DISMISS_KEY = "ankur-profile-setup-v1";

export function ProfileSetupCard() {
  const {
    activeChild,
    profileFullName,
    childBirthDate,
    setProfileFullName,
    setChildBirthDate,
    setActiveChild,
  } = useAppStore();

  // Null = not yet read from localStorage (SSR guard)
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  // Controlled form state
  const [parentName, setParentName] = useState("");
  const [childName,  setChildName]  = useState("");
  const [birthday,   setBirthday]   = useState("");
  const [photoLocal, setPhotoLocal] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setParentName(profileFullName ?? "");
    setChildName(activeChild.name ?? "");
    setBirthday(childBirthDate ?? "");
  }, [profileFullName, activeChild.name, childBirthDate]);

  const missingParent  = !profileFullName;
  const missingChild   = !activeChild.name;
  const missingBirthday = !childBirthDate;
  const hasAnything = missingParent || missingChild || missingBirthday;

  // Don't render until we've read localStorage, or if nothing is missing, or dismissed
  if (dismissed === null || !hasAnything || dismissed || done) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoLocal(URL.createObjectURL(file));
  }

  async function save() {
    setError("");
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const tok = session.access_token;

      if (missingParent && parentName.trim()) {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" },
          body: JSON.stringify({ full_name: parentName.trim() }),
        });
        if (res.ok) setProfileFullName(parentName.trim());
      }

      const patch: Record<string, string> = {};
      if (missingChild   && childName.trim()) patch.name       = childName.trim();
      if (missingBirthday && birthday.trim()) patch.birth_date = birthday.trim();

      if (Object.keys(patch).length) {
        const res = await fetch("/api/child", {
          method: "PATCH",
          headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" },
          body: JSON.stringify({ child_id: activeChild.id, ...patch }),
        });
        if (res.ok) {
          if (patch.name)       setActiveChild({ ...activeChild, name: patch.name });
          if (patch.birth_date) setChildBirthDate(patch.birth_date);
        }
      }

      setDone(true);
    } catch {
      setError("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    (missingParent   ? parentName.trim().length > 0 : false) ||
    (missingChild    ? childName.trim().length  > 0 : false) ||
    (missingBirthday ? birthday.trim().length   > 0 : false);

  return (
    <AnimatePresence>
      <motion.div
        key="profile-setup-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        style={{
          margin: "0 16px 2px",
          borderRadius: 20,
          background: "#EAF2EC",
          border: "1.5px solid rgba(106,156,128,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 16px 0" }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              🌱 Finish setting up
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700, color: "#261E18", lineHeight: 1.3 }}>
              Personalise care for{" "}
              <span style={{ color: "#6A9C80" }}>{activeChild.name || "your child"}</span>
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#7A6D62", lineHeight: 1.4 }}>
              Optional — skip anytime and come back later.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#A4C2B0", flexShrink: 0, marginTop: -2, marginRight: -4 }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {missingParent && (
            <Field
              label="Your name"
              value={parentName}
              onChange={setParentName}
              placeholder="How should Sprout address you?"
            />
          )}
          {missingChild && (
            <Field
              label="Child's full name"
              value={childName}
              onChange={setChildName}
              placeholder={activeChild.name || "e.g. Sofia Amara"}
            />
          )}
          {missingBirthday && (
            <Field
              label="Birthday"
              value={birthday}
              onChange={setBirthday}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          )}

          {/* Photo — local preview only; upload requires storage bucket setup */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Child&apos;s photo
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                background: "white", border: "1.5px dashed rgba(106,156,128,0.28)",
                borderRadius: 14, padding: "10px 14px", cursor: "pointer",
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                background: "#EAF2EC", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {photoLocal
                  ? <img src={photoLocal} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 20 }}>🌸</span>
                }
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#261E18", lineHeight: 1.3 }}>
                  {photoLocal ? "Change photo" : "Add a photo"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#7A6D62" }}>
                  Tap to choose from your camera roll
                </p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: "#C0392B", fontWeight: 600 }}>{error}</p>
          )}

          <button
            onClick={save}
            disabled={saving || !canSave}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 14, border: "none",
              background: canSave && !saving ? "#6A9C80" : "rgba(106,156,128,0.35)",
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: canSave && !saving ? "pointer" : "default",
              marginTop: 2, transition: "background 0.2s ease",
            }}
          >
            {saving ? "Saving…" : "Save details"}
          </button>

          <button
            onClick={dismiss}
            style={{
              background: "none", border: "none", width: "100%",
              fontSize: 12, fontWeight: 500, color: "#A4C2B0",
              cursor: "pointer", padding: "2px 0",
            }}
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string;
}) {
  return (
    <div>
      <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 14px", fontSize: 14, fontWeight: 500,
          border: "1.5px solid rgba(106,156,128,0.15)", borderRadius: 14,
          background: "white", color: "#261E18", boxSizing: "border-box", outline: "none",
          transition: "border-color 0.15s ease",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(106,156,128,0.5)"; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(106,156,128,0.15)"; }}
      />
    </div>
  );
}
