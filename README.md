# Panel Swap Electric — Lead Funnel Dashboard

Live conversion funnel: Google LSA + Meta Ads → HCP estimates → revenue.

## Setup (5 minutes)

### 1. Push to GitHub
Upload this folder to a new GitHub repo.

### 2. Deploy on Vercel
- Go to vercel.com → New Project → Import your GitHub repo
- Vercel will auto-detect Next.js

### 3. Add Environment Variables
In your Vercel project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `GHL_API_KEY` | Your GHL Private Integration Token |
| `GHL_LOCATION_ID` | Your GHL Location ID (Settings → Business Info) |
| `HCP_API_KEY` | Your HCP API Token |

### 4. Deploy
Hit Deploy. The dashboard will be live at your Vercel URL.

### 5. Embed in existing dashboard (optional)
Add this one line anywhere in your partner's dashboard:

```html
<iframe src="https://your-app.vercel.app" width="100%" height="800px" frameborder="0" />
```

---

## What it shows
- **Meta Ads funnel**: GHL leads → entered HCP → estimate booked → estimate approved → revenue
- **Google LSA funnel**: HCP customers (non-Meta) → estimate booked → approved → revenue
- **Meta lead detail table**: every Meta lead with their current status
- Auto-refreshes with live data every time the page loads
