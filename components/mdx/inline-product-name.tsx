import { ClaudeMark } from '~/components/product-marks'

const PRODUCT_ICONS = {
  'App Store': '/images/products/app-store.svg',
  Codex: '/images/codex.svg',
  Slack: '/images/products/slack.svg',
} as const

type InlineProduct = keyof typeof PRODUCT_ICONS | 'Claude Code'

function productClassName(product: InlineProduct) {
  return product.toLowerCase().replaceAll(' ', '-')
}

export function InlineProductName({ product }: { product: InlineProduct }) {
  return (
    <span className="inline-product-name" data-inline-product={product}>
      {product === 'Claude Code' ? (
        <ClaudeMark className="inline-product-logo" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          aria-hidden
          className={`inline-product-logo inline-product-logo-${productClassName(product)}`}
          src={PRODUCT_ICONS[product]}
          alt=""
          width={14}
          height={14}
        />
      )}
      <span>{product}</span>
    </span>
  )
}
