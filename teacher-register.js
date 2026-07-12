const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");
const toastContainer = document.getElementById("toastContainer");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

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
    const submitButton = registerForm?.querySelector("button[type='submit']");
    if (!submitButton) return;

    submitButton.disabled = isLoading;
    submitButton.innerHTML = isLoading ? '<span class="spinner"></span>Creating account...' : 'Register';
}

function updatePasswordStrength(password) {
    if (!strengthBar || !strengthText) return;

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const widths = [0, 25, 50, 75, 100];
    const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["#EF4444", "#F59E0B", "#FBBF24", "#7C3AED", "#22C55E"];
    const index = Math.min(score, 4);

    strengthBar.style.width = `${widths[index]}%`;
    strengthBar.style.background = colors[index];
    strengthText.textContent = `Password strength: ${labels[index]}`;
}

if (registerForm && message) {
    document.getElementById("password")?.addEventListener("input", (e) => updatePasswordStrength(e.target.value));

    document.querySelectorAll(".toggle-password").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;
            input.type = input.type === "password" ? "text" : "password";
            button.textContent = input.type === "password" ? "Show" : "Hide";
        });
    });

    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        message.textContent = "";
        setLoading(true);

        const fullName = document.getElementById("fullname").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match!";
            message.className = "message error";
            setLoading(false);
            showToast("Passwords do not match!", "error");
            return;
        }

        if (!window.supabaseClient) {
            message.textContent = "Supabase is not available. Please refresh the page.";
            message.className = "message error";
            setLoading(false);
            showToast("Supabase is unavailable.", "error");
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
            message.className = "message error";
            setLoading(false);
            showToast(error.message, "error");
        } else {
            console.log(data);
            message.textContent = "Account created successfully! Please check your email to confirm.";
            message.className = "message success";
            registerForm.reset();
            updatePasswordStrength("");
            setLoading(false);
            showToast("Account created successfully!", "success");
        }
    });
}