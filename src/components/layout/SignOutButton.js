"use client";

import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Sign out"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-ink"
    >
      <FiLogOut size={17} />
    </button>
  );
}
