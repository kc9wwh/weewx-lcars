<script type="application/json" id="wx-config">
{
  "lat": $station.latitude_f,
  "lon": $station.longitude_f,
  "units": {"temp": "$unit.unit_type.outTemp", "speed": "$unit.unit_type.windSpeed", "rain": "$unit.unit_type.rain"},
  "labels": {"temp": "$unit.label.outTemp.strip()", "speed": "$unit.label.windSpeed.strip()", "rain": "$unit.label.rain.strip()"},
  "forecast": $('true' if $fc_on else 'false'),
  "forecastDays": $fc_days,
  "nwsAlerts": $('true' if str($Extras.get('nws_alerts', 'true')).lower() in ('true', 'yes', '1') else 'false'),
  "amberGust": $float($Extras.get('amber_gust', 40)),
  "amberPop": $float($Extras.get('amber_precip_probability', 80)),
  "kioskRefresh": $int($Extras.get('kiosk_refresh', 300)),
  "dataTime": $current.dateTime.raw
}
</script>
