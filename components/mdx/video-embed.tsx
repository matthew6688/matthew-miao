'use client'

import { useState } from 'react'

import type { Locale } from '~/lib/locale-route'
import { videoEmbedUrls, type VideoEmbedProvider } from '~/lib/blog/video-embed'

type VideoEmbedProps = {
  provider: VideoEmbedProvider
  id: string
  title: string
  caption?: string
  locale?: Locale
  customerCode?: string
}

export function VideoEmbed(props: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false)
  const src = videoEmbedUrls(props).player
  const locale = props.locale ?? 'zh'
  const providerLabel = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    'cloudflare-stream': 'Cloudflare Stream',
  }[props.provider]

  return (
    <figure className="post-video">
      <div className="post-video__frame">
        {playing ? (
          <iframe
            src={src}
            title={props.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)}>
            <span className="post-video__play" aria-hidden="true">▶</span>
            <span>{locale === 'en' ? 'Play embedded video' : '播放嵌入视频'}</span>
            <small>{providerLabel} · {props.title}</small>
          </button>
        )}
      </div>
      {props.caption ? <figcaption>{props.caption}</figcaption> : null}
    </figure>
  )
}
