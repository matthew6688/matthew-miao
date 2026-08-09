export type VideoEmbedProvider = 'youtube' | 'vimeo' | 'cloudflare-stream'

export type VideoEmbedIdentity = {
  provider: VideoEmbedProvider
  id: string
  customerCode?: string
}

export function videoEmbedUrls({ provider, id, customerCode }: VideoEmbedIdentity) {
  if (provider === 'youtube') {
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error('Invalid YouTube video ID')
    return {
      player: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      verification: `https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${id}&format=json`,
    }
  }
  if (provider === 'vimeo') {
    if (!/^\d{6,12}$/.test(id)) throw new Error('Invalid Vimeo video ID')
    return {
      player: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`,
      verification: `https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F${id}`,
    }
  }
  if (!/^[A-Za-z0-9]{32}$/.test(id)) throw new Error('Invalid Cloudflare Stream video ID')
  if (!customerCode || !/^[a-f0-9]{32}$/.test(customerCode)) {
    throw new Error('Invalid Cloudflare Stream customer code')
  }
  const player = `https://customer-${customerCode}.cloudflarestream.com/${id}/iframe`
  return { player: `${player}?autoplay=true`, verification: player }
}
