# Presidential Quiz App - quick deployment options

This is a static app: `index.html`, `style.css`, `script.js`, and `questions.json`.
No backend or build step is required.

## Fastest free options

1. Netlify Drop
   - Drag the `presidential_quiz_app/` folder into Netlify Drop.
   - Good for: fastest manual upload.
   - Caveat: needs a Netlify account for durable management/custom domain.

2. GitHub Pages
   - Put the contents of `presidential_quiz_app/` in a GitHub repo.
   - Enable Pages from the repo settings.
   - Good for: simple public static hosting and version history.
   - Caveat: slower first setup than drag-and-drop.

3. Cloudflare Pages
   - Connect a Git repo and set output/root to `presidential_quiz_app/`.
   - No build command needed.
   - Good for: fast CDN and easy custom domains.
   - Caveat: requires Cloudflare account/project setup.

4. Vercel
   - Import a Git repo or upload the static folder.
   - Framework preset: Other / static.
   - Good for: quick previews from Git.
   - Caveat: slightly more product surface than this app needs.

## Recommended

For light and quick: Netlify Drop.
For maintainable public version: GitHub Pages or Cloudflare Pages.
