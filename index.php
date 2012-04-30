<!DOCTYPE HTML>
<html>
<head>
	<meta charset="utf-8" />
	<link rel="stylesheet" href="stylesheet.css" />
	<link rel="stylesheet" href="jquery.jscrollpane.dx.css" />
	<link rel="stylesheet" href="jquery-ui-1.8.18.custom.css" />
	<!--[if gte IE 9]>
	<style>
		.top-gradient, .gradient, .email, .email-selected, .replybtn-done, .replybtn-send {
			filter: none !important;
		}
		
		#login_titlebar {
			filter: none !important;
		}
		
		#mail_header {
			top: 25% !important;
		}
	</style>
	<![endif]-->
	<script src="js/modernizr2.5.3.min.js"></script>
</head>
<body>
	<div id="container">
		<div id="login_segment">
			<?php include 'ajax_login.php'; ?>
		</div>
		<div id="disconnect_segment">
			<div id="multiaccount_wrapper">

			</div>
			<button id="disconnect_button" class="dxButton">DISCONNECT</button>
			<div id="hardware_activity">
				<div id="monitor">
				</div>
				<div id="usb_image_cont">
					<img id="usb_image" src="gfx/usb2.png" />
				</div>
			</div>
		</div>
	</div>
	<div id="overlay">
	
	</div>
	<div id="progress">
		
	</div>
	<?php 
		include 'include/dlg_configmenu.html';
		include 'include/dlg_emailreply.html';
	?>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
	<script>
	if ( typeof jQuery == 'undefined' ) {
		document.write(unescape("%3Cscript src='js/jquery-1.7.2.min.js'%3E%3C/script%3E"));
	}
	</script>
	<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js"></script>
	<script src="js/jquery.mousewheel.js"></script>
	<script src="js/mwheelIntent.js"></script>
	<script src="js/jquery.jscrollpane.min.js"></script>
	<script src="js/raphael-min.js"></script>
	<script src="js/config.js"></script>
	<script src="js/dx2.js"></script>
</body>
</html>