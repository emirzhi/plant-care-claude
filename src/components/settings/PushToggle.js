"use client";

import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
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

  if (!checked) {
    return <div className="card h-[74px] animate-pulse bg-surface-muted" />;
  }

  if (!supported) {
    return (
      <p className="card px-4 py-3.5 text-sm text-ink-muted">
        This browser doesn&rsquo;t support push notifications.
      </p>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
              subscribed
                ? "bg-brand-soft text-brand-soft-ink"
                : "bg-surface-muted text-ink-faint"
            }`}
          >
            <FiBell size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Notifications</p>
            <p className="truncate text-xs text-ink-muted">
              {subscribed ? "On for this device" : "Off on this device"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={busy}
          role="switch"
          aria-checked={subscribed}
          aria-label="Toggle notifications on this device"
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-55 ${
            subscribed ? "bg-brand" : "bg-line-strong"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
              subscribed ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <p className="mt-3 border-t border-line pt-3 text-xs text-ink-faint">
        Each device needs to be enabled separately.
      </p>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
