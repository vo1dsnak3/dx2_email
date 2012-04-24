/*
	Copyright (c) 2012 Alexander Ip

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
	documentation files (the "Software"), to deal in the Software without restriction, including without limitation the 
	rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
	persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial 
	portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT 
	LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
	OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* GLOBALS */
/*================================================================================================*/

var global = {
	login_segment: $('#login_segment'),
	currentPage: 'login',
	sync_id:     '',
	hardware_bars: null,
	flags: new Array(),
	delId: new Array(),
	accountIndex: 0
};

// Cache all ajax requests by default
$.ajaxSetup({cache:true});

// DO NOT INCLUDE EXTENSION WITH PATH
function detectAudio(path) {
	var audio = new Audio();
	
	// Use Modernizr instead of relying on UA sniffing
	audio.src = Modernizr.audio.wav ? path+'.wav' :
				Modernizr.audio.mp3 ? path+'.mp3' : '';
				
	return audio;
}

// SoundEffects
var SOUND = {
	login_success: detectAudio('sfx/login_success'),
	email_beeper: detectAudio('sfx/email_beeper')
};

var ACCOUNTS;

// Get a list of accounts
$.getJSON('ajax_fetchaccounts.php', function(data) {
	if ( !data.error ) {
		ACCOUNTS = data;

		// Set the first account to be the default
		config_email.server = ACCOUNTS[0][0][0];
		config_email.user	= ACCOUNTS[0][0][1];
		
		if ( config.augment_login ) {
			DRAW.accountSwitch($('#multiaccount_wrapper'), config_email.server, config_email.user);
		}
	} else {
		window.location = 'setup/index.php';
	}
});

/* DOCUMENT READY */
/*================================================================================================*/

$(document).ready(function() {
	// Force Fullscreen Mode *BETA*
	var docElm = document.documentElement;
	if (docElm.requestFullscreen) {
		docElm.requestFullscreen();
	}
	else if (docElm.mozRequestFullScreen) {
		docElm.mozRequestFullScreen();
	}
	else if (docElm.webkitRequestFullScreen) {
		docElm.webkitRequestFullScreen();
	}

	if ( config.background ) {
		/* For some reason IE will override the background(image) css property if it finds a filter gradient,
		* we need to set filter to 0 if the user defines a custom background image. 
		*/
		$(document.body).css({'background' : 'url('+config.background+')',
							  'filter'     : 0});

		// IE doesn't like to use the default 'opacity' settings, need to use filer:alpha as full percentage.
		if ( config.overlay ) {
			$('#overlay').css({'opacity' : config.overlay_str,
							   'filter'  : 'alpha(opacity='+(config.overlay_str*100)+')'}).show();
		}
	}

	// Set overall css, account for variable screen dimensions
	$('#container').css({width: screen.width, height: screen.height/*window.innerHeight*/});
	
	// Save raphael references to the bars in the global reference object for later animation
	global.hardware_bars = drawHardwareMonitor($('#monitor'), 'svg_hardware');
	
	// hide the monitors after it gets drawn otherwise raphael won't know positioning info when hidden
	$('#hardware_activity').css('position', 'absolute').hide();
	
	var $disconnect_button = $('#disconnect_button');
	$disconnect_button.click(function(e) {
		e.preventDefault();
		
		if ( global.currentPage == 'email' ) {
			$('#hardware_activity').hide();
			
			//POP3 servers will never set the unread flag, only send off the flags if we are in online mode
			if ( global.flags.length && !config_email.offline_mode ) {				
				$.getJSON('ajax_setimapflag.php', {"imapflag":JSON.stringify(global.flags), 
											   "userinfo":JSON.stringify(config_email),
											   "dArray":JSON.stringify(global.delId)}, function(data) {
					// Clear the flag and delete buffer
					global.flags = new Array();
					global.delId = new Array();
				});
			}
			
			global.login_segment.load('ajax_login.php', setLoginPageDimensions);
		}
		
		// Remove synchronization on disconnect
		if ( config.enable_sync ) {
			clearTimeout(global.sync_id);
		}
	}).css('font-size', $disconnect_button.height() * 0.513);
	
	setLoginPageDimensions();
});



/* TRANSITIONAL AND ANIMATION FUNCTIONS */
/*================================================================================================*/

function doLoad() {
	$L.successDialog.svg.hide();
	$L.login_box.animate({ opacity: 0, top: '-='+$L.login_box.height()}, function() {
		/* The progress animation is a special case because Raphael does not support
		* animating objects with gradients, so we make a workaround by encasing the svg
		* inside the progress div, set the div to hidden overflow and animate the svg itself 
		*/
		$.ajax({
			async: 		true,
			url: 		'ajax_email.php',
			dataType: 	'json',
			data: 		config_email,
			
			beforeSend: function(xhr) {
				$L.progress.show();

				var w       = $L.progress.width();
				var end		= w << 1;
				var svg     = $('#progress_bar');
				
				var anim 	= function() {
					svg.css({'left': -w}).animate({'left':'+='+end}, 1000, anim);
				};

				anim();
			},
			
			success: function(data) {
				$L.progress.fadeOut(function() {
					// Load the main content in separate parts to speed things up
					global.login_segment.html(data.main);
					$('#email_list_actual').html(data.list);
					$('#message p:first').html(data.body);
					setEmailPageDimensions();
					
					SOUND.email_beeper.play();

					/* Pop up display animation, hide the containers first because we want to save
					* the container's inline-block property 
					*/
					if ( config.window_anim ) {
						var erc 	= $('#email_reader_container');
						erc.hide();
						$('#email_list_container').hide().show('scale', 500, function() {
							erc.show('scale', 500);
						});
					}
				});
			}
		});
	});
}

// This function is used along with the 'enable_sync' option
function refreshMailBox() {
	$.getJSON('ajax_refresh.php', {"imapflag":JSON.stringify(global.flags), "userinfo":JSON.stringify(config_email), "dArray":JSON.stringify(global.delId)}, function(data) {
		//console.log(data.listdata);
		if ( data.listdata != '' ) {
			// Get the content from an already initialized content pane
			var api 	= $E.list.data('jsp');
			var content	= api.getContentPane();
			
			// Attach the new emails
			content.prepend(data.listdata);
			
			// Click the newest email
			var emails   = content.children('div.email');
			emails.eq(0).height(emails.eq(1).height()).click();
			
			// If the new emails exceed our total email limit remove the emails past limit
			var newTotal = emails.length;
			if ( newTotal > config_email.limit && config_email.limit != 0 ) {
				emails.slice(config_email.limit).remove();
				newTotal = config_email.limit;
			}
			
			// Update $E object
			$E.emailObjs 	= emails;
			$E.totalEmails 	= newTotal;
			$E.list_counter.html('1/'+newTotal);
			
			// Reinit the scrollbar
			api.reinitialise();
		}
		
		global.flags = new Array();
		global.delId = new Array();
	});
}



/* EMAIL SCREEN OBJECT */
/*================================================================================================*/

var $E = {
	list: null,
	list_info: null,
	list_footer: null,
	list_counter: null,
	from_head: null,
	from_text: null,
	to_head: null,
	to_text: null,
	msg_avatar: null,
	message: null,
	attach_bar: null,
	attach_type: null,
	
	emailObjs: null,
	unread_count: null,
	totalEmails: 0,
	
	initObjects: function() {
		this.list 		  = $('#email_list_actual');
		this.list_info 	  = this.list.find('div.email-l-from');
		this.list_footer  = $('#email_list_footer');
		this.list_counter = $('#email_counter');
		this.from_head	  = $('#from');
		this.to_head	  = $('#to');
		this.message	  = $('#message');
		this.attach_bar	  = $('#attach_bar');
		this.attach_type  = $('#paperclip_type');
		this.from_text    = $('#from_text');
		this.to_text      = $('#to_text');
		this.msg_avatar	  = $('#content_avatar');
		
		this.emailObjs    = this.list.children('div.email');
		this.totalEmails  = this.emailObjs.length;
	},
	
	processFirstEmail: function() {
		var $email_first = this.emailObjs.eq(0).addClass('email-selected');
		var $spans = $email_first.find('span');
		$spans.eq(0).addClass('from-person-selected');
		$spans.eq(1).addClass('email-subject-selected');
		
		// Cache first email
		var firstUnread = $email_first.data('msg',  { 
			from: 	this.from_text.html(), 
			to: 	this.to_text.html(), 
			body: 	this.message.html(),
			av:		this.msg_avatar.attr('src'),
			attach: this.attach_type.html()
		}).find('div.email-sl-bar');

		if ( firstUnread.length ) {
			global.flags.push({"number": this.totalEmails, "flag": "\\Seen"});
			firstUnread.removeClass('email-sl-bar');
		}
	},
	
	deleteEmail: function() {
		var api = $E.list.data('jsp');
		var emails = api.getContentPane().children('div.email');
		var $currentEmail	= emails.filter('div.email-selected:first');
		var curIndex		= $currentEmail.index();
		var curID			= $currentEmail.attr('id');
		
		global.flags.push({"number": $E.totalEmails-curIndex, "flag": "\\Deleted"});
		global.delId.push(curID);

		if ( config_email.offline_mode ) {
			var answer = confirm('Delete Email Permanently?');
			if ( answer )
				$.get('ajax_deletexml.php', { "user" : config_email.user, "xmlName": curID });
			else
				return;
		}
		
		// Slice out a set from selected to the very end, filter first visible
		var next = $E.emailObjs.slice(curIndex+1).filter(':visible:first');
		
		if ( next.length ) {
			$currentEmail.hide();
			next.click();
		} else {
			// Check previous visible emails
			var prev = $E.emailObjs.slice(0, curIndex).filter(':visible:last');
			
			if ( prev.length ) {
				$currentEmail.hide();
				prev.click();
			} else {
				// Nothing left so clear the reader
				$currentEmail.hide();
				$('#content_container').html('');
				$E.from_text.html('');
				$E.to_text.html('');
				$E.list_counter.html('0/0');
			}
		}
		
		// Resize the scroll bar for the list
		$E.list.data('jsp').reinitialise();
	},
	
	drawSVG: function() {
		drawEmailIcon($('#mail_icon'), 'svg_email_mailicon');
		drawStripes($('#stripebox2'), '#2b2d2a', '#161817', 's2');
		drawStripes($('#stripebox3'), '#2b2d2a', '#161817', 's3');
		drawHeaderBox(this.to_head, '90-#ef9d15-#ffbb2e', 0.028, 0.971, 'svg_to_head').svg.css('z-index', 3);
		drawHeaderBox(this.from_head, '90-#181a19-#1a1e1d', 0.022, 0.977, 'svg_from_head');
		
		// Only for augmented clients
		if ( config_email.augment_email ) {
			drawAttachment($('#paperclip_box'), '#1a1c1b')
			.icon
			.hover(function() {
				this.attr('fill', '#ec9c13');
			}, function() {
				this.attr('fill', '#1a1c1b');
			})
			.click(function() {
				window.location = 'download.php?id='+$E.emailObjs.filter('.email-selected:first').attr('id')+'&user='+config_email.user;
			});
		
			if ( this.attach_type.html() == '' )
				this.attach_bar.hide();
		
			this.list.find('div.list-icon-attach').each(function() {
				drawAttachment($(this), '#95916B');
			});
		}
		
		var listOrb = drawOrb2(makeSquare($('#email_list_orbcont')), config.orb_color2, 'svg_email_orb1');
		drawOrb2(makeSquare($('#email_reader_orbcont')), 'none', 'svg_email_orb2');
		
		if ( config.orb_anims ) {
			listOrb.animate();
		}
		
		$('#hardware_activity').show();

		if ( config.hardware_anim ) {
			global.hardware_bars.animate();
		}
			
		$container = makeSquare($('#unread_counter_container'));
		$container.css('top', -($container.height()-$container.parent().height())*0.5);

		// Create the unread count object
		this.unread_count = drawUnreadCounter($container, this.list.find('div.email-sl-bar').length, 'svg_unread');
	}
}

