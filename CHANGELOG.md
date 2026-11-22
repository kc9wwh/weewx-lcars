# Changelog

## 0.3.2 (2026-11-22)

- Added a knockout GitHub Invertocat logo hyperlink back to the `weewx-lcars` repository in the shared page footer and wall display (`kiosk.html`) footer.
- Built a versionless `weewx-lcars.zip` alongside `weewx-lcars-<version>.zip` on each release and simplified `README.md` install and upgrade instructions with a direct GitHub release URL and dedicated FAQ.

## 0.3.1 (2026-11-22)

- Made the clock on the Radar page (`radar.html`) tick live like the Current console and wall display, with the last station reading time shown in the header subtitle.

## 0.3.0 (2026-11-22)

- Added mobile-first LCARS layout (`<= 860px` / `<= 640px`): slim `WX·01` top elbow bar, compact side-by-side header, 2×2 primary reading grid, single-row wire-connected additional sensors, radar-first sweep ordering with compact side-by-side wind rose and stats, mobile period switcher (`Yesterday`, `Week`, `Month`, `Year`), full-screen NOAA report viewer, and fixed 5-tab bottom navigation dock with slide-up Auxiliary Consoles drawer (`More`).
- Added Progressive Web App (PWA) support: generated `manifest.webmanifest` (relative paths, shortcuts, optional `pwa_short_name`), Titan.DS PNG icon set (`192`, `512`, maskable `512`, Apple touch icon), WeeWX-aware service worker (`sw.js`: network-first for live HTML/CSS/JS/data, cache-first for bundled assets), offline banner, in-drawer install prompt / iOS hint, and automatic stale-data refresh on resume.
- Made the clock on the Current console (`index.html`) tick live like the wall display, with the last station reading time displayed in the header subtitle and `tabular-nums` digit alignment.
- Added portrait phone mode for the wall display (`kiosk.html`) with scrollable 3×2 vertical segmented meters, fixed centered 16:9 stage scaling on smaller landscape viewports, and adjusted desktop `.sensors` flex-basis to prevent horizontal overflow at 1440px.

## 0.2.0 (2026-11-22)

- Added consolidated LCARS History & Archive console (`history.html`) replacing external `archive_url` and `history_url` links with a single native `History` nav item: all-time recorded extremes, interactive Titan.DS heat-tinted monthly climate matrices (high/avg/low temperature, rainfall, rain days, peak gust), year-by-year archive directory, and monthly/daily historical trend charts.
- Added generated per-year (`year-YYYY.html`) and per-month (`month-YYYY-MM.html`) LCARS archive pages with prev/next navigation kept fresh via `archive.json`.
- Added generated monthly and annual ASCII NOAA climatological summaries (`NOAA/NOAA-YYYY-MM.txt`, `NOAA/NOAA-YYYY.txt`) with an in-page LCARS monospace report viewer modal (`Copy`, `Raw .txt`, `Close`).
- Fixed `README.md` package install instructions to symlink `LCARS` into `[StdReport]`'s `SKIN_ROOT` rather than setting per-report `SKIN_ROOT` under `[[LCARSReport]]` (which WeeWX's `CheetahGenerator` ignores).

## 0.1.1 (2026-11-22)

- Fixed home dashboard and shared frame footer alignment so the bottom-left LCARS elbow meets `.bar-bottom` flush, with the attribution credit aligned cleanly beneath the frame.
- Updated `README.md` package install instructions to recommend setting `SKIN_ROOT` in `[[LCARSReport]]` and added an `Upgrading` guide.

## 0.1.0 (2026-11-22)

First release.

- Console page (`index.html`): slider gauges for temperature, humidity, wind and rain; additional sensors with connector lines; 3-day Open-Meteo forecast; last-24-hour charts.
- Radar page (`radar.html`): NEXRAD radar in a circular scope with true-distance range rings, wind rose, downwind arrow, readouts and solar track.
- Wall display (`kiosk.html`): 16:9 segmented meters with slider knobs and peak ticks, live clock, self-reload.
- Period pages for yesterday, week, month and year with recorded extremes and aggregated charts.
- Condition amber and red alert driven by NWS alerts and the day's forecast.
- Self-hosted Antonio font, ApexCharts 3.54.1 and Leaflet 1.9.4.
