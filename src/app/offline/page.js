import { FiWifiOff } from "react-icons/fi";

// Offline shell fallback — served by the service worker for document
// requests when the network is unavailable (see fallbacks in src/app/sw.js).
export const metadata = {
  title: "Offline — Plant Care",
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-sm text-center">
        <FiWifiOff size={40} className="mx-auto text-neutral-300" />
        <h1 className="mt-4 text-lg font-semibold">You&rsquo;re offline</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Plant Care needs a connection to load your plants. Pages you&rsquo;ve
          already visited stay available — reconnect to see the latest.
        </p>
      </div>
    </main>
  );
}
