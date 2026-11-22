# weewx-lcars

An LCARS-style skin for [WeeWX](https://weewx.com) 5, built on the Titan.DS color palette: slate and gunmetal frames, steel-blue and peach accents, sky-blue linework, and a red alert that follows real weather warnings.

| Page | What it shows |
|---|---|
| `index.html` | Console: slider gauges for temperature, humidity, wind and rain, additional sensors, 3-day forecast, last-24-hour charts |
| `radar.html` | Sensor sweep: live NEXRAD radar in a circular scope with true-distance range rings, wind rose, readouts and solar track |
| `kiosk.html` | 16:9 wall display with segmented meters; scales to any screen and reloads itself |
| `yesterday` / `week` / `month` / `year` | Recorded extremes and aggregated charts for the period |

Tested against WeeWX 5.1.0, 5.5.2 and 5.6.0.

## Install

Download `weewx-lcars-<version>.zip` from [Releases](https://github.com/kc9wwh/weewx-lcars/releases), then:

```
sudo weectl extension install weewx-lcars-<version>.zip
sudo systemctl restart weewx
```

The installer adds a `[[LCARSReport]]` section to `weewx.conf` that writes the site to an `lcars` folder inside your `HTML_ROOT`. It runs alongside your existing skin.

### Package installs (Debian, Arch, etc.)

`weectl extension install` copies skins into `<WEEWX_ROOT>/skins`, but some packages read skins from somewhere else. Check that the folder ended up where WeeWX looks:

```
grep -nE '^\s*(WEEWX_ROOT|SKIN_ROOT|HTML_ROOT)' /etc/weewx/weewx.conf
ls -d /usr/share/weewx/skins/* /etc/weewx/skins/* /usr/lib/weewx/skins/* 2>/dev/null
```

If `LCARS` landed somewhere other than `[StdReport]`'s `SKIN_ROOT`, point `[[LCARSReport]]` at `<WEEWX_ROOT>/skins` in `weewx.conf` so future `weectl extension install` upgrades update the active copy directly:

```
[[LCARSReport]]
    skin = LCARS
    enable = true
    SKIN_ROOT = /usr/lib/weewx/skins    # match <WEEWX_ROOT>/skins
    HTML_ROOT = /var/lib/weewx/www/lcars
```

The WeeWX service runs as its own user (usually `weewx`). Make sure it owns the output folder, and run any manual report as that user, from a directory it can enter:

```
sudo chown -R weewx:weewx /var/lib/weewx/www/lcars        # use your HTML_ROOT
cd /tmp && sudo -u weewx weectl report run LCARSReport
```

Running `weectl report run` with plain `sudo` creates root-owned files, and the service then fails every cycle with `Permission denied`. Check `journalctl -u weewx | grep LCARSReport` if pages stop updating.

### Upgrading

Install the new release zip directly **without** running `weectl extension uninstall` first (uninstalling removes `[[LCARSReport]]` from `weewx.conf`, whereas installing in place preserves your `[[[Extras]]]` overrides):

```
sudo weectl extension install weewx-lcars-<version>.zip
sudo systemctl restart weewx
```

To regenerate the pages immediately without waiting for the next archive cycle:

```
cd /tmp && sudo -u weewx weectl report run LCARSReport
```

If your site sits behind a caching proxy or CDN (such as Cloudflare) and styling or script changes do not appear after upgrading, purge the cached `lcars.css` and `lcars.js` files.

### Make LCARS the front page

Point your web server at the `HTML_ROOT` folder and redirect `/` to `/lcars/`. With Caddy:

```
:8080 {
    root * /var/lib/weewx/www
    redir / /lcars/
    file_server
}
```

## Settings

Everything is in `skins/LCARS/skin.conf` under `[Extras]`. Override values in `weewx.conf` instead, so upgrades don't overwrite them:

```
[[LCARSReport]]
    skin = LCARS
    enable = true
    HTML_ROOT = /var/lib/weewx/www/lcars
    [[[Extras]]]
        archive_url = ../neowx/archive.html
        kiosk_refresh = 60
```

| Setting | Default | What it does |
|---|---|---|
| `station_title` | `location` from weewx.conf | Name on every page |
| `secondary` | dewpoint, windchill, heatindex, appTemp, cloudbase, barometer | Additional sensors, in order. Sensors with no data are skipped |
| `highlight` | appTemp | Sensor that gets the coral connector line |
| `kiosk_meters` | outTemp, outHumidity, dewpoint, windSpeed, cloudbase, rain | The six wall-display meters |
| `kiosk_refresh` | 300 | Seconds between wall-display reloads (minimum 60) |
| `archive_url`, `history_url` | `../archive.html`, `../history.html` | Buttons linking to another skin's pages. Blank hides them |
| `forecast`, `forecast_days` | true, 3 | Open-Meteo forecast |
| `nws_alerts` | true | US National Weather Service alerts. Severe or extreme alerts trigger red alert; others trigger amber |
| `amber_gust`, `amber_precip_probability` | 40, 80 | Today's forecast thresholds for condition amber (gust in your wind units) |
| `radar_rings`, `radar_ring_unit` | 5, 10, 15, 20 / mi | Range rings on the radar scope |
| `radar_tiles`, `basemap_tiles` | IEM NEXRAD, CARTO dark | Map tile sources |

Gauge scales follow your unit system (°F/°C, mph/km/h/m/s/knots, in/mm, inHg/hPa).

## Development

```
pip install weewx                    # any WeeWX 5.x
scripts/test-render.sh               # builds a simulator station, renders every page, validates the output
python3 -m http.server -d <printed output path> 8000   # preview in a browser
scripts/build.sh                     # dist/weewx-lcars-<version>.zip
```

`test-render.sh` runs on every push via GitHub Actions against several WeeWX versions; the rendered site is attached to each run as an artifact.

### Layout

```
install.py                  weectl extension installer (version lives here)
skins/LCARS/
  skin.conf                 settings, labels, generator config
  index.html.tmpl           console
  radar.html.tmpl           radar scope
  kiosk.html.tmpl           wall display
  yesterday|week|month|year.html.tmpl   thin wrappers around inc/period.inc
  inc/                      shared Cheetah includes (frame, config JSON, chart data)
  lcars.css                 all styling; palette tokens at the top
  lcars.js                  gauges, meters, forecast, alerts, charts, radar map, kiosk
  fonts/, vendor/           bundled Antonio, ApexCharts, Leaflet
```

Template notes: WeeWX's `$obs.label` needs `[key]` access, while `$unit.label` and `$unit.unit_type` need `getattr`. Avoid `#errorCatcher`, because it breaks expressions that start with a quote. Use `#set global` to pass values into includes; macros defined in an include are not visible to the page that includes it.

### Releasing

1. Bump `VERSION` in `install.py` and `SKIN_VERSION` in `skins/LCARS/skin.conf`, and add a `CHANGELOG.md` entry.
2. Tag and push: `git tag v0.2.0 && git push --tags`.
3. The Release workflow runs the render test, builds the zip and attaches it to a GitHub release.

## Data sources

- Forecast: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0), fetched by the browser. No key needed.
- Alerts: US National Weather Service, `api.weather.gov`. US only.
- Radar: NEXRAD composite tiles from the [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu/). US only.
- Basemap: CARTO dark, OpenStreetMap data.

## License

MIT, see `LICENSE`. Bundled third-party files keep their own licenses (`skins/LCARS/LICENSES.txt`): Antonio (SIL OFL 1.1), ApexCharts (MIT), Leaflet (BSD-2-Clause).

Star Trek and LCARS are trademarks of CBS Studios / Paramount. This is a fan-made, non-commercial theme with no official logos or insignia. Color palette inspired by [Titan.DS by meWho](https://www.mewho.com/titan/).