function setEmailPageDimensions() {
	global.currentPage = 'email';

	// Do not sync if the client is in offline mode
	if ( config.enable_sync && !config_email.offline_mode ) {
		global.sync_id = setInterval(refreshMailBox, config.sync_time * 60000);
	}
	
	if ( config.augment_login ) {
		$('#svg_accounts text:last').show();
	}
	
	$E.initObjects();
	
	setArrayFontRatio(new Array($('#mail_header'), 
								$('#footer_frm'), 
								$E.list_counter, 
								$('#email_reader_footer_txt'), 
								$('#to_pos'), 
								$('#from_pos'), 
								$E.message,
								$E.list_info,
								$E.attach_type),
					 new Array($('#email_list_header'), 
								$E.list_footer, 
								$E.list_footer, 
								$('#email_reader_footer'), 
								$E.to_head, 
								$E.from_head, 
								$('#email_reader_content'),
								$E.list_info,
								$E.attach_bar), 
					 new Array(0.6, 0.231, 0.641, 0.2, 0.375, 0.375, 0.037, 0.22,  0.75));

	setVerticalCenter($('#email_full_container'), $('#email_list_container'));
	makeSquare($('#content_avatar_cont'));
	$('#reply_box').css({width: screen.width*0.5, height:screen.height*0.5});

	$E.list_counter.html( '1/' + $E.totalEmails );	// Update email counter
	$E.processFirstEmail();							// Add select class to the very first email
	
	// Do extra ui for augmented email
	if ( config_email.augment_email ) {
		var controlBar = drawControlBar($('#control_bar'));
		var $reader_container	= $('#email_reader_container');
		
		// Set draggable windows
		$('#email_list_container').draggable({handle: '#email_list_titlebar'});
		$reader_container.draggable({handle: '#email_reader_titlebar'});
		$('#reply_box').draggable({handle: '#reply_titlebar'});
		
		// Set drag z-index manager
		$('.drag').draggable('option', 'stack', '.drag');
	}
	
	// Bubble the events into parent
	$E.list.on('click', '.email', function(e) {
		var $self = $(this);
	
		if ( !$self.hasClass('email-selected') ) {
			SOUND.email_beeper.play();

			// Get references to the scroll bar
			var api = $E.message.data('jsp');
			var msg = api.getContentPane();
			
			var cache 	= $self.data('msg');
			if ( !cache ) {	// Check to see if the newly selected email has cache data 
				// DO AJAX to xml folder then store in cache 
				$.get('ajax_fetchxml.php', { xmlname : $self.attr('id'), user: config_email.user}, function(result) {
					$E.from_text.html(result.from);
					$E.to_text.html(result.to[0]);
					
					// Take into account custom avatars
					var correctAV = ( !config_email.enable_avatar ? 'gfx/anon.png' : result.avatar );
					$E.msg_avatar.attr('src', correctAV);
					
					// Deal with attachments
					var hasAttach = '';
					if ( result.attype != '' ) {
						$E.attach_bar.show();
						hasAttach = ':'+result.attype;
						$E.attach_type.html(hasAttach);
					} else
						$E.attach_bar.hide();
					
					var temp = '<span class="subject">'+result.subject+'</span><br/>\
								<span class="date">'+result.date+'</span><p>'+result.body;
					msg.html(temp);
					
					// Create and store new cache data for the target email
					$self.data('msg', {
						from: 	result.from, 
						to: 	result.to[0], 
						body: 	temp,
						av:		correctAV,
						attach: hasAttach
					});
					
					// Reinit the scrollbars for new content
					api.reinitialise();
				}, 'json');
			} else {
				// Found previous data, redisplay it to the user instead of making an ajax call
				$E.from_text.html(cache.from);
				$E.to_text.html(cache.to);
				msg.html(cache.body);
				$E.msg_avatar.attr('src', cache.av);
				
				if ( cache.attach != '' ) {
					$E.attach_bar.show();
					$E.attach_type.html(cache.attach);
				} else
					$E.attach_bar.hide();
				
				// Reinit the scrollbars for cached content
				api.reinitialise();
			}
			
			// Update the unread email counter at the titlebar
			$E.unread_count.update($self, $E.totalEmails);
			
			if ( config_email.augment_email ) {
				var flagColor = $self.data('flagColor');
				controlBar.iconFlag.attr('fill', (flagColor ? flagColor : '#1a1c1b'));
			}
			
			// Do class swaps for the the current selected and the target
			var $curSelect = $E.list.find('.email-selected').toggleClass('email-selected');
			$self.toggleClass('email-selected');
			var $curspan = $curSelect.find('span');
			var $sspan	 = $self.find('span');
			$curspan.eq(0).toggleClass('from-person-selected');
			$curspan.eq(1).toggleClass('email-subject-selected');
			$sspan.eq(0).toggleClass('from-person-selected');		
			$sspan.eq(1).toggleClass('email-subject-selected');
			
			// Update the email counter
			// Grab a set of visible emails including itself and find its own index within the internal set
			var thisIndex = $self.siblings(':visible').andSelf().index($self)+1;
			var visTotal  = $('#email_list_actual div.email:visible').length;
			$E.list_counter.html( thisIndex + '/' + visTotal );
		}		
	});
	
	$E.drawSVG();
	
	$E.message.jScrollPane({maintainPosition:false, hideFocus:true});
	
	/* [BUG FIX]: Fix a strange sizing issue with the emails since the jsp inserts the actual content
	* into a jsp panel div element, the emails percentage height doesn't work as well.
	* We need to manually override and convert the percentage height to a pixel height
	* and create the jsp last
	*/
	$E.emailObjs.height($E.emailObjs.height());
	var x = $('#email_list_actual div.email-l-avatar:first').width();
	$('#email_list_actual div.email-l-avatar').height(x);
	$E.list.jScrollPane({hideFocus:true});
}



/* LOGIN SCREEN */
/*================================================================================================*/

var $L = {
	login_box: 			null,
	namebar_container: 	null,
	input_container: 	null,
	input:				null,
	avatar:				null,
	button:				null,
	username:			null,
	orbC:				null,
	progress:			null,
	
	successDialog:		null,
	
	initObjects: function() {
		this.login_box 			= $('#login_box');
		this.namebar_container 	= $('#namebar_container');
		this.input_container	= $('#login_input_container');
		this.input				= $('#login_input');
		this.avatar				= $('#login_avatar');
		this.button				= $('#login_button');
		this.username			= $('#usrname');
		this.orbC				= $('#orblogin_container');
		this.progress			= $('#progress');
	},
	
	initCSS: function() {
		setArrayFontRatio(
		(new Array(this.username,$('#usrname_caption'),this.input)),
		(new Array(this.namebar_container,this.namebar_container,this.input)),
		(new Array(0.2777,0.1222,0.6)));

		//makeSquare(this.orbC, false);
		this.orbC.width(this.orbC.height());
		
		if ( config.alt_stripe ) {
			this.login_box.addClass('login-box-alt');
			this.input_container.addClass('login-input-c-alt');
			this.input.addClass('login-input-alt');
		}
	},
	
	initHandlers: function() {
		var loginBtnClick = function(e) {
			// Start password authentication and get result from server
			$.get('ajax_auth.php', { 'pass': $L.input.val(), 'proxy': config.proxy_pass, 'address': config_email.user }, function(result) {
				if ( result == 'Access Granted' ) {
					SOUND.login_success.play();
					
					$('#config_menu:visible').hide();
					
					// Retrieve vertical shift from element and animate it
					$L.successDialog.svg
					.css('z-index', 3)
					.animate({ opacity: 1, top: '-='+$L.successDialog.svg.data('shift')}, 750, function() {				
						// Pause for 1 second before proceeding to next animation and email loading
						setTimeout(doLoad, 1000);
					});
				}
			});
		};
	
		this.button.click(loginBtnClick);
		
		this.input.keydown(function(e) {
			if ( e.keyCode == '13' ) {
				e.preventDefault();
				$L.button.click();
			}
		});
	},
	
	initSVG: function() {
		var loginOrb = drawOrb2(this.orbC, config.orb_color1, 'svg_log_orb1');
		
		if ( config.orb_anims ) {
			loginOrb.animate();
		}
		
		drawStripes($('#stripe_box'), '#cecece', '#e2e2e2', 'svg_logstripe');
		drawArrowAndLock(this.button, 'svg_logbtn');
		
		// Login Screen Enhancements
		if ( config.augment_login ) {
			drawOffline($('#offline_box'));
			drawConfig($('#config_box'));
		}
		
		drawAjaxIndicator(this.progress);
		this.successDialog = drawSuccessDialog(this.login_box, 'svg_log_dlg');
	},
	
	initExtra: function() {
		if ( config.pass_type ) {
			// Use native code, JQuery won't work 
			document.getElementById('login_input').type = 'password';
		}
		
		if ( config.avatar ) {
			this.avatar.attr('src', config.avatar);
		}
		
		if ( config.alt_usrname ) {
			this.username.html(config.alt_usrname);
		}
		
		if ( config_email.augment_email ) {
			this.login_box.draggable({handle: '#login_titlebar'});
		}
	}
};

function setLoginPageDimensions() {
	global.currentPage = 'login';
	
	if ( config.augment_login ) {
		$('#svg_accounts text:last').hide();
	}
	
	$L.initObjects();
	$L.initCSS();
	$L.initHandlers();
	$L.initSVG();
	$L.initExtra();
}

function initConfigBox() {
	$config_menu 	= $('#config_menu');
	$config_table 	= $('#config_table');
	$pass_type 		= $('#pass_type');
	$proxy_pass		= $('#proxy_pass');
	$overlayOpt		= $('#overlayOpt');
	$orb_anims		= $('#orb_anims');
	$hardware_anims = $('#hardware_anims');
	$alt_stripe		= $('#alt_stripe');
	$email_sync		= $('#email_sync');
	$augment_email	= $('#augment_email');
	$enable_avatar	= $('#enable_avatar');
	
	$config_menu.show().draggable({handle: '#config_titlebar'});
	
	// Set up initial config states
	$pass_type.attr('checked', config.pass_type);
	$proxy_pass.attr('checked', config.proxy_pass);
	$overlayOpt.attr('checked', config.overlay);
	$orb_anims.attr('checked', config.orb_anims);
	$hardware_anims.attr('checked', config.hardware_anim);
	$alt_stripe.attr('checked', config.alt_stripe);
	$email_sync.attr('checked', config.enable_sync);
	$augment_email.attr('checked', config_email.augment_email);
	$enable_avatar.attr('checked', config_email.enable_avatar);
	
	$('#config_table input:checked').parent().addClass('checkSelected');
	
	$config_table.on('change', 'input', function() {
		$(this).parent().toggleClass('checkSelected');
	});
	
	$('#config_close_Btn').click(function() {
		$('#config_table input:checked').parent().removeClass('checkSelected');
		$config_table.off('change', 'input');
		$config_menu.hide();
	});
	
	$('#config_apply_Btn').click(function() {
		// Save the current configuration and apply them
		config.pass_type 		= $pass_type.attr('checked');
		config.proxy_pass 		= $proxy_pass.attr('checked');
		config.orb_anims 		= $orb_anims.attr('checked');
		config.hardware_anim 	= $hardware_anims.attr('checked');
		config.alt_stripe		= $alt_stripe.attr('checked');
		config.enable_sync		= $email_sync.attr('checked');
		
		config_email.augment_email = $augment_email.attr('checked');
		config_email.enable_avatar = $enable_avatar.attr('checked');
		
		if ( $overlayOpt.attr('checked') )
			$('#overlay').css({'opacity' : config.overlay_str,
							   'filter'  : 'alpha(opacity='+(config.overlay_str*100)+')'}).show();
		else
			$('#overlay').hide();

		// Remove the previous selected class states
		$('#config_table input:checked').parent().removeClass('checkSelected');
		$config_menu.hide();
		
		// Reload the login page with the new config values
		$('svg').remove();
		global.login_segment.load('ajax_login.php', setLoginPageDimensions);
	});
}

/*================================================================================================*/

/* Remember to set the element's position css to either relative, absolute or fixed
* otherwise this function won't be able to work. The 'useOuter' arguement uses the
* outside height which includes the padding and borders/outlines. 
*/
function setVerticalCenter(parent, self, useOuter) {
	var th = parent.height();
	var h  = (useOuter ? self.outerHeight() : self.height());
	
	th = ( th - h ) * 0.5;
	
	self.css('top', th);
	
	return th;
}

