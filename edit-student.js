const form = document.getElementById("editStudentForm");
const formMessage = document.getElementById("formMessage");
const cancelBtn = document.getElementById("cancelBtn");
const logoutBtn = document.getElementById("logoutBtn");
const toastContainer = document.getElementById("toastContainer");
let currentStudentId = null;

function showMessage(text, type = "info") {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.className = `message ${type}`;
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
    submitButton.innerHTML = isLoading ? '<span class="spinner"></span>Saving...' : 'Save Changes';
}

function redirectToRecords() {
    window.location.href = "student-records.html";
}

function getStudentIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function requireAuth() {
    if (!window.supabaseClient) {
        showMessage("Supabase is unavailable. Please refresh the page.", "error");
        showToast("Supabase is unavailable.", "error");
        return false;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        showMessage(error.message, "error");
        showToast(error.message, "error");
        return false;
    }

    if (!session) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

function validateStudentData(name, rollNumber, department, email) {
    if (!name || !rollNumber || !department || !email) {
        return { valid: false, message: "All fields are required." };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return { valid: false, message: "Please enter a valid email address." };
    }

    return { valid: true };
}

async function loadStudent(studentId) {
    const { data, error } = await window.supabaseClient
        .from("students")
        .select("id, name, rollNumber, department, email")
        .eq("id", studentId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Student not found.");

    currentStudentId = data.id;
    document.getElementById("name").value = data.name || "";
    document.getElementById("rollNumber").value = data.rollNumber || "";
    document.getElementById("department").value = data.department || "";
    document.getElementById("email").value = data.email || "";
}

async function checkDuplicateRoll(rollNumber, currentId) {
    const { data, error } = await window.supabaseClient
        .from("students")
        .select("id")
        .eq("rollNumber", rollNumber);

    if (error) throw error;
    return data.some((item) => item.id !== currentId);
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        showMessage("", "info");
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

        const validation = validateStudentData(name, rollNumber, department, email);
        if (!validation.valid) {
            showMessage(validation.message, "error");
            showToast(validation.message, "error");
            setLoading(false);
            return;
        }

        try {
            const isDuplicate = await checkDuplicateRoll(rollNumber, currentStudentId);
            if (isDuplicate) {
                showMessage("A student with this roll number already exists.", "error");
                showToast("A student with this roll number already exists.", "error");
                setLoading(false);
                return;
            }

            const { error } = await window.supabaseClient
                .from("students")
                .update({
                    name,
                    rollNumber,
                    department,
                    email
                })
                .eq("id", currentStudentId);

            if (error) throw error;

            showMessage("Student updated successfully! Redirecting...", "success");
            showToast("Student updated successfully!", "success");
            setTimeout(redirectToRecords, 1200);
        } catch (error) {
            showMessage(error.message || "Failed to update student.", "error");
            showToast(error.message || "Failed to update student.", "error");
        } finally {
            setLoading(false);
        }
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", redirectToRecords);
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = "login.html";
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const authenticated = await requireAuth();
    if (!authenticated) return;

    const studentId = getStudentIdFromUrl();
    if (!studentId) {
        showMessage("No student selected. Returning to records.", "error");
        showToast("No student selected.", "error");
        setTimeout(redirectToRecords, 1200);
        return;
    }

    try {
        await loadStudent(studentId);
    } catch (error) {
        showMessage(error.message || "Unable to load student details.", "error");
        showToast(error.message || "Unable to load student details.", "error");
        setTimeout(redirectToRecords, 1500);
    }
});
