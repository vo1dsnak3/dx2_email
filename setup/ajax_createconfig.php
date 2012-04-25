<?php
	/**
	 * ajax_createconfig
	 * Creates an xml that describes the user's list of email accounts.
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

	$accounts = json_decode($_GET['accounts']);
	
	// Default is xml, database storage will be different
	
	$xml = new DOMDocument('1.0', 'UTF-8');
	$xml->formatOutput = true;
			
	$xmlroot = $xml->createElement('accounts');
	$xmlroot = $xml->appendChild($xmlroot);
	
	if ( isset($_GET['proxy']) && !empty($_GET['proxy']) ) {
		$xmlroot->appendChild($xml->createElement('proxy', $_GET['proxy']));
	}
	
	if ( $accounts ) {
		$length = count($accounts);
		for ( $i = 0; $i < $length; ++$i ) {
			$xmlAcc = $xmlroot->appendChild($xml->createElement('account'));
			$xmlAcc->appendChild($xml->createElement('type', $accounts[$i]->type));
			$xmlAcc->appendChild($xml->createElement('address', $accounts[$i]->addr));
			$xmlAcc->appendChild($xml->createElement('password', $accounts[$i]->ps));
		}
	} else {
		// QuickPHP currently does not implement json_decode properly as of version 1.14.0,
		// resort to manually parsing the json string.
		preg_match_all('/\\"type\\":\\"(HOTMAIL|GMAIL)\\",\\"addr\\":\\"([a-zA-Z0-9_\-]+@[a-zA-Z0-9_\-]+\.(com|ca))\\",\\"ps\\":\\"([a-zA-Z0-9]+)\\"\}/i', $_GET['accounts'], $matches);

		if ( ($length = count($matches[0])) != 0 ) {
			for ( $i = 0; $i < $length; ++$i ) {
				$xmlAcc = $xmlroot->appendChild($xml->createElement('account'));
				$xmlAcc->appendChild($xml->createElement('type', $matches[1][$i]->type));
				$xmlAcc->appendChild($xml->createElement('address', $matches[2][$i]->addr));
				$xmlAcc->appendChild($xml->createElement('password', $matches[4][$i]->ps));
			}
		}
	}
	
	$result = $xml->save('../accounts.xml');
	if ( $result === FALSE ) {
		echo json_encode(array('error'=>'Failed to save the account information'));
	} else {
		echo json_encode(array('result'=>'Account information successfully saved'));
	}
?>