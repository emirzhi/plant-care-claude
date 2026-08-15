// Browser-side helpers for the Push API. Kept out of the component so the
// base64 conversion and the SW-registration dance are testable/reusable.

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// VAPID public keys are base64url; PushManager wants a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// `navigator.serviceWorker.ready` NEVER settles when no service worker is
// registered — it isn't rejected, it just hangs. In `next dev` Serwist is
// skipped entirely, so awaiting it there makes the subscribe button spin
// forever with no error. Always go through this helper, which resolves to
// null instead of hanging.
export async function getActiveRegistration({ timeoutMs = 6000 } = {}) {
  if (!isPushSupported()) return null;

  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

const NO_SERVICE_WORKER_MESSAGE =
  "No service worker is running, so notifications can't be enabled. There is no service worker in `npm run dev` — build and start the app (`npm run build && npm start`) to test push.";

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Push notifications aren't supported in this browser.");
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY isn't set in this build.");
  }

  // Check for the service worker BEFORE prompting: otherwise we burn the
  // one-shot permission prompt and then fail anyway.
  const registration = await getActiveRegistration();
  if (!registration) {
    throw new Error(NO_SERVICE_WORKER_MESSAGE);
  }

  const permission = await Notification.requestPermission();
  if (permission === "denied") {
    throw new Error(
      "Notifications are blocked for this site. Enable them in your browser's site settings, then try again.",
    );
  }
  if (permission !== "granted") {
    throw new Error("Notification permission wasn't granted.");
  }

  // Reuse an existing subscription if the browser already has one for this
  // registration — calling subscribe() twice with a different key throws.
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      ),
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Couldn't save the subscription.");
  }

  return subscription;
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}
