<?php
	function getContentType($type) {
		switch($type) {
			// Images
			case 'jpeg':
			case 'gif':
			case 'png':
			case 'tiff':
			case 'vnd.microsoft.icon':
				return 'image';
				
			// Text
			case 'plain':
				return 'text';
				
			// Audio
			case 'mp4':
			case 'ogg':
			case 'x-ms-wma':
				return 'audio';
				
			// Video
			case 'mpeg':
			case 'x-matroska':
				return 'video';
			
			// Application Type
			case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
			case 'javascript':
			case 'pdf':
			case 'zip':
				//return 'application';
			default:
				return 'application';
		}
	}
?>