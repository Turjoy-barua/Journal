# Parismus Journal

A monthly digital edition for the Parismus student association. The Next.js site reads published Edition and Article documents from the standalone Sanity Studio in `../studio-journalmus`.

## Run locally

From the repository root, run the web app and Studio in separate terminals:

```sh
npm --prefix your-existing-app run dev
npm --prefix studio-journalmus run dev
```

The site uses Sanity project `g57lcjmj`, dataset `production` by default. Override these with `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local` when needed. A read token is only required for a private dataset. Published Sanity content revalidates at most every 60 seconds.

## Studio editing

Open `http://localhost:3333` and select **Édition mensuelle** to create an issue. Create or select Category and Author documents, then create and publish 5–10 Articles. Create the Edition with its title, month, year, cover, introduction, ordered Article references, and featured story. Set its status to **Publié** and publish it. The optional Article → Edition reference can be added after the Edition exists. Draft and archived editions remain off the public site.

The active schemas include Edition, Article, Author, and Category. Event, book, and song coverage is managed as regular articles in their editorial categories. Images are supported as normal article/edition media. There are no postcard, photo gallery, podcast, or ambient-audio content types.

## Import the supplied issues

The first two issues are maintained as editable seed manifests in `content/`. To put them into Sanity, add a write token named `SANITY_API_TOKEN` to `studio-journalmus/.env` or `your-existing-app/.env.local`, then run:

```sh
npm --prefix your-existing-app run import:editions
```

The importer creates or updates Category, Author, Article, Edition, and image asset documents. Use a token with dataset write access and keep it out of `NEXT_PUBLIC_` variables.

## Routes

- `/` — latest published edition
- `/editions` — chronological edition archive
- `/editions/[slug]` — cover, introduction, featured story, table of contents, and issue stories
- `/articles/[slug]` — full article
- `/articles` and `/categories` — editorial indexes

If the Sanity dataset has no valid published editions yet, the site temporarily displays the supplied seed issues so the public pages are not blank. Once an Edition is published in Sanity, Sanity becomes the source for the archive and articles.
