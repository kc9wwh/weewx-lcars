<div class="bar bar-bottom">
<div class="s-rail">Station up $station.uptime.long_form • Server up $station.os_uptime.long_form</div>
<span class="dots" aria-hidden="true"><i></i><i></i><i class="gap"></i><i></i><i></i><i class="off"></i><i class="gap"></i><i></i><i class="gap"></i><i></i><i></i><i></i><i></i><i class="gap"></i><i class="off"></i><i></i><i></i></span>
<div class="s-lav">WeeWX $station.version</div>
<i class="cap"></i>
</div>
</div>
</div>
<footer class="credit frame-credit">
<span>#if $fc_on#Forecast by <a href="https://open-meteo.com/">Open-Meteo.com</a> (CC BY 4.0). #end if#Generated $current.dateTime.format("%d.%m.%Y %H:%M").</span>
#include "inc/github_link.inc"
</footer>
<div class="m-backdrop" data-nav-close hidden></div>
<section class="m-sheet" id="mobile-sheet" aria-label="All views and controls" hidden>
<div class="m-sheet-head">
<i class="cap c-peach" aria-hidden="true"></i>
<h2 class="label c-peach">Auxiliary consoles</h2>
<i class="fill" aria-hidden="true"></i>
<button type="button" class="m-sheet-close c-coral" data-nav-close>Close</button>
<i class="end" aria-hidden="true"></i>
</div>
<nav class="m-sheet-grid" aria-label="All pages">
#for $pg in $nav
#if $pg[0] == $page
<a class="btn is-active" href="$pg[3]" aria-current="page">$pg[1]</a>
#else
<a class="btn $pg[2]" href="$pg[3]">$pg[1]</a>
#end if
#end for
</nav>
<div class="m-sheet-actions">
<button type="button" class="pill-btn c-lav" data-pwa-refresh>↻ Refresh</button>
<button type="button" class="pill-btn c-peach" data-pwa-install hidden>+ Install app</button>
</div>
<p class="m-sheet-hint" data-ios-install-hint hidden>Install: tap Share → Add to Home Screen</p>
<p class="m-sheet-meta">$station.hardware • Alt $station.altitude • WeeWX $station.version</p>
</section>
#set $_is_period = $page in ('yesterday', 'week', 'month', 'year')
<nav class="m-dock" aria-label="Primary navigation">
<a class="m-tab c-lav$(' is-active' if $page == 'index' else '')" href="index.html"#if $page == 'index'# aria-current="page"#end if#>Current</a>
<a class="m-tab c-dark$(' is-active' if $page == 'radar' else '')" href="radar.html"#if $page == 'radar'# aria-current="page"#end if#>Radar</a>
<a class="m-tab c-slate$(' is-active' if $_is_period else '')" href="week.html"#if $_is_period# aria-current="page"#end if#>Trends</a>
<a class="m-tab c-mist$(' is-active' if $page == 'history' else '')" href="history.html"#if $page == 'history'# aria-current="page"#end if#>History</a>
<a class="m-tab c-coral" href="#mobile-sheet" data-nav-toggle aria-expanded="false" aria-controls="mobile-sheet">More</a>
</nav>
