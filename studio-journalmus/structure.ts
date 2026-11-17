import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) => S.list().title('Contenu').items([
  S.listItem()
    .id('aboutPage')
    .title('Page À propos')
    .child(S.document().schemaType('aboutPage').documentId('aboutPage').title('Page À propos')),
  S.divider(),
  ...S.documentTypeListItems().filter((item) => item.getId() !== 'aboutPage'),
])
