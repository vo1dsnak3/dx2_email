<?php
	require_once 'define_email.php';
	require_once 'include/class_DX_Imap_Online.php';
	
	$imapFlags = ( isset($_GET['imapflag']) ? json_decode($_GET['imapflag']) : false );
	//if ( !$imapFlags )
	//	die ( json_encode(array('Error'=>'Could not retreive imap flags')) );
	
	$userInfo  = ( isset($_GET['userinfo']) ? json_decode($_GET['userinfo']) : false );
	if ( !$userInfo )
		die ( json_encode(array('Error'=>'Could not retreive server info')) );
		
	$xmls = ( isset($_GET['dArray']) ? json_decode($_GET['dArray']) : false );
		
	try {
		$dxImap = new DX_Imap_Online($userInfo->server, $userInfo->user, DX_PASSWORD);
		
		if ( !empty($imapFlags) ) {
			$dxImap->setEmailFlags($imapFlags, $userInfo->limit);
			
			// Remove email from xml directory
			$length = count($xmls);
			for ( $i = 0; $i < $length; ++$i ) {
				$path = 'email/'.$userInfo->user.'/'.$xmls[$i].'.xml';
				if ( file_exists($path) )
					unlink($path);
			}
		}
		
		if ( $dxImap->getEmails($userInfo->limit) ) {
			$list = $dxImap->processRefresh($userInfo->enable_avatar);
			
			echo json_encode(array('listdata'=>$list));
		} 
	} catch ( Exception $e ) {
		die ( json_encode(array('Error'=>$e->getMessage())) );
	}
?>