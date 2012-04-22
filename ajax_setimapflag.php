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
	 * @version   1.06 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 */

	require_once 'define_email.php';
	require_once 'include/class_DX_Imap_Online.php';
	
	$imapFlags = ( isset($_GET['imapflag']) ? json_decode($_GET['imapflag']) : false );
	if ( !$imapFlags )
		die ( json_encode(array('result'=>false, 'error'=>'Could not retreive imap flags')) );
	
	$userInfo  = ( isset($_GET['userinfo']) ? json_decode($_GET['userinfo']) : false );
	if ( !$userInfo )
		die ( json_encode(array('result'=>false, 'error'=>'Could not retreive server info')) );
		
	$xmls = ( isset($_GET['dArray']) ? json_decode($_GET['dArray']) : false );
	
	try {
		$dxImap = new DX_Imap_Online($userInfo->server, $userInfo->user, DX_PASSWORD);
		$dxImap->setEmailFlags($imapFlags, $userInfo->limit);
		
		// Remove email from xml directory
		$length = count($xmls);
		for ( $i = 0; $i < $length; ++$i ) {
			$path = 'email/'.$userInfo->user.'/'.$xmls[$i].'.xml';
			if ( file_exists($path) )
				unlink($path);
		}
	} catch ( Exception $e ) {
		die ( json_encode(array('result'=>false, 'error'=>$e->getMessage())) );
	}
		
	echo json_encode(array('result'=>true));

?>