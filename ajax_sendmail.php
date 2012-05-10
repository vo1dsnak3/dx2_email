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
	
	if ( !$userInfo || !$content ) {
		die(json_encode(array('error'=>'Failed receiving values from GET or failed json decoding')));
	}
	
	// Extract password
	$p 				= openAccXml(false);
	$dx_password	= false;
	for ( $i = 0, $l = count($p); $i < $l; ++$i ) {
		if ( $p[$i][XML_USER] == $userInfo->user ) {
			$dx_password = $p[$i][XML_PASS];
			break;
		}
	}

	if ( $dx_password === false ) {
		die (json_encode(array('error'=>'Failed to retrieve password')));
	}
	
	$attachments = false;
	if ( file_exists('attachments/') && isset($_GET['attachments']) ) {
		$a = json_decode($_GET['attachments']);
		
		for ( $i = 0, $a_length = count($a); $i < $a_length; ++$i ) {
			$attachments[] = 'attachments/'.$a[$i];
		}
	}
	
	$param 	= Email::get_SMTP_host($userInfo->server);
	$smtp 	= new Email($param['host'], $param['port'], $userInfo->user, $dx_password, true);
	$result = $smtp->SendEmail($content->to, $content->subject, $content->body, false, $attachments);
	
	if ( $result !== TRUE ) {
		echo json_encode(array('error'=>$smtp->getLastError()));
	} else {
		echo json_encode(array('result'=>'success'));
	}
?>