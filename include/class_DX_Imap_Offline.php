<?php
	/**
	 * DX_Imap_Offline Class
	 * A class used to construct the email list when the user is in offline
	 * mode. Processes stored email xml's instead of connecting to the
	 * email service.
	 *
	 * PHP version 5
	 *
	 * @category  PHP
	 * @package   DX2
	 * @author    Alexander Ip <voidsnake@users.sourceforge.net>
	 * @copyright 2012 Alexander Ip
	 * @license   http://opensource.org/licenses/MIT MIT
	 * @version   1.10 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 * @link	  https://github.com/vo1dsnak3/dx2_email/
	 */

	require_once 'include/class_DX_Imap.php';

	class DX_Imap_Offline extends DX_Imap
	{
		/**
		 * constructor
		 * check folders, throw exception if necessary
		 */
		public function __construct($user, $limit=0)
		{
			$this->user 		= $user;
			$this->user_folder	= 'email/'.$user.'/';
			$this->file_list	= array();
			$this->limit		= $limit;
			
			if ( !$this->checkFolders() )
				throw new Exception('No stored emails found');
		}
		
		/**
		 * attempts to grab a handle from the user folder and iterates through
		 * stored xml's. Objects are created from the xml's and stored in an
		 * array for further processing.
		 *
		 * @param int $limit	unused
		 *
		 * @return boolean	true if processing succeeded, false if handle is invalid.
		 */
		public function getEmails($limit)
		{
			if ( ($handle = opendir($this->user_folder)) !== false )
			{
				while ( ($file = readdir($handle)) !== false ) 
				{
					if ( substr($file, -3) == 'xml' ) 
					{
						// open xml and extract data information, store other information in an object
						if ( $email = new SimpleXMLElement($this->user_folder.$file, 0, true) ) 
						{
							$key 							= $email->date;
							$attach = null;

							if ( $email->attachment->filename && $email->attachment->type && $email->attachment->data )
								$attach = new Attachment($email->attachment->filename, $email->attachment->type, $email->attachment->data);

							$value 							= new XmlEmailInfo($key, $email->from, $email->to, $email->subject, $this->getAvatar($email->from), $email->body, $email->id, false, $attach);
							$this->file_list[(String)$key] 	= $value;
						}
					}
				}
				
				if ( empty($this->file_list) )
					throw new Exception('No XML Files Found at: '.$this->user_folder);
				
				closedir($handle);
				
				return true;
			}
			
			return false;
		}
		
		/**
		 * processes the array of emails that was previously created through
		 * the xml folder, information is saved from the newest email to be
		 * displayed to the user.
		 *
		 * @param boolean $enable_avatar	Whether to display a customized avatar for the person
		 *
		 * @return string 	A fully generated list of emails, sorted by date newest
		 */
		public function processEmails($enable_avatar)
		{
			$list = '';
		
			if ( uksort($this->file_list, "XmlEmailInfo::dateSort") ) 
			{
				// Store initial data from the first email for displaying to the reader
				$firstEmail 			= reset($this->file_list);
				$this->initial_data		= $firstEmail->getValueArray();
			
				$count = 0;
			
				// Start processing xml
				foreach($this->file_list as $key => $value) 
				{
					if ( !$enable_avatar )
						$value->setAvatar('gfx/anon.png');
						
					$list .= $value->generateList();
					
					// Conform to limit if any
					if ( $this->limit != 0 && ++$count == $this->limit )
						break;
				}
			}
			
			return $list;
		}
		
		/*================================================================================================*/
		
		/**
		 * An associative array of [(String)Date]=>[(XmlEmailInfo)Object]
		 *
		 * @var Array
		 */
		private $file_list;
		
		/**
		 * Path to the xml folder, [email/username/]
		 *
		 * @var string
		 */
		private $user_folder;
		
		/**
		 * How many xml's to process
		 *
		 * @var int
		 */
		private $limit;
	}
?>