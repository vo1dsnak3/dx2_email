<?php
	/**
	 * Simple authentication through ajax
	 *
	 * PHP version 5
	 *
	 * @category  PHP
	 * @package   DX2
	 * @author    Alexander Ip <voidsnake@users.sourceforge.net>
	 * @copyright 2012 Alexander Ip
	 * @license   http://opensource.org/licenses/MIT MIT
	 * @version   1.0 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 */

	// For multiple users or more security put the password in a DB instead of the define
	include_once 'define_email.php';
	
	define('PASS', 'pass');
	define('MAX_PASS', 64);
	
	$proxy = ( isset($_GET['proxy']) && $_GET['proxy'] == 'true' ? PROXY_PASSWORD : DX_PASSWORD );
	
	$real_password = $proxy;
	
	$entry = '';
	
	if ( !isset($_GET[PASS]) || $_GET[PASS] > MAX_PASS ) {
		die('Access Denied');
	}
	
	$entry = $_GET[PASS];

	echo ( $entry == $real_password ? 'Access Granted' : 'Access Denied' );

?>