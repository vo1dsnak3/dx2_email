<?php
	/**
	 * ajax_fetchaccounts
	 * Get a list of email accounts the user plans to use with the email
	 * client.
	 *
	 * PHP version 5
	 *
	 * @category  PHP
	 * @package   DX2
	 * @author    Alexander Ip <voidsnake@users.sourceforge.net>
	 * @copyright 2012 Alexander Ip
	 * @license   http://opensource.org/licenses/MIT MIT
	 * @version   1.12 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 * @link	  https://github.com/vo1dsnak3/dx2_email/
	 */

	include_once 'include/func_openAccXml.php';
	
	$result = openAccXml();
	
	if ( $result !== FALSE ) {
		echo json_encode($result);
	} else {
		echo json_encode(array('error'=>'Please run the DX Client setup'));
	}
?>