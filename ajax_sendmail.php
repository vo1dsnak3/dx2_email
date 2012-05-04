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
	 * @version   1.14 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 * @link	  https://github.com/vo1dsnak3/dx2_email/
	 */
	 
	require_once 'include/class_Email.php';
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
	
	$param = getHostParams($userInfo->server);
	
	$attachments = false;
	if ( file_exists('attachments/') && isset($_GET['attachments']) ) {
		$a = json_decode($_GET['attachments']);
		$a_length = count($a);
		
		for ( $i = 0; $i < $a_length; ++$i ) {
			$a_path = 'attachments/'.$a[$i];
			$attachments[] = $a_path;
		}
	}
	
	$smtp = new Email($param['host'], $param['port'], $userInfo->user, $dx_password, true);
	$result = $smtp->SendEmail($content->to, $content->subject, $content->body, false, $attachments);
	
	if ( $result !== TRUE ) {
		echo json_encode(array('error'=>$smtp->getLastError()));
	} else {
		echo json_encode(array('result'=>'success'));
	}
?>