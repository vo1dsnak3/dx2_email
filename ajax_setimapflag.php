<?php
	/**
	 * ajax_setimapflag
	 * Receive json objects containing an array of flag objects that describe
	 * what email number needs to be flagged. Connect to the imap server
	 * and mark the emails seen or deleted.
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

	require_once 'include/func_openAccXml.php';
	require_once 'include/class_DX_Imap_Online.php';
	
	$imapFlags = ( isset($_GET['imapflag']) ? json_decode($_GET['imapflag']) : false );
	$userInfo  = ( isset($_GET['userinfo']) ? json_decode($_GET['userinfo']) : false );
	
	if ( !$imapFlags || $imapFlags == null ) {
		die ( json_encode(array('error'=>'Could not retreive imap flags')) );
	}

	if ( !$userInfo || $userInfo == null ) {
		die ( json_encode(array('error'=>'Could not retreive server info')) );
	}
	
	// Prevent the user from using relative folder names especially '..'
	if ( preg_match('/.*\.\..*/', $userInfo->user) ) {
		die ( json_encode(array('error'=>'Invalid username: '.$userInfo->user)) );
	}
		
	$xmls = ( isset($_GET['dArray']) ? json_decode($_GET['dArray']) : false );
	
	if ( $xmls == null ) {
		die ( json_encode(array('error'=>'List of xmls could not be decoded via json')) );
	}

	if ( ($password = find_password($userInfo->user)) !== false ) {
		try {
			$dxImap = new DX_Imap_Online($userInfo->server, $userInfo->user, $password);
			$dxImap->setEmailFlags($imapFlags, $userInfo->limit);
			
			// Remove email from xml directory
			for ( $i = 0, $length = count($xmls); $i < $length; ++$i ) {
				$path = 'email/'.$userInfo->user.'/'.$xmls[$i].'.xml';
				
				if ( file_exists($path) )
					unlink($path);
			}
			
			echo json_encode(array('result'=>true));
		} catch ( Exception $e ) {
			die ( json_encode(array('error'=>$e->getMessage())) );
		}
	}
		
	echo json_encode(array('error'=>'Password could not be used'));
?>