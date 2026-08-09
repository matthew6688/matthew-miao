const beaconSource = 'https://static.cloudflareinsights.com/beacon.min.js'

function analyticsToken() {
  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim()
  return token && /^[A-Za-z0-9_-]{20,80}$/.test(token) ? token : null
}

export function CloudflareWebAnalytics() {
  const token = analyticsToken()
  if (!token) return null

  return (
    <script
      defer
      src={beaconSource}
      data-cf-beacon={JSON.stringify({ token })}
      data-cloudflare-web-analytics=""
    />
  )
}
