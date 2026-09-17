# RDK Emergency Care — Website

Marketing site for RDK Emergency Care Company Limited (Tanzania).
Static HTML/CSS/JS — no build step required.

## Structure

- `index.html` — home
- `training.html` — course catalog (20 courses, 5 categories, packages)
- `quiz.html` — interactive "Find Your Training" needs quiz
- `work-abroad.html` — first aid as an advantage for working abroad
- `about.html` — company, leadership, compliance
- `contact.html` — contact & booking
- `blog.html` — blog (posts defined in `assets/js/posts.js`)
- `privacy.html` — privacy policy (EN/SW via `i18n.js`)
- `assets/js/config.js` — **single swap point** for WhatsApp number, email, legal numbers
- `assets/js/i18n.js` — English / Kiswahili engine
- `assets/js/data.js` — course & package database (single source of truth)

## Editing content

- Courses, prices and packages: edit `assets/js/data.js` only — the training
  page, quiz and pricing cards all render from it.
- Text strings (both languages): edit `assets/js/i18n.js`.
- WhatsApp number: set `whatsapp` and `whatsappDisplay` in `assets/js/config.js`
  (international format, digits only, e.g. `"255712345678"`). While empty,
  WhatsApp buttons automatically fall back to email.

## Deployment

Live at **https://www.rdk.co.tz** (custom domain), served by a Vercel project
that auto-deploys the `main` branch. GitHub Pages is attached to the same
domain via the `CNAME` file, so the old `kevomziray.github.io/rdk-site/`
address 301-redirects to the domain. Links are relative, so the site works
at any origin. SEO: canonical/OG/Twitter tags per page, `sitemap.xml`,
`robots.txt`, JSON-LD on `index.html` — all pinned to `https://www.rdk.co.tz`.

## Blog — publishing a post

Posts live in one file: `assets/js/posts.js`. To publish, copy an existing
post block, change the `slug` (short, unique, no spaces), set the `date`,
and write `title` / `summary` / `body` in `en` and `sw` (each body is a list
of plain-text paragraphs). Save, commit to `main` — the post appears on
`blog.html` about a minute later. Individual post URLs look like
`blog.html#your-slug`.

## Swahili note

Kiswahili translations are machine-assisted — recommend a native-speaker
review pass before public launch.
