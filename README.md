# Liskov Labs website

Static landing page for Liskov Labs LLP, served by GitHub Pages.

- `index.html` — the page (no build step, no external dependencies)
- `assets/` — logo and social preview image
- `favicon.ico`, `favicon.png`, `apple-touch-icon.png` — browser icons
- `.nojekyll` — tells GitHub Pages to serve files as-is

## Deploy

Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`.

## Custom domain (liskovlabs.com)

The `CNAME` file sets the domain. At the DNS provider:

| Type  | Host  | Value |
|-------|-------|-------|
| A     | @     | 185.199.108.153 |
| A     | @     | 185.199.109.153 |
| A     | @     | 185.199.110.153 |
| A     | @     | 185.199.111.153 |
| AAAA  | @     | 2606:50c0:8000::153 |
| AAAA  | @     | 2606:50c0:8001::153 |
| AAAA  | @     | 2606:50c0:8002::153 |
| AAAA  | @     | 2606:50c0:8003::153 |
| CNAME | www   | `<github-username>.github.io` |

Then in **Settings → Pages**, confirm the custom domain and tick **Enforce HTTPS** once the certificate is issued.
