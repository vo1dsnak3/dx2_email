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
	 * @version   1.13 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 * @link	  https://github.com/vo1dsnak3/dx2_email/
	 */

	require_once 'include/Mail.php';
	require_once 'include/mime.php';
	require_once 'include/func_openAccXml.php';
	
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
	
	// Extract password
	$p 				= openAccXml(false);
	$l 				= count($p);
	$dx_password	= false;
	for ( $i = 0; $i < $l; ++$i ) {
		if ( $p[$i][1] == $userInfo->user ) {
			$dx_password = $p[$i][2];
			break;
		}
	}

	if ( !$dx_password ) {
		die (json_encode(array('error'=>'Failed to retrieve password')));
	}
	
	$params 			= getHostParams($userInfo->server);
	$params["username"] = $userInfo->user;
	$params["password"] = $dx_password;
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
	if ( file_exists('attachments/') && isset($_GET['attachments']) ) {
		$a = json_decode($_GET['attachments']);
		$a_length = count($a);
		
		for ( $i = 0; $i < $a_length; ++$i ) {
		
			$a_path = 'attachments/'.$a[$i];

			if ( file_exists($a_path) ) {
				$a_result = $mime->addAttachment($a_path);
			
				if ( $a_result !== TRUE ) {
					die(json_encode(array('error'=>$a_result->getMessage())));
				}
			}
		}
	}
	
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