import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'edition',
  title: 'Édition mensuelle',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identité', default: true},
    {name: 'editorial', title: 'Éditorial'},
    {name: 'design', title: 'Style du texte'},
    {name: 'publication', title: 'Publication'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titre créatif', type: 'string', group: 'identity', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Identifiant URL', type: 'slug', options: {source: 'title', maxLength: 96}, group: 'identity', validation: (rule) => rule.required()}),
    defineField({name: 'editionNumber', title: 'Numéro', type: 'number', group: 'identity', validation: (rule) => rule.required().integer().positive()}),
    defineField({name: 'month', title: 'Mois', type: 'string', group: 'identity', validation: (rule) => rule.required()}),
    defineField({name: 'year', title: 'Année', type: 'number', group: 'identity', validation: (rule) => rule.required().integer()}),
    defineField({name: 'publicationDate', title: 'Date de publication', type: 'datetime', group: 'publication', validation: (rule) => rule.required()}),
    defineField({name: 'coverImage', title: 'Couverture', type: 'image', options: {hotspot: true}, fields: [{name: 'alt', title: 'Texte alternatif', type: 'string'}], group: 'identity', validation: (rule) => rule.required()}),
    defineField({name: 'subtitle', title: 'Sous-titre', type: 'text', rows: 2, group: 'identity'}),
    defineField({
      name: 'introduction', title: 'Mot de l’équipe', type: 'array', group: 'editorial',
      of: [{type: 'block', styles: [{title: 'Normal', value: 'normal'}, {title: 'Citation', value: 'blockquote'}], marks: {decorators: [{title: 'Gras', value: 'strong'}, {title: 'Italique', value: 'em'}], annotations: [{name: 'link', type: 'object', title: 'Lien', fields: [{name: 'href', type: 'url', title: 'URL'}]}]}}],
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'fontStyle', title: 'Police du texte', type: 'string', group: 'design', initialValue: 'editorialSerif', options: {list: [
      {title: 'Bodoni Moda · élégant', value: 'bodoniModa'},
      {title: 'Sérif éditorial · classique', value: 'editorialSerif'},
      {title: 'Sans sérif · moderne', value: 'sansSerif'},
    ]}, description: 'S’applique au titre, au sous-titre et au mot de l’équipe sur la page de cette édition.'}),
    defineField({name: 'titleAlignment', title: 'Alignement du titre', type: 'string', group: 'design', initialValue: 'center', options: {list: [
      {title: 'À gauche', value: 'left'}, {title: 'Centré', value: 'center'}, {title: 'À droite', value: 'right'},
    ]}}),
    defineField({name: 'introductionAlignment', title: 'Alignement du mot de l’équipe', type: 'string', group: 'design', initialValue: 'left', options: {list: [
      {title: 'À gauche', value: 'left'}, {title: 'Centré', value: 'center'}, {title: 'À droite', value: 'right'}, {title: 'Justifié', value: 'justify'},
    ]}}),
    defineField({
      name: 'stories', title: 'Sommaire · Articles', type: 'array', group: 'editorial',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      validation: (rule) => rule.required().min(5).max(10),
      description: 'Choisissez 5 à 10 articles et classez-les dans l’ordre du sommaire.',
    }),
    defineField({name: 'featuredStory', title: 'Article à la une', type: 'reference', to: [{type: 'article'}], group: 'editorial', validation: (rule) => rule.required()}),
    defineField({name: 'themeAccent', title: 'Couleur du numéro (hex)', type: 'string', group: 'identity'}),
    defineField({name: 'status', title: 'Statut éditorial', type: 'string', options: {list: [{title: 'Brouillon', value: 'draft'}, {title: 'Publié', value: 'published'}, {title: 'Archivé', value: 'archived'}], layout: 'radio'}, initialValue: 'draft', group: 'publication', validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'title', subtitle: 'month', media: 'coverImage'}},
})
