# Journalmus · Parismus Journal Platform

The repository has two independently managed apps. Keep this parent folder open in your editor/agent so both projects are visible.

```text
Journal/
├── your-existing-app/   # Next.js reader-facing site
└── studio-journalmus/   # standalone Sanity Studio
```

## Install and run

Install each app's dependencies once:

```sh
npm --prefix your-existing-app install
npm --prefix studio-journalmus install
```

Configure `your-existing-app/.env.local` using its `.env.example` and `studio-journalmus/.env` using its `.env.example`. Use the same Sanity project ID and dataset in both files. Then run each process in its own terminal from this parent folder:

```sh
npm run dev:web       # Next.js at http://localhost:3000
npm run dev:studio    # Sanity Studio at http://localhost:3333
```

The site uses local demo content if no Sanity project is configured. Once configured, it reads published articles, categories, and postcards from Sanity. The Studio contains schemas for articles, authors, categories, postcards, photo galleries, book/song recommendations, events, and podcast episodes.

## Connect Sanity

1. Create or select a Sanity project in [Sanity Manage](https://www.sanity.io/manage), and note its project ID and dataset name.
2. Add the same project ID/dataset to both apps' env files. `SANITY_STUDIO_PROJECT_ID` is used by the standalone Studio; `NEXT_PUBLIC_SANITY_PROJECT_ID` is used by the web app.
3. Add `http://localhost:3000` to the project's CORS origins in Sanity Manage (credentials enabled if you use Presentation Tool or authenticated browser access).
4. Start both apps. Sign into Sanity at `http://localhost:3333`; content entered in Studio appears on the Next.js site once published.

For production, add the production web URL to Sanity CORS origins, deploy the Studio with `npm run deploy:studio`, and deploy the Next.js app from `your-existing-app/` (or configure the deployment platform's root directory accordingly). Never put write tokens in `NEXT_PUBLIC_` variables.

See [the web app README](your-existing-app/README.md) for the publishing workflow and deployment notes.
