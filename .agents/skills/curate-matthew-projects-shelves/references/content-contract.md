# Projects and shelves content contract

## Canonical files

- `lib/site-profile.ts`: approved project registry and the personal-shelves
  feature flag.
- `lib/projects.ts`: typed projection of the canonical project registry; do not
  duplicate project records here.
- `lib/personal.ts`: book and record arrays.
- `public/images/projects/`, `public/images/books/`,
  `public/images/records/`: public derivatives only.
- `docs/asset-sources.md`: provenance and rights record for every added visual.

## Project intake and labels

Required evidence:

1. Repository URL.
2. Matthew's assertion that he created the project or is its primary maintainer.
3. GitHub metadata showing whether it is a fork, archived, private/public, and
   licensed.
4. README or other first-party evidence for every published capability.

Classification:

| Evidence | Allowed website label |
| --- | --- |
| Matthew original + recognized open-source license | Open-source project |
| Matthew original + public repository + no license | Project or public-source project |
| Private repository | Do not expose unless Matthew explicitly approves the public facts |
| Ordinary fork/mirror/template/tutorial copy | Do not list as Matthew's original project |
| Primary-maintainer claim not supported by repository ownership/history | Ask for role and attribution |

`fork: false` is only a candidate signal, not proof of authorship. Organization
repositories and imported histories require human confirmation. Never rewrite
commit history or add a license to another repository as part of this website
workflow.

Each project entry keeps the existing schema:

```ts
{
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  url: `https://${string}`
  icon: `/images/projects/${string}`
  domain: string
}
```

Descriptions state what the project does and Matthew's verified role. Do not
claim customers, revenue, usage, security, production readiness, or comparative
superiority without direct evidence.

## Book and record intake

Books require title, author, verified publication year, category, readable spine
colors, and an optional official publisher/author URL. Records require artist,
album, year, genre, readable sleeve colors, and an optional official music URL.
The existing types in `lib/personal.ts` are authoritative.

Artwork is optional. Without `art`, the components create a text cover/sleeve.
When artwork is used, keep its natural aspect ratio, store only the public
derivative, and record source, rights basis, retrieval date, and processing in
`docs/asset-sources.md`. Never copy Cali's cover files or project icons.

## Release evidence

Before publication, report:

- originality decision and Matthew's stated role;
- repository fork/archive/visibility state and license label;
- final Chinese and English name/description;
- destination URL and icon/cover provenance;
- affected Preview URLs;
- test and hosted-check results.

For books/music, also report that the choice came from Matthew and whether the
display uses text-only art or a rights-recorded cover.
