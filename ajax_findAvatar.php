<?php
	/**
	 * ajax_findAvatar.php
	 * Find and show an avatar based on the recipient that the user
	 * types in.
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

	define('DEFAULT_AVATAR', 'avatar/anon.png');
	 
	if ( !isset($_GET['recipient']) ) {
		echo DEFAULT_AVATAR;
	}
	
	$recipient 	= $_GET['recipient'];
	$avatars 	= glob('avatar/'.$recipient.'.*');
	
	echo ( isset($avatars[0]) ? $avatars[0] : DEFAULT_AVATAR );
?>