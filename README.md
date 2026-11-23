# Plan X landing page (brochure QR)

A one-page mailing list sign-up for people who pick up the brochure at Plan X. It's a static page that can be hosted anywhere. Suggested URL: `concentrik.com/planx`.

```
index.html        the page (all CSS and JS inline)
assets/           logo and background image from the brochure
apps-script.gs    form receiver: Google Sheet + email notification
```

The form asks for name, email and consent, and nothing else.

## 1. Connect the form (10 minutes)

1. Create a Google Sheet called "Concentrik mailing list".
2. In the Sheet, open **Extensions → Apps Script**. Paste in `apps-script.gs` and save.
3. Set `NOTIFY_EMAIL` to the person who should hear about each sign-up, or `''` for none.
4. **Deploy → New deployment → Web app**. Execute as: *Me*. Who has access: *Anyone*. Authorise.
5. Copy the `/exec` URL and paste it into `CONFIG.ENDPOINT` near the bottom of `index.html`.
6. Sign up from your phone. A row should appear in the "Mailing list" tab.

If Concentrik uses Mailchimp, Brevo or a CRM, point `CONFIG.ENDPOINT` at a webhook for it (via Zapier, Make or n8n) instead. The page sends `fullName`, `email`, `consent`, `event`, `leadSource` and the UTM values as a form-encoded POST. While `ENDPOINT` is empty, the form shows the thank-you message but **sends nothing**.

## 2. QR code

```
https://concentrik.com/planx?utm_source=brochure&utm_medium=qr&utm_campaign=plan-x
```

## 3. Before it goes live

- [ ] `CONFIG.ENDPOINT` set and tested on a phone over mobile data
- [ ] Privacy notice link (`concentrik.com/privacy`) works and covers the mailing list
- [ ] Every email sent to the list has an unsubscribe link (the consent line promises it)
- [ ] SVG logo when available (replaces `assets/logo-white.png`)

The page pushes `signup_form_start` and `signup_form_submit` to `dataLayer` only if a consented tag manager is on the page. No tags load by default. The page is set to `noindex` because it's an event page.
