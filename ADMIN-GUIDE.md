# RDK Admin Guide — editing your website

The admin panel lives at:

**https://kevomziray.github.io/rdk-site/admin.html**

Bookmark it. It is not linked anywhere on the public site and is hidden from
search engines (`noindex`).

## One-time setup — create your login token

1. Log in to GitHub → click your profile photo (top right) → **Settings**.
2. Bottom of the left menu → **Developer settings** → **Personal access tokens**
   → **Fine-grained tokens** → **Generate new token**.
3. Token name: `RDK website admin`. Expiration: whatever you like (e.g. 1 year).
4. **Repository access:** *Only select repositories* → select `kevomziray/rdk-site`.
5. **Permissions → Repository permissions → Contents:** set to **Read and write**.
   Everything else stays *No access*.
6. Generate the token and copy it (it starts with `github_pat_…`).
   GitHub shows it only once.
7. Open the admin page, paste the token, press **Connect**.

The token is stored only in your browser (localStorage). **Logout** clears it —
use that on shared computers. Enabling 2FA on your GitHub account is recommended.

## What you can edit

| Tab | What it changes on the site |
|---|---|
| **Settings** | WhatsApp number & display, email, Instagram / Facebook / TikTok links, office address, legal numbers |
| **Courses** | The whole catalogue: names (EN/SW), prices, durations, topics, categories, featured flag, archive |
| **Packages** | The group offers: names, prices, group size, "Most popular" badge, feature lists |
| **Categories & Topics** | Catalogue filter categories; the shared English/Kiswahili topic vocabulary |
| **Site text** | Every heading, paragraph, button and quiz sentence — English and Kiswahili side by side |
| **Photos** | Home gallery photos + captions, the hero photo, leadership photos |

## How saving works

- Your edits stay in the browser tab until you press **Review & save**.
- Saving commits the changed files to GitHub. The live site updates
  **about a minute later** (GitHub Pages deploy time).
- If a file changed on GitHub after you loaded the panel, saving warns you
  instead of overwriting it.
- **Try things safely:** switch the *Branch* selector (top bar) to `cms-test`.
  That branch never affects the live site. Switch back to `main` for real edits.

## Photos

- New images are resized (max 1200 px) and compressed to JPEG **in your
  browser** before upload — big phone photos are fine.
- Landscape photos look best in the gallery.
- Replacing the hero photo overwrites `assets/img/hero-firstaid.jpg`.

## Rules of thumb

- **Course ids and topic keys are permanent** — links on the site depend on them.
- Archiving hides a course everywhere (catalogue, home page, quiz); nothing is
  ever deleted.
- After saving, hard-refresh the site (**Ctrl+F5**) — browsers keep old files
  in cache for a while.
- Keep Swahili wording consistent with the rest of the site.

## Troubleshooting

| Problem | Fix |
|---|---|
| "That token was rejected" | Tokens expire — generate a fresh one and paste it again. |
| "Cannot see the repository" | The token was not scoped to `kevomziray/rdk-site` with *Contents: Read and write*. Edit the token's permissions or create a new one. |
| "…changed on GitHub after you loaded it" | Copy any edits you need, press **Reload**, then make them again. |
| Site didn't change a minute after saving | Wait one more minute, then Ctrl+F5. Pages deploys occasionally take 2 minutes. |
| Lost token / locked out | Just create a new fine-grained token and log in again. |
