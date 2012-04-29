<?php
	/**
	 * DX_Imap_Online Class
	 * Used for making a connection to an imap service and processing the
	 * emails downloaded from the server.
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

	require_once 'include/class_DX_Imap.php';
	
	define('MULTIPART', 1);
	
	define('7BIT', 0);
	define('8BIT', 1);
	define('BINARY', 2);
	define('BASE64', 3);
	define('QUOTED_PRINTABLE', 4);
	define('OTHER', 5);

	class DX_Imap_Online extends DX_Imap
	{
		/**
		 * Constructor
		 * attempt to open an imap/pop3 stream to the user's mail server
		 *
		 * @param string $imap_server  	what imap service to connect to [DX_Imap_Online::getHostString]
		 * @param string $user   		the email address of the user
		 * @param string $password   	the password needed to connect to the email server
		 */
		public function __construct($imap_server, $user, $password)
		{
			$this->user			= $user;
			$this->xml_path 	= 'email/'.$user.'/';
		
			$this->checkFolders();
		
			if ( ($connectStr = $this->getHostString($imap_server)) !== false )
			{
				$this->inbox = imap_open($connectStr, $user, $password);
				
				if ( !$this->inbox )
					 throw new Exception('Cannot connect '.imap_last_error());
			}
			else
				throw new Exception('Invalid IMAP/POP3 Host');	
		}
		
		/**
		 * Destructor
		 * close the imap stream.
		 */
		public function __destruct()
		{
			if ( $this->inbox )
				imap_close($this->inbox);
		}
		
		/**
		 * search and retrieve emails from the server based on the search criteria,
		 * reverse sort by default.
		 *
		 * @param int $limit	User defined limit on how many messages to retrieve
		 *
		 * @return boolean		true if emails retrieved, false otherwise
		 */
		public function getEmails($limit)
		{
			// Retrieve a range of overviews
			$total = imap_num_msg($this->inbox);	
			
			// IMAP_FETCH_OVERVIEW RANGE STARTS AT ONE NOT ZERO !!!
			if ( $limit == 0 || ($total - $limit) < 1 )
				$start = 1;
			else
				$start = ($total - $limit) + 1;
				
			$this->emails = imap_fetch_overview($this->inbox, $start.':'.$total);
	
			if ( !$this->emails ) 
				throw new Exception('No Emails');
			
			return true;
		}
		
		public function processRefresh($enable_avatar=true) 
		{
			$total = count($this->emails) - 1;
			$list  = '';
			
			// Use a for loop instead of foreach to avoid limit and counter checks
			for ( $i = $total; $i >= 0; --$i )
			{
				$xmlfile  = $this->xml_path.substr($this->emails[$i]->message_id, 1, -1).'.xml';
				//var_dump($this->emails[$i]->message_id);
				// XML exists which means that the email from the server is not recent since last update
				if ( file_exists($xmlfile) ) 
					break;
				else
				{
					$xmlInfo = $this->overviewToObject($i, $enable_avatar);
					
					// If xml file of the email does not exist create an xml
					$xmlInfo->createXml();
					if ( !$xmlInfo->saveXml($xmlfile) )
						throw new Exception('createXml not called previously or cannot save xml');
				}

				$list .= $xmlInfo->generateList();
			}
			
			return $list;
		}
		
		/**
		 * iterate through the emails generating the markup needed to display
		 * the email list on the left hand side of the client. Also save the
		 * xml if it doesn't exist for future use.
		 *
		 * @param boolean $enable_avatar Whether to enable custom avatars
		 *
		 * @return string markup needed on the left hand side of the client
		 */
		public function processEmails($enable_avatar=true)
		{
			// Adaptive xml clean algorithm
			$xmlCache = glob($this->xml_path.'*.xml');
			$xmlCache = array_combine($xmlCache, $xmlCache);
		
			$total = count($this->emails) - 1;
			
			// Process the most recent message independently to display to the user
			$xmlfile = $this->xml_path.substr($this->emails[$total]->message_id, 1, -1).'.xml';
			
			// Found the message in xml cache use file first
			if ( file_exists($xmlfile) )
			{
				$xmlInfo = $this->xmlToObject($xmlfile, $this->emails[$total]->seen);
				
				if ( isset($xmlCache[$xmlfile]) )
					unset($xmlCache[$xmlfile]);
			}
			else
			{
				// Could not find file, decode and construct manually
				$xmlInfo = $this->overviewToObject($total, $enable_avatar);

				// Save to xml dir
				$xmlInfo->createXml();
				if ( !$xmlInfo->saveXml($xmlfile) ) 
					throw new Exception('createXml not called previously or cannot save xml');
			}

			$this->initial_data = $xmlInfo->getValueArray();
			$list 			    = $xmlInfo->generateList();
			
			// Use a for loop instead of foreach to avoid limit and counter checks
			for ( $i = $total - 1; $i >= 0; --$i )
			{
				$xmlfile  = $this->xml_path.substr($this->emails[$i]->message_id, 1, -1).'.xml';
				
				if ( file_exists($xmlfile) )
				{
					$xmlInfo = $this->xmlToObject($xmlfile, $this->emails[$i]->seen);
					
					if ( isset($xmlCache[$xmlfile]) )
						unset($xmlCache[$xmlfile]);
				}
				else
				{
					$xmlInfo = $this->overviewToObject($i, $enable_avatar);
					
					// If xml file of the email does not exist create an xml
					$xmlInfo->createXml();
					if ( !$xmlInfo->saveXml($xmlfile) )
						throw new Exception('createXml not called previously or cannot save xml');
				}

				$list 	.= $xmlInfo->generateList();
			}
			
			// Finish cleaning part
			// Loop through the array and clean up the remaining xml's
			foreach ( $xmlCache as $key => $value ) 
				unlink($key);

			return $list;
		}
		
		/**
		 * Set flags to notify the imap server whether to mark particular emails
		 * read, deleted, answered, drafted, etc.
		 *
		 * @param array $msgFlags	An array of objects holding a number and a flag string
		 * @param int	$limit		The email limit specified in configuration, used for adjustment
		 */
		public function setEmailFlags($msgFlags, $limit)
		{
			$total  = imap_num_msg($this->inbox);
			$adjust = 0;
			
			/* if total < limit -> no change to email numbers
			*
			*  if total == limit -> no change to email numbers
			*
			*  if total > limit -> we must make an adjustment otherwise the numbers
			* will be offset from the total
			*
			* eg. total = 17 limit = 15
			*	email numbers = 15 14 13 12 11 10
			*	actual number = 17 16 15 14 13 12
			*	adjustment    = 2
			*/
			if ( $total > $limit )
				$adjust = $total - $limit;
				
			$seenSequence = '';
			$delSequence  = '';
			$flagSequence = '';
				
			$length = count($msgFlags);
			
			/* Iterate through each object and concatenate which email number
			* needs to be flagged
			*/
			for ( $i = 0; $i < $length; ++$i )
			{
				$number = ((int)$msgFlags[$i]->number + $adjust).',';
			
				switch ( $msgFlags[$i]->flag )
				{
					case "\\Seen":
						$seenSequence .= $number;
						break;
						
					case "\\Deleted":
						$delSequence  .= $number;
						break;
						
					case "\\Flagged":
						$flagSequence .= $number;
						break;
						
					default:
						continue;
				}
			}
			
			if ( !empty($seenSequence) )
			{
				// remove comma at the end
				$seenSequence = substr($seenSequence, 0, -1);
				imap_setflag_full($this->inbox, $seenSequence, "\\Seen");
			}
			
			if ( !empty($flagSequence) )
			{
				$flagSequence = substr($flagSequence, 0, -1);
				imap_setflag_full($this->inbox, $flagSequence, "\\Flagged");
			}
			
			if ( !empty($delSequence) )
			{
				$delSequence = substr($delSequence, 0, -1);
				imap_setflag_full($this->inbox, $delSequence, "\\Deleted");
				imap_expunge($this->inbox);
			}
		}
		
		/*================================================================================================*/
		
		/**
		 * returns the correct string needed to open the imap stream to the
		 * correct email service.
		 *
		 * @param string $imap_server	the email service to connect to
		 *
		 * @return string string containing the correct connection settings and port number
		 */
		private function getHostString($imap_server, $mailbox='INBOX') 
		{
			switch($imap_server) 
			{
				case 'HOTMAIL':
					$this->serverType = 'POP3';
					return '{65.54.62.215:995/pop3/ssl/novalidate-cert}'.$mailbox;
				case 'GMAIL':
					$this->serverType = 'IMAP';
					return '{209.85.225.108:993/imap/ssl/novalidate-cert}'.$mailbox;
				default:
					return false;
			}
		}
		
		/**
		 * Decode the body of the email message if appropriate through the
		 * encoding type from the structure. Do not need to decode 7/8 bit strings.
		 *
		 * @param string $str	The string to decode
		 * @param int $encoding	The encoding type from imap_fetchstructure
		 *
		 * @return string A string properly decoded.
		 */
		private function decodeBody($str, $encoding) 
		{
			switch($encoding) 
			{
				case BASE64:
					return imap_base64($str);
				case QUOTED_PRINTABLE:
					return quoted_printable_decode($str);
				default:
					return $str;
			}
		}
		
		/**
		 * Recursively search the structure object looking for a supplied type.
		 * When the type is found, return the object and at the same time
		 * create the part number sequence needed for imap_fetchbody.
		 *
		 * @param array $parts		An array of part objects
		 * @param string &$partnum	A string describing the depth level of the needed part
		 * @param string $type		The email subtype needed
		 *
		 * @return mixed			If found return the part object, otherwise return false for further recursion
		 */
		private function getPart($parts, &$partnum, $type='HTML')
		{
			// Recursive
			$numParts = count($parts);
			
			// Start analyzing part array
			for ( $i = 0; $i < $numParts; ++$i )
			{
				// Found part we need
				if ( $parts[$i]->subtype == $type )
				{
					if ( empty($partnum) )
						$partnum = $i + 1;
					else
						$partnum .= '.'.($i+1);
						
					// Stop recursion and return back the object we need
					return $parts[$i];
				}
				// Not the part we need but the object has another part array
				else if ( isset($parts[$i]->parts) )
				{
					if ( empty($partnum) )
						$partnum = $i + 1;
					else
						$partnum .= '.'.($i+1);
				
					// Find out what we get from analyzing another 
					$result = $this->getPart($parts[$i]->parts, $partnum);
				
					if ( $result === false )
						// We hit a dead end so we need to remove the last 2 characters
						$partnum = substr($partnum, 0, -2);
					else
						// Return back the correct object through recursion
						return $result;
				}
			}
			
			// Found nothing, reached dead end
			return false;
		}
		
		/**
		 * Search an array of parameters from an email part object and 
		 * return a proper charset for further conversion
		 *
		 * @param array $parameters		An array of parameters
		 *
		 * @return mixed	A string describing the charset in uppercase otherwise false
		 */
		private function getCharset($parameters)
		{
			$numParam = count($parameters);
			
			for ( $i = 0; $i < $numParam; ++$i )
			{
				if ( $parameters[$i]->attribute == 'CHARSET' )
				{
					$charset = $parameters[$i]->value;
					
					if ( $charset == 'gb2312' )
						$charset = 'EUC-CN';
					
					return strtoupper($charset);
				}
			}
			
			return false;
		}
		
		/**
		 * create a XmlEmailInfo object and return it
		 *
		 * @param int	  $overview_index	an index into the email array of overview objects
		 * @param boolean $decode			if needing to decode the message
		 * @param boolean $enable			whether to enable custom avatars
		 *
		 * @return object A XmlEmailInfo object that contains email information
		 */
		private function overviewToObject($overview_index, $enable)
		{
			$apath 	  = ($enable ? $this->getAvatar($this->emails[$overview_index]->from) : DEFAULT_AV);
			$attach	  = null;
			$msgno    = $this->emails[$overview_index]->msgno;
			$struct	  = imap_fetchstructure($this->inbox, $msgno);

			// The email is MULTIPART, recursively decode the contents with DX_Imap_Online::getParts
			if ( /*isset($struct->parts)*/ $struct->type == MULTIPART ) 
			{
				// IMPORTANT: specifies the exact part we need in format (eg 1.2)
				$partSec				= '';
				
				// The exact object we need extracted from getPart
				$partObj 				= $this->getPart($struct->parts, $partSec);
				
				// In the event an HTML part is not found, search for a plain text portion
				if ( $partObj == false ) {
					$partSec = '';
					$partObj = $this->getPart($struct->parts, $partSec, 'PLAIN');
				}
				
				$content_transfer_type	= $partObj->encoding;
				$charset				= $this->getCharset($partObj->parameters);
				
				// FT_PEEK will not work with POP3 servers
				$message = imap_fetchbody($this->inbox, $msgno, $partSec, FT_PEEK);
				$message = $this->decodeBody($message, $content_transfer_type);
				
				if ( $charset != 'UTF-8' )
					$message = iconv($charset, 'UTF-8//IGNORE', $message);
				
				$attach  = Attachment::createFromPart($this->inbox, $msgno, $struct->parts);
			} else { 
				// not MULTIPART
				$message = imap_body($this->inbox, $msgno);

				// Even though not MULTIPART, sometimes the text is encoded
				if ( isset($struct->encoding) ) {
					$content_transfer_type = $struct->encoding;

					$message = $this->decodeBody($message, $content_transfer_type);
					
					$charset = mb_detect_encoding($message, 'ISO-8859-1, UTF-8');

					if ( $charset != 'UTF-8' )
						$message = iconv($charset, 'UTF-8//IGNORE', $message);
				}
			}
					
			$xmlInfo  = XmlEmailInfo::constructFromOverview($this->serverType, $this->emails[$overview_index], $message, $apath, $attach, true);
	
			return $xmlInfo;
		}
		
		/**
		 * Create an XmlEmailInfo object from an existing xml
		 *
		 * @param string $xmlpath path to an existing xml file
		 * @param int $seen whether or not the message is unread
		 *
		 * @return object an XmlEmailInfo object
		 */
		private function xmlToObject($xmlpath, $seen)
		{
			if ( $email = new SimpleXMLElement($xmlpath, 0, true) ) 
			{
				/* Read by default for pop3 and existing xml in cache.
				* For IMAP even though the client might have downloaded the email into xml cache
				* the flag for being read if it did, was not sent to the imap server previously
				*/
				$unread	= false;
				$attach = null;
		
				if ( $this->serverType == 'IMAP' )
					$unread	= $seen == 0;
					
				if ( $email->attachment->filename && $email->attachment->data )
					$attach = new Attachment($email->attachment->filename, $email->attachment->type, $email->attachment->data);
			
				return new XmlEmailInfo($email->date, $email->from, $email->to, $email->subject, $this->getAvatar($email->from), $email->body, $email->id, $unread, $attach);
			}
			else
				throw new Exception('Cannot open the xml at: '.$xmlpath);
		}
		
		/*================================================================================================*/
	
		/**
		 * imap stream
		 *
		 * @var object
		 */
		private $inbox;
		
		/**
		 * Whether server is POP3 or IMAP
		 *
		 * @var string
		 */
		private $serverType;
		
		/**
		 * array of email overviews
		 *
		 * @var array
		 */
		private $emails;
		
		/**
		 * path to the xml
		 *
		 * @var string
		 */
		private $xml_path;
	}
?>