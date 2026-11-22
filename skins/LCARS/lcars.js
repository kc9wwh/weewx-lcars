/* LCARS skin for WeeWX: client-side behaviour.
 * Everything here is progressive: pages read fine without it. */
(function () {
  'use strict';

  function readJSON(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { console.warn('LCARS: bad JSON in #' + id, e); return null; }
  }

  var cfg = readJSON('wx-config') || {};
  var units = cfg.units || {};
  var labels = cfg.labels || {};

  /* ---------- scales ---------- */

  var SCALES = {
    temp: { degree_F: [-20, 110], degree_C: [-30, 45], degree_K: [243, 318] },
    pct: { '*': [0, 100] },
    speed: { mile_per_hour: [0, 60], mile_per_hour2: [0, 60], km_per_hour: [0, 100], km_per_hour2: [0, 100], meter_per_second: [0, 30], meter_per_second2: [0, 30], knot: [0, 50], knot2: [0, 50], beaufort: [0, 12] },
    rain: { inch: [0, 2], mm: [0, 50], cm: [0, 5] },
    altitude: { foot: [0, 10000], meter: [0, 3000] },
    pressure: { inHg: [28.6, 31.0], mbar: [970, 1050], hPa: [970, 1050], kPa: [97, 105], mmHg: [728, 788] }
  };

  function scaleFor(kind, unit) {
    var s = SCALES[kind];
    if (!s) return [0, 100];
    return s[unit] || s['*'] || [0, 100];
  }
  function num(x) {
    if (x === null || x === undefined || x === '') return null;
    var n = parseFloat(x);
    return isFinite(n) ? n : null;
  }
  function pct(v, r) {
    return Math.max(0, Math.min(100, ((v - r[0]) / (r[1] - r[0])) * 100));
  }
  function fmt(n, d) {
    return n === null ? '–' : Number(n).toFixed(d === undefined ? 0 : d);
  }

  /* ---------- slider gauges ---------- */

  function gauges() {
    document.querySelectorAll('.gauge[data-scale]').forEach(function (g) {
      var r = scaleFor(g.dataset.scale, g.dataset.unit);
      var v = num(g.dataset.v);
      if (v === null) return;
      g.style.setProperty('--k', pct(v, r) + '%');
      var lo = num(g.dataset.lo), hi = num(g.dataset.hi);
      if (lo !== null && hi !== null && hi >= lo) {
        var a = pct(lo, r), b = pct(hi, r);
        g.style.setProperty('--bl', a + '%');
        g.style.setProperty('--bw', Math.max(b - a, 0.8) + '%');
      }
      g.classList.add('is-ready');
    });
    document.querySelectorAll('[data-scale-labels]').forEach(function (el) {
      var r = scaleFor(el.dataset.scaleLabels, el.dataset.unit);
      var spans = el.querySelectorAll('span');
      if (spans.length === 3) {
        spans[0].textContent = r[0];
        spans[1].textContent = (r[0] + r[1]) / 2;
        spans[2].textContent = r[1] + ' ' + (labels.speed || '');
      }
    });
  }

  /* ---------- wall display meters ---------- */

  var SEGS = 20;
  function meter(m) {
    var r = scaleFor(m.dataset.scale, m.dataset.unit);
    var box = m.querySelector('.m-segs');
    var v = num(m.dataset.v), pk = num(m.dataset.peak);
    var lit = v === null ? 0 : Math.max(v > r[0] ? 1 : 0, Math.round((pct(v, r) / 100) * SEGS));
    var peakSeg = pk === null ? -1 : Math.round((pct(pk, r) / 100) * SEGS);
    box.querySelectorAll('i.seg').forEach(function (s) { s.remove(); });
    var tick = box.querySelector('.m-tick');
    for (var i = SEGS; i >= 1; i--) {
      var s = document.createElement('i');
      s.className = 'seg' + (i <= lit ? ' on' : '') + (i === peakSeg && i > lit ? ' peak' : '');
      box.insertBefore(s, tick);
    }
    var knob = box.querySelector('.m-knob');
    if (v === null) { knob.hidden = true; } else { box.style.setProperty('--k', pct(v, r) + '%'); }
    if (pk === null) { tick.hidden = true; } else { tick.hidden = false; box.style.setProperty('--pk', pct(pk, r) + '%'); }
    var mx = m.querySelector('[data-max]'), mn = m.querySelector('[data-min]');
    if (mx) mx.textContent = r[1];
    if (mn) mn.textContent = r[0];
  }
  function meters() { document.querySelectorAll('.meter[data-scale]').forEach(meter); }

  /* ---------- forecast (Open-Meteo) ---------- */

  var WMO = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers',
    82: 'Violent showers', 85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Storm, hail', 99: 'Storm, hail'
  };
  var DAY_COLORS = ['c-peach', 'c-lav', 'c-mist', 'c-lav', 'c-mist', 'c-lav', 'c-mist'];

  function forecastURL() {
    var u = units;
    var t = u.temp === 'degree_C' ? 'celsius' : 'fahrenheit';
    var w = { km_per_hour: 'kmh', km_per_hour2: 'kmh', meter_per_second: 'ms', meter_per_second2: 'ms', knot: 'kn', knot2: 'kn' }[u.speed] || 'mph';
    var p = (u.rain === 'mm' || u.rain === 'cm') ? 'mm' : 'inch';
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + cfg.lat + '&longitude=' + cfg.lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,' +
      'wind_speed_10m_max,wind_gusts_10m_max,sunshine_duration,daylight_duration' +
      '&temperature_unit=' + t + '&wind_speed_unit=' + w + '&precipitation_unit=' + p +
      '&timezone=auto&forecast_days=' + Math.min(Math.max(cfg.forecastDays || 3, 1), 7);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function days(fc) {
    var d = fc.daily, out = [];
    var pUnit = (units.rain === 'mm' || units.rain === 'cm') ? 'mm' : (labels.rain || 'in');
    for (var i = 0; i < d.time.length; i++) {
      var parts = d.time[i].split('-');
      var date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      out.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sky: WMO[d.weather_code[i]] || 'Code ' + d.weather_code[i],
        hi: d.temperature_2m_max[i], lo: d.temperature_2m_min[i],
        rain: d.precipitation_sum[i], pop: d.precipitation_probability_max[i],
        wind: d.wind_speed_10m_max[i], gust: d.wind_gusts_10m_max[i],
        sun: d.sunshine_duration[i] / 3600, daylight: d.daylight_duration[i] / 3600,
        pUnit: pUnit
      });
    }
    return out;
  }

  function hours(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (mm === 60) { hh += 1; mm = 0; }
    return hh + ':' + (mm < 10 ? '0' : '') + mm + ' h';
  }

  function renderForecast(box, list) {
    var mode = box.dataset.forecast;
    var tUnit = labels.temp || '';
    var sUnit = labels.speed || '';
    var rd = list[0] && list[0].pUnit === 'mm' ? 1 : 2;
    box.textContent = '';
    list.forEach(function (f, i) {
      var card = el('div', 'fc');
      card.appendChild(el('div', 'day ' + DAY_COLORS[i % DAY_COLORS.length], f.name));
      var body = el('div', 'body');
      if (mode === 'kiosk' || mode === 'compact') {
        var top = el('div');
        top.style.display = 'flex';
        top.style.justifyContent = 'space-between';
        top.appendChild(el('span', 'temps', fmt(f.lo) + '° / ' + fmt(f.hi) + '°'));
        top.appendChild(el('span', 'sky', f.sky));
        body.appendChild(top);
        body.appendChild(el('div', 'meta', fmt(f.rain, rd) + ' ' + f.pUnit + ' (' + fmt(f.pop) + '%) • Wind ' + fmt(f.wind) + ' (' + fmt(f.gust) + ') ' + sUnit));
      } else {
        body.appendChild(el('div', 'sky', f.sky));
        body.appendChild(el('div', 'temps', fmt(f.lo) + '° / ' + fmt(f.hi) + tUnit));
        body.appendChild(el('div', 'meta', 'Precip ' + fmt(f.rain, rd) + ' ' + f.pUnit + ' (' + fmt(f.pop) + '%) • Wind ' + fmt(f.wind) + ' (' + fmt(f.gust) + ') ' + sUnit));
        if (mode === 'full') body.appendChild(el('div', 'meta', 'Sun ' + hours(f.sun) + ' of ' + hours(f.daylight)));
      }
      card.appendChild(body);
      box.appendChild(card);
    });
  }

  function forecast() {
    var boxes = document.querySelectorAll('[data-forecast]');
    if (!cfg.forecast || cfg.lat === undefined) return Promise.resolve(null);
    return fetch(forecastURL())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (fc) {
        var list = days(fc);
        boxes.forEach(function (b) { renderForecast(b, list); });
        return list;
      })
      .catch(function (e) {
        console.warn('LCARS: forecast unavailable', e);
        boxes.forEach(function (b) {
          b.textContent = '';
          b.appendChild(el('p', 'empty', 'Forecast unavailable. Open-Meteo did not respond; it will retry on the next page refresh.'));
        });
        return null;
      });
  }

  /* ---------- NWS alerts ---------- */

  var SEVERITY = { Extreme: 3, Severe: 2, Moderate: 1, Minor: 0, Unknown: 0 };
  function alerts() {
    if (!cfg.nwsAlerts || cfg.lat === undefined) return Promise.resolve([]);
    var url = 'https://api.weather.gov/alerts/active?point=' + Number(cfg.lat).toFixed(4) + ',' + Number(cfg.lon).toFixed(4);
    return fetch(url, { headers: { Accept: 'application/geo+json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        return (j.features || []).map(function (f) { return f.properties; })
          .sort(function (a, b) { return (SEVERITY[b.severity] || 0) - (SEVERITY[a.severity] || 0); });
      })
      .catch(function (e) { console.warn('LCARS: NWS alerts unavailable', e); return []; });
  }

  /* ---------- condition (nominal / amber / red) ---------- */

  function setCondition(level, text) {
    document.body.classList.remove('alert-amber', 'alert-red');
    if (level !== 'nominal') document.body.classList.add('alert-' + level);
    document.querySelectorAll('[data-alert-banner]').forEach(function (b) {
      b.hidden = level === 'nominal';
      b.textContent = text;
    });
    document.querySelectorAll('[data-kiosk-banner]').forEach(function (b) { b.textContent = text; });
    document.querySelectorAll('[data-cond-label]').forEach(function (b) {
      b.textContent = level === 'red' ? 'Red alert' : level === 'amber' ? 'Cond amber' : 'Nominal';
    });
  }

  function condition(fcList, alertList) {
    if (alertList.length) {
      var top = alertList[0];
      var red = (SEVERITY[top.severity] || 0) >= 2;
      var more = alertList.length > 1 ? ' (+' + (alertList.length - 1) + ' more)' : '';
      setCondition(red ? 'red' : 'amber', (red ? 'Red alert • ' : 'Condition amber • ') + top.event + more);
      return;
    }
    if (fcList && fcList.length) {
      var t = fcList[0], why = [];
      if (t.pop !== null && t.pop >= cfg.amberPop) why.push('rain ' + fmt(t.rain, t.pUnit === 'mm' ? 1 : 2) + ' ' + t.pUnit + ' (' + fmt(t.pop) + '%)');
      if (t.gust !== null && t.gust >= cfg.amberGust) why.push('gusts to ' + fmt(t.gust) + ' ' + (labels.speed || ''));
      if (why.length) { setCondition('amber', 'Condition amber • Today: ' + why.join(' • ')); return; }
    }
    setCondition('nominal', 'All atmospheric sensors nominal');
  }

  /* ---------- charts (ApexCharts) ---------- */

  var CHART_COLORS = ['#78c0e8', '#f29d7d', '#ef7257', '#98a0b8'];
  function charts() {
    var host = document.querySelector('[data-charts]');
    var data = readJSON('wx-charts');
    if (!host || !data || !window.ApexCharts) return;
    var jobs = [];
    data.charts.forEach(function (c) {
      var hasPoints = c.series.some(function (s) { return s.data && s.data.some(function (p) { return p[1] !== null; }); });
      if (!hasPoints) return;
      var panel = el('div', 'chart-panel');
      panel.appendChild(el('h3', null, c.title + (c.unit ? ' · ' + c.unit : '')));
      var box = el('div', 'chart');
      panel.appendChild(box);
      host.appendChild(panel);
      jobs.push([box, c]);
    });
    // Render only after every panel is in the grid, so each chart measures its final column width.
    var narrow = window.innerWidth <= 640;
    jobs.forEach(function (job) {
      var box = job[0], c = job[1];
      var bar = c.type === 'bar';
      new window.ApexCharts(box, {
        chart: { type: bar ? 'bar' : 'line', height: narrow ? 185 : 230, background: 'transparent', foreColor: '#98a0b8', fontFamily: 'Antonio, Arial Narrow, sans-serif', toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false } },
        theme: { mode: 'dark' },
        colors: bar ? ['#ef7257'] : CHART_COLORS,
        series: c.series,
        stroke: { width: bar ? 0 : 2, curve: 'straight' },
        dataLabels: { enabled: false },
        grid: { borderColor: '#313749', strokeDashArray: 3 },
        xaxis: { type: 'datetime', labels: { datetimeUTC: false, hideOverlappingLabels: true, style: { fontSize: narrow ? '11px' : '12px' } }, axisBorder: { color: '#313749' }, axisTicks: { color: '#313749' } },
        yaxis: { labels: { style: { fontSize: narrow ? '11px' : '12px' }, formatter: function (v) { return v === null || v === undefined ? '' : (Math.abs(v) < 10 && v % 1 ? v.toFixed(2) : Math.round(v * 10) / 10); } } },
        legend: { show: c.series.length > 1, labels: { colors: '#d6d9e4' } },
        tooltip: { theme: 'dark', x: { format: c.xFormat || 'dd MMM HH:mm' }, y: { formatter: function (v) { return v === null ? '–' : v + ' ' + (c.unit || ''); } } },
        plotOptions: { bar: { columnWidth: '70%' } },
        noData: { text: 'No data' }
      }).render();
    });
  }

  /* ---------- radar scope (Leaflet) ---------- */

  var RING_METERS = { mi: 1609.344, km: 1000, nm: 1852 };
  function radar() {
    var box = document.getElementById('scope-map');
    var rc = readJSON('wx-radar');
    if (!box || !rc || !window.L || cfg.lat === undefined) return;
    var L = window.L;
    var here = L.latLng(cfg.lat, cfg.lon);
    var per = RING_METERS[rc.ringUnit] || RING_METERS.mi;
    var rings = (rc.rings || [5, 10, 15, 20]).map(function (r) { return r * per; });
    var maxR = Math.max.apply(null, rings);
    var map = L.map(box, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, zoomSnap: 0.1 });
    map.fitBounds(here.toBounds(maxR * 2), { padding: [0, 0] });
    if (rc.basemapTiles) L.tileLayer(rc.basemapTiles, { attribution: rc.basemapAttribution, subdomains: 'abcd', maxZoom: 18 }).addTo(map);
    var radarLayer = null;
    function stamp() { return Math.floor(Date.now() / 300000); }
    if (rc.radarTiles) {
      radarLayer = L.tileLayer(rc.radarTiles + (rc.radarTiles.indexOf('?') < 0 ? '?' : '&') + 't=' + stamp(), { attribution: rc.radarAttribution, opacity: 0.75 }).addTo(map);
      setInterval(function () { radarLayer.setUrl(rc.radarTiles + (rc.radarTiles.indexOf('?') < 0 ? '?' : '&') + 't=' + stamp()); }, 300000);
    }
    rings.forEach(function (r) {
      L.circle(here, { radius: r, color: '#78c0e8', weight: 1, opacity: 0.55, dashArray: '4 6', fill: false, interactive: false }).addTo(map);
    });
    window.addEventListener('resize', function () { map.invalidateSize(); map.fitBounds(here.toBounds(maxR * 2), { padding: [0, 0] }); });
  }

  /* ---------- solar track ---------- */

  function solar() {
    var svg = document.querySelector('svg.solar');
    if (!svg) return;
    var rise = num(svg.dataset.rise), set = num(svg.dataset.set);
    if (rise === null || set === null || set <= rise) return;
    var now = Date.now() / 1000;
    var f = Math.max(0, Math.min(1, (now - rise) / (set - rise)));
    var th = Math.PI * (1 - f);
    var x = 300 + 260 * Math.cos(th), y = 150 - 120 * Math.sin(th);
    var sun = svg.querySelector('.sun');
    sun.setAttribute('cx', x.toFixed(1));
    sun.setAttribute('cy', y.toFixed(1));
    if (now < rise || now > set) sun.setAttribute('opacity', '0.35');
    svg.querySelector('.done').setAttribute('d', f > 0 ? 'M40 150 A260 120 0 0 1 ' + x.toFixed(1) + ' ' + y.toFixed(1) : 'M40 150');
    var len = (set - rise) / 3600;
    svg.querySelector('.daylen').textContent = 'DAYLIGHT ' + hours(len).toUpperCase();
  }

  /* ---------- live clock & wall display ---------- */

  function liveClock() {
    var clocks = document.querySelectorAll('[data-clock]');
    if (!clocks.length) return;
    function tick() {
      var d = new Date();
      var s = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return (n < 10 ? '0' : '') + n; }).join(':');
      clocks.forEach(function (c) { c.textContent = s; });
    }
    tick();
    setInterval(tick, 1000);
  }

  function kiosk() {
    var stage = document.getElementById('stage');
    if (!stage) return;
    function fit() {
      if (window.innerWidth <= 720 && window.innerHeight > window.innerWidth) {
        stage.style.transform = '';
        return;
      }
      var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    setTimeout(function () { window.location.reload(); }, Math.max(60, cfg.kioskRefresh || 300) * 1000);
  }

  function rainPeakFromForecast(list) {
    if (!list || !list.length) return;
    document.querySelectorAll('.meter[data-peak-source="forecast"]').forEach(function (m) {
      m.dataset.peak = list[0].rain;
      meter(m);
      var note = m.querySelector('[data-note]');
      if (note) note.textContent = (labels.rain || '') + ' • Fcst ' + fmt(list[0].rain, list[0].pUnit === 'mm' ? 1 : 2);
    });
  }

  /* ---------- history matrix & archive ---------- */

  function tempToF(v, unit) {
    if (unit === 'degree_C') return v * 9 / 5 + 32;
    if (unit === 'degree_K') return (v - 273.15) * 9 / 5 + 32;
    return v;
  }

  function rainToIn(v, unit) {
    if (unit === 'mm') return v / 25.4;
    if (unit === 'cm') return v / 2.54;
    return v;
  }

  function speedToMph(v, unit) {
    if (unit === 'km_per_hour' || unit === 'km_per_hour2') return v * 0.621371;
    if (unit === 'meter_per_second' || unit === 'meter_per_second2') return v * 2.23694;
    if (unit === 'knot' || unit === 'knot2') return v * 1.15078;
    return v;
  }

  function toneFor(metric, unit, v) {
    if (metric === 'tmax' || metric === 'tavg' || metric === 'tmin') {
      var f = tempToF(v, unit);
      if (f < 20) return 't0';
      if (f < 32) return 't1';
      if (f < 45) return 't2';
      if (f < 58) return 't3';
      if (f < 70) return 't4';
      if (f < 82) return 't5';
      if (f < 92) return 't6';
      return 't7';
    }
    if (metric === 'rain') {
      var r = rainToIn(v, unit);
      if (r <= 0) return 'r0';
      if (r < 0.5) return 'r1';
      if (r < 1.5) return 'r2';
      if (r < 3.0) return 'r3';
      if (r < 5.0) return 'r4';
      return 'r5';
    }
    if (metric === 'rdays') {
      if (v <= 0) return 'r0';
      if (v <= 3) return 'r1';
      if (v <= 7) return 'r2';
      if (v <= 12) return 'r3';
      if (v <= 18) return 'r4';
      return 'r5';
    }
    if (metric === 'gust') {
      var g = speedToMph(v, unit);
      if (g <= 0) return 'w0';
      if (g < 15) return 'w1';
      if (g < 25) return 'w2';
      if (g < 38) return 'w3';
      if (g < 50) return 'w4';
      return 'w5';
    }
    return '';
  }

  function historyMatrix() {
    document.querySelectorAll('td[data-val][data-metric]').forEach(function (td) {
      var v = num(td.dataset.val);
      if (v === null) return;
      var tone = toneFor(td.dataset.metric, td.dataset.unit, v);
      if (tone) td.dataset.tone = tone;
    });

    var tablist = document.querySelector('.hist-tabs');
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"][data-matrix-tab]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-matrix-panel]'));
    if (!tabs.length || !panels.length) return;

    function activate(id, focusTab) {
      tabs.forEach(function (t) {
        var on = t.dataset.matrixTab === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        if (on && focusTab) t.focus();
      });
      panels.forEach(function (p) {
        p.hidden = p.dataset.matrixPanel !== id;
      });
    }

    var active = tabs.filter(function (t) { return t.classList.contains('is-active'); })[0] || tabs[0];
    activate(active.dataset.matrixTab, false);

    tabs.forEach(function (t, idx) {
      t.addEventListener('click', function () { activate(t.dataset.matrixTab, false); });
      t.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        activate(next.dataset.matrixTab, true);
      });
    });
  }

  var ARCHIVE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function archiveNav() {
    var bar = document.querySelector('.archive-bar[data-archive-kind][data-archive-key]');
    if (!bar || !window.fetch) return;
    var kind = bar.dataset.archiveKind;
    var key = bar.dataset.archiveKey;
    if (!kind || !key) return;
    function labelFor(k) {
      if (kind === 'year') return k;
      var m = parseInt(k.slice(5, 7), 10);
      return (ARCHIVE_MONTHS[m - 1] || k.slice(5, 7)) + ' ' + k.slice(0, 4);
    }
    function hrefFor(k) { return (kind === 'year' ? 'year-' : 'month-') + k + '.html'; }
    fetch('archive.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (idxData) {
        var list = kind === 'year' ? idxData.years : idxData.months;
        if (!Array.isArray(list)) return;
        var pos = list.indexOf(key);
        if (pos < 0) return;
        var prevEl = bar.querySelector('[data-archive-prev]');
        var nextEl = bar.querySelector('[data-archive-next]');
        if (prevEl) {
          if (pos > 0) {
            prevEl.href = hrefFor(list[pos - 1]);
            prevEl.textContent = '‹ ' + labelFor(list[pos - 1]);
            prevEl.hidden = false;
          } else {
            prevEl.hidden = true;
          }
        }
        if (nextEl) {
          if (pos + 1 < list.length) {
            nextEl.href = hrefFor(list[pos + 1]);
            nextEl.textContent = labelFor(list[pos + 1]) + ' ›';
            nextEl.hidden = false;
          } else {
            nextEl.hidden = true;
          }
        }
      })
      .catch(function () {});
  }

  function noaaViewer() {
    var dialog = document.getElementById('noaa-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var titleEl = document.getElementById('noaa-dialog-title');
    var bodyEl = document.getElementById('noaa-dialog-body');
    var rawEl = dialog.querySelector('[data-noaa-raw]');
    var copyBtn = dialog.querySelector('[data-noaa-copy]');
    var closeBtn = dialog.querySelector('[data-noaa-close]');
    var reqId = 0;
    var copyTimer = null;

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target && e.target.closest ? e.target.closest('a[data-noaa-src]') : null;
      if (!link) return;
      var src = link.getAttribute('data-noaa-src');
      if (!src) return;
      e.preventDefault();
      if (titleEl) titleEl.textContent = link.getAttribute('data-noaa-title') || 'NOAA Report';
      if (rawEl) rawEl.setAttribute('href', src);
      if (bodyEl) bodyEl.textContent = 'Loading NOAA report…';
      if (copyBtn) copyBtn.textContent = 'Copy';
      if (!dialog.open) dialog.showModal();
      var myReq = ++reqId;
      fetch(src)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (txt) { if (myReq === reqId && bodyEl) bodyEl.textContent = txt; })
        .catch(function () {
          if (myReq === reqId && bodyEl) bodyEl.textContent = 'Unable to load NOAA report inline (' + src + '). Use "Raw .txt" above to open the file directly.';
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    if (copyBtn && bodyEl && navigator.clipboard && navigator.clipboard.writeText) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(bodyEl.textContent || '').then(function () {
          copyBtn.textContent = 'Copied';
          clearTimeout(copyTimer);
          copyTimer = setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1800);
        }).catch(function () {});
      });
    }
  }

  /* ---------- mobile drawer & PWA ---------- */

  function mobileNav() {
    var sheet = document.getElementById('mobile-sheet');
    var backdrop = document.querySelector('.m-backdrop');
    var toggle = document.querySelector('[data-nav-toggle]');
    if (!sheet || !toggle) return;

    function setOpen(open) {
      sheet.hidden = !open;
      if (backdrop) backdrop.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open && window.location.hash === '#mobile-sheet' && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    if (window.location.hash === '#mobile-sheet') setOpen(true);

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      setOpen(sheet.hidden);
    });

    document.querySelectorAll('[data-nav-close]').forEach(function (el) {
      el.addEventListener('click', function () { setOpen(false); });
    });

    sheet.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sheet.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function pwa() {
    var secureOrigin = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if ('serviceWorker' in navigator && secureOrigin) {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function (e) {
        console.warn('LCARS: service worker registration failed', e);
      });
    }

    document.querySelectorAll('[data-pwa-refresh]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.location.reload(); });
    });

    var installBtn = document.querySelector('[data-pwa-install]');
    var deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.hidden = false;
    });
    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (res) {
          if (res && res.outcome === 'accepted') installBtn.hidden = true;
          deferredPrompt = null;
        }).catch(function () {});
      });
    }
    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      if (installBtn) installBtn.hidden = true;
    });

    var iosHint = document.querySelector('[data-ios-install-hint]');
    var isStandalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (iosHint && isIOS && !isStandalone) iosHint.hidden = false;

    var offlineBanners = document.querySelectorAll('[data-offline-banner]');
    function syncOnline() {
      var off = navigator.onLine === false;
      offlineBanners.forEach(function (b) { b.hidden = !off; });
    }
    syncOnline();
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);

    var bootAt = Date.now();
    if (!document.body.classList.contains('kiosk')) {
      var reloadIfStale = function () {
        if (navigator.onLine !== false && (Date.now() - bootAt > 300000)) {
          window.location.reload();
        }
      };
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') reloadIfStale();
      });
      window.addEventListener('pageshow', function (e) {
        if (e.persisted) reloadIfStale();
      });
    }
  }

  /* ---------- boot ---------- */

  function boot() {
    gauges();
    meters();
    liveClock();
    kiosk();
    solar();
    radar();
    charts();
    historyMatrix();
    archiveNav();
    noaaViewer();
    mobileNav();
    pwa();
    Promise.all([forecast(), alerts()]).then(function (res) {
      rainPeakFromForecast(res[0]);
      condition(res[0], res[1] || []);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
