# JobTrackr Chrome Extension

Save jobs from LinkedIn, Indeed, Reed, and Greenhouse to your JobTrackr board with one click.

## Installation (Developer Mode)

1. Download or clone the `chrome-extension` folder
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `chrome-extension` folder
6. The JobTrackr icon will appear in your toolbar

## Usage

1. **Sign in** — Click the extension icon and sign in with your JobTrackr email and password
2. **Navigate** to a job posting on LinkedIn, Indeed, Reed, or Greenhouse
3. **Click** the floating "Save to JobTrackr" button (bottom-right corner)
4. The job is saved to your **Found** column with title, company, description, salary, and location auto-filled

## Supported Sites

| Site | URL Pattern |
|---|---|
| LinkedIn | `linkedin.com/jobs/*` |
| Indeed | `indeed.com/viewjob*`, `indeed.co.uk/viewjob*` |
| Reed | `reed.co.uk/jobs/*` |
| Greenhouse | `boards.greenhouse.io/*/jobs/*` |

## Publishing to Chrome Web Store

1. Create placeholder icons (16×16, 48×48, 128×128 PNG) in the `icons/` folder
2. Zip the entire `chrome-extension` folder
3. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Click **New Item** → Upload the zip
5. Fill in listing details, screenshots, and privacy policy
6. Submit for review

## Icons

The `icons/` folder needs three PNG files:
- `icon16.png` — 16×16px (toolbar)
- `icon48.png` — 48×48px (extensions page)
- `icon128.png` — 128×128px (store listing)

Use your brand colors (indigo #6366f1) with "JT" text as a placeholder.

## Notes

- The extension stores your auth token locally and refreshes it automatically
- Job descriptions are truncated to 5,000 characters
- All saved jobs appear in the "Found" column
- The source URL is saved as a link on the job card
