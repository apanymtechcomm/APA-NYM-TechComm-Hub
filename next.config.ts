import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

// Two-mode build (PROJ-033): BUILD_MODE=static exports the public site to
// dist/ for GitHub Pages (under /APA-NYM-TechComm-Hub/); unset → normal
// Next server (dev + admin).
const isStatic = process.env.BUILD_MODE === 'static'
const GITHUB_PAGES_BASE = '/APA-NYM-TechComm-Hub'

const nextConfig: NextConfig = {
  ...(isStatic
    ? {
        output: 'export' as const,
        trailingSlash: true,
        distDir: 'dist',
        basePath: GITHUB_PAGES_BASE,
        images: { unoptimized: true },
        typescript: { ignoreBuildErrors: true },
      }
    : {}),
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    // Static export: the image optimizer is a server feature and cannot ship;
    // media files must land as-is in the export.
    ...(isStatic
      ? { unoptimized: true, localPatterns: [{ pathname: '/api/media/file/**' }] }
      : {}),
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
