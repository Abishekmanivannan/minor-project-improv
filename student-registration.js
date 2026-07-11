const form = document.getElementById("studentForm");
const formMessage = document.getElementById("formMessage");
const logoutBtn = document.getElementById("logoutBtn");

function showMessage(element, text, type = "success") {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;
}

async function requireAuth() {
    if (!window.supabaseClient) {
        showMessage(formMessage, "Supabase is unavailable. Please refresh the page.", "error");
        return false;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        showMessage(formMessage, error.message, "error");
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

        const authenticated = await requireAuth();
        if (!authenticated) return;

        const name = document.getElementById("name").value.trim();
        const rollNumber = document.getElementById("rollNumber").value.trim();
        const department = document.getElementById("department").value.trim();
        const email = document.getElementById("email").value.trim();

        if (!name || !rollNumber || !department || !email) {
            showMessage(formMessage, "All fields are required.", "error");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showMessage(formMessage, "Please enter a valid email address.", "error");
            return;
        }

        try {
            const isDuplicate = await checkDuplicateRoll(rollNumber);
            if (isDuplicate) {
                showMessage(formMessage, "A student with this roll number already exists.", "error");
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
        } catch (error) {
            showMessage(formMessage, error.message || "Failed to register student.", "error");
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
