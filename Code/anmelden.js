const form = document.getElementById("login-form");

form.addEventListener("submit",
    async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log(email, password);

    const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
        });


    const data = await res.json();
    console.log(data);
});
