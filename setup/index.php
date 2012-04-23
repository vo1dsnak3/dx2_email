<!DOCTYPE HTML>
<html>
<head>
	<link rel="stylesheet" href="stylesheet.css" />
</head>
<body>
<div id="global_wrapper" class="box">
	<div id="page_header">Deux Ex Email Client 2 - Email Accounts Setup</div>
	<div id="page_intro">
		Use this page to do a first time setup for your email accounts.<br/>
		If you are making a minor change you can edit the accounts.xml file directly
	</div>
	<div id="page_table_note">
		Email Account 1 will be your default account.
	</div>
	<div id="table_wrapper">
		<table>
			<tbody>
				<tr>
					<td class="cell-center">#</td>
					<td class="cell-center">Type</td>
					<td class="cell-center">Address</td>
					<td class="cell-center">Password</td>
					<td></td>
				</tr>
				<tr class="email-entry">
					<td class="cell-center">1: </td>
					<td>
						<select>
							<option value="HOTMAIL">Hotmail</option>
							<option value="GMAIL">Gmail</option>
						</select>
					</td>
					<td>
						<input type="email" placeholder="adam.jenson@serif.com" />
					</td>
					<td>
						<input type="password" />
					</td>
					<td></td>
				</tr>
				<tr id="new_acc_row">
					<td><a class="new-acc" href="#">+</a></td>
					<td colspan="4"><a class="new-acc" href="#">Add another email account</a></td>
				</tr>
				<tr>
					<td colspan="5"><input id="page_submit" type="submit" value="Submit"/></td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
<script src="dx_setup.js"></script>
</body>
</html>