import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

// @serwist/next only hooks into the `webpack(config, options)` callback.
// Turbopack never calls that hook, so the InjectManifest plugin never runs and
// public/sw.js is not generated — hence `npm run build` passes `--webpack`.
//
// The wrapper injects a `webpack` key even when `disable: true`, and Next 16
// hard-errors on "a `webpack` config and no `turbopack` config" under
// Turbopack. So we only apply the wrapper for production builds; `next dev`
// gets a plain config and keeps using Turbopack (there is no service worker in
// dev — test PWA/offline/push against `npm run build && npm start`).
//
// Keeping the wrapper OFF in dev but ON in production is also what preserves
// the safety net: a plain `next build` (Turbopack, no --webpack) still fails
// loudly rather than quietly producing no service worker. Do not "fix" that by
// adding a `turbopack: {}` key here — see CLAUDE.md "Build gotchas".
// withSerwistInit() is called only in the production branch — calling it at
// module scope prints a Turbopack warning during `next dev` even when its
// result is never used.
const isProductionBuild = process.env.NODE_ENV === "production";

export default isProductionBuild
  ? withSerwistInit({
      swSrc: "src/app/sw.js",
      swDest: "public/sw.js",
      reloadOnOnline: true,
      // The offline fallback must be precached explicitly — @serwist/next only
      // auto-precaches build assets and public/ files, not rendered App Router
      // routes. Note: supplying `additionalPrecacheEntries` REPLACES the
      // automatic public/ scan (see @serwist/next src), so the icons/manifest
      // are left to runtime caching instead, which is fine — they're only
      // needed online at install time.
      additionalPrecacheEntries: [
        { url: "/offline", revision: Date.now().toString() },
      ],
    })(nextConfig)
  : nextConfig;
