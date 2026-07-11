const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

if (registerForm && message) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        message.textContent = "";

        const fullName = document.getElementById("fullname").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match!";
            return;
        }

        if (!window.supabaseClient) {
            message.textContent = "Supabase is not available. Please refresh the page.";
            return;
        }

        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) {
            message.textContent = error.message;
        } else {
            console.log(data);
            message.textContent = "Account created successfully! Please check your email to confirm.";
            registerForm.reset();
        }
    });
}