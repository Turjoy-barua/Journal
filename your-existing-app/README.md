# Parismus Journal

A French-first, bilingual-ready digital magazine for the Parismus student association. Built with Next.js App Router, TypeScript, Tailwind CSS, Sanity Studio and a local demo-content fallback.

## Run locally

Requirements: Node.js 20.9+.

```sh
npm install
cp .env.example .env.local
npm run dev
```

The site works without Sanity credentials using demo stories and replaceable Unsplash images. Run the standalone Sanity Studio from the sibling `studio-journalmus/` folder; it is served at http://localhost:3333.

## Connect Sanity

1. Create a Sanity project at [sanity.io/manage](https://www.sanity.io/manage) and choose a dataset (usually `production`).
2. Copy its project ID and dataset into `your-existing-app/.env.local` as `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`, and into `studio-journalmus/.env` as `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`. Set `NEXT_PUBLIC_SANITY_API_VERSION` to a stable date (the example is provided).
3. Restart the Next.js and Sanity dev servers. The standalone Studio lives in `../studio-journalmus/`; the frontend reads published article, category and postcard documents. Public published content uses Sanity's CDN; no API token is sent to the browser. `SANITY_API_READ_TOKEN` is reserved for future private/preview workflows and must stay server-side.
4. Create documents for categories and authors first, then reference them from articles and postcards. Draft documents stay in Studio; only published documents are queried by the public site.
5. Deploy the same public project ID and dataset as Vercel environment variables, then run `npm run build` before deployment.

### Editorial member guide

Open http://localhost:3333 and sign in with your Sanity account. Choose **Article → Create**, enter a title and URL slug, choose a category and author, add a cover image, then write in the rich-text editor. Set a publication date and fill the SEO fields if useful. Use **Publish** when the story is ready; until then it remains a draft. To take a story down, open it and choose **Unpublish**. Create postcards from the **Carte postale** content type and add photos, a location, contributor credit and optional hosted audio/video URLs.

In Sanity project settings, invite contributors and assign roles/project permissions. Give writers the minimum content-editing permission they need; keep project administration and dataset settings restricted to an editor/administrator. Authentication and publishing are handled by Sanity; this app does not invent local CMS credentials or expose a write token.

## Content architecture

Schemas in `../studio-journalmus/schemaTypes` cover articles (Portable Text, image, embeds, SEO and relations), categories, authors, postcards, photo galleries, book and song recommendations, events and podcast episodes for future Pôle Radio collaboration. The radio episode model supports audio URL/embedding, host, guests, duration and related stories; there is no livestreaming system.

The frontend content adapters in `lib/sanity.ts` fall back to `lib/content.ts` when credentials are missing, the dataset is empty, or the CMS cannot be reached. Replace demo content and placeholder contact/social links before public launch. The newsletter validates email format but intentionally does not submit or store addresses until an email provider is configured. Audio buttons and video fields are editorial controls/placeholders; connect actual media URLs in Sanity to publish those assets.

## Deploy to Vercel

Import this repository into Vercel, set the Sanity public project ID and dataset environment variables for Preview and Production, and deploy. Add the site’s final canonical domain to `app/layout.tsx` and the sitemap/robots URLs before launch. Add `SANITY_API_READ_TOKEN` only if private draft preview is implemented; never prefix secrets with `NEXT_PUBLIC_`.

## Image and bilingual direction

Demo photography uses Unsplash image URLs as temporary visual placeholders. Sanity's image pipeline is configured for published CMS media; `next.config.ts` allows both image hosts. French is the default document language (`lang="fr"`); model content can add a locale field and locale-aware routes when English publishing begins.
