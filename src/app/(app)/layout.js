import Link from "next/link";
import { GiPlantRoots } from "react-icons/gi";
import { FiSettings } from "react-icons/fi";
import SignOutButton from "@/components/layout/SignOutButton";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/plants" className="flex items-center gap-2 font-semibold">
            <GiPlantRoots size={22} className="text-green-700" />
            Plant Care
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
            >
              <FiSettings size={16} />
              Settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
