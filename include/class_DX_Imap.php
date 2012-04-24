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
	 * @version   1.12 Beta
	 * @link	  https://sourceforge.net/projects/dx2client/
	 */

	require_once 'class_Attachment.php';
	require_once 'class_XmlEmailInfo.php';

	define('DEFAULT_AV', 'gfx/anon.png');
	
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
		
			$avatar_path = 'avatar/'.$this->user.'/';
			if ( !file_exists($avatar_path) ) 
			{
				mkdir($avatar_path);
				return $default;
			}
			
			$from   = htmlspecialchars(str_replace(" ", "_", $from));
			$target = $avatar_path.$from.'.jpg';
			if ( file_exists($target) )
				return $target;
			
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
	}

?>