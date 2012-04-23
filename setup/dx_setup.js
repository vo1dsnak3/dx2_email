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
		
		$.getJSON('ajax_createconfig.php', { "accounts": JSON.stringify(data) }, function(result) {
			if ( !result.error ) {
				alert(result.result);
			} else {
				alert(result.error);
			}
		});
	});
});