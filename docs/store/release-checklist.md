# Tab Out Release Checklist

## Preflight
- Run `npm install` if dependencies changed.
- Run `npm run check`.
- Confirm `dist/` was rebuilt by `npm run build`.
- Confirm bundle and startup gates pass through `npm run check:bundle` and `npm run check:startup`.

## Manual Chrome Check
- Open `chrome://extensions`.
- Enable Developer mode.
- Load unpacked from `dist/`.
- Click the Tab Out toolbar icon.
- Confirm tab groups appear.
- Confirm YouTube Music appears inside YouTube.
- Confirm `*.vercel.app` appears inside Vercel.
- Create a section and move a group into it.
- Switch Cards/Table and confirm section assignment is consistent.
- Confirm Recent sessions shows summaries only, then expands details on click.
- Restore a group from a recovery snapshot and confirm it opens only after clicking restore.

## Store Package
- Zip the contents of `dist/`, not the repository root.
- Do not include source maps unless intentionally approved for release.
- Upload listing copy from `docs/store/chrome-web-store-listing.md`.
- Use screenshots from the current build.

## Privacy Review
- Confirm permissions are still limited to `tabs` and `storage`.
- Confirm no account, backend, remote sync, analytics, or tracking is introduced.
- Confirm recovery snapshots are capped to 5 sessions and 80 tabs each.
- Confirm delete and clear controls are available for recovery snapshots.
