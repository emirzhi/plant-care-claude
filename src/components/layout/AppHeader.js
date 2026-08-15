import Link from "next/link";
import { PiPlantFill } from "react-icons/pi";
import { FiSettings } from "react-icons/fi";
import SignOutButton from "@/components/layout/SignOutButton";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link
          href="/plants"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-ink">
            <PiPlantFill size={16} />
          </span>
          Plant Care
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-ink"
          >
            <FiSettings size={17} />
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