// Array version of the above function
function setArrayVerticals(elements, parents) {
	var length = elements.length;
	
	if ( length != parents.length ) {
		return false;
	}
	
	for ( var i = 0; i < length; ++i ) {
		var th = parents[i].height();
		var h  = elements[i].height();
		
		th = ( th - h ) * 0.5;
		
		elements[i].css('top', th);
	}
	
	return true;
}

function makeSquare(element, reverse) {
	if ( !reverse ) {
		element.width(element.height());	// change the width
	} else {
		element.height(element.width());	// change the height
	}
	
	return element;
}

/* Acts on a ratio of the font's height, works by multiplying the parent's height
* by the ratio to get the font's target height. Modify the element's font-size
* css property when done. 
*/
function setFontRatio(element, parent, ratio) {
	var size = parent.height() * ratio;
	element.css('font-size', size);
	
	return size;
}

// Array version of above function
function setArrayFontRatio(elements, parents, ratios) {
	var length = elements.length;
	
	if ( length != parents.length || length != ratios.length )
		return false;
	
	for ( var i = 0; i < length; ++i )
		elements[i].css('font-size', parents[i].height() * ratios[i]);
	
	return true;
}

// Combines vertical center and set font ratio.
function setFontAndCenter(element, parent, ratio) {
	setFontRatio(element, parent, ratio);
	setVerticalCenter(parent, element);
}

function cleanReplyBox() {
	$('#reply_sendbtn').html('SEND').removeClass('replybtn-done').addClass('replybtn-send');
}

function initEmailBox(self, to, subject) {
	var textarea = $('#reply_body_text');
	
	setFontRatio(to, to, 0.5);
	setFontRatio(subject, subject, 0.5);
	
	setFontAndCenter($('#rtohead'), $('#rtorow'), 0.5);
	setFontAndCenter($('#rsubjhead'), $('#rsubjrow'), 0.5);
	setFontAndCenter($('#reply_footer_text'), $('#reply_footer'), 0.25);

	var closeWindow = function() {
		self.hide();
		to.val('');
		subject.val('');
		textarea.val('');
	};
	
	drawOrb2(makeSquare($('#reply_orb_c')), 'rgba(0,0,0,0)', 'svg_reply').element.click(closeWindow);
	
	$('#reply_sendbtn').click(function() {
		var contentpayload = {
			"to": to.val(),
			"subject": subject.val(),
			"body": textarea.val()
		};
		
		// Append the body as previous reply to the message, standard by email replies
		var reply = contentpayload.subject.substr(0, 3).toLowerCase();
		if ( reply == 're:' ) {
			var api = $('#message').data('jsp');
			//var a = $('.subject').html().split('<br/>');
			
			contentpayload.body += '<hr>\
				From: '+$('#to_text').text()+'\
				<br>\
				To: '+$('#from_text').text()+'\
				<br>\
				Subject: '+$('.subject')+'\
				<br>\
				Date: '+$('.date')+'\
				<br>\
				<br>';
			contentpayload.body += api.getContentPane().html();
		}
		
		$.get('ajax_sendmail.php', { "userinfo": JSON.stringify(config_email), 
									 "content": JSON.stringify(contentpayload) }, function(data) {
			if ( data.result ) {
				$('#reply_sendbtn').html('DONE').removeClass('replybtn-send').addClass('replybtn-done');
				setTimeout(closeWindow, 1500);
			} else {
				alert(data.error);
			}
		}, 'json');
	});
	
	self.data('init', true);
}



/*================================================================================================*/



function getSize2(element) {
	var offset = element.offset();
	
	var size = {
		l: offset.left,
		t: offset.top,
		w: element.width(),
		h: element.height()
	};
	
	return size;
}

var DRAW = {
	accountSwitch: function(element, server, user) {
		var s = getSize2(element);
		var p = Raphael(s.l, s.t, s.w, s.h);
		var r = s.h / 80;
		
		var boxattr = {'fill':'#111','stroke':'none'};
		var a = p.path('m10,20l8,-6l8,6v8l-8,5l-8,-5z').attr(boxattr);
		var e = p.path('m10,52l8,-6l8,6v8l-8,5l-8,-5z').attr(boxattr);
		
		var textattr = {'text-anchor': 'start', 'font-family': 'DX', 'font-size': 12, 'stroke': 'none', 'fill': '#A2A070'};
		var b = p.text(38, 23, server).attr(textattr);
		var c = p.text(38, 55, user).attr(textattr);
		var h = p.text(126, 23, 'APPLY').attr(textattr).transform('S'+r+','+r+',0,0').hide();
	
		var f = p.set().push(a, b).hover(function() {
			a.attr('fill', '#fcc433');
		}, function() {
			a.attr('fill', '#111');
		});
		
		var g = p.set().push(e, c).hover(function() {
			e.attr('fill', '#fcc433');
		}, function() {
			e.attr('fill', '#111');
		});
	
		var d = p.set().push(f, g);
		d.transform('S'+r+','+r+',0,0')
		.click(function() {
			var length = ACCOUNTS[0].length-1;
			
			if ( ++global.accountIndex > length ) {
				global.accountIndex = 0;
			}
			
			config_email.server = ACCOUNTS[0][global.accountIndex][0];
			config_email.user	= ACCOUNTS[0][global.accountIndex][1];
			
			b.attr('text', config_email.server);
			c.attr('text', config_email.user);
		});
		
		// Switch to another account when user clicks the apply link
		h.click(function() {
			$.getJSON('ajax_email.php', config_email, function(data) {
				global.login_segment.html(data.main);
				$('#email_list_actual').html(data.list);
				$('#message p:first').html(data.body);
				setEmailPageDimensions();
				
				SOUND.email_beeper.play();
			});
		});
		
		// adjust z-index and give the svg an index to be modified later
		$(a.node).parent().css('z-index', 104).attr('id', 'svg_accounts');
	}
};

function drawOrb2(element, color, lsid) {
	var s = getSize2(element);
	var paper = Raphael(s.l, s.t, s.w, s.h);
	var n;
	var cache = localStorage.getItem(lsid);
	
	if ( cache ) {
		// if a cache exists add it to the paper and get the object from array into n var
		n = paper.add(JSON.parse(cache))[3];
	} else {
		var c = s.w * 0.5;
		var x = s.w * 0.25;
		var y = c - (s.h * 0.06);
		var w = s.w * 0.523;
		var h = s.h * 0.125;
		
		var obj = [{
			type: 'circle',
			cx: c,
			cy: c,
			r: c-1,
			fill: '#474538',
			stroke: '#423b31'
		}, {
			type: 'rect',
			x: x,
			y: y,
			width: w,
			height: h,
			transform: 'R-45',
			fill: '#2e2d29',
			stroke: 'none',
			'stroke-opacity': 0
		}, {
			type: 'rect',
			x: x,
			y: y,
			width: w,
			height: h,
			transform: 'R45',
			fill: '#2e2d29',
			stroke: 'none',
			'stroke-opacity': 0
		}, {
			type: 'circle',
			cx: c,
			cy: c,
			r: c-1,
			fill: color,
			stroke: 'none'
		}];
		
		n = paper.add(obj)[3];
		localStorage.setItem(lsid, JSON.stringify(obj));
	}
	
	var nn = $(n.node).css('opacity', 0);
	var parent = nn.parent();
	element.append(parent.css({top:0,left:0}));
	
	return {
		element: n,
		jElement: nn,
		parent: parent,
		
		animate: function() {
			/* For orb animations, we make a topmost circle NOT SVG PARENT and fill 
			* it with a gradient, afterwards we just modify the opacity to simulate a pulse. 
			*/
			if ( Modernizr.cssanimations ) {
				// Use native CSS3 code if available and if browser is not IE or Opera
				var orbanimprop = 'pulse 1s infinite alternate';
				this.jElement.css({'animation': 			orbanimprop,
						  '-moz-animation' : 	orbanimprop,
						  '-webkit-animation' : orbanimprop });
			} else {
				var opac;
				var anim 	= function() {
					opac = nn.css('opacity');
					nn.animate({opacity: (opac == 0 ? 1 : 0)}, 1000, anim);
				};

				anim();
			}
		}
		
	};
}
	
function drawEmailIcon(element, lsid) {
	var s 		= getSize2(element);
	var paper 	= Raphael(s.l, s.t, s.w, s.h);
	
	var n;
	var cache = localStorage.getItem(lsid);
	
	// Retrieve from cache if exists, otherwise calculate the svg's
	if ( cache ) {
		n = paper.add(JSON.parse(cache))[0];
	} else {
		var object = [{
			type: 'rect',
			x: 0,
			y: 0,
			width: s.w,
			height: s.h,
			fill: "#53513a",
			stroke: 'none'
		}, {
			type: 'path',
			path: 'M0,0L'+s.w * 0.5+','+s.h * 0.5+'L'+s.w+',0',
			stroke: "#31322c",
			'stroke-width': 2
		}];
		
		n = paper.add(object)[0];
		localStorage.setItem(lsid, JSON.stringify(object));
	}
	
	element.append($(n.node).parent().css({top:0,left:0}));
	
	// if email client is augmented then attach hover and click handlers
	if ( config_email.augment_email ) {
		n.hover(function() {
			this.attr('fill', '#ec9c13');
		}, function() {
			this.attr('fill', '#53513a');
		})
		.click(
		function() {
			if ( $('#reply_box:visible').length == 0 ) {
				cleanReplyBox();
				
				$('#reply_box').show('scale', 'fast', function() {
					if ( !$(this).data('init') ) 
						initEmailBox($(this), $('#reply_to'), $('#reply_subject'));
				});
			}
		}
		);
	}
}
	
function drawStripes(element, mainColor, lineColor, lsid) {
	var cache = localStorage.getItem(lsid);
	var n;
	
	if ( cache ) {
		var paper = Raphael(element, element.width(), element.height());
		n = paper.add(JSON.parse(cache))[0];
	} else {
		var s = getSize2(element);
		var paper = Raphael(s.l, s.t, s.w, s.h);
		var x = [{
			type: 'path',
			path: 'M0,' + s.h + 'H' + s.w + 'V0z',
			fill: mainColor,
			stroke: 'none'
		}, {
			type: 'path',
			path: 'M' + (s.w * 0.28) + ',' + s.h + 'L' + s.w + ',' + (s.h * 0.28),
			stroke: lineColor
		}, {
			type: 'path',
			path: 'M' + (s.w * 0.66) + ',' + s.h + 'L' + s.w + ',' + (s.h * 0.66),
			stroke: lineColor
		}];
		
		n = paper.add(x)[0];

		localStorage.setItem(lsid, JSON.stringify(x));
	}
	
	element.append($(n.node).parent().css({top:0,left:0}));
}
	
function drawArrowAndLock(element, lsid) {
	var offset = element.offset();
	var ol = offset.left;
	var ot = offset.top;
	var pw = element.outerWidth();
	var ph = element.outerHeight();
	
	// Set actual paper dims
	ol += pw * 0.181;
	ot += ph * 0.256;
	pw *= 0.694;
	ph *= 0.538;
	
	var paper  = Raphael(ol, ot, pw, ph);	
	
	var cache = localStorage.getItem(lsid);
	var n;
	
	if ( cache ) {
		n = paper.add(JSON.parse(cache))[0];
	} else {
		var x = [{
			type: 'path',
			path: 'M0,'+ph * 0.381+'H'+pw * 0.286+'V'+ph * 0.19+'L'+pw * 0.551+','+ph * 0.524+'L'+pw * 0.286
			+','+ph * 0.9+'V'+ph * 0.666+'H0z',
			fill: '#f7fff9',
			stroke: 'none'	
		}, {
			type: 'circle',
			cx: pw * 0.835,
			cy: ph * 0.4,
			r: pw * 0.125,
			fill: 'none',
			stroke: '#205660',
			'stroke-width': 2.5
		}, {
			type: 'rect',
			x: pw * 0.673,
			y: ph * 0.4285,
			width: pw * 0.3265,
			height: ph * 0.619,
			fill: '#205660',
			stroke: 'none'
		}, {
			type: 'rect',
			x: pw * 0.8,
			y: ph * 0.6,
			width: pw * 0.061,
			height: ph * 0.19,
			fill: '#4195c3',
			stroke: 'none'
		}];
		
		n = paper.add(x)[0];
		
		localStorage.setItem(lsid, JSON.stringify(x));
	}
	
	element.append($(n.node).parent().css({position:'relative',top:0,left:0}));
}

