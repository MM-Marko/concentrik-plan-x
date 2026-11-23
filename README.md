# Plan X landing page (brochure QR)

A static page you can host anywhere: Netlify, Vercel, S3 or a folder on concentrik.com. Suggested URL: `concentrik.com/planx`.

```
index.html        the page (all CSS and JS inline)
assets/           photos and logo taken from the brochure
apps-script.gs    form receiver: Google Sheet + email notification
```

## 1. Connect the form (10 minutes)

1. Create a Google Sheet called "Concentrik leads".
2. In the Sheet, open **Extensions → Apps Script**. Paste in `apps-script.gs` and save.
3. Set `NOTIFY_EMAIL` to the person who should get each lead.
4. **Deploy → New deployment → Web app**. Execute as: *Me*. Who has access: *Anyone*. Authorise.
5. Copy the `/exec` URL and paste it into `CONFIG.ENDPOINT` near the bottom of `index.html`.
6. Send a test from your phone. A row should appear in the "Plan X leads" tab, and an email should arrive.

You can use any other endpoint that accepts a form-encoded POST (Formspree, n8n, Make, Zapier, or a HubSpot or Nexudus middleware). Change `CONFIG.ENDPOINT` and nothing else. While `ENDPOINT` is empty, the form shows the thank-you message but **sends nothing**.

## 2. QR code

Point the brochure QR at:

```
https://concentrik.com/planx?utm_source=brochure&utm_medium=qr&utm_campaign=plan-x
```

The UTM values are saved with every lead. If they're missing, the page fills in the same defaults. To pre-select an option, add `&interest=office`, `executive` or `founder`.

## 3. Before it goes live

- [ ] `CONFIG.ENDPOINT` set and tested on a phone over mobile data
- [ ] Privacy notice link (`concentrik.com/privacy`) works and covers form data
- [ ] Reply time confirmed. The page says "personally", not a number of days
- [ ] Brochure photos: the lounge and boardroom images show people. Check they're real with releases, or label them as indicative (brand PRD §6.5)
- [ ] SVG logo when available (replaces `assets/logo-white.png`)
- [ ] Analytics: the page pushes `cta_click`, `invitation_form_start` and `invitation_form_submit` to `dataLayer`, but only if a consented tag manager is present. No tags load by default.

The page is set to `noindex` because it's an event page. Remove that line if you want it in search.
