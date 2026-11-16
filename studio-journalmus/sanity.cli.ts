import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'your-project-id',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  typegen: {
    enabled: true,
    path: '../your-existing-app/{app,components,lib}/**/*.{ts,tsx,js,jsx}',
    schema: 'schema.json',
    generates: '../your-existing-app/sanity.types.ts',
    overloadClientMethods: true,
  },
})
