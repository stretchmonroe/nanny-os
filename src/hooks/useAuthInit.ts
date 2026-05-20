"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

export function useAuthInit() {
  const { setActiveChild, setMemberNames, setCurrentUserRole } = useAppStore();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership) return;

      setCurrentUserRole(membership.role as "nanny" | "parent");

      // Load children in this household
      const { data: children } = await supabase
        .from("children")
        .select("id, name, age")
        .eq("household_id", membership.household_id)
        .order("created_at", { ascending: true })
        .limit(10);

      if (children && children.length > 0) {
        const storedId = useAppStore.getState().activeChildId;
        const match = children.find(c => c.id === storedId) ?? children[0];
        setActiveChild({
          id:   String(match.id),
          name: String(match.name),
          age:  String(match.age),
        });
      }

      // Load household member display names for attribution
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      try {
        const res = await fetch("/api/care-circle", {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.demo && Array.isArray(data.members)) {
          const names = { nanny: "Caregiver", parent: "Parent" };
          for (const m of data.members as { role: string; display_name: string }[]) {
            if (m.role === "nanny")  names.nanny  = m.display_name;
            if (m.role === "parent") names.parent = m.display_name;
          }
          setMemberNames(names);
        }
      } catch {
        // keep defaults
      }
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
