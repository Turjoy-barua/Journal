# Journalmus · Parismus Journal

This repository contains two independently run apps:

```text
Journal/
├── your-existing-app/   # Next.js public site
└── studio-journalmus/   # standalone Sanity Studio
```

Both apps use Sanity project `g57lcjmj` and dataset `production` by default. The Studio defines the monthly editorial models; the Next.js app displays published editions and their articles.

Start each in its own terminal:

```sh
npm --prefix your-existing-app run dev
npm --prefix studio-journalmus run dev
```

Open the reader at `http://127.0.0.1:3000` and the editor at `http://127.0.0.1:3333`. To import the supplied September and October editions into Sanity, set `SANITY_API_TOKEN` in a local env file and run `npm --prefix your-existing-app run import:editions`.

The public site uses the supplied seed editions while the Sanity dataset has no valid published editions. After content is published in Sanity, the CMS entries drive the archive and article pages.
