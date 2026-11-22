## Shared body for yesterday/week/month/year. Expects globals:
##   $page, $P, $ptitle, $tfmt, $agg, $rain_int, $hilo, $trend
#include "inc/setup.inc"
#set $btns = ['c-lav', 'c-slate', 'c-dark', 'c-frame', 'c-mist']
<!doctype html>
<html lang="en">
<head>
#include "inc/head.inc"
<title>$stn · $ptitle</title>
</head>
#include "inc/frame_open.inc"
<header class="console-head">
<div>
<div class="kicker">Sensor log · $ptitle</div>
<h1>$stn</h1>
</div>
<div class="clock">
<div class="time">$ptitle</div>
<div class="when">$P.start.format("%d.%m.%Y %H:%M") – $P.end.format("%d.%m.%Y %H:%M")</div>
</div>
</header>

<main class="content" id="content">

<section aria-labelledby="h-rec">
<div class="sect"><i class="cap c-peach"></i><h2 class="label c-peach" id="h-rec">Recorded extremes</h2><i class="fill"></i><i class="end"></i></div>
<div class="records">
#set $n = 0
#for $o in ['outTemp', 'outHumidity'] + [x for x in $secondary if x not in ('outTemp', 'outHumidity')]
#try
#set $s = $getattr($P, $o)
#set $ok = $s.has_data
#except
#set $ok = False
#end try
#if $ok
<div class="record">
<span class="btn $btns[$n % len($btns)]">$obs.label[$o]</span>
<i class="wire" aria-hidden="true"></i>
<div class="stats">
<div class="stat"><b>$s.min</b><span>Low · $s.mintime.format($tfmt)</span></div>
<div class="stat"><b>$s.avg</b><span>Average</span></div>
<div class="stat"><b>$s.max</b><span>High · $s.maxtime.format($tfmt)</span></div>
</div>
</div>
#set $n = $n + 1
#end if
#end for
#if $P.windSpeed.has_data
<div class="record">
<span class="btn c-dark">$obs.label.windSpeed</span>
<i class="wire" aria-hidden="true"></i>
<div class="stats">
<div class="stat"><b>$P.windSpeed.avg</b><span>Average</span></div>
<div class="stat"><b>$P.windGust.max</b><span>Gust · $P.windGust.maxtime.format($tfmt)</span></div>
#if $P.windrun.has_data
<div class="stat"><b>$P.windrun.sum</b><span>Wind run</span></div>
#end if
</div>
</div>
#end if
#if $P.rain.has_data
<div class="record">
<span class="btn c-coral">$obs.label.rain</span>
<i class="wire" aria-hidden="true"></i>
<div class="stats">
<div class="stat"><b>$P.rain.sum</b><span>Total</span></div>
<div class="stat"><b>$P.rainRate.max</b><span>Max rate · $P.rainRate.maxtime.format($tfmt)</span></div>
</div>
</div>
#end if
</div>
</section>

<section aria-labelledby="h-trend">
<div class="sect"><i class="cap c-mist"></i><h2 class="label c-mist" id="h-trend">Trend bay · $trend</h2><i class="fill"></i></div>
<div class="charts" data-charts></div>
</section>

</main>
#include "inc/frame_close.inc"
#include "inc/charts.inc"
#include "inc/config.inc"
<script src="vendor/apexcharts.min.js" defer></script>
<script src="lcars.js" defer></script>
</body>
</html>
