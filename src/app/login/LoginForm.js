"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { PiPlantFill } from "react-icons/pi";
import { FiCheckCircle, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ nextPath = "/plants", callbackError = null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  async function handleMagicLinkSubmit(event) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-sm">
            <PiPlantFill size={28} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Plant Care
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Snap a photo, get a care plan, never miss a watering.
          </p>
        </div>

        <div className="card p-6 shadow-sm">
          {callbackError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger-soft-ink">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <span>Sign-in failed. Please try again.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn-secondary w-full"
          >
            <FcGoogle size={18} />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">
              or
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {status === "sent" ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-brand-soft px-3.5 py-3 text-sm text-brand-soft-ink">
              <FiCheckCircle className="mt-0.5 shrink-0" size={16} />
              <span>
                Check <strong className="font-semibold">{email}</strong> for a link
                to sign in.
              </span>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
              {status === "error" && (
                <p className="text-sm text-danger">{errorMessage}</p>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary w-full"
              >
                {status === "sending" ? "Sending..." : "Email me a link"}
                {status !== "sending" && <FiArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          No password needed — we&rsquo;ll email you a secure sign-in link.
        </p>
      </div>
    </main>
  );
}
