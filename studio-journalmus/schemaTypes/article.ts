import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  groups: [
    {name: 'content', title: 'Contenu', default: true},
    {name: 'publication', title: 'Publication'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titre', type: 'string', group: 'content', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Identifiant URL', type: 'slug', options: {source: 'title', maxLength: 96}, group: 'content', validation: (rule) => rule.required()}),
    defineField({name: 'subtitle', title: 'Sous-titre', type: 'text', rows: 2, group: 'content'}),
    defineField({name: 'excerpt', title: 'Résumé', type: 'text', rows: 3, group: 'content'}),
    defineField({name: 'category', title: 'Rubrique', type: 'reference', to: [{type: 'category'}], group: 'content', validation: (rule) => rule.required()}),
    defineField({name: 'author', title: 'Auteur·rice', type: 'reference', to: [{type: 'author'}], group: 'content', validation: (rule) => rule.required()}),
    defineField({name: 'coverImage', title: 'Image de couverture', type: 'image', options: {hotspot: true}, fields: [{name: 'alt', title: 'Texte alternatif', type: 'string'}], group: 'content'}),
    defineField({
      name: 'body', title: 'Texte', type: 'array', group: 'content',
      of: [
        {type: 'block', styles: [{title: 'Normal', value: 'normal'}, {title: 'Titre', value: 'h2'}, {title: 'Intertitre', value: 'h3'}, {title: 'Citation', value: 'blockquote'}], marks: {decorators: [{title: 'Gras', value: 'strong'}, {title: 'Italique', value: 'em'}], annotations: [{name: 'link', type: 'object', title: 'Lien', fields: [{name: 'href', type: 'url', title: 'URL'}]}]}},
        {type: 'image', options: {hotspot: true}, fields: [{name: 'alt', type: 'string', title: 'Texte alternatif'}, {name: 'caption', type: 'string', title: 'Légende'}, {name: 'credit', type: 'string', title: 'Crédit'}]},
      ],
    }),
    defineField({name: 'edition', title: 'Édition', type: 'reference', to: [{type: 'edition'}], group: 'publication'}),
    defineField({name: 'publishedAt', title: 'Date de publication', type: 'datetime', group: 'publication', validation: (rule) => rule.required()}),
    defineField({name: 'featured', title: 'Article à la une', type: 'boolean', initialValue: false, group: 'publication'}),
    defineField({name: 'readingTime', title: 'Temps de lecture (minutes)', type: 'number', initialValue: 5, group: 'publication'}),
    defineField({name: 'related', title: 'Articles associés', type: 'array', of: [{type: 'reference', to: [{type: 'article'}]}], group: 'publication'}),
    defineField({name: 'seoTitle', title: 'Titre SEO', type: 'string', group: 'seo'}),
    defineField({name: 'seoDescription', title: 'Description SEO', type: 'text', rows: 3, group: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'category.title', media: 'coverImage'}},
})
