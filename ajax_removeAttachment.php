<?php
	/**
	 * ajax_removeAttachment.php
	 * Remove an attachment from the attachment folder.
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

	if ( isset($_GET['attachments']) ) {
		$a 			= json_decode($_GET['attachments']);
		$a_length 	= count($a);
		
		for ( $i = 0; $i < $a_length; ++$i ) {
			$target = 'attachments/'.$a[$i];
		
			if ( file_exists($target) ) {
				unlink($target);
			}
		}
	}
?>