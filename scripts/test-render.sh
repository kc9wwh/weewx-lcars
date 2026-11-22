#!/usr/bin/env bash
# Render every LCARS page against a throwaway WeeWX simulator station and check the output.
# Needs WeeWX 5 on the PATH (pip install weewx). Leaves the station in $WORK for inspection.
#   scripts/test-render.sh            # uses a temp dir
#   WORK=/tmp/lcars-test scripts/test-render.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"
WORK="${WORK:-$(mktemp -d)}"
STATION="$WORK/station"
DAYS="${DAYS:-3}"

echo "==> Creating simulator station in $STATION"
rm -rf "$STATION"
weectl station create "$STATION" --no-prompt --driver=weewx.drivers.simulator \
  --location="LCARS Test" --altitude=911,foot --latitude=44.81 --longitude=-91.50 \
  --units=us --register=n >/dev/null

python3 - "$STATION" "$DAYS" <<'PY'
import sys, datetime, configobj
station, days = sys.argv[1], int(sys.argv[2])
c = configobj.ConfigObj(f'{station}/weewx.conf', encoding='utf-8')
start = datetime.datetime.now() - datetime.timedelta(days=days)
c['Simulator'].update({'mode': 'generator', 'start': start.strftime('%Y-%m-%dT%H:%M'), 'loop_interval': '60'})
for k, v in c['StdReport'].items():
    if isinstance(v, dict) and 'skin' in v:
        v['enable'] = 'false'
c['Logging'] = {'root': {'handlers': ['console']}}
c.write()
PY

echo "==> Generating ~$DAYS days of simulated data"
timeout "${GEN_SECONDS:-60}" weewxd --config "$STATION/weewx.conf" >"$WORK/generate.log" 2>&1 || true
python3 - "$STATION" <<'PY'
import sys, sqlite3, time
db = sqlite3.connect(f'{sys.argv[1]}/archive/weewx.sdb')
db.execute('DELETE FROM archive WHERE dateTime > ?', (int(time.time()),)); db.commit()
n, = db.execute('SELECT COUNT(*) FROM archive').fetchone()
print(f'    {n} archive records')
if n < 100: sys.exit('Not enough simulated data; raise GEN_SECONDS')
PY
weectl database rebuild-daily --config "$STATION/weewx.conf" -y >/dev/null 2>&1

echo "==> Installing skin from working tree"
cp -r "$REPO/skins/LCARS" "$STATION/skins/"
python3 - "$STATION" <<'PY'
import sys, configobj
c = configobj.ConfigObj(f'{sys.argv[1]}/weewx.conf', encoding='utf-8')
c['StdReport']['LCARSReport'] = {'skin': 'LCARS', 'enable': 'true', 'HTML_ROOT': 'public_html/lcars'}
c.write()
PY

echo "==> Running LCARSReport"
rm -rf "$STATION/public_html/lcars"
weectl report run LCARSReport --config "$STATION/weewx.conf" >"$WORK/report.log" 2>&1
if grep -q "ERROR" "$WORK/report.log"; then grep -A20 ERROR "$WORK/report.log"; exit 1; fi

echo "==> Checking output"
python3 - "$STATION/public_html/lcars" <<'PY'
import sys, os, re, json
from html.parser import HTMLParser
out = sys.argv[1]
expected = ['index', 'radar', 'kiosk', 'yesterday', 'week', 'month', 'year']
fail = False
for name in expected:
    path = os.path.join(out, f'{name}.html')
    if not os.path.exists(path):
        print(f'    MISSING {name}.html'); fail = True; continue
    s = open(path, encoding='utf-8').read()
    blocks = re.findall(r'<script type="application/json" id="([^"]+)">(.*?)</script>', s, re.S)
    for bid, body in blocks:
        try:
            json.loads(body)
        except Exception as e:
            print(f'    {name}.html: bad JSON in #{bid}: {e}'); fail = True
    leftovers = re.findall(r'\$[A-Za-z_][\w.]*', re.sub(r'<script.*?</script>', '', s, flags=re.S))
    if leftovers:
        print(f'    {name}.html: unrendered Cheetah placeholders {sorted(set(leftovers))[:5]}'); fail = True
    print(f'    ok  {name}.html  ({len(s)//1024} KB, {len(blocks)} JSON blocks)')
for asset in ['lcars.css', 'lcars.js', 'vendor/apexcharts.min.js', 'vendor/leaflet.js', 'fonts/antonio-latin-400-normal.woff2']:
    if not os.path.exists(os.path.join(out, asset)):
        print(f'    MISSING {asset}'); fail = True
sys.exit(1 if fail else 0)
PY
echo "==> All pages rendered. Output: $STATION/public_html/lcars"
echo "    Preview: python3 -m http.server -d $STATION/public_html/lcars 8000"
