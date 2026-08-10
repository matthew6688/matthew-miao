const baseUrl = process.argv[2]
const maxAttempts = 40
const retryDelayMs = 3_000

if (!baseUrl) {
  throw new Error('Usage: node scripts/wait-for-cloudflare-deployment.mjs <base-url>')
}

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

function scriptUrls(html, documentUrl) {
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js(?:\?[^"]*)?)"/gu)].map(
    ([, source]) => new URL(source, documentUrl).href,
  )
}

async function deploymentIsConverged(attempt) {
  const documentUrl = new URL(baseUrl)
  documentUrl.searchParams.set('__deployment_probe', `${Date.now()}-${attempt}`)

  const documentResponse = await fetch(documentUrl, {
    headers: { 'cache-control': 'no-cache' },
  })
  if (!documentResponse.ok) return false

  const scripts = scriptUrls(await documentResponse.text(), documentUrl)
  if (!scripts.length) return false

  const responses = await Promise.all(
    scripts.map((url) => fetch(url, { headers: { 'cache-control': 'no-cache' } })),
  )

  return responses.every((response) => {
    const contentType = response.headers.get('content-type') ?? ''
    return response.ok && /(?:java|ecma)script/iu.test(contentType)
  })
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    if (await deploymentIsConverged(attempt)) {
      console.log(`Cloudflare deployment converged after ${attempt} attempt(s).`)
      process.exit(0)
    }
  } catch (error) {
    console.warn(`Deployment probe ${attempt} failed: ${error.message}`)
  }

  if (attempt < maxAttempts) await sleep(retryDelayMs)
}

throw new Error(`Cloudflare deployment did not converge within ${maxAttempts} attempts.`)
