<?php
	/**
	 * XmlEmailInfo Class
	 * An object that will hold information regarding the email message,
	 * also exposes methods used to save xml and sort them.
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

	require_once 'class_Attachment.php';
	 
	define('YEAR', 3);
	define('MONTH', 2);
	define('DAY', 1);
	define('TIME', 4);

	class XmlEmailInfo 
	{
		/**
		 * Constructor for the class, uses the email information as the values
		 *
		 * @param string $date 		Emails received date
		 * @param string $from		Who the email was from
		 * @param string $to		Who the email is addressed to
		 * @param string $subject	What the email is about
		 * @param string $avatar	The path to the correct avatar
		 * @param string $body		The email's message
		 * @param string $mid		The email's unique id
		 * @param boolean $unread	Whether the email is unread
		 * @param object $attachment An attachment object
		 */
		public function __construct($date, $from, $to, $subject, $avatar, $body, $mid, $unread=false, $attachment=null) 
		{
			$this->mid			= $mid;
			$this->date 		= $date;
			$this->from 		= $from;
			$this->to	 		= $to;
			$this->subject  	= $subject;
			$this->avatar   	= $avatar;
			$this->body			= $body;
			$this->unread		= $unread;
			$this->attachment 	= $attachment;
		}
		
		/**
		 * A constructor that constructs the xmlEmailInfo object from imap information
		 *
		 * @param string $type 		String specifying what kind of email server is used
		 * @param object $overview	An overview object with necessary information
		 * @param string $message	The email's message
		 * @param string $apath		The path to the custom avatar or default
		 * @param object $attachment An attachment object if available
		 *
		 * @return object			A XmlEmailInfo object
		 */
		public static function constructFromOverview($type, $overview, $message, $apath, $attachment=null, $unread=false)
		{
			$id   		= substr($overview->message_id, 1, -1);
			$date		= $overview->date;
			$from 		= $overview->from;
			$to			= $overview->to;
			
			//$unread		= false;
			
			if ( $type == 'IMAP' )
				$unread		= $overview->seen == 0;
			
			$subject = $overview->subject;
			
			// Sometimes the subject from the mime header gets encoded in another charset
			if ( !empty($subject) ) {
				$subjectObj = imap_mime_header_decode($subject);
				$subjSet	= $subjectObj[0]->charset;
				$subject	= $subjectObj[0]->text;
				
				// Always aim for UTF-8
				if ( $subjSet != 'default' && $subjSet != 'UTF-8' && $subjSet != 'ISO-8859-1' )
					$subject = iconv($subjSet, 'UTF-8//IGNORE', $subject);
			}
			
			$className  = __CLASS__;
			
			return new $className($date, $from, $to, htmlspecialchars($subject, ENT_DISALLOWED | ENT_COMPAT | ENT_XML1), 
			$apath, htmlspecialchars($message, ENT_DISALLOWED | ENT_COMPAT | ENT_XML1), $id, $unread, $attachment);
		}
		
		/**
		 * A custom date sorting algorithm that sorts key dates, currently
		 * sorts by reverse order, if sorting normally then reverse the -1 : 1 to
		 * 1 : -1
		 *
		 * @param string $a 	The first date string
		 * @param string $b		The second date string
		 *
		 * @return int 	An integer that determines which arguement is larger
		 */
		public static function dateSort($a, $b) 
		{
			$d1 = explode(' ', $a);
			$d2 = explode(' ', $b);
			
			if ( $d1[YEAR] == $d2[YEAR] ) {
				if ( $d1[MONTH] == $d2[MONTH] ) {
					if ( $d1[DAY] == $d2[DAY] ) {
						if ( $d1[TIME] == $d2[TIME] ) {
							return 0;
						}
						
						return ( $d1[TIME] > $d2[TIME] ) ? -1 : 1;
					}
					
					return ( $d1[DAY] > $d2[DAY] ) ? -1 : 1;
				}
				
				return ( XmlEmailInfo::interpMonth($d1[MONTH]) > XmlEmailInfo::interpMonth($d2[MONTH]) ) ? -1 : 1;
			} 
			
			return ( $d1[YEAR] > $d2[YEAR] ) ? -1 : 1;
		}
		
		/**
		 * Convert the month segment to an integer used to for correct sorting
		 *
		 * @param string $month		A three character string that describes the month
		 *
		 * @return int 	An integer than describes the month
		 */
		private static function interpMonth($month) 
		{
			switch( $month ) {
				case 'Jan':
					return 1;
				case 'Feb':
					return 2;
				case 'Mar':
					return 3;
				case 'Apr':
					return 4;
				case 'May':
					return 5;
				case 'Jun':
					return 6;
				case 'Jul':
					return 7;
				case 'Aug':
					return 8;
				case 'Sep':
					return 9;
				case 'Oct':
					return 10;
				case 'Nov':
					return 11;
				case 'Dec':
					return 12;
			}
			
			return 0;
		}
		
		/*================================================================================================*/
	
		/**
		 * Create an xml with the values already within the class
		 *
		 * @param string $version 	The xml's version
		 * @param string $charset	The charset of the xml
		 * @param string $format	If you want nice formatting for the xml
		 */
		public function createXml($version='1.0', $charset='UTF-8', $format=true)
		{
			$this->xml = new DOMDocument($version, $charset);
			$this->xml->formatOutput = $format;
			
			$xmlroot = $this->xml->createElement('email');
			$xmlroot = $this->xml->appendChild($xmlroot);
			
			$xmlroot->appendChild($this->xml->createElement('id', 		$this->mid));
			$xmlroot->appendChild($this->xml->createElement('date', 	$this->date));
			$xmlroot->appendChild($this->xml->createElement('from', 	$this->from));
			$xmlroot->appendChild($this->xml->createElement('to', 		$this->to));
			$xmlroot->appendChild($this->xml->createElement('subject', 	$this->subject));
			$xmlroot->appendChild($this->xml->createElement('body', 	$this->body));

			$x_att = $xmlroot->appendChild($this->xml->createElement('attachment'));
			
			if ( $this->attachment != null )
			{
				$x_att->appendChild($this->xml->createElement('filename', 	$this->attachment->getFilename()));
				$x_att->appendChild($this->xml->createElement('type', 		$this->attachment->getType()));
				$x_att->appendChild($this->xml->createElement('data', 		$this->attachment->getData()));
			}
			
		}
		
		/**
		 * Save an xml to the path specified.
		 *
		 * @param string $path		The path to save the xml file
		 *
		 * @return boolean			true if the save is success, false otherwise
		 */
		public function saveXml($path)
		{
			if ( !empty($this->xml) )
				$this->xml->save($path);
			else
				return false;
				
			return true;
		}
		
		/**
		 * Used for generating markup for each email being displayed in the list container.
		 *
		 * @return string markup for the particular email
		 */
		public function generateList() 
		{
			$markup = '<div id="'.$this->mid.'" class="email">
						<div class="email-l-avatar-cont">
							<div class="email-l-avatar box">
								<img class="list-avatar box" src="'.$this->avatar.'" />
							</div>
							<div class="abar';
							
							if ( $this->unread )
								$markup .= ' email-sl-bar';
							
							$markup .= '">
								
							</div>
						</div>
						<div class="email-l-from">
							<span class="from-person">'.$this->from.'</span><br/>
							<span class="email-subject">'.$this->subject.'</span>
						</div>
						<div class="list-icon-container">
						';
						
							$markup .= ( is_object($this->attachment) ? '<div class="list-icon-attach"></div>' : '' );
							
						$markup .= '
						</div>
					</div>';
					
			return $markup;
		}
	
		/**
		 * Get an array of data from the object
		 *
		 * @return arrray	array of data
		 */
		public function getValueArray()
		{
			return array('From'	=>$this->from, 
						  'To'		=>$this->to, 
						  'Subject'	=>$this->subject,
						  'date'	=>$this->date,
						  'Body'	=>$this->body,
						  'Avatar'	=>$this->avatar,
						  'Attach'	=>$this->attachment );
		}
	
		/**
		 * Return the unique email id
		 *
		 * @return string	The unique email id
		 */
		public function getId()
		{
			return $this->mid;
		}
		
		/**
		 * Return who the email was from
		 *
		 * @return string	Who the email was from
		 */
		public function getFrom() 
		{
			return $this->from;
		}
	
		/**
		 * Return the recipient of the email
		 *
		 * @return string	Return the recipient of the email
		 */
		public function getTo() 
		{
			return $this->to;
		}
	
		/**
		 * Return the date of the email
		 *
		 * @return string	Return the date of the email
		 */
		public function getDate() 
		{
			return $this->date;
		}
	
		/**
		 * Return the subject of the email
		 *
		 * @return string	Return the subject of the email
		 */
		public function getSubject() 
		{
			return $this->subject;
		}
	
		/**
		 * Return the path to the avatar
		 *
		 * @return string	Return the path to the avatar
		 */
		public function getAvatar() 
		{
			return $this->avatar;
		}
		
		/**
		 * Set the path to the email's avatar
		 */
		public function setAvatar($path)
		{
			$this->avatar = $path;
		}
		
		/**
		 * Return the email's message
		 *
		 * @return string	Return the email's message
		 */
		public function getBody()
		{
			return $this->body;
		}
		
		/**
		 * Return the email's unread status
		 *
		 * @return string	Return the email's seen flag
		 */
		public function getUnreadStatus()
		{
			return $this->unread;
		}
		
		/**
		 * Return an attachment object
		 *
		 * @return object	Attachment object
		 */
		public function getAttachment()
		{
			return $this->attachment;
		}

		/*================================================================================================*/
		
		/**
		 * an attachment object
		 *
		 * @var object
		 */
		private $attachment;
		
		/**
		 * unique email id
		 *
		 * @var string
		 */
		private $mid;
		
		/**
		 * an xml object
		 *
		 * @var object
		 */
		private $xml;
		
		/**
		 * path to the avatar for the message
		 *
		 * @var string
		 */
		private $avatar;
		
		/**
		 * subject of the email
		 *
		 * @var string
		 */
		private $subject;
		
		/**
		 * email receive date
		 *
		 * @var string
		 */
		private $date;
		
		/**
		 * recipient of the email
		 *
		 * @var string
		 */
		private $to;
		
		/**
		 * who the email was from
		 *
		 * @var string
		 */
		private $from;
		
		/**
		 * the body of the email
		 *
		 * @var string
		 */
		private $body;
		
		/**
		 * if the email message is an unread email
		 *
		 * @var int
		 */
		private $unread;
	}
?>