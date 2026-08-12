import type { GitHubSnapshot, SocialSnapshot } from '~/components/social-cards'
import bakedGithub from '~/content/github.json'
import bakedSocial from '~/content/social.json'
import { siteProfile } from '~/lib/site-profile'

export interface SocialData {
  x: SocialSnapshot
  telegram: SocialSnapshot
  youtube: SocialSnapshot
}

// Shared public chrome must never depend on a runtime cache refresh. These
// committed snapshots are refreshed deliberately and deployed atomically with
// the site, so an upstream outage or cache expiry cannot take down every page.
// X has no public endpoint; its content stays manual in content/social.json.

export function getGitHub(): GitHubSnapshot {
  return bakedGithub as GitHubSnapshot
}

export function getSocial(): SocialData {
  return {
    ...(bakedSocial as SocialData),
    x: {
      ...(bakedSocial.x as SocialSnapshot),
      handle: siteProfile.links.x.handle,
    },
  }
}
