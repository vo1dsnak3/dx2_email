<?php
	/**
	 * Initiate downloading for email attachments
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

	$id 	= ( isset($_GET['id']) ? $_GET['id'] : false );
	$user 	= ( isset($_GET['user']) ? $_GET['user'] : false );
	
	if ( $id === false || $user === false ) {
		die('ERROR: Email id or User address not set');
	}
	
	$id = str_replace(" ", "+", $id);

	include_once 'include/func_mimetype.php';
	
	$xml_path = 'email/'.$user.'/'.$id.'.xml';
	if ( file_exists($xml_path) ) {
		if ( $email = new SimpleXMLElement($xml_path, 0, true) ) {
			
			$filename 	= $email->attachment->filename;
			$atype 		= getContentType($email->attachment->type);
			$data 		= $email->attachment->data;

			if ( $atype != 'text' )
				$data = base64_decode($data);
			
			header('Content-Description: File Transfer');
			header('Content-Type: '.$atype.'/'.$email->attachment->type);
			header('Content-Disposition: attachment; filename="'.$filename.'"');
			header('Content-Transfer-Encoding: binary');
			flush();
			
			echo $data;
			exit;
		}
	} else {
		die('ERROR: XML File "'.$xml_path.'" not found or could not open');
	}
?>