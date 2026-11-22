## Shared setup: station title, sensor lists and navigation (sets globals).
#set global $stn = $Extras.get('station_title', '') or $station.location
#set $raw = $Extras.get('secondary', ['dewpoint', 'windchill', 'heatindex', 'appTemp', 'cloudbase', 'barometer'])
#set global $secondary = [$raw] if isinstance($raw, str) else list($raw)
#set global $hot = $Extras.get('highlight', '')
#set $kraw = $Extras.get('kiosk_meters', ['outTemp', 'outHumidity', 'dewpoint', 'windSpeed', 'cloudbase', 'rain'])
#set global $kiosk_meters = [$kraw] if isinstance($kraw, str) else list($kraw)
#set global $fc_on = str($Extras.get('forecast', 'true')).lower() in ('true', 'yes', '1')
#set global $fc_days = int($Extras.get('forecast_days', 3))
#set global $nav = [('index', 'Current', 'c-lav', 'index.html'), ('radar', 'Radar', 'c-dark', 'radar.html'), ('yesterday', 'Yesterday', 'c-lav', 'yesterday.html'), ('week', 'Week', 'c-slate', 'week.html'), ('month', 'Month', 'c-mist', 'month.html'), ('year', 'Year', 'c-lav', 'year.html'), ('history', 'History', 'c-coral', 'history.html'), ('kiosk', 'Wall display', 'c-dark', 'kiosk.html')]
