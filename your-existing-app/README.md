# Parismus Journal

A monthly digital edition for the Parismus student association, built with Next.js App Router and Contentstack. The site is organized around the newest published issue, article pages, category pages, and an edition archive.

## Run locally

Requirements: Node.js 20.9+.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set the Contentstack API key, Delivery Token, environment, and locale in `.env.local`. Editorial content is served from the published Contentstack Delivery API. Without credentials, edition and article pages show empty states; no sample monthly issue or cover is hardcoded.

## Contentstack models

Importable model definitions live in `../contentstack/content-types/`:

- Edition
- Article
- Author
- Category
- Event
- Book Recommendation
- Song Recommendation

Photography is handled through Edition and Article cover images and images in article rich text. There are no standalone photography, photo essay, gallery, postcard, or ambient audio features or routes.

See `../contentstack/README.md` for Contentstack setup, model relationships, configuration, and the monthly publishing workflow.

## Routes

- `/` — latest published edition
- `/editions` — complete chronological edition archive
- `/editions/[slug]` — cover, introduction, featured story, table of contents, and edition stories
- `/articles/[slug]` — full article
- `/articles` and `/categories` — published editorial indexes

An edition appears publicly only when it is published to the configured Delivery API environment, has Editorial status `published`, and contains 5–10 published stories. The app keeps article pages hidden until their linked edition is published.
