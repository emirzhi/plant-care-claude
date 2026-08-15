import webpush from "web-push";

let configured = false;

// VAPID keys were generated with `npx web-push generate-vapid-keys` and live
// in .env.local (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
export function getWebPush() {
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
    configured = true;
  }
  return webpush;
}

// Sends one notification. Returns { ok, gone } — `gone` means the push
// service reported the subscription is dead (404/410), so the caller should
// delete that row rather than retrying it forever.
export async function sendNotification(subscription, payload) {
  try {
    await getWebPush().sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true, gone: false };
  } catch (err) {
    const gone = err.statusCode === 404 || err.statusCode === 410;
    return { ok: false, gone, error: err.message };
  }
}
