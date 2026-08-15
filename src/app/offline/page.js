import { FiWifiOff } from "react-icons/fi";

// Offline shell fallback — served by the service worker for document
// requests when the network is unavailable (see fallbacks in src/app/sw.js).
export const metadata = {
  title: "Offline — Plant Care",
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-xs text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-faint">
          <FiWifiOff size={24} />
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          You&rsquo;re offline
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Pages you&rsquo;ve already visited still work. Reconnect to load the rest.
        </p>
      </div>
    </main>
  );
}
