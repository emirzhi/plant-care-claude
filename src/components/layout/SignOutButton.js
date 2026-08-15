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
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
    >
      <FiLogOut size={16} />
      Sign out
    </button>
  );
}
