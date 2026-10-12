/**
 * Media URLs: Payload media docs resolve to /api/media/file/<name> (a route
 * handler, which cannot ship in a static export). The files physically live in
 * public/media/, so rewrite to /media/<name> and prefix the GitHub Pages base
 * path when exporting (NEXT_PUBLIC_BASE_PATH is baked in at build time).
 *
 * Idempotent: strips any existing origin, strips an already-present basePath
 * (the export pipeline can add one), and strips the export trailing slash
 * before re-prefixing exactly once.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  let u = url.replace(/^https?:\/\/[^/]+/, '') // strip origin if absolute
  if (base && u.startsWith(base)) u = u.slice(base.length)
  u = u.replace(/^\/api\/media\/file\//, '/media/')
  u = u.replace(/\/+$/, '') // export trailingSlash
  return base + u
}