# Restaurant website privacy and cookies package

This folder contains draft UK-facing legal pages and a consent component. It is not a live restaurant backend. The site source was not present in this folder, so the pages and script are ready to copy into the website once its files are available.

## Files

- `legal/privacy.html` — privacy notice template.
- `legal/cookies.html` — cookie and similar technologies policy template.
- `public/cookie-consent.js` and `public/cookie-consent.css` — optional-cookie choices.

## Before publishing

Replace every `[[...]]` placeholder in the legal pages. Confirm the restaurant's legal name, trading name, address, contact email, jurisdiction, actual forms, booking provider, analytics/advertising providers, hosting provider, payment/order providers, data retention periods, and international transfers. Remove sections for services the site does not use. Have the business owner or a qualified adviser review the final notices. The templates are not a claim that the site complies with law by themselves.

Audit the actual website with browser developer tools. List every cookie, local-storage entry, pixel, embedded map/video, and third-party script. The cookie policy must name each technology, provider, purpose, duration, and category. Do not load non-essential analytics, marketing, or embeds before consent. If the site has no non-essential technologies, a banner is unnecessary; still publish an accurate cookie policy.

## Integrating consent

Add the stylesheet and script to every page, then call `RestaurantCookieConsent.init()` after the script loads:

```html
<link rel="stylesheet" href="/cookie-consent.css">
<script src="/cookie-consent.js" defer></script>
<script defer src="/site-cookie-setup.js"></script>
```

```js
// site-cookie-setup.js
window.addEventListener('DOMContentLoaded', () => {
  RestaurantCookieConsent.init({
    policyUrl: '/cookies.html',
    categories: {
      analytics: {
        label: 'Analytics',
        description: 'Helps us understand visits to improve the website.',
        enable: () => { /* Load your audited analytics provider here. */ },
        disable: () => { /* Run provider opt-out and remove its first-party cookies here. */ }
      },
      marketing: {
        label: 'Marketing',
        description: 'Allows advertising and measurement across sites.',
        enable: () => { /* Load your audited marketing provider here. */ },
        disable: () => { /* Run provider opt-out and remove its first-party cookies here. */ }
      }
    }
  });
});
```

The optional providers must be loaded **only** inside `enable`; remove any existing unconditional script tags, pixels, or embeds. Add a visible “Cookie settings” link or button on every page that calls `RestaurantCookieConsent.open()`. The component records the visitor's choice in one necessary first-party cookie for 180 days. It defaults to all optional categories off, offers equally prominent accept and reject buttons, and lets people change their choice. Increment `consentVersion` when purposes or providers change so visitors are asked again. A `disable` function is required for every optional category: revoking consent must also invoke the provider's opt-out and clear cookies that your domain can clear. Third-party cookies may require provider-specific controls.

The component does not inspect or automatically block scripts added elsewhere. It must be integrated with the real site's tag manager and provider settings. Serve the site and legal pages over HTTPS. Use security headers at the hosting layer, keep dependencies patched, restrict staff access, and avoid collecting information that the restaurant does not need.

## Sources used for the templates

- [ICO: privacy information to provide](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [ICO: cookies and similar technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)
- [ICO: storage limitation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/)
