<?php
	/**
	 * Email Class
	 * A wrapper that incorporates both the Mail and Mime packages from PEAR
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

	require_once 'include/mail.php';
	require_once 'include/mime.php';

	class Email
	{
		/**
		 * Constructor, sents up necessary parameters for both mail factory and mime
		 * helper object.
		 *
		 * @param string $host	The host address to the mail server
		 * @param int	 $port	The port number of the address
		 * @param string $user	The email address or user of the account
		 * @param string $pass	The password that is associated with the user
		 * @param bool	 $auth	Whether the server needs ssl or other security auth
		 */
		public function __construct($host, $port, $user, $pass, $auth)
		{
			$this->host = $host;
			$this->port = $port;
			$this->user = $user;
			$this->pass = $pass;
			$this->auth = $auth;
			
			$params["host"] 	= $host;
			$params["port"] 	= $port;
			$params["username"] = $user;
			$params["password"] = $pass;
			$params["auth"] 	= $auth;
			
			// Setup mail object
			$this->mailObj = &Mail::factory('smtp', $params);
			
			// Setup mime object
			$mimeparams['eol'] 				= "\n";
			$mimeparams['text_encoding'] 	= "8bit";
			$mimeparams['html_encoding'] 	= "8bit";
			$mimeparams['head_charset']		= "UTF-8";
			$mimeparams['text_charset']		= "UTF-8";
			$mimeparams['html_charset']		= "UTF-8";
			$this->mimeObj = new Mail_mime($mimeparams);
		}
		
		/**
		 * Sends an email.
		 *
		 * @param string $to			The recipient
		 * @param string $subject		The subject of the email message
		 * @param string $message		The plain text message
		 * @param mixed $htmlmsg		The custom html message or false
		 * @param mixed $attachments	An array of file paths for attachment otherwise false
		 * @param mixed $from			Who the sender is, otherwise false
		 *
		 * @return boolean				Whether or not the email has been sent or not
		 */
		public function SendEmail($to, $subject, $message, $htmlmsg=false, $attachments=false, $from=false)
		{
			$recipients = $to;

			$headers['From']    = ($from === false ? $this->user : $from);
			$headers['To']      = $to;
			$headers['Subject'] = $subject;
			
			// Setup the content
			$body 		= $message;
			
			if ( $htmlmsg === false )
				$htmlbody = trim("<html>
								<head>
									<style>
										body.zg {
											font-size: 12px;
											font-family: Verdana,Arial;
										}
									</style>
								</head>
								<body>
								".$body."
								</body>
							</html>");
			else
				$htmlbody = $htmlmsg;
								
			
			// Do mime conversion on content
			$this->mimeObj->setTXTBody($body);
			$this->mimeObj->setHTMLBody($htmlbody);
			
			// Deal with attachments
			if ( $attachments !== false )
				$this->setAttachments($attachments);
			
			// Get mime compatible content
			$mimeBody = $this->mimeObj->get();
			$mimeHead = $this->mimeObj->headers($headers);
			
			$result = $this->mailObj->send($recipients, $mimeHead, $mimeBody);
			
			if ( $result !== TRUE ) {
				$this->error = $result->getMessage();
				return false;
			} else {
				return true;
			}
		}
		
		/*================================================================================================*/
		
		/**
		 * Attaches files to the mime email whenever a file is found at the correct path
		 * as denoted by the input array.
		 *
		 * @param array[string] $attachments an array of file paths to the attachments
		 */
		private function setAttachments($attachments)
		{
			$length = count($attachments);
			
			for ( $i = 0; $i < $length; ++$i )
				if ( file_exists($attachments[$i]) )
					$this->mimeObj->addAttachment($attachments[$i]);
		}
		
		/*================================================================================================*/
		
		/**
		 * Return the url for the smtp account
		 *
		 * @return string ^
		 */
		public function getHost()
		{
			return $this->host;
		}
		
		/**
		 * Return the port access number for the smtp account
		 *
		 * @return int ^
		 */
		public function getPort()
		{
			return $this->port;
		}
		
		/**
		 * Return the email address of the smtp account
		 *
		 * @return string ^
		 */
		public function getUser()
		{
			return $this->user;
		}
		
		/**
		 * Return the password for the smtp account
		 *
		 * @return string ^
		 */
		public function getPass()
		{
			return $this->pass;
		}
		
		/**
		 * Return whether the smtp needs authentication
		 *
		 * @return boolean ^
		 */
		public function isAuth()
		{
			return $this->auth;
		}
		
		/**
		 * Return the last error encountered by the object
		 *
		 * @return string Last Error encountered
		 */
		public function getLastError()
		{
			return $this->error;
		}
		
		/*================================================================================================*/
		
		/**
		 * url of the smtp accoiunt
		 *
		 * @var string
		 */
		private $host;
		
		/**
		 * Correct port for the smtp
		 *
		 * @var int
		 */
		private $port;
		
		/**
		 * The email address for the SMTP account
		 *
		 * @var string
		 */
		private $user;
		
		/**
		 * SMTP account's password
		 *
		 * @var string
		 */
		private $pass;
		
		/**
		 * Whether the smtp account needs to use auth security
		 *
		 * @var boolean
		 */
		private $auth;
		
		/**
		 * The email object that sends the email via SMTP
		 *
		 * @var object
		 */
		private $mailObj;
		
		/**
		 * A mime object that helps with html markup in emails
		 *
		 * @var object
		 */
		private $mimeObj;
		
		/**
		 * The last error that the class encountered if any
		 *
		 * @var string
		 */
		private $error;
	}
?>