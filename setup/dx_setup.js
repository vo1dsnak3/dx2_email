/*
	Copyright (c) 2012 Alexander Ip

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
	documentation files (the "Software"), to deal in the Software without restriction, including without limitation the 
	rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
	persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial 
	portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT 
	LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
	OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

$(document).ready(function() {
	$('#table_wrapper').data('num', 2);

	$('#new_acc_row a.new-acc').click(function(e) {
		e.preventDefault();
		
		var index	 = $('#table_wrapper').data('num');
		var $lastrow = $('#table_wrapper tr.email-entry:last');
		$lastrow.after('<tr class="email-entry">\
					<td class="cell-center">'+index+': </td>\
					<td>\
						<select>\
							<option value="HOTMAIL">Hotmail</option>\
							<option value="GMAIL">Gmail</option>\
						</select>\
					</td>\
					<td>\
						<input type="email" placeholder="adam.jenson@serif.com" />\
					</td>\
					<td>\
						<input type="password" />\
					</td>\
					<td><a href="#" class="rem-acc">X</a></td>\
				</tr>');
				
		$('#table_wrapper').data('num', index+1);
	});
	
	$('#table_wrapper').on('click', 'a.rem-acc', function(e) {
		e.preventDefault();
		$(this).closest('tr.email-entry').remove();
	});

	$('#page_submit').click(function(e) {
		e.preventDefault();
		
		var data 		= new Array();
		var validation 	= {
			type: new RegExp('(HOTMAIL|GMAIL)'),
			addr: new RegExp('[a-zA-Z0-9_\-]+@[a-zA-Z0-9_\-]+\.(com|ca)', 'i')
		};
		
		$('#table_wrapper tr.email-entry').each(function() {
			var $self 	= $(this);
			var num		= $self.children('td:first').html().substring(0,1);
			var type 	= $self.find('select').val();
			var addr 	= $self.find('input[type=email]').val();
			var ps		= $self.find('input[type=password]').val();
			
			if ( !validation.type.test(type) ) {
				alert('Row '+num+': Please select a valid email service');
				return;
			}
			
			if ( !validation.addr.test(addr) ) {
				alert('Row '+num+': Please enter a valid email address');
				return;
			}
			
			if ( !ps ) {
				alert('Row '+num+': Please enter a corresponding password for the account');
				return;
			}
			
			data.push({'type': type, 'addr': addr, 'ps': ps});
		});

		$.getJSON('ajax_createconfig.php', { "accounts": JSON.stringify(data), 'proxy': $('#proxy_row').find('input').val() }, function(result) {
			if ( !result.error ) {
				alert(result.result);
				window.location = '../index.php';
			} else {
				alert(result.error);
			}
		});
	});
});