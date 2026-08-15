"use client";

import { useEffect, useState } from "react";
import { FiBell, FiBellOff } from "react-icons/fi";
import {
  isPushSupported,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/subscribeClient";

export default function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      setChecked(true);
      return;
    }
    getExistingSubscription()
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => setSubscribed(false))
      .finally(() => setChecked(true));
  }, []);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush();
        setSubscribed(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!checked) return null;

  if (!supported) {
    return (
      <p className="text-sm text-neutral-500">
        This browser doesn&rsquo;t support push notifications.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
          subscribed
            ? "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        {subscribed ? <FiBellOff size={16} /> : <FiBell size={16} />}
        {busy
          ? "Working..."
          : subscribed
            ? "Disable notifications on this device"
            : "Enable notifications on this device"}
      </button>
      <p className="mt-2 text-xs text-neutral-500">
        {subscribed
          ? "This device will receive your daily digest of overdue tasks."
          : "Each device you want reminders on needs to be enabled separately."}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
