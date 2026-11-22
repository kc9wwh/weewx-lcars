## Chart data for the trend bay. Expects globals:
##   $P (timespan), $agg (seconds or None), $rain_int (seconds), $hilo (bool)
#set $at = 'avg' if $agg else None
#set $gt = 'max' if $agg else None
#def ser($o, $t, $i, $nd=1)
$getattr($P, $o).series(aggregate_type=$t, aggregate_interval=$i, time_series='start', time_unit='unix_epoch_ms').round($nd).json#slurp
#end def
<script type="application/json" id="wx-charts">
{"charts": [
#if $hilo
{"id": "temp", "title": "$obs.label.outTemp", "unit": "$unit.label.outTemp.strip()", "series": [
 {"name": "High", "data": $ser('outTemp', 'max', $agg)},
 {"name": "Low", "data": $ser('outTemp', 'min', $agg)}]}
#else
{"id": "temp", "title": "$obs.label.outTemp", "unit": "$unit.label.outTemp.strip()", "series": [
 {"name": "Outside", "data": $ser('outTemp', $at, $agg)}#slurp
#if $getattr($P, 'dewpoint').has_data
,
 {"name": "$obs.label.dewpoint", "data": $ser('dewpoint', $at, $agg)}#slurp
#end if
]}
#end if
#if $getattr($P, 'outHumidity').has_data
,{"id": "hum", "title": "$obs.label.outHumidity", "unit": "%", "series": [
 {"name": "$obs.label.outHumidity", "data": $ser('outHumidity', $at, $agg, 0)}]}
#end if
#if $getattr($P, 'windSpeed').has_data
,{"id": "wind", "title": "$obs.label.windSpeed", "unit": "$unit.label.windSpeed.strip()", "series": [
 {"name": "Speed", "data": $ser('windSpeed', $at, $agg)},
 {"name": "Gust", "data": $ser('windGust', $gt, $agg)}]}
#end if
#if $getattr($P, 'rain').has_data
,{"id": "rain", "title": "$obs.label.rain", "unit": "$unit.label.rain.strip()", "type": "bar", "series": [
 {"name": "$obs.label.rain", "data": $ser('rain', 'sum', $rain_int, 2)}]}
#end if
#if $getattr($P, 'barometer').has_data
,{"id": "baro", "title": "$obs.label.barometer", "unit": "$unit.label.barometer.strip()", "series": [
 {"name": "$obs.label.barometer", "data": $ser('barometer', $at, $agg, 2)}]}
#end if
#if $getattr($P, 'cloudbase').has_data
,{"id": "cloud", "title": "$obs.label.cloudbase", "unit": "$unit.label.cloudbase.strip()", "series": [
 {"name": "$obs.label.cloudbase", "data": $ser('cloudbase', $at, $agg, 0)}]}
#end if
]}
</script>
