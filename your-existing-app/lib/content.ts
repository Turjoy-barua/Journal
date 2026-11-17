export type Story = { uid?:string; slug:string; title:string; subtitle:string; category:string; categorySlug:string; author:string; date:string; readingTime:string; excerpt:string; image:string; imageAlt:string; body:string[]; richBody?:any[]; quote?:string };

// Small editorial illustrations used on the About page. Article and edition imagery is managed in Sanity.
export const photos = {
  cafe:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
  portrait:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
}
