import { clerkMiddleware } from '@clerk/nextjs/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  isArchivedNewsletterId,
  isPublishedPostSlug,
} from './lib/public-content-routes'

function missingPublicContent(pathname: string) {
  const postMatch = pathname.match(/^\/(?:en\/)?blog\/([^/]+)\/?$/)
  if (postMatch) {
    const slug = postMatch[1]
    if (/^(?:opengraph-image|twitter-image)-/.test(slug)) return false
    return !isPublishedPostSlug(slug)
  }

  const newsletterMatch = pathname.match(
    /^\/(?:en\/)?newsletters\/([^/]+)\/?$/,
  )
  return newsletterMatch
    ? !isArchivedNewsletterId(newsletterMatch[1])
    : false
}

function isAdminPage(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isUnavailableAmaFixture(pathname: string) {
  return (
    process.env.NODE_ENV !== 'development' &&
    (pathname === '/admin/ama/fixtures' ||
      pathname.startsWith('/admin/ama/fixtures/'))
  )
}

function usesClerk(pathname: string) {
  return (
    isAdminPage(pathname) ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  )
}

function hasClerkConfiguration() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  )
}

// Admin pages use the static site CSP from next.config (July 2026): the
// former per-request nonce policy forced dynamic rendering, which is
// incompatible with the admin's prerendered instant-navigation shells.
export function siteProxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.nextUrl.hostname === 'www.matthew-miao.com') {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.hostname = 'matthew-miao.com'
    return NextResponse.redirect(canonicalUrl, 308)
  }

  if (/^\/(?:en\/)?confirm\//.test(pathname)) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  if (missingPublicContent(pathname) || isUnavailableAmaFixture(pathname)) {
    const notFoundUrl = request.nextUrl.clone()
    notFoundUrl.pathname = '/_not-found'
    return NextResponse.rewrite(notFoundUrl, { status: 404 })
  }

  if (usesClerk(pathname) && !hasClerkConfiguration()) {
    const notFoundUrl = request.nextUrl.clone()
    notFoundUrl.pathname = '/_not-found'
    return NextResponse.rewrite(notFoundUrl, { status: 404 })
  }

  return NextResponse.next()
}

const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isAdminPage(request.nextUrl.pathname)) await auth.protect()
  return siteProxy(request)
})

export function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isUnavailableAmaFixture(request.nextUrl.pathname)) {
    return siteProxy(request)
  }
  if (!usesClerk(request.nextUrl.pathname) || !hasClerkConfiguration()) {
    return siteProxy(request)
  }
  return clerkProxy(request, event)
}

export const config = {
  matcher: [
    '/',
    '/en',
    '/blog',
    '/en/blog',
    '/projects',
    '/en/projects',
    '/photos',
    '/en/photos',
    '/ama/:path*',
    '/en/ama/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/blog/:slug',
    '/en/blog/:slug',
    '/newsletters/:id',
    '/en/newsletters/:id',
    '/confirm/:path*',
    '/en/confirm/:path*',
  ],
}
