import withSerwistInit from "@serwist/next";

// IMPORTANT: @serwist/next only hooks into the `webpack(config, options)`
// callback. Turbopack never calls that hook, so under Turbopack the
// InjectManifest plugin never runs and public/sw.js is silently NOT
// generated — no error, no warning. That's why `npm run build` passes
// `--webpack`. See CLAUDE.md "Build gotchas".
//
// Dev intentionally keeps Turbopack (faster) with Serwist disabled — there's
// no service worker in `next dev`. Test PWA/offline/push behavior against a
// production build (`npm run build && npm start`).
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.js",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  reloadOnOnline: true,
  // The offline fallback must be precached explicitly — @serwist/next only
  // auto-precaches build assets and public/ files, not rendered App Router
  // routes. Note: supplying `additionalPrecacheEntries` REPLACES the
  // automatic public/ scan (see @serwist/next src), so the icons/manifest are
  // left to runtime caching instead, which is fine — they're only needed
  // online at install time.
  additionalPrecacheEntries: [{ url: "/offline", revision: Date.now().toString() }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
