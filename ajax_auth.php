<?php
	/**
	 * ajax_auth
	 * Simple authentication through ajax
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

	// For multiple users or more security put the password in a DB instead of the define
	include_once 'include/func_openAccXml.php';
	
	define('ACCLIST', 0);
	define('PROXY', 1);
	
	// Determine if the user enabled proxy passwords
	$proxy 	= ( isset($_GET['proxy']) && $_GET['proxy'] == 'true' ? true : false );
	$result	= false;
	
	// Ensure values are set
	if ( !isset($_GET['pass']) || !isset($_GET['address']) ) {
		die('Access Denied');
	}
	
	// Data
	$entry		= $_GET['pass'];
	$address	= $_GET['address'];
	$info		= openAccXml();
	
	// Password checking, keep note of the multidimensional array
	if ( $proxy && isset($info[PROXY][0]) ) {
		$password 	= $info[PROXY][0];
		$result		= $entry == $password;
	} else {
		$length = count($info[ACCLIST]);
		
		for ( $i = 0; $i < $length; ++$i ) {
			if ( $entry == $info[ACCLIST][$i][2] ) {
				$result = true;
				break;
			}
		}
	}
	
	echo ( $result ? 'Access Granted' : 'Access Denied' );
	
	/*
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
	*/
?>