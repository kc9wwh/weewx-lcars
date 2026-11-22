<body class="lcars page-$page">
<a class="sr-only" href="#content">Skip to readings</a>
<div class="frame">
<aside class="rail">
<div class="elbow elbow-top" aria-hidden="true"><span>WX • 01</span></div>
<nav class="rail-nav" aria-label="Pages">
#for $pg in $nav
#if $pg[0] == $page
<a class="btn is-active" href="$pg[3]" aria-current="page">$pg[1]</a>
#else
<a class="btn $pg[2]" href="$pg[3]">$pg[1]</a>
#end if
#end for
</nav>
<div class="rail-fill">Alt $station.altitude</div>
<div class="elbow elbow-bottom" aria-hidden="true"><span>$station.hardware</span></div>
</aside>
<div class="main">
<div class="bar" aria-hidden="true"><i class="s-elbow"><span>WX·01</span></i><i class="s-rail"></i><i class="s-peach"></i><i class="s-lav"></i><i class="cap"></i></div>
<div class="offline-banner" data-offline-banner role="status" hidden>Offline · showing cached readings</div>
<div class="alert-banner" data-alert-banner role="status" hidden></div>
