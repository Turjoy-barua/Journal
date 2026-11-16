# Contentstack editorial publishing

The Next.js app reads editions and articles from Contentstack's published Content Delivery API. JSON content type definitions live in `content-types/` for Edition, Article, Author, Category, Event, Book Recommendation, and Song Recommendation.

## Configure the stack

1. In Contentstack, import the Category, Author, Event, Book Recommendation, and Song Recommendation content types first.
2. Import Article and Edition. They have a circular Edition ↔ Article relationship. If the importer requires referenced types to exist, create Article and Edition without their `edition`, `stories`, and `featured_story` reference fields, import both, then add these fields in the model editor: Article → Edition (single Edition reference); Edition → Stories (multiple Article references) and Featured story (single Article reference). Add Article's Category and Author and optional Event/Book/Song references from the provided Article model. Contentstack supports self-referencing JSON RTE fields.
3. Create Category entries for the eight editorial categories: About Parismus, Hidden Spots, Book of the Month, Song of the Month, Student Voices, Culture Without Borders, Life in Paris, and Parismus Events. Create Author entries for contributors.
4. Create a Delivery Token scoped to the `production` environment. Add the stack API key and token to the Next app's environment using `your-existing-app/.env.example`. Keep the token server-side; do not prefix it with `NEXT_PUBLIC_`.
5. Set `CONTENTSTACK_API_HOST` to the Content Delivery host for the stack's region (`cdn.contentstack.io` for North America, `eu-cdn.contentstack.com` for Europe). `CONTENTSTACK_LOCALE` defaults to `fr-fr`. Set the same variables in Vercel, then redeploy. Editorial data revalidates after 60 seconds.

## Monthly publishing workflow

1. Create an Edition with its creative title, slug, number, month, year, publication date, cover, subtitle, introduction, and optional theme accent. Leave Editorial status as `draft`.
2. Create 5–10 Article entries for the issue. For each Article, choose its Category, Author, and Edition references; add the article cover, rich text, and publication date. Publish all of the articles to the `production` environment.
3. Add the articles to the Edition's Stories reference in table-of-contents order. Choose one of those articles as Featured story. Set Editorial status to `published`, then publish the Edition to `production` last.
4. The website publishes an edition only when both Contentstack publication and its Editorial status are `published`, and its resolved story count is between five and ten. Draft, archived, incomplete, or overfull editions do not appear in the archive or homepage. Articles are visible only when their linked edition is public.
5. For edits, publish changed articles first and republish the Edition after updating its reference list. To remove an issue, unpublish it or set its Editorial status to `archived` and publish that change.

## Public routes

- `/` — newest valid published Edition, including cover, introduction, featured story, remaining stories, and previous issues
- `/editions` — complete archive, newest first
- `/editions/[slug]` — edition cover, introduction, featured story, linked table of contents, and remaining stories
- `/articles/[slug]` — article page
- `/categories` and `/categories/[slug]` — editorial category indexes

Article and Edition images remain normal editorial elements. The website has no separate photography, gallery, photo essay, postcard, or ambient-audio pages.
