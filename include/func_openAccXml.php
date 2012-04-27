<?php
	/**
	 * func_openAccXml
	 * Open's the account xml and returns the array either to be
	 * used for echoed.
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

	function openAccXml($getProxy=true) {
		$accountPath 	= 'accounts.xml';

		if ( file_exists($accountPath) ) {
			$total	  = array();
			$list	  = array();
			$accounts = new SimpleXMLElement($accountPath, 0, true);
			
			foreach ( $accounts->account as $a ) {
				$list[] = array(sprintf("%s", $a->type), sprintf("%s", $a->address), sprintf("%s", $a->password));
			}
			
			if ( $getProxy ) {
				$total[] = $list;
			
				if ( $accounts->proxy ) {
					$total[] = array(sprintf("%s", $accounts->proxy));
				}
				
				return $total;
			}
			
			return $list;
		}
		
		return false;
	}
?>