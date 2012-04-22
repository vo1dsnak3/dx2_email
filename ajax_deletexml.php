<?php
	require_once('define_email.php');
	
	$username = $_GET['user'];
	$name	  = $_GET['xmlName'];
	
	if ( file_exists('email/'.$username) ) {
	
		$target = 'email/'.$username.'/'.$name.'.xml';
	
		if ( file_exists($target) ) {
			unlink($target);
		}
	}
?>