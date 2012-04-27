<?php
	/**
	 * ajax_fileattachment.php
	 * This php script is used to process the file uploads sent through
	 * an ajax call.
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

	$attachment_path 	= 'attachments/';
	
	if ( !file_exists($attachment_path) ) {
		mkdir($attachment_path);
	}

	$len = count($_FILES['attachments']['name']);
	
	for ( $i = 0; $i < $len; ++$i ) {
		$real_name = $_FILES['attachments']['name'][$i];
		$temp_name = $_FILES['attachments']['tmp_name'][$i];
		move_uploaded_file($temp_name, $attachment_path.$real_name);
	}

	echo 'File Attached';
?>