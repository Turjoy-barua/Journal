import type {ReactNode} from 'react'

type PortableSpan = {text?: string; marks?: string[]; _key?: string}
type PortableBlock = {
  _key?: string
  _type?: string
  style?: string
  children?: PortableSpan[]
  markDefs?: Array<{_key?: string; _type?: string; href?: string}>
  asset?: {url?: string} | string
  alt?: string
  caption?: string
}

function renderSpan(span: PortableSpan, block: PortableBlock, key: string): ReactNode {
  let child: ReactNode = span.text || ''
  for (const mark of span.marks || []) {
    if (mark === 'strong') child = <strong key={`${key}-strong`}>{child}</strong>
    else if (mark === 'em') child = <em key={`${key}-em`}>{child}</em>
    else {
      const definition = block.markDefs?.find((item) => item._key === mark)
      if (definition?._type === 'link' && definition.href) child = <a key={`${key}-link`} href={definition.href} rel="noreferrer noopener">{child}</a>
    }
  }
  return child
}

function renderPortableText(value: PortableBlock[]) {
  return value.map((block, index) => {
    const key = block._key || `block-${index}`
    if (block._type === 'image') {
      const imageUrl = typeof block.asset === 'string' ? block.asset : block.asset?.url
      if (!imageUrl) return null
      return <figure className="article-inline-image" key={key}><img src={imageUrl} alt={block.alt || ''}/>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>
    }
    if (block._type !== 'block') return null
    const children = (block.children || []).map((span, spanIndex) => renderSpan(span, block, `${key}-${span._key || spanIndex}`))
    if (block.style === 'h2') return <h2 key={key}>{children}</h2>
    if (block.style === 'h3') return <h3 key={key}>{children}</h3>
    if (block.style === 'blockquote') return <blockquote key={key}>{children}</blockquote>
    return <p key={key}>{children}</p>
  })
}

type LegacyNode = {type?: string; text?: string; children?: LegacyNode[]; attrs?: Record<string, string>; italic?: boolean; bold?: boolean; href?: string}

function renderLegacy(node: LegacyNode, key: string): ReactNode {
  if (typeof node.text === 'string') {
    let text: ReactNode = node.text
    if (node.italic) text = <em>{text}</em>
    if (node.bold) text = <strong>{text}</strong>
    if (node.href) text = <a href={node.href}>{text}</a>
    return text
  }
  const children = (node.children || []).map((child, index) => renderLegacy(child, `${key}-${index}`))
  switch (node.type) {
    case 'p': case 'paragraph': return <p key={key}>{children}</p>
    case 'h2': case 'heading-two': return <h2 key={key}>{children}</h2>
    case 'h3': case 'heading-three': return <h3 key={key}>{children}</h3>
    case 'blockquote': case 'quote': return <blockquote key={key}>{children}</blockquote>
    case 'doc': return <>{children}</>
    default: return <>{children}</>
  }
}

export default function PortableTextContent({value}:{value:unknown}) {
  if (!value) return null
  if (Array.isArray(value)) return <div className="article-body">{renderPortableText(value as PortableBlock[])}</div>
  if (typeof value === 'object') return <div className="article-body">{renderLegacy(value as LegacyNode, 'legacy')}</div>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) return <div className="article-body">{renderPortableText(parsed as PortableBlock[])}</div>
      if (parsed && typeof parsed === 'object') return <div className="article-body">{renderLegacy(parsed as LegacyNode, 'legacy')}</div>
    } catch {
      return <div className="article-body"><p>{value}</p></div>
    }
  }
  return null
}
