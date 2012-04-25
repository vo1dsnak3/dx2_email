<?php
	/**
	 * DX_Imap Class
	 * Abstract class for both online and offline variants
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
	require_once 'class_XmlEmailInfo.php';

	define('DEFAULT_AV', 'avatar/anon.png');
	
	abstract class DX_Imap
	{
		abstract public function getEmails($limit);
		abstract public function processEmails($enable_avatar);
		
		/**
		 * return initial data to be displayed to the user
		 *
		 * @return Array	An array of data
		 */
		public function getFirstData()
		{
			return $this->initial_data;
		}
		
		/*================================================================================================*/
		
		/**
		 * check folder paths to see if they exist, if not, create them.
		 *
		 * @return string 	true if folders exist, false if they must be created
		 */
		protected function checkFolders()
		{
			// Create Folder Structure
			$email_folder 	= 'email/';
			$user_folder	= 'email/'.$this->user.'/';
			
			if ( !file_exists($email_folder) ) 
			{
				mkdir($email_folder);
				mkdir($user_folder);
				return false;
			} 
			else if ( !file_exists($user_folder) ) 
			{
				mkdir($user_folder);
				return false;
			}
			
			return true;
		}
		
		/**
		 * Determines the path of the avatar depending on who sent the email.
		 *
		 * @param string $from  	string that contains who the email was from
		 * @param string $default   the path to the default avatar
		 *
		 * @return string path to the correct avatar or the default path
		 */
		protected function getAvatar($from, $default=DEFAULT_AV) 
		{
			if ( !file_exists('avatar') ) 
			{
				mkdir('avatar');
				return $default;
			}
			
			preg_match('/.*\s<(.+)>/i', $from, $match);
			
			// Check the avatar array first before matching using glob
			if ( isset($avatar_list[$match[1]]) ) 
				return $avatar_list[$match[1]];
			
			// If not found in array, search avatar dir and push to array
			if ( isset($match[1]) ) 
			{
				$pictures = glob('avatar/'.$match[1].'.*');
				
				// Always use the first picture found
				if ( isset($pictures[0]) ) {
					$avatar_list[$match[1]] = $pictures[0];
					return $pictures[0];
				}
			}

			return $default;
		}
		
		/*================================================================================================*/
		
		/**
		 * email address of the user
		 *
		 * @var string
		 */
		protected $user;
		
		/**
		 * an array of initial data to be displayed
		 *
		 * @var array
		 */
		protected $initial_data;
		
		/**
		 * storage of avatars
		 *
		 * @var array
		 */
		private $avatar_list;
	}

?>