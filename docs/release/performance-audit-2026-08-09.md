# Production performance audit — 2026-08-09

Target: `https://matthew-miao.com` on Cloudflare Workers.

## Method

Chrome DevTools performance traces were recorded against cold reloads of the
Chinese and English home pages. The run used the local audit machine without
CPU or network throttling. Values below are lab observations from one run per
locale; Chrome UX Report field data was unavailable and is not inferred from
these results.

## Results

| Route | TTFB | LCP | CLS | LCP element |
| --- | ---: | ---: | ---: | --- |
| `/` | 97 ms | 526 ms | 0.00 | Introductory text |
| `/en` | 74 ms | 206 ms | 0.00 | Introductory text |

Both routes are comfortably inside the current good thresholds for TTFB, LCP
and CLS. The Chinese trace reported a 285 ms maximum critical request chain
through first-party CSS and the two Frex Sans GB fonts. Chrome estimated zero
FCP or LCP savings from the render-blocking and cache observations.

The only third-party request observed was the FengTalk favicon preview through
the inherited OG proxy. Its cache observation reported zero wasted bytes and
zero estimated FCP/LCP savings. It is not treated as a performance issue.

## Accessibility snapshot

The production accessibility tree exposed one main landmark, named navigation,
one level-one heading, named external links, named preference controls, footer
navigation and an explicitly labelled Brisbane clock. The language suggestion
was exposed as a polite live region. No unnamed public interactive control was
observed in this high-level snapshot.

## Decision

No performance code or design changes are justified by this audit. The site is
already fast, layout-stable and served from the intended first-party critical
path. Preserve the pinned visual contract and repeat the measurement after
material asset, font, analytics or third-party-script changes.
