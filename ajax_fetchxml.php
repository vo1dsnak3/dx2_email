<?php
	/**
	 * Fetch a single xml from the xml path and return as
	 * ajax result.
	 *
	 * PHP version 5
	 *
	 * @category  PHP
	 * @package   DX2
	 * @author    Alexander Ip <voidsnake@users.sourceforge.net>
	 * @copyright 2012 Alexander Ip
	 * @license   http://opensource.org/licenses/MIT MIT
	 * @version   1.11 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 */

	define('XML_ID', 'xmlname');
	define('DX_USER', 'user');
	
	$id   = ( isset($_GET[XML_ID]) ? $_GET[XML_ID] : '' );
	$user = ( isset($_GET[DX_USER]) ? $_GET[DX_USER] : '');
	
	$xml_path = 'email/'.$user.'/'.$id.'.xml';
	if ( file_exists($xml_path) ) {
		if ( $email = new SimpleXMLElement($xml_path, 0, true) ) {
		
			$from = htmlspecialchars(sprintf("%s", $email->from));
			$to   = $email->to;
			$body = sprintf("%s", $email->body);
			$subj = sprintf("%s", $email->subject);
			$av	  = htmlspecialchars(sprintf("%s", $email->avatar));
			$date = sprintf("%s", $email->date);
			
			// Use extension for display instead of raw type
			$fn   = sprintf("%s", $email->attachment->filename);
			if ( !empty($fn) ) {
				$pos  = strpos($fn, '.');
				if ( $pos !== FALSE ) {
					$fn = substr($fn, $pos + 1);
				} else {
					$fn = '?';
				}
			}

			if ( preg_match('/(\<|&lt;)(html|span|table)(\>|&gt;)(&#13;)?/i', $body) == 0 ) {
				$body = nl2br($body);
			}

			echo json_encode(array('from'=>$from, 'to'=>$to, 'body'=>$body, 'date'=>$date, 'subject'=>$subj, 'avatar'=>$av, 'attype'=>$fn));
		}
	} else {
		echo json_encode(array('error'=>'Cannot find: '.$xml_path));
	}
?>