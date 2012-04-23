<?php
	/**
	 * ajax_createconfig
	 * Creates an xml that describes the user's list of email accounts,
	 * passwords are hashed with md5.
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

	$accounts = json_decode($_GET['accounts']);
	
	$xml = new DOMDocument('1.0', 'UTF-8');
	$xml->formatOutput = true;
			
	$xmlroot = $xml->createElement('accounts');
	$xmlroot = $xml->appendChild($xmlroot);
	
	$length = count($accounts);
	for ( $i = 0; $i < $length; ++$i ) {
		$xmlAcc = $xmlroot->appendChild($xml->createElement('account'));
		$xmlAcc->appendChild($xml->createElement('type', $accounts[$i]->type));
		$xmlAcc->appendChild($xml->createElement('address', $accounts[$i]->addr));
		$xmlAcc->appendChild($xml->createElement('password', md5($accounts[$i]->ps)));
	}
	
	$result = $xml->save('../accounts.xml');
	if ( $result === FALSE ) {
		echo json_encode(array('error'=>'Failed to save the account information'));
	} else {
		echo json_encode(array('result'=>'Account information successfully saved'));
	}
?>