# Job Assistant Chrome Extension

A Chrome extension (Manifest V2) that helps users **search job boards, scrape
job ads, and generate tailored cover letters and resumes** via a backend API.
It includes pluggable ad parsers for many major job boards and a guided
application wizard.

This is de-branded reference code from a production extension. Backend hosts,
analytics keys, AWS Cognito pool, and S3 buckets have been replaced with
`YOUR_*` placeholders - wire it to your own services before loading.

## Highlights

- **Ad parsers** for CareerJet, Glassdoor, SimplyHired, ZipRecruiter, Monster,
  Seek, Indeed, Jora and more (`app/scripts/modules/native/ad_parsers/`)
- **Application wizard** with cover-letter / resume template selection
- **Autocomplete lookups** for cities, positions, languages, degrees
  (`app/lookup_lists/`)
- Local persistence of resume / cover-letter data in `localStorage`
- Build pipeline with Gulp + Webpack + Babel

## Configure before running

Replace these placeholders with your own values:

| Placeholder | Where | What it is |
|-------------|-------|------------|
| `YOUR_API_HOST` | `app/scripts/modules/native/coverletter.js` | Backend API base URL (e.g. the `resume-cover-letter-api`) |
| `YOUR_POSTHOG_KEY` | `app/scripts/main.js` | PostHog project key (or remove analytics) |
| `YOUR_COGNITO_IDENTITY_POOL_ID` | `app/scripts/modules/native/s3.js` | AWS Cognito identity pool for S3 access |
| `YOUR_S3_BUCKET` / `YOUR_ERRORS_BUCKET` / `YOUR_STATIC_BUCKET` | `s3.js`, templates | S3 buckets for uploads/assets |
| `YOUR_FEEDBACK_FORM_URL` | `app/scripts/modules/native/account.js` | Feedback form link |

## Build & load

```bash
npm install
npm run build          # webpack build (see gulpfile.babel.js for the full pipeline)
```

Then in Chrome: `chrome://extensions` → enable Developer mode → **Load
unpacked** → select the `app/` directory.

> This targets Manifest V2. Chrome is phasing out MV2; a production release
> today would need migration to Manifest V3 (service worker background,
> updated permissions/CSP).

## License

MIT - see [LICENSE](LICENSE).
