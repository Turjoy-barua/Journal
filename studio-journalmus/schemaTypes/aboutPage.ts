import {defineField, defineType} from 'sanity'

const portableText = {
  type: 'array' as const,
  of: [{
    type: 'block',
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'Titre', value: 'h2'},
      {title: 'Intertitre', value: 'h3'},
      {title: 'Citation', value: 'blockquote'},
    ],
    marks: {
      decorators: [{title: 'Gras', value: 'strong'}, {title: 'Italique', value: 'em'}],
      annotations: [{name: 'link', type: 'object', title: 'Lien', fields: [{name: 'href', type: 'url', title: 'URL'}]}],
    },
  }],
}

export default defineType({
  name: 'aboutPage',
  title: 'Page À propos',
  type: 'document',
  groups: [
    {name: 'introduction', title: 'Introduction', default: true},
    {name: 'mission', title: 'Notre intention'},
    {name: 'team', title: 'Rédaction'},
    {name: 'categories', title: 'Rubriques'},
    {name: 'design', title: 'Style et alignement'},
  ],
  fields: [
    defineField({name: 'heroEyebrow', title: 'Petit titre', type: 'string', group: 'introduction', initialValue: 'À propos · Un journal étudiant'}),
    defineField({name: 'heroTitle', title: 'Titre principal', type: 'string', group: 'introduction', validation: (rule) => rule.required()}),
    defineField({name: 'heroTitleEmphasis', title: 'Fin du titre en italique', type: 'string', group: 'introduction'}),
    defineField({name: 'heroDescription', title: 'Texte d’introduction', type: 'text', rows: 3, group: 'introduction', validation: (rule) => rule.required()}),
    defineField({name: 'heroImage', title: 'Grande photo', type: 'image', options: {hotspot: true}, fields: [{name: 'alt', title: 'Texte alternatif', type: 'string'}], group: 'introduction'}),
    defineField({name: 'heroCaption', title: 'Légende de la photo', type: 'string', group: 'introduction', initialValue: 'Un journal fait de rencontres'}),
    defineField({name: 'missionEyebrow', title: 'Petit titre', type: 'string', group: 'mission', initialValue: 'Notre intention'}),
    defineField({name: 'missionTitle', title: 'Titre', type: 'string', group: 'mission', validation: (rule) => rule.required()}),
    defineField({name: 'missionBody', title: 'Texte', ...portableText, group: 'mission', validation: (rule) => rule.required()}),
    defineField({name: 'teamEyebrow', title: 'Petit titre', type: 'string', group: 'team', initialValue: 'Une rédaction ouverte'}),
    defineField({name: 'teamTitle', title: 'Titre', type: 'string', group: 'team', validation: (rule) => rule.required()}),
    defineField({name: 'teamBody', title: 'Texte', ...portableText, group: 'team', validation: (rule) => rule.required()}),
    defineField({name: 'teamImage', title: 'Photo de la rédaction', type: 'image', options: {hotspot: true}, fields: [{name: 'alt', title: 'Texte alternatif', type: 'string'}], group: 'team'}),
    defineField({name: 'callToActionLabel', title: 'Texte du bouton', type: 'string', group: 'team', initialValue: 'Proposer une contribution'}),
    defineField({name: 'callToActionUrl', title: 'Lien du bouton', type: 'url', group: 'team', initialValue: 'mailto:bonjour@parismus.fr'}),
    defineField({name: 'categoriesEyebrow', title: 'Petit titre', type: 'string', group: 'categories', initialValue: 'Les rubriques du journal'}),
    defineField({name: 'categoriesTitle', title: 'Titre', type: 'string', group: 'categories', initialValue: 'Huit façons de raconter.'}),
    defineField({
      name: 'fontStyle', title: 'Police de la page', type: 'string', group: 'design', initialValue: 'bodoniModa',
      options: {list: [
        {title: 'Bodoni Moda · élégant', value: 'bodoniModa'},
        {title: 'Sérif éditorial · classique', value: 'editorialSerif'},
        {title: 'Sans sérif · moderne', value: 'sansSerif'},
      ]},
      description: 'Change la police des titres et des textes de la page À propos.',
    }),
    ...([
      ['heroTextAlignment', 'Alignement · Introduction'],
      ['missionTextAlignment', 'Alignement · Notre intention'],
      ['teamTextAlignment', 'Alignement · Rédaction'],
      ['categoriesTextAlignment', 'Alignement · Rubriques'],
    ] as const).map(([name, title]) => defineField({
      name, title, type: 'string', group: 'design', initialValue: 'left',
      options: {list: [
        {title: 'À gauche', value: 'left'},
        {title: 'Centré', value: 'center'},
        {title: 'À droite', value: 'right'},
        {title: 'Justifié', value: 'justify'},
      ]},
    })),
  ],
  preview: {select: {title: 'heroTitle'}, prepare: ({title}) => ({title: title || 'Page À propos'})},
})
