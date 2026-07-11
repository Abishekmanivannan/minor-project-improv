const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

async function redirectIfLoggedIn() {
    if (!window.supabaseClient) return;

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (!error && session) {
        window.location.href = "student-registration.html";
    }
}

if (loginForm && message) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        message.textContent = "";
        message.className = "";

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!window.supabaseClient) {
            message.textContent = "Supabase is unavailable. Please refresh the page.";
            message.className = "error";
            return;
        }

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            message.textContent = error.message;
            message.className = "error";
        } else {
            message.textContent = "Login successful!";
            message.className = "success";
            console.log(data);
            window.location.href = "student-registration.html";
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await redirectIfLoggedIn();
});