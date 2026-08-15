import Link from "next/link";
import { GiPlantRoots } from "react-icons/gi";
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
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
