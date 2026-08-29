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

GitHub Pages. Links are relative, so it works at any subpath
(`https://<user>.github.io/rdk-site/`). A custom domain (rdk.co.tz) can be
attached later via repo Settings → Pages → Custom domain.

## Swahili note

Kiswahili translations are machine-assisted — recommend a native-speaker
review pass before public launch.
