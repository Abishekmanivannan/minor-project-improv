const form = document.getElementById("studentForm");
const formMessage = document.getElementById("formMessage");
const logoutBtn = document.getElementById("logoutBtn");
const toastContainer = document.getElementById("toastContainer");

function showMessage(element, text, type = "success") {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;
}

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
    const submitButton = form?.querySelector("button[type='submit']");
    if (!submitButton) return;

    submitButton.disabled = isLoading;
    submitButton.innerHTML = isLoading ? '<span class="spinner"></span>Saving...' : 'Register Student';
}

async function requireAuth() {
    if (!window.supabaseClient) {
        showMessage(formMessage, "Supabase is unavailable. Please refresh the page.", "error");
        showToast("Supabase is unavailable.", "error");
        return false;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        showMessage(formMessage, error.message, "error");
        showToast(error.message, "error");
        return false;
    }

    if (!session) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

async function checkDuplicateRoll(rollNumber, currentId = null) {
    const { data, error } = await window.supabaseClient
        .from("students")
        .select("id")
        .eq("rollNumber", rollNumber);

    if (error) throw error;

    if (currentId) {
        return data.some((item) => item.id !== currentId);
    }

    return data.length > 0;
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        showMessage(formMessage, "", "success");
        setLoading(true);

        const authenticated = await requireAuth();
        if (!authenticated) {
            setLoading(false);
            return;
        }

        const name = document.getElementById("name").value.trim();
        const rollNumber = document.getElementById("rollNumber").value.trim();
        const department = document.getElementById("department").value.trim();
        const email = document.getElementById("email").value.trim();

        if (!name || !rollNumber || !department || !email) {
            showMessage(formMessage, "All fields are required.", "error");
            showToast("All fields are required.", "error");
            setLoading(false);
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showMessage(formMessage, "Please enter a valid email address.", "error");
            showToast("Please enter a valid email address.", "error");
            setLoading(false);
            return;
        }

        try {
            const isDuplicate = await checkDuplicateRoll(rollNumber);
            if (isDuplicate) {
                showMessage(formMessage, "A student with this roll number already exists.", "error");
                showToast("A student with this roll number already exists.", "error");
                setLoading(false);
                return;
            }

            const { error } = await window.supabaseClient.from("students").insert([
                {
                    name,
                    rollNumber: rollNumber,
                    department,
                    email
                }
            ]);

            if (error) throw error;

            form.reset();
            showMessage(formMessage, "Student registered successfully!", "success");
            showToast("Student registered successfully!", "success");
        } catch (error) {
            showMessage(formMessage, error.message || "Failed to register student.", "error");
            showToast(error.message || "Failed to register student.", "error");
        } finally {
            setLoading(false);
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = "login.html";
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await requireAuth();
});
