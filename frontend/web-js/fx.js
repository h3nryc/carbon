function pageEffect() {
	$( "#product" ).fadeIn( "fast", function() {
	});
	$( ".header" ).fadeIn( "fast", function() {
	});
}
function userCardAction() {
	if ($(".user-card").height() == 500) {
			$(".user-card").animate({height: 30});
			$(".user-card-inner").fadeToggle();
			document.getElementById('user-card-action').innerHTML = '+';
	}else{
		$(".user-card").animate({height: 500});
		$(".user-card-inner").fadeToggle();
		document.getElementById('user-card-action').innerHTML = '-';
	}
}