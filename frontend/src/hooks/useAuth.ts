import { useEffect, useState } from "react";
import * as authService from "../services/auth.service";
import type { Profile } from "../types";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const user = await authService.getCurrentUser();
      if (!mounted) return;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setEmail(user.email);

      try {
        const p = await authService.getProfile(user.id);
        if (mounted) setProfile(p);
      } catch {
        // profile may not exist yet
      }
      if (mounted) setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await authService.signOut();
  }

  return { userId, email, profile, loading, logout };
}
