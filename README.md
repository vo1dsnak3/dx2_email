Deus Ex Email Client 2 - 1.13 BETA
=========

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
1. You will need a working webserver, works on apache 2.2, untested on IIS
2. You will need PHP 5 installed
3. A modern browser that supports HTML5 and CSS3
4. The email client is meant to be displayed full-screen on your browser, press the F11 button

	For people having trouble with steps 1 and 2 try QuickPHP: http://www.zachsaw.com/?pg=quickphp_php_tester_debugger

	
	
INSTALLATION
----------------------------------------------------------------------
1. Put the entire DX2 folder in your server root.
2. Point your browser to /setup/index.php and add your email accounts
3. Further customizations are in /js/config.js
4. To use custom avatars simply put the picture into the avatar folder and rename it to your friend's email address



INSTALLATION W/ QuickPHP
----------------------------------------------------------------------
1. Download and install PHP 5 and extract it to a folder
2. Download and extract the QuickPHP BareBones version into your PHP folder
3. Rename php.ini-production to php.ini
4. Edit the php.ini and replace "extension=php_imap.dll" to "extension=ext/php_imap.dll"
5. You must also replace "extension=php_mbstring.dll" to "extension=ext/php_mbstring.dll"
6. Don't forget to remove the the semi-colon before each line on numbers 4 and 5
7. Follow the same installation rules as above
8. Launch QuickPHP and use 127.0.0.1 and port 80 substitute execution time to 0 and start



SECURITY
----------------------------------------------------------------------
Some overall tips on security issues if you are making this application public on your server

* If worried about security, enable SSL on your server
* For added security, put encrypted or hashed password in a database
* Enable password type inputs for login (Make the characters in the entry circles)



ISSUES
----------------------------------------------------------------------
* Sometimes the first html email shown upon logging in will not display correctly
* Old browsers may not render the client correctly [see requirements]
* Not all email services are supported, contact me if you want a service supported (eg. Yahoo)
* May have problems with viewing foreign characters under different charsets
* IE performs very poorly upon getting initial data through ajax as well as fetching email xml



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