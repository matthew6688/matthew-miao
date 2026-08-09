import { cacheLife } from 'next/cache'

import { bundledAssets } from './generated-worker-content'

// Design-language tokens resolved to sRGB for satori (no oklch support).
// Sources: --paper / --paper-ink / --foreground / --muted-foreground /
// --border in app/globals.css.
export const ogColors = {
  paper: '#f9f8f5',
  paperInk: '#6b6961',
  foreground: '#0a0a0a',
  mutedForeground: '#737373',
  border: '#e5e5e5',
} as const

// Fonts are read per render (not cached) to keep font ArrayBuffer data
// intact for satori.
export async function ogRuntimeFonts() {
  const [regular, semibold] = [
    bundledAssets['/fonts/og-regular.ttf'],
    bundledAssets['/fonts/og-semibold.ttf'],
  ].map((font) => {
    // Satori transfers/detaches font buffers while rendering. Allocate an
    // explicit standalone buffer on every request; Workers' Buffer polyfill
    // may otherwise reuse backing storage and later OG renders hang.
    const decoded = Buffer.from(font, 'base64')
    const copy = new ArrayBuffer(decoded.byteLength)
    new Uint8Array(copy).set(decoded)
    return copy
  })
  return [
    { name: 'Frex Sans GB', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Frex Sans GB', data: semibold, weight: 600 as const, style: 'normal' as const },
  ]
}

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

export async function coverDataUri(publicSrc: string): Promise<string> {
  'use cache'
  cacheLife('max')

  // cover.src is the public /content/... URL; the file lives in content/
  const relativePath = publicSrc.startsWith('/content/')
    ? publicSrc.slice('/content/'.length)
    : null

  if (!relativePath || relativePath.split('/').includes('..')) {
    throw new Error('Invalid OG cover path')
  }

  const asset = bundledAssets[publicSrc as keyof typeof bundledAssets]
  if (!asset) throw new Error(`Unbundled OG cover: ${publicSrc}`)
  const ext = (relativePath.split('.').pop() ?? 'png').toLowerCase()
  return `data:${MIME[ext] ?? 'image/png'};base64,${asset}`
}

export async function publicImageDataUri(publicSrc: string): Promise<string> {
  'use cache'
  cacheLife('max')

  const relativePath = publicSrc.startsWith('/') ? publicSrc.slice(1) : null

  if (!relativePath || relativePath.split('/').includes('..')) {
    throw new Error('Invalid public image path')
  }

  const asset = bundledAssets[publicSrc as keyof typeof bundledAssets]
  if (!asset) throw new Error(`Unbundled public OG asset: ${publicSrc}`)
  const ext = (relativePath.split('.').pop() ?? 'png').toLowerCase()
  return `data:${MIME[ext] ?? 'image/png'};base64,${asset}`
}

// The drafting sheet: page background plus the boxed guides from the
// ambient-background layer (dashed hairlines, ~40px insets at OG scale).
export function OgSheet({ children }: { children: React.ReactNode }) {
  const guide = `1px dashed ${ogColors.border}`
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 40,
          bottom: 40,
          left: 48,
          right: 48,
          borderTop: guide,
          borderBottom: guide,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 48,
          right: 48,
          borderLeft: guide,
          borderRight: guide,
          display: 'flex',
        }}
      />
      {children}
    </div>
  )
}

// The instant-print cover as satori JSX — same proportions as .polaroid:
// 2% frame, empty 28px bottom band, hairline ring, rest shadow, slug tilt.
export function OgPolaroid({
  src,
  tilt,
  width = 432,
}: {
  src: string
  tilt: number
  width?: number
}) {
  const pad = width * 0.02
  const photoWidth = width - pad * 2
  const photoHeight = (photoWidth * 9) / 16
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        padding: `${pad}px ${pad}px 0`,
        backgroundColor: ogColors.paper,
        boxShadow: '0 0 0 1px rgb(0 0 0 / 0.04), 0 4px 8px -2px rgb(0 0 0 / 0.18)',
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={photoWidth}
          height={photoHeight}
          style={{ objectFit: 'cover', width: photoWidth, height: photoHeight }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: photoWidth,
            height: photoHeight,
            boxShadow: 'inset 0 0 3px rgb(0 0 0 / 0.14)',
            display: 'flex',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          height: 28,
        }}
      />
    </div>
  )
}