function drawSuccessDialog(container, lsid) {
	var s 		= getSize2(container);
	var paper 	= Raphael(s.l, s.t, s.w, s.h);
	var trans	= s.w * 0.2;
	var n;
	var cache = localStorage.getItem(lsid);
	
	if ( cache ) {
		n = paper.add(JSON.parse(cache))[0];
	} else {		
		var cw = s.w * 0.018;
		var f = (screen.height > 800 ? (s.h*0.51) : (s.h*0.5));//Fudge
		var a = s.w * 0.063;
		var b = s.h * 0.547;
		
		var x = [{
			type: 'path',
			path: 'M'+a+','+(s.h*0.281)+'H'+(s.w*0.73)+'s'+cw+',0 '+cw+',10V'+f+'s0,10 -'+cw+',10L'+(s.w*0.43)+','+b+
				  'L'+(s.w*0.39)+','+(s.h*0.635)+'L'+(s.w*0.356)+','+b+'H'+a+'s-'+cw+',0 -'+cw+',-10V'+((s.h*0.281)+10)+
				  's0,-10 '+cw+',-10z',
			fill: '90-#f3d6b8-#fff',
			stroke: 'none'
		}, {
			type: 'path',
			path: 'M'+s.w * 0.067+','+s.h * 0.445+'l'+s.w * 0.014+',-'+s.h * 0.036+'l'+s.w * 0.02+','+s.h * 0.032+
				  'l'+s.w * 0.048+',-'+s.h * 0.086+'l'+s.w * 0.014+','+s.h * 0.032+'l-'+(s.w * 0.014+s.w * 0.048)+
				  ','+s.h * 0.123+'z',
			stroke: 'none',
			fill: '0-#24b1de-#1f9eb1'
		}, {
			type: 'text',
			x: s.w * 0.45,
			y: s.h * 0.405,
			text: 'Access Granted',
			'font-family': 'DX',
			'font-size': (s.h*0.125),
			fill: '#483d29'
		}];
		
		n = paper.add(x)[0];
		
		localStorage.setItem(lsid, JSON.stringify(x));
	}

	// Opacity at 0 because we will be animating it, also store the translation amount so the animation can use it
	var parent = $(n.node).parent().css({top: trans, left:0, 'z-index': -2, opacity: 0}).attr('id', 'success_dialog').data('shift', trans);
	container.append(parent);
	
	//return path1;
	return {
		element: n,
		svg: parent
	};
}

function drawHeaderBox(container, color, ratio1, ratio2, lsid) {
	var s 		= getSize2(container);
	var paper 	= Raphael(s.l, s.t, s.w, s.h);

	var n;
	var cache = localStorage.getItem(lsid);
	
	// Retrieve from cache if exists, otherwise calculate the svg's
	if ( cache ) {
		n = paper.add(JSON.parse(cache))[0];
	} else {
		// store some calculations
		var a = s.h * 0.468;
		var b = s.w * ratio1;
		var c = s.w * ratio2;
	
		var object = [{
			type: 'path',
			path: 'M0,'+a+'L'+b+',0h'+c+'v'+(s.h-a)+'l-'+b+','+a+'h-'+c+'z',
			fill: color,
			stroke: 'none'
		}];
		
		n = paper.add(object)[0];
		localStorage.setItem(lsid, JSON.stringify(object));
	}
	
	var parent = $(n.node).parent().css({top:0,left:0});
	container.append(parent);
	
	return {
		element: n,
		svg: parent
	};
}

function drawAjaxIndicator(container) {
	var s = getSize2(container);
	
	// move by additional pixels to account for the outer element borders
	var a 		= container.outerWidth() - s.w;
	var paper 	= Raphael(s.l+a, s.t+a, s.w, s.h);
	
	var path1 = paper.path('M0,0h'+s.w+'l-'+(s.w*0.12)+','+s.h+'H0z')
	.attr({ fill : '0-rgba(0,0,0,0)-#a87436'/*'0-#12120e-#a87436'*/, stroke : 'none' });
			
	var parent = $(path1.node).parent().attr('id', 'progress_bar').css({top:0,left: -s.w});
	container.append(parent);
					
	return path1;
}

function drawUnreadCounter(container, unreadNumber, lsid) {
	var s = getSize2(container);
	var paper  = Raphael(s.l, s.t, s.w, s.h);
	
	var n;
	var cache = localStorage.getItem(lsid);
	
	if ( cache ) {
		n = paper.add(JSON.parse(cache))[0];
		n.attr('text', unreadNumber).toFront();
	} else {
		// store common calculations
		var center = s.w * 0.5;
		
		var object = [{
			type: 'text',
			x: center,
			y: center,
			text: unreadNumber,
			'font-family': 'DX',
			'font-size': s.w*0.405,
			fill: '#fff'
		}, {
			type: 'circle',
			cx: center,
			cy: center,
			r: center,
			fill: '#474538',
			'fill-opacity': 0.6,
			stroke: 'none'
		}, {
			type: 'circle',
			cx: center,
			cy: center,
			r: s.w / 3,
			fill: "r#fbba2c-#f29713",
			stroke: 'none'
		}];
		
		n = paper.add(object)[0].toFront();
		localStorage.setItem(lsid, JSON.stringify(object));
	}

	var parent = $(n.node).parent();
	container.append(parent.css({top:0,left:0}));
	
	if ( unreadNumber == 0 )
		parent.hide();
	
	return {
		text: n,
		svg: parent,
		
		update: function($self, total_emails) {
			// If the unread indicator is set, remove it and add the email number to the array
			var $read_bar = $self.find('div.email-sl-bar:first');
			if ( $read_bar.length != 0 ) {
				$read_bar.removeClass('email-sl-bar');
				
				// Append object to array consisting of email number and flag
				global.flags.push( {"number": total_emails-$self.index(), "flag": "\\Seen"} );
				//console.log(global.flags);
				// Make adjustment to the unread orb if necessary
				var newNum = parseInt(this.text.attr('text')) - 1;
				
				if ( newNum == 0 )
					this.svg.hide();
				else
					this.text.attr({'text': newNum});
			}
		}
	};
}

