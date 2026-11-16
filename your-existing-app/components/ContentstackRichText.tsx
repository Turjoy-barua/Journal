import type {ReactNode} from 'react'

type RteNode = {
  type?: string
  text?: string
  children?: RteNode[]
  attrs?: Record<string, any>
  [key: string]: any
}

function textWithMarks(node: RteNode, key: string): ReactNode {
  let value: ReactNode = node.text || ''
  if (node.code) value = <code key={`${key}-code`}>{value}</code>
  if (node.underline) value = <u key={`${key}-underline`}>{value}</u>
  if (node.italic || node.italicized) value = <em key={`${key}-italic`}>{value}</em>
  if (node.bold) value = <strong key={`${key}-bold`}>{value}</strong>
  if (node.strike) value = <s key={`${key}-strike`}>{value}</s>
  if (node.href || node.url) value = <a key={`${key}-link`} href={node.href || node.url}>{value}</a>
  return value
}

function renderNode(node: RteNode, key: string): ReactNode {
  if (typeof node.text === 'string') return textWithMarks(node, key)
  const children = (node.children || []).map((child, index) => renderNode(child, `${key}-${index}`))
  const type = (node.type || '').toLowerCase()
  const attrs = node.attrs || {}

  switch (type) {
    case 'doc': return <>{children}</>
    case 'p': case 'paragraph': return <p key={key}>{children}</p>
    case 'h1': case 'heading-one': return <h2 key={key}>{children}</h2>
    case 'h2': case 'heading-two': return <h2 key={key}>{children}</h2>
    case 'h3': case 'heading-three': return <h3 key={key}>{children}</h3>
    case 'h4': case 'heading-four': return <h4 key={key}>{children}</h4>
    case 'blockquote': case 'quote': return <blockquote key={key}>{children}</blockquote>
    case 'ul': case 'unordered-list': return <ul key={key}>{children}</ul>
    case 'ol': case 'ordered-list': return <ol key={key}>{children}</ol>
    case 'li': case 'list-item': return <li key={key}>{children}</li>
    case 'hr': case 'horizontal-rule': return <hr key={key}/>
    case 'a': case 'link': {
      const href = attrs.href || attrs.url || node.href || node.url
      return href ? <a key={key} href={href}>{children}</a> : <>{children}</>
    }
    case 'img': case 'image': {
      const src = attrs.src || attrs.url || node.url || node.src
      if (!src) return null
      const alt = attrs.alt || node.alt || ''
      const caption = attrs.title || attrs.caption || node.caption
      return <figure className="article-inline-image" key={key}><img src={src} alt={alt}/>{caption && <figcaption>{caption}</figcaption>}</figure>
    }
    default: return <>{children}</>
  }
}

export default function ContentstackRichText({value}:{value:unknown}) {
  if (!value) return null
  let document: RteNode
  try {
    document = typeof value === 'string' ? JSON.parse(value) as RteNode : value as RteNode
  } catch {
    return <div className="article-body"><p>{String(value)}</p></div>
  }
  if (typeof document !== 'object' || document === null) return null
  return <div className="article-body">{renderNode(document, 'rte')}</div>
}
