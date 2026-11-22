# Changelog

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