function drawOffline(element) {
	var s 		= getSize2(element);
	var paper  	= Raphael(s.l, s.t, s.w, s.h);
	
	// src: http://raphaeljs.com/icons/
	var path1 = paper.path('M16,1.466C7.973,1.466,1.466,7.973,1.466,16c0,8.027,6.507,14.534,14.534,14.534c8.027,0,14.534-6.507,14.534-14.534C30.534,7.973,24.027,1.466,16,1.466zM19.158,23.269c-0.079,0.064-0.183,0.13-0.105,0.207c0.078,0.078-0.09,0.131-0.09,0.17s0.104,0.246,0.052,0.336c-0.052,0.092-0.091,0.223-0.13,0.301c-0.039,0.077-0.131,0.155-0.104,0.272c0.025,0.116-0.104,0.077-0.104,0.194c0,0.116,0.116,0.065,0.09,0.208c-0.025,0.144-0.09,0.183-0.09,0.285c0,0.104,0.064,0.247,0.064,0.286s-0.064,0.17-0.155,0.272c-0.092,0.104-0.155,0.17-0.144,0.233c0.014,0.065,0.104,0.144,0.091,0.184c-0.013,0.037-0.129,0.168-0.116,0.259c0.014,0.09,0.129,0.053,0.155,0.116c0.026,0.065-0.155,0.118-0.078,0.183c0.078,0.064,0.183,0.051,0.156,0.208c-0.019,0.112,0.064,0.163,0.126,0.198c-0.891,0.221-1.818,0.352-2.777,0.352C9.639,27.533,4.466,22.36,4.466,16c0-2.073,0.557-4.015,1.518-5.697c0.079-0.042,0.137-0.069,0.171-0.062c0.065,0.013,0.079,0.104,0.183,0.13c0.104,0.026,0.195-0.078,0.26-0.117c0.064-0.039,0.116-0.195,0.051-0.182c-0.065,0.013-0.234,0-0.234,0s0.183-0.104,0.183-0.169s0.025-0.169,0.129-0.208C6.83,9.655,6.83,9.681,6.765,9.837C6.7,9.993,6.896,9.928,6.973,9.863s0.13-0.013,0.272-0.104c0.143-0.091,0.143-0.143,0.221-0.143c0.078,0,0.221,0.143,0.299,0.091c0.077-0.052,0.299,0.065,0.429,0.065c0.129,0,0.545,0.169,0.624,0.169c0.078,0,0.312,0.09,0.325,0.259c0.013,0.169,0.09,0.156,0.168,0.156s0.26,0.065,0.26,0.13c0,0.065-0.052,0.325,0.078,0.39c0.129,0.064,0.247,0.169,0.299,0.143c0.052-0.026,0-0.233-0.064-0.26c-0.065-0.026-0.027-0.117-0.052-0.169c-0.026-0.051,0.078-0.051,0.117,0.039c0.039,0.091,0.143,0.26,0.208,0.26c0.064,0,0.208,0.156,0.168,0.247c-0.039,0.091,0.039,0.221,0.156,0.221c0.116,0,0.26,0.182,0.312,0.195c0.052,0.013,0.117,0.078,0.117,0.117c0,0.04,0.065,0.26,0.065,0.351c0,0.09-0.04,0.454-0.053,0.597s0.104,0.39,0.234,0.52c0.129,0.13,0.246,0.377,0.324,0.429c0.079,0.052,0.13,0.195,0.247,0.182c0.117-0.013,0.195,0.078,0.299,0.26c0.104,0.182,0.208,0.48,0.286,0.506c0.078,0.026,0.208,0.117,0.142,0.182c-0.064,0.064-0.168,0.208-0.051,0.208c0.117,0,0.156-0.065,0.247,0.053c0.09,0.116,0.208,0.181,0.194,0.26c-0.013,0.077,0.104,0.103,0.156,0.116c0.052,0.013,0.169,0.247,0.286,0.143c0.117-0.104-0.155-0.259-0.234-0.326c-0.078-0.064,0-0.207-0.182-0.35c-0.182-0.143-0.156-0.247-0.286-0.351c-0.13-0.104-0.233-0.195-0.104-0.286c0.13-0.091,0.143,0.091,0.195,0.208c0.052,0.116,0.324,0.351,0.441,0.454c0.117,0.104,0.326,0.468,0.39,0.468s0.247,0.208,0.247,0.208s0.103,0.168,0.064,0.22c-0.039,0.052,0.053,0.247,0.144,0.299c0.09,0.052,0.455,0.22,0.507,0.247c0.052,0.027,0.155,0.221,0.299,0.221c0.142,0,0.247,0.014,0.286,0.053c0.039,0.038,0.155,0.194,0.234,0.104c0.078-0.092,0.09-0.131,0.208-0.131c0.117,0,0.168,0.091,0.233,0.156c0.065,0.065,0.247,0.235,0.338,0.222c0.091-0.013,0.208,0.104,0.273,0.064s0.169,0.025,0.22,0.052c0.054,0.026,0.234,0.118,0.222,0.272c-0.013,0.157,0.103,0.195,0.182,0.234c0.078,0.039,0.182,0.13,0.248,0.195c0.064,0.063,0.206,0.077,0.246,0.116c0.039,0.039,0.065,0.117,0.182,0.052c0.116-0.064,0.092-0.181,0.092-0.181s0.129-0.026,0.194,0.026c0.064,0.05,0.104,0.22,0.144,0.246c0.038,0.026,0.115,0.221,0.063,0.362c-0.051,0.145-0.038,0.286-0.091,0.286c-0.052,0-0.116,0.17-0.195,0.209c-0.076,0.039-0.285,0.221-0.272,0.286c0.013,0.063,0.131,0.258,0.104,0.35c-0.025,0.091-0.194,0.195-0.154,0.338c0.038,0.144,0.312,0.183,0.323,0.312c0.014,0.131,0.209,0.417,0.235,0.546c0.025,0.13,0.246,0.272,0.246,0.453c0,0.184,0.312,0.3,0.377,0.312c0.063,0.013,0.182,0.131,0.272,0.17s0.169,0.116,0.233,0.221s0.053,0.261,0.053,0.299c0,0.039-0.039,0.44-0.078,0.674C19.145,23.021,19.235,23.203,19.158,23.269zM10.766,11.188c0.039,0.013,0.117,0.091,0.156,0.091c0.04,0,0.234,0.156,0.286,0.208c0.053,0.052,0.053,0.195-0.013,0.208s-0.104-0.143-0.117-0.208c-0.013-0.065-0.143-0.065-0.208-0.104C10.805,11.344,10.66,11.152,10.766,11.188zM27.51,16.41c-0.144,0.182-0.13,0.272-0.195,0.286c-0.064,0.013,0.065,0.065,0.09,0.194c0.022,0.112-0.065,0.224,0.063,0.327c-0.486,4.619-3.71,8.434-8.016,9.787c-0.007-0.011-0.019-0.025-0.021-0.034c-0.027-0.078-0.027-0.233,0.064-0.285c0.091-0.053,0.312-0.233,0.363-0.272c0.052-0.04,0.13-0.221,0.091-0.247c-0.038-0.026-0.232,0-0.26-0.039c-0.026-0.039-0.026-0.092,0.104-0.182c0.13-0.091,0.195-0.222,0.247-0.26c0.052-0.039,0.155-0.117,0.195-0.209c0.038-0.09-0.041-0.039-0.118-0.039s-0.117-0.142-0.117-0.207s0.195,0.026,0.339,0.052c0.143,0.024,0.077-0.065,0.064-0.142c-0.013-0.078,0.026-0.209,0.105-0.17c0.076,0.039,0.479-0.013,0.531-0.026c0.052-0.013,0.194-0.246,0.246-0.312c0.053-0.065,0.064-0.129,0-0.168c-0.065-0.04-0.143-0.184-0.168-0.221c-0.026-0.041-0.039-0.274-0.013-0.34c0.025-0.063,0,0.377,0.181,0.43c0.183,0.052,0.286,0.078,0.455-0.078c0.169-0.155,0.298-0.26,0.312-0.363c0.013-0.104,0.052-0.209,0.117-0.246c0.065-0.039,0.104,0.103,0.182-0.065c0.078-0.17,0.156-0.157,0.234-0.299c0.077-0.144-0.13-0.325,0.024-0.43c0.157-0.103,0.43-0.233,0.43-0.233s0.078-0.039,0.234-0.078c0.155-0.038,0.324-0.014,0.376-0.09c0.052-0.079,0.104-0.247,0.182-0.338c0.079-0.092,0.169-0.234,0.13-0.299c-0.039-0.065,0.104-0.352,0.091-0.429c-0.013-0.078-0.13-0.261,0.065-0.416s0.402-0.391,0.416-0.454c0.012-0.065,0.169-0.338,0.154-0.469c-0.012-0.129-0.154-0.285-0.245-0.325c-0.092-0.037-0.286-0.05-0.364-0.154s-0.299-0.208-0.377-0.182c-0.077,0.026-0.208,0.051-0.312-0.015c-0.104-0.063-0.272-0.143-0.337-0.194c-0.066-0.051-0.234-0.09-0.312-0.09s-0.065-0.053-0.182,0.103c-0.117,0.157,0,0.209-0.208,0.182c-0.209-0.024,0.025-0.038,0.144-0.194c0.115-0.155-0.014-0.247-0.144-0.207c-0.13,0.039-0.039,0.117-0.247,0.156c-0.207,0.038-0.207-0.092-0.077-0.117c0.13-0.026,0.363-0.143,0.363-0.194c0-0.053-0.026-0.196-0.13-0.196s-0.078-0.129-0.233-0.297c-0.156-0.17-0.351-0.274-0.508-0.249c-0.154,0.026-0.272,0.065-0.35-0.076c-0.078-0.144-0.169-0.17-0.222-0.247c-0.051-0.078-0.182,0-0.221-0.039s-0.039-0.039-0.039-0.039s-0.169,0.039-0.077-0.078c0.09-0.117,0.129-0.338,0.09-0.325c-0.038,0.013-0.104,0.196-0.168,0.183c-0.064-0.013-0.014-0.04-0.144-0.117c-0.13-0.078-0.337-0.013-0.337,0.052c0,0.065-0.065,0.117-0.065,0.117s-0.039-0.038-0.078-0.117c-0.039-0.078-0.221-0.091-0.312-0.013c-0.09,0.078-0.142-0.196-0.207-0.196s-0.194,0.065-0.26,0.184c-0.064,0.116-0.038,0.285-0.092,0.272c-0.05-0.013-0.063-0.233-0.05-0.312c0.012-0.079,0.155-0.208,0.05-0.234c-0.103-0.026-0.259,0.13-0.323,0.143c-0.065,0.013-0.195,0.104-0.273,0.209c-0.077,0.103-0.116,0.168-0.195,0.207c-0.077,0.039-0.193,0-0.167-0.039c0.025-0.039-0.222-0.181-0.261-0.13c-0.04,0.052-0.155,0.091-0.272,0.144c-0.117,0.052-0.222-0.065-0.247-0.117s-0.079-0.064-0.091-0.234c-0.013-0.168,0.027-0.351,0.065-0.454c0.038-0.104-0.195-0.312-0.286-0.3c-0.091,0.015-0.182,0.105-0.272,0.091c-0.092-0.012-0.052-0.038-0.195-0.038c-0.143,0-0.026-0.025,0-0.143c0.025-0.116-0.052-0.273,0.092-0.377c0.142-0.104,0.091-0.351,0-0.363c-0.092-0.014-0.261,0.039-0.377,0.026c-0.116-0.014-0.208,0.091-0.169,0.207c0.039,0.117-0.065,0.195-0.104,0.183c-0.039-0.013-0.09-0.078-0.234,0.026c-0.142,0.103-0.194,0.064-0.337-0.052c-0.143-0.118-0.299-0.234-0.325-0.416c-0.026-0.182-0.04-0.364,0.013-0.468c0.051-0.104,0.051-0.285-0.026-0.312c-0.078-0.025,0.09-0.155,0.181-0.181c0.092-0.026,0.234-0.143,0.26-0.195c0.026-0.052,0.156-0.04,0.298-0.04c0.143,0,0.169,0,0.312,0.078c0.143,0.078,0.169-0.039,0.169-0.078c0-0.039,0.052-0.117,0.208-0.104c0.156,0.013,0.376-0.052,0.416-0.013s0.116,0.195,0.194,0.143c0.079-0.051,0.104-0.143,0.131,0.014c0.025,0.155,0.09,0.39,0.208,0.429c0.116,0.039,0.052,0.194,0.168,0.207c0.115,0.013,0.17-0.246,0.131-0.337c-0.04-0.09-0.118-0.363-0.183-0.428c-0.064-0.065-0.064-0.234,0.064-0.286c0.13-0.052,0.442-0.312,0.532-0.389c0.092-0.079,0.338-0.144,0.261-0.248c-0.078-0.104-0.104-0.168-0.104-0.247s0.078-0.052,0.117,0s0.194-0.078,0.155-0.143c-0.038-0.064-0.026-0.155,0.065-0.143c0.091,0.013,0.116-0.065,0.078-0.117c-0.039-0.052,0.091-0.117,0.182-0.091c0.092,0.026,0.325-0.013,0.364-0.065c0.038-0.052-0.078-0.104-0.078-0.208c0-0.104,0.155-0.195,0.247-0.208c0.091-0.013,0.207,0,0.221-0.039c0.012-0.039,0.143-0.143,0.155-0.052c0.014,0.091,0,0.247,0.104,0.247c0.104,0,0.232-0.117,0.272-0.129c0.038-0.013,0.286-0.065,0.338-0.078c0.052-0.013,0.363-0.039,0.325-0.13c-0.039-0.09-0.078-0.181-0.118-0.22c-0.039-0.039-0.077,0.013-0.13,0.078c-0.051,0.065-0.143,0.065-0.168,0.013c-0.026-0.051,0.012-0.207-0.078-0.156c-0.092,0.052-0.104,0.104-0.157,0.078c-0.052-0.026-0.103-0.117-0.103-0.117s0.129-0.064,0.038-0.182c-0.09-0.117-0.221-0.091-0.35-0.025c-0.13,0.064-0.118,0.051-0.273,0.09s-0.234,0.078-0.234,0.078s0.209-0.129,0.299-0.208c0.091-0.078,0.209-0.117,0.286-0.195c0.078-0.078,0.285,0.039,0.285,0.039s0.105-0.104,0.105-0.039s-0.027,0.234,0.051,0.234c0.079,0,0.299-0.104,0.21-0.131c-0.093-0.026,0.129,0,0.219-0.065c0.092-0.065,0.194-0.065,0.247-0.09c0.052-0.026,0.092-0.143,0.182-0.143c0.092,0,0.13,0.117,0,0.195s-0.143,0.273-0.208,0.325c-0.064,0.052-0.026,0.117,0.078,0.104c0.104-0.013,0.194,0.013,0.286-0.013s0.143,0.026,0.168,0.065c0.026,0.039,0.104-0.039,0.104-0.039s0.169-0.039,0.221,0.026c0.053,0.064,0.092-0.039,0.053-0.104c-0.039-0.064-0.092-0.129-0.13-0.208c-0.039-0.078-0.091-0.104-0.194-0.078c-0.104,0.026-0.13-0.026-0.195-0.064c-0.065-0.04-0.118,0.052-0.065-0.04c0.053-0.09,0.078-0.117,0.117-0.195c0.039-0.078,0.209-0.221,0.039-0.259c-0.169-0.04-0.222-0.065-0.247-0.143c-0.026-0.078-0.221-0.221-0.272-0.221c-0.053,0-0.233,0-0.247-0.065c-0.013-0.065-0.143-0.208-0.208-0.273c-0.064-0.065-0.312-0.351-0.351-0.377c-0.039-0.026-0.091-0.013-0.208,0.143c-0.116,0.157-0.22,0.183-0.312,0.144c-0.091-0.039-0.104-0.026-0.193-0.13c-0.093-0.104,0.09-0.117,0.051-0.182c-0.04-0.064-0.247-0.091-0.377-0.104c-0.13-0.013-0.221-0.156-0.416-0.169c-0.194-0.013-0.428,0.026-0.493,0.026c-0.064,0-0.064,0.091-0.09,0.234c-0.027,0.143,0.09,0.182-0.027,0.208c-0.116,0.026-0.169,0.039-0.052,0.091c0.117,0.052,0.273,0.26,0.273,0.26s0,0.117-0.092,0.182c-0.09,0.065-0.182,0.13-0.233,0.053c-0.053-0.079-0.195-0.065-0.155,0.013c0.038,0.078,0.116,0.117,0.116,0.195c0,0.077,0.117,0.272,0.039,0.337c-0.078,0.065-0.168,0.014-0.233,0.026s-0.131-0.104-0.078-0.13c0.051-0.026-0.014-0.221-0.014-0.221s-0.155,0.221-0.143,0.104c0.014-0.117-0.064-0.13-0.064-0.221c0-0.091-0.079-0.13-0.194-0.104c-0.118,0.026-0.26-0.04-0.482-0.079c-0.22-0.039-0.311-0.064-0.493-0.156c-0.182-0.091-0.247-0.026-0.338-0.013c-0.091,0.013-0.052-0.182-0.169-0.207c-0.116-0.027-0.181,0.025-0.207-0.144c-0.026-0.168,0.039-0.208,0.324-0.39c0.286-0.182,0.247-0.26,0.468-0.286c0.22-0.026,0.325,0.026,0.325-0.039s0.052-0.325,0.052-0.195S16.95,9.109,16.832,9.2c-0.116,0.091-0.052,0.104,0.04,0.104c0.091,0,0.259-0.091,0.259-0.091s0.208-0.091,0.26-0.013c0.053,0.078,0.053,0.156,0.144,0.156s0.285-0.104,0.116-0.195c-0.168-0.091-0.272-0.078-0.376-0.182s-0.078-0.065-0.195-0.039c-0.116,0.026-0.116-0.039-0.156-0.039s-0.104,0.026-0.13-0.026c-0.025-0.052,0.014-0.065,0.145-0.065c0.129,0,0.285,0.039,0.285,0.039s0.155-0.052,0.194-0.065c0.039-0.013,0.247-0.039,0.208-0.155c-0.04-0.117-0.169-0.117-0.208-0.156s0.078-0.09,0.143-0.117c0.065-0.026,0.247,0,0.247,0s0.117,0.013,0.117-0.039S17.897,8.2,17.976,8.239s0,0.156,0.117,0.13c0.116-0.026,0.143,0,0.207,0.039c0.065,0.039-0.013,0.195-0.077,0.221c-0.065,0.025-0.169,0.077-0.026,0.09c0.144,0.014,0.246,0.014,0.246,0.014s0.092-0.091,0.131-0.169c0.038-0.078,0.104-0.026,0.155,0c0.052,0.025,0.247,0.065,0.065,0.117c-0.183,0.052-0.221,0.117-0.26,0.182c-0.038,0.065-0.053,0.104-0.221,0.065c-0.17-0.039-0.26-0.026-0.299,0.039c-0.039,0.064-0.013,0.273,0.053,0.247c0.063-0.026,0.129-0.026,0.207-0.052c0.078-0.026,0.39,0.026,0.467,0.013c0.078-0.013,0.209,0.13,0.248,0.104c0.039-0.026,0.117,0.052,0.194,0.104c0.078,0.052,0.052-0.117,0.194-0.013c0.144,0.104,0.065,0.104,0.144,0.104c0.076,0,0.246,0.013,0.246,0.013s0.014-0.129,0.144-0.104c0.13,0.026,0.245,0.169,0.232,0.064c-0.012-0.103,0.013-0.181-0.09-0.259c-0.104-0.078-0.272-0.13-0.299-0.169c-0.026-0.039-0.052-0.091-0.013-0.117c0.039-0.025,0.221,0.013,0.324,0.079c0.104,0.065,0.195,0.13,0.273,0.078c0.077-0.052,0.17-0.078,0.208-0.117c0.038-0.04,0.13-0.156,0.13-0.156s-0.391-0.051-0.441-0.117c-0.053-0.065-0.235-0.156-0.287-0.156s-0.194,0.091-0.246-0.039s-0.052-0.286-0.105-0.299c-0.05-0.013-0.597-0.091-0.674-0.13c-0.078-0.039-0.39-0.13-0.507-0.195s-0.286-0.156-0.389-0.156c-0.104,0-0.533,0.052-0.611,0.039c-0.078-0.013-0.312,0.026-0.403,0.039c-0.091,0.013,0.117,0.182-0.077,0.221c-0.195,0.039-0.169,0.065-0.13-0.13c0.038-0.195-0.131-0.247-0.299-0.169c-0.169,0.078-0.442,0.13-0.377,0.221c0.065,0.091-0.012,0.157,0.117,0.247c0.13,0.091,0.183,0.117,0.35,0.104c0.17-0.013,0.339,0.025,0.339,0.025s0,0.157-0.064,0.182c-0.065,0.026-0.169,0.026-0.196,0.104c-0.025,0.078-0.155,0.117-0.155,0.078s0.065-0.169-0.026-0.234c-0.09-0.065-0.117-0.078-0.221-0.013c-0.104,0.065-0.116,0.091-0.169-0.013C16.053,8.291,15.897,8.2,15.897,8.2s-0.104-0.129-0.182-0.194c-0.077-0.065-0.22-0.052-0.234,0.013c-0.013,0.064,0.026,0.129,0.078,0.247c0.052,0.117,0.104,0.337,0.013,0.351c-0.091,0.013-0.104,0.026-0.195,0.052c-0.091,0.026-0.13-0.039-0.13-0.143s-0.04-0.195-0.013-0.234c0.026-0.039-0.104,0.027-0.234,0c-0.13-0.025-0.233,0.052-0.104,0.092c0.13,0.039,0.157,0.194,0.039,0.233c-0.117,0.039-0.559,0-0.702,0s-0.35,0.039-0.39-0.039c-0.039-0.078,0.118-0.129,0.208-0.129c0.091,0,0.363,0.012,0.467-0.13c0.104-0.143-0.13-0.169-0.233-0.169c-0.104,0-0.183-0.039-0.299-0.155c-0.118-0.117,0.078-0.195,0.052-0.247c-0.026-0.052-0.156-0.014-0.272-0.014c-0.117,0-0.299-0.09-0.299,0.014c0,0.104,0.143,0.402,0.052,0.337c-0.091-0.064-0.078-0.156-0.143-0.234c-0.065-0.078-0.168-0.065-0.299-0.052c-0.129,0.013-0.35,0.052-0.415,0.039c-0.064-0.013-0.013-0.013-0.156-0.078c-0.142-0.065-0.208-0.052-0.312-0.117C12.091,7.576,12.182,7.551,12,7.538c-0.181-0.013-0.168,0.09-0.35,0.065c-0.182-0.026-0.234,0.013-0.416,0c-0.182-0.013-0.272-0.026-0.299,0.065c-0.025,0.091-0.078,0.247-0.156,0.247c-0.077,0-0.169,0.091,0.078,0.104c0.247,0.013,0.105,0.129,0.325,0.117c0.221-0.013,0.416-0.013,0.468-0.117c0.052-0.104,0.091-0.104,0.117-0.065c0.025,0.039,0.22,0.272,0.22,0.272s0.131,0.104,0.183,0.13c0.051,0.026-0.052,0.143-0.156,0.078c-0.104-0.065-0.299-0.051-0.377-0.116c-0.078-0.065-0.429-0.065-0.52-0.052c-0.09,0.013-0.247-0.039-0.299-0.039c-0.051,0-0.221,0.13-0.221,0.13S10.532,8.252,10.494,8.2c-0.039-0.052-0.104,0.052-0.156,0.065c-0.052,0.013-0.208-0.104-0.364-0.052C9.818,8.265,9.87,8.317,9.649,8.304s-0.272-0.052-0.35-0.039C9.22,8.278,9.22,8.278,9.22,8.278S9.233,8.33,9.143,8.382C9.052,8.434,8.986,8.499,8.921,8.421C8.857,8.343,8.818,8.343,8.779,8.33c-0.04-0.013-0.118-0.078-0.286-0.04C8.324,8.33,8.064,8.239,8.013,8.239c-0.04,0-0.313-0.015-0.491-0.033c2.109-2.292,5.124-3.74,8.478-3.74c2.128,0,4.117,0.589,5.83,1.598c-0.117,0.072-0.319,0.06-0.388,0.023c-0.078-0.043-0.158-0.078-0.475-0.061c-0.317,0.018-0.665,0.122-0.595,0.226c0.072,0.104-0.142,0.165-0.197,0.113c-0.055-0.052-0.309,0.06-0.293,0.165c0.016,0.104-0.039,0.225-0.175,0.199c-0.134-0.027-0.229,0.06-0.237,0.146c-0.007,0.087-0.309,0.147-0.332,0.147c-0.024,0-0.412-0.008-0.27,0.095c0.097,0.069,0.15,0.027,0.27,0.052c0.119,0.026,0.214,0.217,0.277,0.243c0.062,0.026,0.15,0,0.189-0.052c0.04-0.052,0.095-0.234,0.095-0.234s0,0.173,0.097,0.208c0.095,0.035,0.331-0.026,0.395-0.017c0.064,0.008,0.437,0.061,0.538,0.112c0.104,0.052,0.356,0.087,0.428,0.199c0.071,0.113,0.08,0.503,0.119,0.546c0.04,0.043,0.174-0.139,0.205-0.182c0.031-0.044,0.198-0.018,0.254,0.042c0.056,0.061,0.182,0.208,0.175,0.269C21.9,8.365,21.877,8.459,21.83,8.425c-0.048-0.034-0.127-0.025-0.096-0.095c0.032-0.069,0.048-0.217-0.015-0.217c-0.064,0-0.119,0-0.119,0s-0.12-0.035-0.199,0.095s-0.015,0.26,0.04,0.26s0.184,0,0.184,0.034c0,0.035-0.136,0.139-0.128,0.2c0.009,0.061,0.11,0.268,0.144,0.312c0.031,0.043,0.197,0.086,0.244,0.096c0.049,0.008-0.111,0.017-0.07,0.077c0.04,0.061,0.102,0.208,0.189,0.243c0.087,0.035,0.333,0.19,0.363,0.26c0.032,0.069,0.222-0.052,0.262-0.061c0.04-0.008,0.032,0.182,0.143,0.191c0.11,0.008,0.15-0.018,0.245-0.096s0.072-0.182,0.079-0.26c0.009-0.078,0-0.138,0.104-0.113c0.104,0.026,0.158-0.018,0.15-0.104c-0.008-0.087-0.095-0.191,0.07-0.217c0.167-0.026,0.254-0.138,0.357-0.138c0.103,0,0.389,0.043,0.419,0c0.032-0.043,0.167-0.243,0.254-0.251c0.067-0.007,0.224-0.021,0.385-0.042c1.582,1.885,2.561,4.284,2.673,6.905c-0.118,0.159-0.012,0.305,0.021,0.408c0.001,0.03,0.005,0.058,0.005,0.088c0,0.136-0.016,0.269-0.021,0.404C27.512,16.406,27.512,16.408,27.51,16.41zM17.794,12.084c-0.064,0.013-0.169-0.052-0.169-0.143s-0.091,0.169-0.04,0.247c0.053,0.078-0.104,0.169-0.155,0.169s-0.091-0.116-0.078-0.233c0.014-0.117-0.077-0.221-0.221-0.208c-0.143,0.014-0.208,0.13-0.259,0.169c-0.053,0.039-0.053,0.259-0.04,0.312s0.013,0.235-0.116,0.221c-0.118-0.013-0.092-0.233-0.079-0.312c0.014-0.078-0.039-0.273,0.014-0.376c0.053-0.104,0.207-0.143,0.312-0.156s0.324,0.065,0.363,0.052c0.04-0.014,0.222-0.014,0.312,0C17.729,11.837,17.858,12.071,17.794,12.084zM18.027,12.123c0.04,0.026,0.311-0.039,0.364,0.026c0.051,0.065-0.054,0.078-0.183,0.13c-0.129,0.052-0.169,0.039-0.221,0.104s-0.221,0.09-0.299,0.168c-0.078,0.079-0.217,0.125-0.246,0.065c-0.04-0.078,0.013-0.039,0.025-0.078c0.013-0.039,0.245-0.129,0.245-0.129S17.988,12.097,18.027,12.123zM16.988,11.668c-0.038,0.013-0.182-0.026-0.3-0.026c-0.116,0-0.091-0.078-0.143-0.064c-0.051,0.013-0.168,0.039-0.247,0.078c-0.078,0.039-0.208,0.03-0.208-0.04c0-0.104,0.052-0.078,0.221-0.143c0.169-0.065,0.352-0.247,0.429-0.169c0.078,0.078,0.221,0.169,0.312,0.182C17.144,11.5,17.026,11.655,16.988,11.668zM15.659,7.637c-0.079,0.026-0.347,0.139-0.321,0.199c0.01,0.023,0.078,0.069,0.19,0.052c0.113-0.018,0.276-0.035,0.355-0.043c0.078-0.009,0.095-0.139,0.009-0.147C15.805,7.689,15.736,7.611,15.659,7.637zM14.698,7.741c-0.061,0.026-0.243-0.043-0.338,0.018c-0.061,0.038-0.026,0.164,0.07,0.172c0.095,0.009,0.259-0.06,0.276-0.008c0.018,0.052,0.078,0.286,0.234,0.208c0.156-0.078,0.147-0.147,0.19-0.156c0.043-0.009-0.008-0.199-0.078-0.243C14.983,7.689,14.758,7.715,14.698,7.741zM14.385,7.005c0.017,0.044-0.008,0.078,0.113,0.095c0.121,0.018,0.173,0.035,0.243,0.035c0.069,0,0.042-0.113-0.018-0.19c-0.061-0.078-0.043-0.069-0.199-0.113c-0.156-0.043-0.312-0.043-0.416-0.035c-0.104,0.009-0.217-0.017-0.243,0.104c-0.013,0.062,0.07,0.112,0.174,0.112S14.368,6.962,14.385,7.005zM14.611,7.481c0.043,0.095,0.043,0.051,0.165,0.061C14.896,7.551,14.991,7.421,15,7.378c0.009-0.044-0.061-0.13-0.225-0.113c-0.165,0.017-0.667-0.026-0.736,0.034c-0.066,0.058,0,0.233-0.026,0.251c-0.026,0.017,0.009,0.095,0.077,0.078c0.069-0.017,0.104-0.182,0.157-0.182C14.299,7.447,14.568,7.386,14.611,7.481zM12.982,7.126c0.052,0.043,0.183,0.008,0.173-0.035c-0.008-0.043,0.053-0.217-0.051-0.225C13,6.858,12.854,6.962,12.697,7.014c-0.101,0.033-0.078,0.13-0.009,0.13S12.931,7.083,12.982,7.126zM13.72,7.282c-0.087,0.043-0.114,0.069-0.191,0.052c-0.078-0.017-0.078-0.156-0.217-0.13c-0.138,0.026-0.164,0.104-0.207,0.139s-0.139,0.061-0.173,0.043c-0.034-0.017-0.234-0.129-0.234-0.129s-0.416-0.018-0.433-0.07c-0.017-0.052-0.086-0.138-0.277-0.121s-0.52,0.13-0.572,0.13c-0.052,0,0.062,0.104-0.009,0.104c-0.069,0-0.155-0.008-0.181,0.069c-0.018,0.053,0.078,0.052,0.189,0.052c0.112,0,0.295,0,0.347-0.026c0.052-0.026,0.312-0.087,0.303-0.009c-0.009,0.079,0.104,0.199,0.164,0.182c0.061-0.017,0.183-0.13,0.243-0.086c0.061,0.043,0.07,0.146,0.13,0.173c0.061,0.025,0.226,0.025,0.304,0c0.077-0.027,0.294-0.027,0.389-0.009c0.095,0.018,0.373,0.069,0.399,0.018c0.026-0.053,0.104-0.061,0.112-0.113s0.051-0.216,0.051-0.216S13.806,7.239,13.72,7.282zM18.105,16.239c-0.119,0.021-0.091,0.252,0.052,0.21C18.3,16.407,18.223,16.217,18.105,16.239zM19.235,15.929c-0.104-0.026-0.221,0-0.299,0.013c-0.078,0.013-0.299,0.208-0.299,0.208s0.143,0.026,0.233,0.026c0.092,0,0.144,0.051,0.221,0.09c0.078,0.04,0.221-0.052,0.272-0.052c0.053,0,0.118,0.156,0.131-0.013C19.508,16.032,19.339,15.955,19.235,15.929zM15.616,7.507c-0.043-0.104-0.259-0.139-0.304-0.035C15.274,7.563,15.659,7.611,15.616,7.507zM18.093,15.292c0.143-0.026,0.064-0.144-0.053-0.13C17.922,15.175,17.949,15.318,18.093,15.292zM19.82,16.095c-0.119,0.022-0.092,0.253,0.051,0.211C20.015,16.264,19.937,16.074,19.82,16.095zM18.247,15.708c-0.09,0.013-0.285-0.09-0.389-0.182c-0.104-0.091-0.299-0.091-0.377-0.091c-0.077,0-0.39,0.091-0.39,0.091c-0.013,0.13,0.117,0.091,0.273,0.091s0.429-0.026,0.479,0.039c0.053,0.064,0.286,0.168,0.352,0.221c0.064,0.052,0.272,0.065,0.285,0.013S18.338,15.695,18.247,15.708zM16.698,7.412c-0.13-0.009-0.295-0.009-0.399,0c-0.104,0.008-0.182-0.069-0.26-0.113c-0.077-0.043-0.251-0.182-0.354-0.199c-0.104-0.017-0.086-0.017-0.303-0.069c-0.11-0.027-0.294-0.061-0.294-0.086c0-0.026-0.052,0.121,0.043,0.165c0.095,0.043,0.251,0.121,0.363,0.164c0.114,0.043,0.329,0.052,0.399,0.139c0.069,0.086,0.303,0.156,0.303,0.156l0.277,0.026c0,0,0.191-0.043,0.39-0.026c0.199,0.017,0.493,0.043,0.659,0.035c0.163-0.008,0.189-0.061,0.208-0.095c0.016-0.035-0.304-0.104-0.383-0.095C17.271,7.42,16.827,7.42,16.698,7.412zM17.182,9.404c-0.034,0.039,0.157,0.095,0.191,0.043C17.407,9.396,17.271,9.309,17.182,9.404zM17.764,9.585c0.086-0.035,0.043-0.139-0.079-0.104C17.547,9.521,17.676,9.62,17.764,9.585z');
	var bb    = path1.getBBox(false);
	var ratio = (s.w-2)/bb.width;
	
	var hoverColor 	 = '#4493bc';
	var defaultColor = '#bcbcbc';
	
	path1.attr('stroke', ( config_email.offline_mode ? '#bcbcbc' : '#4493bc'))
	.transform('s'+ratio+' '+ratio+' 0 0')
	.click(function() {
		config_email.offline_mode = !config_email.offline_mode;
		this.attr('stroke', (config_email.offline_mode ? defaultColor : hoverColor ));
	}).hover(function() {
		this.attr('stroke', hoverColor);
	}, function() {
		if ( config_email.offline_mode )
			this.attr('stroke', defaultColor);
		else
			this.attr('stroke', hoverColor);
	});

	element.append($(path1.node).parent().css({top:0,left:0}));
}

