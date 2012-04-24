Deus Ex Email Client 2 - 1.12 BETA

INTRODUCTION
----------------------------------------------------------------------
After playing Deus Ex Human Revolution and hacking computers like mad,
I've come to realize that I really like the email client on the computers.
After some planning I've decided to write my own email client that emulates
the look and feel of the client in the game but including some enhancements of
my own. Instead of static email pieces, the entire backend will connect
to your personal inbox.



REQUIREMENTS
----------------------------------------------------------------------
1) You will need a working webserver, works on apache 2.2, untested on IIS
2) You will need PHP 5 installed

	For people having trouble with steps 1 and 2 try QuickPHP: http://www.zachsaw.com/?pg=quickphp_php_tester_debugger

3) A modern browser that supports HTML5 and CSS3
4) The email client is meant to be displayed full-screen on your browser, press the F11 button



INSTALLATION
----------------------------------------------------------------------
1) Put the entire DX2 folder in your server root.
2) Point your browser to /setup/index.php and add your email accounts
3) Further customizations are in /js/config.js
4) To use custom avatars for other people create a folder under the avatar directory,
   image must have no spaces only underscores. If you have a saved xml, you can copy the value from the "From" element
   and use that as the image name.
	eg. Avatar/[Your email address]something@hotmail.com/jenson_adam&lt;something@hotmail.com&gt;.jpg



SECURITY
----------------------------------------------------------------------
Some overall tips on security issues if you are making this application public on your server

1) If worried about security, enable SSL on your server
2) For added security, put encrypted or hashed password in a database
3) Enable password type inputs for login (Make the characters in the entry circles)



ISSUES
----------------------------------------------------------------------
- Some HTML messages may not render correctly
- Old browsers may not render the client correctly [see requirements]
- Not all email services are supported, contact me if you want a service supported (eg. Yahoo)
- May have problems with viewing foreign characters under different charsets.
- IE can't handle large amounts of ajax data



LIBRARIES USED
----------------------------------------------------------------------
	JQuery 		- http://jquery.com
	JQueryUI 	- http://jqueryui.com
	Raphael		- http://raphaeljs.com
	JScrollPane - http://jscrollpane.kelvinluck.com
	Modernizr	- http://modernizr.com/
	
	PEAR Mail	- http://pear.php.net/package/Mail/
	PEAR Mime	- http://pear.php.net/package/Mail_Mime/



LICENSE
----------------------------------------------------------------------
Release under the MIT License, please see LICENSE.TXT or visit
http://opensource.org/licenses/MIT



Special Thanks
----------------------------------------------------------------------
Special thanks to the Eidos team for making Human Revolution a
gorgeous and fun game.