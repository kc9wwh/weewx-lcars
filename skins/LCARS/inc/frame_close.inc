<div class="bar bar-bottom">
<div class="s-rail">Station up $station.uptime.long_form • Server up $station.os_uptime.long_form</div>
<span class="dots" aria-hidden="true"><i></i><i></i><i class="gap"></i><i></i><i></i><i class="off"></i><i class="gap"></i><i></i><i class="gap"></i><i></i><i></i><i></i><i></i><i class="gap"></i><i class="off"></i><i></i><i></i></span>
<div class="s-lav">WeeWX $station.version</div>
<i class="cap"></i>
</div>
</div>
</div>
#if $fc_on
<p class="credit frame-credit">Forecast by <a href="https://open-meteo.com/">Open-Meteo.com</a> (CC BY 4.0). Generated $current.dateTime.format("%d.%m.%Y %H:%M").</p>
#else
<p class="credit frame-credit">Generated $current.dateTime.format("%d.%m.%Y %H:%M").</p>
#end if
