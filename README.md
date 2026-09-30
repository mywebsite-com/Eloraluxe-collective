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

## Scroll animation system (js/app.js)
Everything is driven by the scroll position in one `requestAnimationFrame` loop and only writes `transform`, `opacity` and CSS variables.
Add these attributes to any element in `index.html`:
- `data-rise` (optional `data-st="1..6"` for stagger) — slow rise, fade and scale, reversible on scroll up.
- `data-parallax="0.05"` — layer drifts at a different speed (negative = slightly faster than the page). `data-mouse="12"` adds cursor movement.
- `class="reveal-lines"` with `<span class="line"><span>…</span></span>` — line mask reveal with blur-to-sharp.
- `data-pin` on a `.pin` section — pinned cinematic section; `--pp` (0 to 1) drives its text, image and shapes.
- Cursor effects (desktop only): hero and section shapes follow the pointer, product images tilt in 3D, buttons pull gently toward the cursor.
- Touch devices get lighter distances and no cursor effects. `prefers-reduced-motion` disables all of it and shows content normally.

## Dubai map
The section `#location` uses the Google Maps embed for "Dubai, United Arab Emirates" (no street address or coordinates). The map card rises, tilts and rotates into place as the page scrolls and settles at 0°. Buttons use Google Maps search and directions links for the same text. To use a real address later, change `Dubai%2C%20United%20Arab%20Emirates` in the links and the iframe `src` in `index.html`.
