/* CONFIGURATIONS */
/*================================================================================================*/

var config = {
	/* [BACKGROUND] */
	"background" 	: "gfx/Dark_Hexagon.jpg",	// Path to custom background 
	"overlay"	   	: false,					// If using custom background, have an overlay? 
	"overlay_str"	: 0.8,						// Set the tint of the custom background

	/* [ANIMATIONS] */
	"hardware_anim"	: false,					// Hardware animations for cpu and network (Disable for slow computers)
	"orb_anims"		: false,					// Orb anims on the titlebars (Disable for slow computers)
	"window_anim"	: false,					// If you want to use fancy popup anims for email windows (Disable for slow computers)
	"orb_color1"	: "r#30b6c2-#27919f",		// Color for the orb at the login screen Format: r[innerColor]-[outerColor]
	"orb_color2"	: "r#f2b14c-#d49842",		// Color for the orb at the email screen Format: r[innerColor]-[outerColor]

	/* [LOGIN SCREEN] */
	"augment_login" : true,						// Set to true to enable extra login features
	"pass_type"		: false,					// Change the pasword entry to dots 
	"avatar"		: "", 						// The path to your avatar, to use default set to "" 
	"alt_stripe"	: true,						// Use alternate striped background on some terminals 
	"alt_usrname"	: "",						// Your username that you want to see, default is AJENSON 
	"proxy_pass"	: true,						// Set to true to use a different password than your email account password at login screen
	
	/* [EMAIL SCREEN] */
	"enable_sync"   : false,					// Set true to refresh the email page every interval
	"sync_time"     : 15						// Sync with the mailbox every interval in minutes 
};

var config_email = {
	"augment_email":	true,					// Enable augmented email features
	"offline_mode": 	false,					// Set to true to not connect to server, instead going through stored emails
	"limit":			15,						// Set the number of emails to show, 0 for unlimited
	"xml_limit":		0,						// Set the maximum amount of stored emails to display
	"enable_avatar":	true,					// Set if you want to use custom avatars for contacts
	
	"server": 			"GMAIL",				// Enter your email service [HOTMAIL, GMAIL]
	"user":				"eternaldamnation4@gmail.com"						// Enter email address
};