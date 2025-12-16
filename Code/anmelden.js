const form = document.getElementById("login-form");

form.addEventListener("submit",
    function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log(email, password);

});

    
