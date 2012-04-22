<?php
	/**
	 * Attachment
	 * An encapsulation of an attachment object decoded from a valid
	 * MIME email.
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
	 */

	class Attachment
	{
		/**
		 * Convert the month segment to an integer used to for correct sorting
		 *
		 * @param string $filename	The name of the attachment
		 * @param string $type		The filetype of the attachment
		 * @param string $data		Either raw base64 data or plain text
		 * @param string $encoding  What the data is encoded with, usually base64
		 */
		public function __construct($filename, $type, $data, $encoding='base64')
		{
			$this->filename = $filename;
			$this->type		= $type;
			$this->data		= $data;
			
			$pos = strpos($this->filename, '.');
			if ( $pos !== FALSE ) {
				$this->extension = substr($this->filename, $pos + 1);
			} else {
				$this->extension = '?';
			}
			
			// Assume base64
			$this->encoding = $encoding;
		}
		
		/**
		 * Convert the month segment to an integer used to for correct sorting
		 *
		 * @param stream &$imapStream 	An imap stream to be used temporarily for decode and fetch
		 * @param int $msgNo 			The message number to extract the data from
		 * @param array $partArray		Array representing the parts of a mime email
		 *
		 * @return object 	An object representing an attachment or null
		 */
		public static function createFromPart(&$imapStream, $msgNo, $partArray)
		{
			if ( !$partArray )
				return null;
				
			$len = count($partArray);
			for ( $i = 0; $i < $len; ++$i ) 
			{
				if ( $partArray[$i]->ifdisposition == true && $partArray[$i]->disposition == 'ATTACHMENT' ) 
				{
					$type = strtolower($partArray[$i]->subtype);
				
					$dlen = count($partArray[$i]->dparameters);
					for ( $j = 0; $j < $dlen; ++$j )
					{
						if ( $partArray[$i]->dparameters[$j]->attribute == 'FILENAME' )
						{
							// Sometimes the filename within the disposition attributes is not UTF-8
							$header 	= imap_mime_header_decode($partArray[$i]->dparameters[$j]->value);
							$charset 	= $header[0]->charset;
							$filename	= $header[0]->text;
							
							if ( $charset != 'default' && $charset != 'UTF-8' && $charset != 'ISO-8859-1' )
								$filename = iconv($charset, 'UTF-8//IGNORE', $filename);
							
							// Retrieve the base64 data
							$data		= imap_fetchbody($imapStream, $msgNo, $i+1, FT_PEEK);
							$className  = __CLASS__;
							
							return new $className($filename, $type, $data);
						}
					}
				}
			}
			
			return null;
		}
		
		/*================================================================================================*/
		
		/**
		 * Return attachment file name
		 *
		 * @return string attachment file name
		 */
		public function getFilename()
		{
			return $this->filename;
		}
		
		/**
		 * Return attachment type
		 *
		 * @return string attachment type
		 */
		public function getType()
		{
			return $this->type;
		}
		
		/**
		 * Return attachment type
		 *
		 * @return string attachment type
		 */
		 public function getExtension()
		 {
			return $this->extension;
		 }
		
		/**
		 * Return raw data
		 *
		 * @return string attachment data
		 */
		public function getData()
		{
			return $this->data;
		}
		
		/*================================================================================================*/
		
		/**
		 * Attachment's filename
		 *
		 * @var string
		 */
		private $filename;
		
		/**
		 * What kind of file the attachment is
		 *
		 * @var string
		 */
		private $type;
		
		/**
		 * The extension of the file, serves as a short type
		 *
		 * @var string
		 */
		 private $extension;
		
		/**
		 * The attachment's raw data
		 *
		 * @var string
		 */
		private $data;
		
		/**
		 * The attachment's encoding (technically transport-type)
		 *
		 * @var string
		 */
		private $encoding;
	}
?>