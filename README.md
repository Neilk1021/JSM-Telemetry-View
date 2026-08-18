# JSM Telemetry Dashboard — Japanese Salaryman (日本のサラリーマン)

A high-performance, real-time data visualization and game balance analytics dashboard for **Japanese Salaryman (JSM)** indie hacking-strategy roguelike.

Built to help the dev team analyze player behavior, spot balance patterns, monitor map difficulty curves, track tower adoption, and inspect Discord playtest telemetry events.

---

## ⚡ Features Built

All 5 core priorities from [`jsm-telemetry-dashboard-spec.md`](./jsm-telemetry-dashboard-spec.md) plus developer quality-of-life additions:

### 1. Overview & High-Level KPIs
- **Global telemetry stats**: Total events logged, unique active players, primary player action share, overall map win rate, most popular tower, and playtest time span.
- **Snapshot visualizations**: Mini-charts for immediate at-a-glance insight and quick drill-down navigation.

### 2. Event Type Frequency (Priority 1)
- **Interactive Recharts Bar Charts**: Switch between Horizontal, Vertical, and Donut/Pie distribution modes.
- **Raw Count vs Percentage toggle**: Analyze raw volume vs relative distribution.
- **Granular event breakdown table**: Occurrences, % of total, unique player adoption, first seen, and last seen timestamps.
- **1-Click event filtering**: Drill down into any event type across the entire dashboard with a single click.

### 3. Tower Popularity & Balance Matrix (Priority 2)
- **Deployment volume vs Pick count**: Tracks total units placed vs number of map attempts featuring each tower.
- **Win rate correlation**: Identifies overpowered and underpowered hacking nodes by tracking win rates when a tower is used.
- **Level & deployment averages**: Average tower level and average units deployed per run.
- **Synthetic fallback preview**: Realistic simulated dataset while `GET /map-attempts` is being built on the Go backend, seamlessly switching to live data when available.

### 4. Hacking Map Pass/Fail Rates (Priority 3)
- **Pass vs Fail stacked charts**: Win/loss counts and win rate percentages per map sector.
- **Attempts-to-clear metrics**: Average attempts required to complete each map.
- **Nanosecond duration conversion**: Automatically converts Go native nanoseconds (`duration / 1_000_000_000`) into readable seconds, minutes, and formatted durations.
- **Difficulty curve balance table**: Compares First-time pass rate vs Repeat attempt pass rate, alongside average RAM and CPU consumption.

### 5. Timeline Trends (Priority 4)
- **Time-series activity graphs**: Daily and Hourly resolution toggles.
- **Multi-series stacked area breakdown**: Visualizes event type volume over time and Daily Active Players (DAU).
- **Peak period callouts**: Highlights peak playtest hours/days and average event throughput.

### 6. Player Drill-down (Priority 5)
- **Player directory**: Searchable sidebar with player activity indicators.
- **Player profile summary**: First/last seen, total actions, and win rate.
- **Player-specific visualizations**: Event distribution, hacking map run history with pass/fail badges, duration, round counts, and tower loadouts.

### 7. Raw Stream & Data Export
- **Searchable & sortable raw table**: Paginated event feed with UTC timestamps and relative time formatting.
- **Raw JSON payload inspector modal**: View the exact JSON payload for any event.
- **CSV & JSON export**: 1-click download of filtered or full telemetry datasets for offline spreadsheets or external analysis.

### 8. Live Environment & Endpoint Controls
- **Live Endpoint heartbeat indicator**: Real-time status badges for `/stats` and `/map-attempts`.
- **Auto-polling**: Configurable live polling intervals (Off, 10s, 30s, 60s).
- **Settings modal**: In-app configuration for API Key and Base URL with live connectivity test buttons.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Date Utilities**: Date-fns
- **Styling**: Vanilla CSS Design System (Cyberpunk/Dark Slate terminal aesthetic)

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file (already gitignored) in the project root:

```env
VITE_API_BASE_URL=https://telemetry.japanesesalaryman.dev
VITE_API_KEY=FP+Ew+4i5aFXJRpE12sahP2WszxqdyEe8yayA20JYY8=
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔒 Security & Backend Notes

- **Gitignored API credentials**: The API key is loaded from `.env.local` or localStorage and is never hardcoded in committed source files.
- **No direct DB connection**: All telemetry access goes through the Go backend REST endpoints (`GET /stats` and `GET /map-attempts`).
- **Offline / In-Progress `/map-attempts` handling**: When `/map-attempts` returns 404 (not live yet), the dashboard automatically provides synthetic preview data so you can review map and tower visualizations without waiting on backend deployment. When the backend endpoint goes live, it will immediately fetch and display real data.
