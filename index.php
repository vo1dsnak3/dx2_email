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
	<div id="config_menu" class="drag">
		<div id="config_titlebar" class="top-gradient">
		</div>
		<div id="config_content_container">
			<div id="config_header">
				CONFIGURATION
			</div>
			<div id="config_content">
				<span style="padding-left:5%;">*To make options persist, edit the dx2.js file directly</span>
				<table id="config_table">
					<tbody>
						<tr>
							<td class="option" title="Change the pasword entry to dots ">Password Type Login</td>
							<td class="option-box"><input type="checkbox" id="pass_type" value="passType"/></td>
						</tr>
						<tr>
							<td class="option" title="Check to use a different password than your email account password at login screen">Proxy Password</td>
							<td class="option-box"><input type="checkbox" id="proxy_pass" value="proxy_pass"/></td>
						</tr>
						<tr>
							<td class="option" title="Use this option to tint the background">Background Tint</td>
							<td class="option-box"><input type="checkbox" id="overlayOpt" value="overlay"/></td>
						</tr>
						<tr>
							<td class="option" title="Enable orb animations on login and email windows (Disable for slow computers)">Orb Animation</td>
							<td class="option-box"><input type="checkbox" id="orb_anims" value="orb_anims"/></td>
						</tr>
						<tr>
							<td class="option" title="Enable to emulate hardware animations on email screen (Disable for slow computers)">Hardware Animation</td>
							<td class="option-box"><input type="checkbox" id="hardware_anims" value="hardware_anims"/></td>
						</tr>
						<tr>
							<td class="option" title="Use striped graphics for Camera and Turret Terminals">Alternate Stripes</td>
							<td class="option-box"><input type="checkbox" id="alt_stripe" value="alt_stripe"/></td>
						</tr>
						<tr>
							<td class="option" title="Refresh the inbox every interval">Email Synchronization</td>
							<td class="option-box"><input type="checkbox" id="email_sync" value="email_sync"/></td>
						</tr>
						<tr>
							<td class="option"></td>
							<td class="option-box"></td>
						</tr>
						<tr>
							<td class="option" title="Enable extra features to enhance the Deus Ex Email Client">Augment Email Client</td>
							<td class="option-box"><input type="checkbox" id="augment_email" value="augment_email"/></td>
						</tr>
						<tr>
							<td class="option" title="Enable to use custom avatars for contacts">Enable Avatar</td>
							<td class="option-box"><input type="checkbox" id="enable_avatar" value="enable_avatar"/></td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div id="config_buttons">
			<button id="config_apply_Btn" class="dxButton">APPLY</button>
			<button id="config_close_Btn" class="dxButton">CLOSE</button>
		</div>
		<div id="config_footer">
			DX2 VISUAL FRAMEWORK 1.11
		</div>
	</div>
	<div id="reply_box" class="windowshadow drag">
		<div id="reply_titlebar" class="top-gradient">
			<div id="reply_orb_c">
			
			</div>
		</div>
		<div id="reply_content">
			<div id="reply_header">
				<div id="reply_send">
					<button id="reply_sendbtn" class="replybtn-send">SEND</button>
				</div>
				<div id="reply_input">
					<div id="rtorow" class="reply-input-box">
						<div id="rtohead" class="input-header">To: </div>
						<div class="reply-input-c">
							<input required autocomplete="on" type="text" id="reply_to" />
						</div>
					</div>
					<div id="rsubjrow" class="reply-input-box">
						<div id="rsubjhead" class="input-header">Subject: </div>
						<div class="reply-input-c">
							<input required autocomplete="on" type="text" id="reply_subject" />
						</div>
					</div>
				</div>
			</div>
			<div id="reply_body">
				<textarea autofocus id="reply_body_text"></textarea>
			</div>
		</div>
		<div id="reply_footer">
			<div id="reply_footer_text">
				DX VISUAL FRAMEWORK 1.11
			</div>
		</div>
	</div>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
	<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js"></script>

	<script src="js/jquery.mousewheel.js"></script>
	<script src="js/mwheelIntent.js"></script>
	<script src="js/jquery.jscrollpane.min.js"></script>
	<script src="js/raphael-min.js"></script>
	<script src="js/config.js"></script>
	<script src="js/dx2.js"></script>
</body>
</html>