function drawConfig(element) {
	var s 		= getSize2(element);
	var paper  	= Raphael(s.l, s.t, s.w, s.h);
	
	// src: http://raphaeljs.com/icons/
	var path1 	= paper.path('M17.41,20.395l-0.778-2.723c0.228-0.2,0.442-0.414,0.644-0.643l2.721,0.778c0.287-0.418,0.534-0.862,0.755-1.323l-2.025-1.96c0.097-0.288,0.181-0.581,0.241-0.883l2.729-0.684c0.02-0.252,0.039-0.505,0.039-0.763s-0.02-0.51-0.039-0.762l-2.729-0.684c-0.061-0.302-0.145-0.595-0.241-0.883l2.026-1.96c-0.222-0.46-0.469-0.905-0.756-1.323l-2.721,0.777c-0.201-0.228-0.416-0.442-0.644-0.643l0.778-2.722c-0.418-0.286-0.863-0.534-1.324-0.755l-1.96,2.026c-0.287-0.097-0.581-0.18-0.883-0.241l-0.683-2.73c-0.253-0.019-0.505-0.039-0.763-0.039s-0.51,0.02-0.762,0.039l-0.684,2.73c-0.302,0.061-0.595,0.144-0.883,0.241l-1.96-2.026C7.048,3.463,6.604,3.71,6.186,3.997l0.778,2.722C6.736,6.919,6.521,7.134,6.321,7.361L3.599,6.583C3.312,7.001,3.065,7.446,2.844,7.907l2.026,1.96c-0.096,0.288-0.18,0.581-0.241,0.883l-2.73,0.684c-0.019,0.252-0.039,0.505-0.039,0.762s0.02,0.51,0.039,0.763l2.73,0.684c0.061,0.302,0.145,0.595,0.241,0.883l-2.026,1.96c0.221,0.46,0.468,0.905,0.755,1.323l2.722-0.778c0.2,0.229,0.415,0.442,0.643,0.643l-0.778,2.723c0.418,0.286,0.863,0.533,1.323,0.755l1.96-2.026c0.288,0.097,0.581,0.181,0.883,0.241l0.684,2.729c0.252,0.02,0.505,0.039,0.763,0.039s0.51-0.02,0.763-0.039l0.683-2.729c0.302-0.061,0.596-0.145,0.883-0.241l1.96,2.026C16.547,20.928,16.992,20.681,17.41,20.395zM11.798,15.594c-1.877,0-3.399-1.522-3.399-3.399s1.522-3.398,3.399-3.398s3.398,1.521,3.398,3.398S13.675,15.594,11.798,15.594zM27.29,22.699c0.019-0.547-0.06-1.104-0.23-1.654l1.244-1.773c-0.188-0.35-0.4-0.682-0.641-0.984l-2.122,0.445c-0.428-0.364-0.915-0.648-1.436-0.851l-0.611-2.079c-0.386-0.068-0.777-0.105-1.173-0.106l-0.974,1.936c-0.279,0.054-0.558,0.128-0.832,0.233c-0.257,0.098-0.497,0.22-0.727,0.353L17.782,17.4c-0.297,0.262-0.568,0.545-0.813,0.852l0.907,1.968c-0.259,0.495-0.437,1.028-0.519,1.585l-1.891,1.06c0.019,0.388,0.076,0.776,0.164,1.165l2.104,0.519c0.231,0.524,0.541,0.993,0.916,1.393l-0.352,2.138c0.32,0.23,0.66,0.428,1.013,0.6l1.715-1.32c0.536,0.141,1.097,0.195,1.662,0.15l1.452,1.607c0.2-0.057,0.399-0.118,0.596-0.193c0.175-0.066,0.34-0.144,0.505-0.223l0.037-2.165c0.455-0.339,0.843-0.747,1.152-1.206l2.161-0.134c0.152-0.359,0.279-0.732,0.368-1.115L27.29,22.699zM23.127,24.706c-1.201,0.458-2.545-0.144-3.004-1.345s0.143-2.546,1.344-3.005c1.201-0.458,2.547,0.144,3.006,1.345C24.931,22.902,24.328,24.247,23.127,24.706z');
	var bb		= path1.getBBox(false);
	var ratio   = (s.w-2)/bb.width;
	
	path1.attr('stroke', '#bcbcbc')
	.transform('s'+ratio+' '+ratio+' 0 0')
	.click(initConfigBox)
	.hover(function() {
		this.attr('stroke', '#4493bc');
	}, function() {
		this.attr('stroke', '#bcbcbc');
	});
	
	element.append($(path1.node).parent().css({top:0,left:0}));
}

