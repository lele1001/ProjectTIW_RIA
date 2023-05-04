/**
 * AJAX call management
 */

function makeCall(method, url, formElement, callback, reset = true) {
	const req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		callback(req)
	};

	req.open(method, url);

	if (formElement == null) {
		req.send();
	} else {
		req.send(new FormData(formElement));
	}

	if (formElement !== null && reset === true) {
		formElement.reset();
	}
}

function setCookie(cookieName, cookieValue, exDays) {
	let deadline = new Date();

	deadline.setTime(deadline.getTime() + (exDays * 24 * 60 * 60 * 1000));
	document.cookie = cookieName + '=' + cookieValue + '; expires=' + deadline.toUTCString() + '; path=/';
}

function replaceCookie(newName, cookieValue) {
	let deadline = new Date();

	deadline.setTime(deadline.getTime() + (30 * 24 * 60 * 60 * 1000));
	document.cookie = newName + '=' + cookieValue + '; expires=' + deadline.toUTCString() + '; path=/';
}

function getCookie(cookieName) {
	let name = cookieName + "=";
	let cookieArray = document.cookie.split(';');

	for (let i = 0; i < cookieArray.length; i++) {
		let c = cookieArray[i];

		while (c.charAt(0) === ' ') {
			c = c.substring(1);
		}

		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length);
		}
	}

	return "";
}

function cancelCookie(key) {
	let date = new Date();
	const expires = "expires=" + date.toUTCString();
	document.cookie = key + "=" + "" + "; " + expires + "; path=/";
}