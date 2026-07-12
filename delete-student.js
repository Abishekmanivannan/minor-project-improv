const deleteBtn = document.getElementById("deleteBtn");
const cancelBtn = document.getElementById("cancelBtn");
const logoutBtn = document.getElementById("logoutBtn");
const formMessage = document.getElementById("formMessage");
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
    if (!deleteBtn) return;
    deleteBtn.disabled = isLoading;
    deleteBtn.innerHTML = isLoading ? '<span class="spinner"></span>Deleting...' : 'Delete Student';
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

async function loadStudent(studentId) {
    const { data, error } = await window.supabaseClient
        .from("students")
        .select("id, name, rollNumber, department, email")
        .eq("id", studentId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Student not found.");

    currentStudentId = data.id;
    document.getElementById("studentName").textContent = data.name || "-";
    document.getElementById("studentRoll").textContent = data.rollNumber || "-";
    document.getElementById("studentDepartment").textContent = data.department || "-";
    document.getElementById("studentEmail").textContent = data.email || "-";
}

if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
        const authenticated = await requireAuth();
        if (!authenticated) return;

        if (!currentStudentId) {
            showMessage("No student selected.", "error");
            showToast("No student selected.", "error");
            return;
        }

        setLoading(true);

        try {
            const { error } = await window.supabaseClient
                .from("students")
                .delete()
                .eq("id", currentStudentId);

            if (error) throw error;

            showMessage("Student deleted successfully! Redirecting...", "success");
            showToast("Student deleted successfully!", "success");
            setTimeout(redirectToRecords, 1200);
        } catch (error) {
            showMessage(error.message || "Failed to delete student.", "error");
            showToast(error.message || "Failed to delete student.", "error");
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
