<?php
	/**
	 * Send a simple reply to a recipient, using pear mail.
	 *
	 * PHP version 5
	 *
	 * @category  PHP
	 * @package   DX2
	 * @author    Alexander Ip <voidsnake@users.sourceforge.net>
	 * @copyright 2012 Alexander Ip
	 * @license   http://opensource.org/licenses/MIT MIT
	 * @version   1.10 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 */

	require_once 'include/Mail.php';
	require_once 'include/mime.php';
	require_once 'define_email.php';
	
	$userInfo  	= ( isset($_GET['userinfo']) ? json_decode($_GET['userinfo']) : false );
	$content	= ( isset($_GET['content']) ? json_decode($_GET['content']) : false );
	
	if ( !$userInfo || !$content )
		die(json_encode(array('error'=>'Failed receiving values from GET or failed json decoding')));
	
	function getHostParams($host) {
		switch ( $host ) {
			case 'HOTMAIL':
			$params["host"] = 'smtp.live.com';
			$params["port"] = 587;
			return $params;
			
			case 'GMAIL':
			$params["host"] = 'smtp.gmail.com';
			$params["port"] = 465;
			return $params;
			
			case 'YAHOO':
			$params["host"] = 'smtp.mail.yahoo.com';
			$params["port"] = 995;
			return $params;
			
			default:
				die(json_encode(array('error'=>$host.' Not a valid host')));
		}
	}
	
	$params 			= getHostParams($userInfo->server);
	$params["username"] = $userInfo->user;
	$params["password"] = DX_PASSWORD;
	$params["auth"] 	= true;
	
	$mailObj = &Mail::factory('smtp', $params);
	
	$recipients = $content->to;

	$headers['From']    = $userInfo->user;
	$headers['To']      = $content->to;
	$headers['Subject'] = $content->subject;

	// Setup MIME params
	$mimeparams['eol'] 				= "\n";
    $mimeparams['text_encoding'] 	= "8bit";
    $mimeparams['html_encoding'] 	= "8bit";
    $mimeparams['head_charset']		= "UTF-8";
    $mimeparams['text_charset']		= "UTF-8";
    $mimeparams['html_charset']		= "UTF-8";
	$mime 							= new Mail_mime($mimeparams);
	
	// Setup the content
	$body 		= $content->body;
	$htmlbody	= "<html><head><style>body.dxmsg{font-size:11px;font-family:'Segoe UI', Verdana, Arial;}</style></head><body class='dxmsg'>".$body."</body></html>";
	
	// Do mime conversion on content
	$mime->setTXTBody($body);
	$mime->setHTMLBody($htmlbody);
	// Set attachments here if any
	
	// Get mime compatible content
	$mimeBody = $mime->get();
	$mimeHead = $mime->headers($headers);
	
	$result = $mailObj->send($recipients, $mimeHead, $mimeBody);
	
	if ( $result !== TRUE ) {
		die(json_encode(array('error'=>$result->getMessage())));
	} else {
		echo json_encode(array('result'=>'success'));
	}
?>