<?php	
	/**
	 * Process the emails and send result back as ajax result
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

	require_once 'include/class_XmlEmailInfo.php';
	require_once 'include/class_DX_Imap_Online.php';
	require_once 'include/class_DX_Imap_Offline.php';
	require_once 'include/func_openAccXml.php';
	 
	//Options
	define('OPT_AUGMENT', 	'augment_email');
	define('OPT_OFFLINE', 	'offline_mode');
	define('OPT_UNREAD', 	'unread_only');
	define('OPT_LIMIT', 	'limit');
	define('OPT_XMLLIM',	'xml_limit');
	define('OPT_SERVER', 	'server');
	define('OPT_USER', 		'user');
	
	define('DX_SERVER', 	( isset($_GET[OPT_SERVER]) 	? $_GET[OPT_SERVER] : '' ));
	define('DX_USER', 		( isset($_GET[OPT_USER]) 	? $_GET[OPT_USER] 	: '' ));
	
	$augment		= ( isset($_GET[OPT_AUGMENT]) 	&& $_GET[OPT_AUGMENT] == 'true' ? true : false );
	$offline		= ( isset($_GET[OPT_OFFLINE]) 	&& $_GET[OPT_OFFLINE] == 'true' ? true : false );
	$limit			= ( isset($_GET[OPT_LIMIT]) ? $_GET[OPT_LIMIT] : 0 );
	$xml_limit		= ( isset($_GET[OPT_XMLLIM]) ? $_GET[OPT_XMLLIM] : 0 );
	
	$infoAcc		= openAccXml();
	$length 		= count($infoAcc[0]);
	$pass			= '';
		
	for ( $i = 0; $i < $length; ++$i ) {
		if ( DX_USER == $infoAcc[0][$i][1] ) {
			$pass = $infoAcc[0][$i][2];
			break;
		}
	}

	/*==========================================================================================*/
	
	$list   = '';
	$ver	= 'DX2 VISUAL FRAMEWORK 1.13';
	$data	= array('From'=>'From', 'To'=>'To', 'Avatar'=>DEFAULT_AV, 'Attach'=>false, 'date'=>'');
	
	try {
		// Create object depending on whether we are in offline mode
		$dx_imap = ( !$offline ? new DX_Imap_Online(DX_SERVER, DX_USER, $pass) : new DX_Imap_Offline(DX_USER, $xml_limit) );
		
		if ( $dx_imap->getEmails($limit) ) {
			$list = $dx_imap->processEmails();
			$data = $dx_imap->getFirstData();
		} 
	} catch (Exception $e) {
		$data['Subject'] 	= 'DX CLIENT ERROR';
		$data['Body'] 		= $e->getMessage();
	}
	
	// Extra formatting for non-html email messages
	if ( preg_match('/(\<|&lt;)(html|span|table)(\>|&gt;)(&#13;)?/i', $data['Body']) == 0 ) {
		$data['Body'] = nl2br($data['Body']);
	}

	$attach_html = '';
	if ( $augment ) {
		$hasAttach = ( $data['Attach'] != null ? true : false );
	
		$attach_html = '
		<div id="control_bar">
			
		</div>
		<p></p>
		<div id="attach_bar">
			<div id="paperclip_box">
				
			</div>
			<div id="paperclip_type">'.($hasAttach ? ':'.$data['Attach']->getExtension() : '').'</div>
		</div>';
	}

$main = '
<div id="email_full_container">

	<div id="email_list_container" class="drag">
		<div id="email_list_titlebar" class="top-gradient">
			<div id="email_list_orbcont">
			
			</div>
			<div id="unread_counter_container">
			
			</div>
		</div>
		<div id="email_list_header">
			<div id="mail_icon">
				
			</div>
			<div id="mail_header">
				EMAILS
			</div>
		</div>
		<div id="email_list_actual">
			
		</div>
		<div id="email_list_footer">
			<div id="footer_frm">
				'.$ver.'
			</div>
			<div id="stripebox2">
			</div>
			<div id="email_counter">
				1/1
			</div>
			
		</div>
	</div>
	
	<div id="email_reader_container" class="drag">
		<div id="email_reader_titlebar" class="top-gradient">
			<div id="email_reader_orbcont">
				
			</div>
		</div>
		<div id="email_reader_content">
			<div id="from">
				<div id="from_pos">
					<span style="color: #d5a11a; padding-right: 1.8%;">FROM</span>
					<span id="from_text">'.htmlspecialchars($data['From']).'</span>
				</div>
			</div>
			<div id="to">
				<div id="to_pos">
					<span style="color: #fef6e1; padding-right: 1.7%;">TO</span>
					<span id="to_text">'.$data['To'].'</span>
				</div>
			</div>
			<div id="content_container">
				<div id="content_avatar_cont">
					<img id="content_avatar" src="'.$data['Avatar'].'" />
					'.$attach_html.'
				</div>
				<div id="message">
					<span class="subject">'.$data['Subject'].'</span><br/>
					<span class="date">'.$data['date'].'</span>
					<p></p>
				</div>
			</div>
		</div>
		<div id="email_reader_footer">
			<div id="email_reader_footer_txt">
				'.$ver.'
			</div>
			<div id="stripebox3">
			
			</div>
		</div>
	</div>
	
</div>';

echo json_encode(array('main'=>$main, 'list'=>$list, 'body'=>html_entity_decode($data['Body'], ENT_COMPAT | ENT_XML1)));
?>