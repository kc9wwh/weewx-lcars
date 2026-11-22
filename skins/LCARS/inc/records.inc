## Shared recorded-extremes grid. Expects globals: $P, $tfmt, $secondary
#set $btns = ['c-lav', 'c-slate', 'c-dark', 'c-frame', 'c-mist']
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
