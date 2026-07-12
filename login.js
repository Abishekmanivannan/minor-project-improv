const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const toastContainer = document.getElementById("toastContainer");

function showToast(text, type = "info") {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = text;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2600);
}

function setLoading(isLoading) {
    const submitButton = loginForm?.querySelector("button[type='submit']");
    if (!submitButton) return;

    submitButton.disabled = isLoading;
    submitButton.innerHTML = isLoading ? '<span class="spinner"></span>Signing in...' : 'Login';
}

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
        setLoading(true);

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!window.supabaseClient) {
            message.textContent = "Supabase is unavailable. Please refresh the page.";
            message.className = "error";
            setLoading(false);
            showToast("Supabase is unavailable.", "error");
            return;
        }

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            message.textContent = error.message;
            message.className = "error";
            setLoading(false);
            showToast(error.message, "error");
        } else {
            message.textContent = "Login successful!";
            message.className = "success";
            console.log(data);
            showToast("Login successful!", "success");
            window.location.href = "student-registration.html";
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await redirectIfLoggedIn();
});