function drawHardwareMonitor(container, lsid) {
	var s 		= getSize2(container);
	var paper  	= Raphael(s.l, s.t, s.w, s.h);
	
	var n;
	var cache = localStorage.getItem(lsid);
	
	// found item in localstorage, add to paper
	if ( cache ) {
		n = paper.add(JSON.parse(cache));
	} else {
		var fontSize	= s.h * 0.175;
		var barheight 	= s.h * 0.182;
		var bar1Y		= s.h * 0.236;
		var bar2Y		= s.h * 0.82;
		
		var object = [{
			type: 'text',
			x: 0,
			y: fontSize * 0.5,
			text: 'PROCESSOR ACTIVITY',
			'font-family': 'DX',
			'font-size': fontSize,
			fill: '#A2A070',
			'text-anchor': 'start'
		}, {
			type: 'text',
			x: 0,
			y: (s.h * 0.688) ,
			text: 'NETWORK ACTIVITY',
			'font-family': 'DX',
			'font-size': fontSize,
			fill: '#A2A070',
			'text-anchor': 'start'
		}, {
			type: 'rect',
			x: 0, 
			y: bar1Y,
			width: s.w,
			height: barheight,
			fill: '#fcc433',
			stroke: 'none'
		}, {
			type: 'rect',
			x: 0,
			y: bar1Y,
			width: s.w * 0.577,
			height: barheight,
			fill: '#262626',
			stroke: '#262626'
		}, {
			type: 'rect',
			x: 0,
			y: bar2Y,
			width: s.w * 0.538,
			height: barheight,
			fill: '#fcc433',
			stroke: 'none'
		}, {
			type: 'rect',
			x: 0,
			y: bar2Y,
			width: s.w * 0.308,
			height: barheight,
			fill: '#262626',
			stroke: '#262626'
		}];
		
		n = paper.add(object);
		
		localStorage.setItem(lsid, JSON.stringify(object));
	}
	
	//var a = n[0].getBBox(false);
	//n[0].attr('x', (a.width / 2));
	
	//var b = n[1].getBBox(false);
	//n[1].attr('x', b.width / 2);
	
	/*
	var fontSize	= s.h * 0.175;
	var fontX 		= s.w * 0.5;
	var fontY 		= fontSize * 0.5;
	var at3   		= {'font-family': 'DX', 'font-size': fontSize, fill: '#A2A070' };
	var cpuTxt  	= paper.text(fontX, fontY, "PROCESSOR ACTIVITY").attr(at3);
	var netTxt 		= paper.text(s.w * 0.425, (s.h * 0.56) + fontSize, "NETWORK ACTIVITY").attr(at3);
	
	var barheight 	= s.h * 0.182;
	var bar1Y		= s.h * 0.236;
	var bar1atr		= {fill: '#fcc433', stroke: 'none'};
	var bar2atr		= {fill: '#262626', stroke: '#262626', 'stroke-width': 1};
	
	var bar1 		= paper.rect(0, bar1Y, s.w, barheight).attr(bar1atr);
	var bar1_1 		= paper.rect(0, bar1Y, s.w * 0.577, barheight).attr(bar2atr);
	
	var bar2Y	= s.h*0.873;
	var bar2 	= paper.rect(0, bar2Y, s.w * 0.538, barheight).attr(bar1atr);
	var bar2_2 	= paper.rect(0, bar2Y, s.w * 0.308, barheight).attr(bar2atr);
	*/
	
	var p = $(n[2].node).parent().attr('id', 'cpusvg').css({top: 0,left: 0});
	container.append(p);
	
	return {
		cpuMaxBar: n[2],
		cpuBar: n[3],
		netMaxBar: n[4],
		netBar: n[5],
		parent: p,
		isAnimating: false,
		
		animate: function() {
			// Only call the animation once
			if ( !this.isAnimating ) {
				this.isAnimating = true;
				
				/* The animations merely emulate the load on cpu and network resources by getting
				* a percentage width of the cpu/net bar and setting the darker bar to the new width
				* and covering the yellow bar. We could actually get accurate server cpu readings
				* to be used for the anims but we would be have to be doing a lot of ajax calls
				* for small data. We save bandwidth this way.
				*/
				var cpuWidth = n[2].attr('width');
				var netWidth = n[4].attr('width');
				
				var cpuAnim = function() {
					var newWidth = Math.random() * cpuWidth;
					n[3].animate({width:newWidth}, 1000, cpuAnim);
				};
				
				var netAnim = function() {
					var newWidth = Math.random() * netWidth;
					n[5].animate({width:newWidth}, 1500, netAnim);
				}

				cpuAnim();
				netAnim();
			}
		}
	};
}

