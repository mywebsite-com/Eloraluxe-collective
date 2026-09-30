# ELORA ELEGANCE COLLECTIVE — website

Static site (HTML, CSS, JavaScript). No build step and no libraries. Open `index.html`, or upload the whole folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, shared hosting).

## Update products
Everything lives in `js/products.js`. Each product looks like this:

```js
{
  id: "gucci-tiger-head-chain-bag",   // unique, lowercase, no spaces
  name: "Tiger-Head Chain Bag",
  brand: "Gucci",                     // "" to hide
  category: "Bags",                   // filters are built from these automatically
  images: [ { sm:"assets/img/p/x-1-sm.webp", lg:"assets/img/p/x-1-lg.webp", w:1400, h:1400, sw:640 } ],
  description: "Short factual description.",
  keywords: "words people may search for",
  price: null,                        // null = ASK FOR PRICE. Or a string like "$120"
  featured: false,                    // true = larger tile in the ALL view
  newArrival: true                    // true = appears in New Arrivals with a NEW badge
}
```
- **Add a category:** use a new `category` name on a product; a filter button appears.
- **Remove a product:** delete its block.
- **Image sizes:** `sm` about 640 px wide, `lg` about 1400 px wide, WebP.

## Hero video
Put your video at `assets/video/hero.mp4` (H.264, muted, 1080p or smaller, under about 6 MB, 10–20 s loop). It plays automatically when it loads. Until then, the hero shows the photo slideshow.

## Before going live
1. Replace `https://YOUR-DOMAIN.com/` in `index.html`, `robots.txt` and `sitemap.xml` with your real domain.
2. Set real `newArrival` and `featured` flags in `js/products.js`.
3. Optional: replace `assets/og-image.jpg` (1200 × 630) with your own share image.

## Colors
Edit the variables at the top of `css/style.css` (`--burg`, `--crimson`, `--ivory`, and so on).

## Instagram
Handle and link are set in `index.html` and `js/app.js` (`IG`, `HANDLE`).
