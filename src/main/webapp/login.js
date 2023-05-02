/**
 * Login management
 */

(function() {
  const loginError = document.getElementById("loginError");

  document.getElementById("loginButton").addEventListener('click', (e) => {
    let form = e.target.closest("form");

    if (form.checkValidity()) {
      makeCall("POST", 'LoginRIA', e.target.closest("form"), function(x) {
        if (x.readyState === XMLHttpRequest.DONE) {
          let message = x.responseText;
          console.log(x.status);

          switch (x.status) {
            case 200:
              setCookie('username', message, 30);
              sessionStorage.setItem('username', message);
              window.location.href = "home.html";
              break;

            case 500: // server error
              loginError.textContent = message;
              break;

            case 400: // bad request
              loginError.textContent = message;
              break;

            default:
              loginError.textContent = "JS Error: something went wrong";
              break;
          }
        }
      });
    } else {
      form.reportValidity();
    }
  });
})();