function drawAttachment(container, color) {
	var s = getSize2(container);
	var paper = Raphael(s.l, s.t, s.w, s.h);
	
	var paperclip = paper.path('M23.898,6.135c-1.571-1.125-3.758-0.764-4.884,0.808l-8.832,12.331c-0.804,1.122-0.546,2.684,0.577,3.488c1.123,0.803,2.684,0.545,3.488-0.578l6.236-8.706l-0.813-0.583l-6.235,8.707h0c-0.483,0.672-1.42,0.828-2.092,0.347c-0.673-0.481-0.827-1.419-0.345-2.093h0l8.831-12.33l0.001-0.001l-0.002-0.001c0.803-1.119,2.369-1.378,3.489-0.576c1.12,0.803,1.379,2.369,0.577,3.489v-0.001l-9.68,13.516l0.001,0.001c-1.124,1.569-3.316,1.931-4.885,0.808c-1.569-1.125-1.93-3.315-0.807-4.885l7.035-9.822l-0.813-0.582l-7.035,9.822c-1.447,2.02-0.982,4.83,1.039,6.277c2.021,1.448,4.831,0.982,6.278-1.037l9.68-13.516C25.83,9.447,25.47,7.261,23.898,6.135z')
	.attr({fill: color, stroke: 'none'});
	
	var bb = paperclip.getBBox(false);
	var ratio = (s.h-1) / bb.height;
	
	paperclip.transform('s'+ratio+' '+ratio+' 0 0t-'+(bb.width*0.33)+' -'+(bb.height*0.25));
	
	var parent = $(paperclip.node).parent().css({top:0,left:0});
	container.append(parent);
	
	return {
		svg: parent,
		icon: paperclip
	};
}

function drawControlBar(container) {
	var s 		= getSize2(container);
	var paper 	= Raphael(s.l, s.t, s.w, s.h);
	
	var color = {fill: '#1a1c1b', stroke: 'none'};
	
	// Deletion icon chunk
	var iconDel = paper.path('M20.826,5.75l0.396,1.188c1.54,0.575,2.589,1.44,2.589,2.626c0,2.405-4.308,3.498-8.312,3.498c-4.003,0-8.311-1.093-8.311-3.498c0-1.272,1.21-2.174,2.938-2.746l0.388-1.165c-2.443,0.648-4.327,1.876-4.327,3.91v2.264c0,1.224,0.685,2.155,1.759,2.845l0.396,9.265c0,1.381,3.274,2.5,7.312,2.5c4.038,0,7.313-1.119,7.313-2.5l0.405-9.493c0.885-0.664,1.438-1.521,1.438-2.617V9.562C24.812,7.625,23.101,6.42,20.826,5.75zM11.093,24.127c-0.476-0.286-1.022-0.846-1.166-1.237c-1.007-2.76-0.73-4.921-0.529-7.509c0.747,0.28,1.58,0.491,2.45,0.642c-0.216,2.658-0.43,4.923,0.003,7.828C11.916,24.278,11.567,24.411,11.093,24.127zM17.219,24.329c-0.019,0.445-0.691,0.856-1.517,0.856c-0.828,0-1.498-0.413-1.517-0.858c-0.126-2.996-0.032-5.322,0.068-8.039c0.418,0.022,0.835,0.037,1.246,0.037c0.543,0,1.097-0.02,1.651-0.059C17.251,18.994,17.346,21.325,17.219,24.329zM21.476,22.892c-0.143,0.392-0.69,0.95-1.165,1.235c-0.474,0.284-0.817,0.151-0.754-0.276c0.437-2.93,0.214-5.209-0.005-7.897c0.881-0.174,1.708-0.417,2.44-0.731C22.194,17.883,22.503,20.076,21.476,22.892zM11.338,9.512c0.525,0.173,1.092-0.109,1.268-0.633h-0.002l0.771-2.316h4.56l0.771,2.316c0.14,0.419,0.53,0.685,0.949,0.685c0.104,0,0.211-0.017,0.316-0.052c0.524-0.175,0.808-0.742,0.633-1.265l-1.002-3.001c-0.136-0.407-0.518-0.683-0.945-0.683h-6.002c-0.428,0-0.812,0.275-0.948,0.683l-1,2.999C10.532,8.77,10.815,9.337,11.338,9.512z');
	var bbox    = iconDel.getBBox(false);
	var ratio	= s.h / bbox.height;
	iconDel.attr(color)
	.transform('s'+ratio+','+ratio+',0,0t-'+bbox.x+',-'+s.h*0.2)
	.hover(function() {
		this.attr('fill', '#ec9c13');
	}, function() {
		this.attr('fill', '#1a1c1b');
	})
	.click($E.deleteEmail);
	
	var gap = s.w * 0.125;
	
	// Reply icon
	var reply = paper.path('M25.31,2.872l-3.384-2.127c-0.854-0.536-1.979-0.278-2.517,0.576l-1.334,2.123l6.474,4.066l1.335-2.122C26.42,4.533,26.164,3.407,25.31,2.872zM6.555,21.786l6.474,4.066L23.581,9.054l-6.477-4.067L6.555,21.786zM5.566,26.952l-0.143,3.819l3.379-1.787l3.14-1.658l-6.246-3.925L5.566,26.952z');	
	var rbox = reply.getBBox(false);
	bbox = iconDel.getBBox(false);
	ratio = s.h/rbox.height;
	reply.attr(color)
	.transform('s'+ratio+','+ratio+',0,0T'+(bbox.width+gap-2)+',0')
	.hover(function() {
		this.attr('fill', '#ec9c13');
	}, function() {
		this.attr('fill', '#1a1c1b');
	})
	.click(function() {
		if ( $('#reply_box:visible').length == 0 ) {
			// Reset button css
			cleanReplyBox();
			
			$('#reply_box').show('scale', 'fast', function() {	
				// Set the recipient
				var replyto = $('#reply_to');
				var from = $('#from_text').html();
				from = from.substring(from.indexOf('&lt;')+4, from.length-4);
				replyto.val(from);
				
				// Set the subject
				var replysubject = $('#reply_subject');
				var subj = $('#message .subject:first').html();
				if ( subj.indexOf('RE:') == -1 )
					subj = 'RE: '+subj;
				replysubject.val(subj);
				
				// Only initialize once
				if ( !$(this).data('init') ) 
					initEmailBox($(this), replyto, replysubject);
			});
	}
	});
	
	// Expand Icon
	var expand = paper.path('M25.545,23.328,17.918,15.623,25.534,8.007,27.391,9.864,29.649,1.436,21.222,3.694,23.058,5.53,15.455,13.134,7.942,5.543,9.809,3.696,1.393,1.394,3.608,9.833,5.456,8.005,12.98,15.608,5.465,23.123,3.609,21.268,1.351,29.695,9.779,27.438,7.941,25.6,15.443,18.098,23.057,25.791,21.19,27.638,29.606,29.939,27.393,21.5z');
	rbox = reply.getBBox(false);
	var ebox = expand.getBBox(false);
	ratio = (s.h-1) / ebox.height;
	expand.attr(color)
	//.scale(ratio, ratio, 0, 0)
	.transform('S'+ratio+','+ratio+',0,0T'+(bbox.width+rbox.width+gap+gap)+',0')
	.hover(function() {
		this.attr('fill', '#ec9c13');
	}, function() {
		this.attr('fill', '#1a1c1b');
	}).click(function() {
		var api = $('#message').data('jsp');
		var msg = api.getContentPane().html();
		var w = window.open('', '', 'location=no,menubar=no,status=no,toolbar=no,scrollbars=yes,width='+screen.width*0.5);
		
		$(w.document.body).html(msg);
	});
	
	// Flagging icon
	var flagged = paper.path('M26.04,9.508c0.138-0.533,0.15-1.407,0.028-1.943l-0.404-1.771c-0.122-0.536-0.665-1.052-1.207-1.146l-3.723-0.643c-0.542-0.094-1.429-0.091-1.97,0.007l-4.033,0.726c-0.542,0.098-1.429,0.108-1.973,0.023L8.812,4.146C8.817,4.165,8.826,4.182,8.83,4.201l2.701,12.831l1.236,0.214c0.542,0.094,1.428,0.09,1.97-0.007l4.032-0.727c0.541-0.097,1.429-0.107,1.973-0.022l4.329,0.675c0.544,0.085,0.906-0.288,0.807-0.829l-0.485-2.625c-0.1-0.541-0.069-1.419,0.068-1.952L26.04,9.508zM6.667,3.636C6.126,3.75,5.78,4.279,5.894,4.819l5.763,27.378H13.7L7.852,4.409C7.736,3.867,7.207,3.521,6.667,3.636z');
	ebox = expand.getBBox(false);
	var fbox = flagged.getBBox(false);
	ratio = s.h / fbox.height;
	flagged.attr(color)
	.transform('S'+ratio+','+ratio+',0,0T'+(bbox.width+rbox.width+ebox.width+(gap*3))+',-'+s.h*0.1)
	.hover(function() {
		this.attr('stroke', '#ec9c13');
	}, function() {
		this.attr('stroke', 'none');
	})
	.click(function() {
		var totalEmails 	= $E.totalEmails;//$('#email_list_actual div.email').length;
		var $current		= $E.list.find('div.email-selected:first');
		var curIndex		= $current.index();
		var newIndex		= totalEmails-curIndex;
		
		var len = global.flags.length;
		var found = false;
		if ( len ) {
			for ( var i = 0; i < len; ++i ) {
				if ( global.flags[i].number == newIndex && global.flags[i].flag == "\\Flagged" ) {
					global.flags.splice(i, 1);
					found = true;
				}
			}
		}
		
		if ( !found )
			global.flags.push({"number": newIndex, "flag": "\\Flagged"});
		
		var color = (flagged.attr('fill') == '#ec9c13' ? '#1a1c1b' : '#ec9c13');
		flagged.attr('fill', color);
		
		$current.data('flagColor', color);
	});
	
	var parent = $(iconDel.node).parent().css({top:0,left:0});
	container.append(parent);
	
	return {
		iconDelete: iconDel,
		iconReply: reply,
		iconExpand: expand,
		iconFlag: flagged
	};
}
