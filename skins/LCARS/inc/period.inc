## Shared body for yesterday/week/month/year and archived year/month pages. Expects globals:
##   $page, $P, $ptitle, $tfmt, $agg, $rain_int, $hilo, $trend
## Optional globals for historical archive pages:
##   $kicker, $noaa_url, $noaa_title, $parent_url, $parent_label,
##   $prev_url, $prev_label, $next_url, $next_label,
##   $archive_kind, $archive_key, $show_year_months, $ynum
#include "inc/setup.inc"
#set $_kicker = $kicker if ($varExists('kicker') and $kicker) else ('Sensor log · ' + $ptitle)
#set $_has_archive = $varExists('noaa_url') and bool($noaa_url)
#set $_akind = $archive_kind if ($varExists('archive_kind') and $archive_kind) else ''
#set $_akey = $archive_key if ($varExists('archive_key') and $archive_key) else ''
<!doctype html>
<html lang="en">
<head>
#include "inc/head.inc"
<title>$stn · $ptitle</title>
</head>
#include "inc/frame_open.inc"
<header class="console-head">
<div>
<div class="kicker">$_kicker</div>
<h1>$stn</h1>
</div>
<div class="clock">
<div class="time">$ptitle</div>
<div class="when">$P.start.format("%d.%m.%Y %H:%M") – $P.end.format("%d.%m.%Y %H:%M")</div>
</div>
</header>

<main class="content" id="content">

#if $_has_archive
<nav class="archive-bar" aria-label="Archive navigation" data-archive-kind="$_akind" data-archive-key="$_akey">
<a class="pill-btn c-lav" href="history.html">← History</a>
#if $varExists('parent_url') and $parent_url
<a class="pill-btn c-slate" href="$parent_url">$parent_label</a>
#end if
#if $varExists('prev_url') and $prev_url
<a class="pill-btn c-dark" data-archive-prev href="$prev_url">‹ $prev_label</a>
#else
<a class="pill-btn c-dark" data-archive-prev href="#" hidden></a>
#end if
#if $varExists('next_url') and $next_url
<a class="pill-btn c-dark" data-archive-next href="$next_url">$next_label ›</a>
#else
<a class="pill-btn c-dark" data-archive-next href="#" hidden></a>
#end if
<a class="pill-btn c-coral" href="$noaa_url" data-noaa-src="$noaa_url" data-noaa-title="$noaa_title">NOAA Report</a>
</nav>
#end if

#if $varExists('show_year_months') and $show_year_months
#set $_mo_abbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
#set $_mo_fulls = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
#set $_sm_set = set($SummaryByMonth) if $varExists('SummaryByMonth') else set()
#set $_by_mo = {}
#for $_m in $P.months
#set $_by_mo[int($_m.start.format('%m'))] = $_m
#end for
<section aria-labelledby="h-months">
<div class="sect"><i class="cap c-lav"></i><h2 class="label c-lav" id="h-months">Monthly archive · $ptitle</h2><i class="fill"></i><i class="end"></i></div>
<div class="archive-months">
#for $_mi, $_abbr in enumerate($_mo_abbrs, 1)
#set $_full = $_mo_fulls[$_mi - 1]
#set $_mkey = '%s-%02d' % ($ynum, $_mi)
#set $_m = $_by_mo.get($_mi)
#set $_ok = ($_m is not None) and ($_mkey in $_sm_set) and ($_m.outTemp.has_data or $_m.rain.has_data or $_m.windSpeed.has_data)
#if $_ok
<div class="archive-month">
<div class="archive-month-head">
<a class="archive-month-name" href="month-${_mkey}.html">$_abbr</a>
<a class="noaa-chip" href="NOAA/NOAA-${_mkey}.txt" data-noaa-src="NOAA/NOAA-${_mkey}.txt" data-noaa-title="NOAA Monthly Summary · $_full $ynum">NOAA</a>
</div>
<a class="archive-month-stats" href="month-${_mkey}.html">
#if $_m.outTemp.has_data
<b>$_m.outTemp.min.formatted – $_m.outTemp.max.formatted<small>$unit.label.outTemp.strip()</small></b>
#end if
#if $_m.rain.has_data
<span>Rain $_m.rain.sum</span>
#elif $_m.windSpeed.has_data
<span>Wind $_m.windSpeed.avg</span>
#end if
</a>
</div>
#else
<div class="archive-month is-empty"><span class="archive-month-name">$_abbr</span><span class="archive-month-none">No data</span></div>
#end if
#end for
</div>
</section>
#end if

<section aria-labelledby="h-rec">
<div class="sect"><i class="cap c-peach"></i><h2 class="label c-peach" id="h-rec">Recorded extremes</h2><i class="fill"></i><i class="end"></i></div>
#include "inc/records.inc"
</section>

<section aria-labelledby="h-trend">
<div class="sect"><i class="cap c-mist"></i><h2 class="label c-mist" id="h-trend">Trend bay · $trend</h2><i class="fill"></i></div>
<div class="charts" data-charts></div>
</section>

</main>
#include "inc/frame_close.inc"
#if $_has_archive
#include "inc/noaa_dialog.inc"
#end if
#include "inc/charts.inc"
#include "inc/config.inc"
<script src="vendor/apexcharts.min.js" defer></script>
<script src="lcars.js" defer></script>
</body>
</html>
