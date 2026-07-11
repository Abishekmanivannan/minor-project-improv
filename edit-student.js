const form = document.getElementById("editStudentForm");
const formMessage = document.getElementById("formMessage");
const cancelBtn = document.getElementById("cancelBtn");
const logoutBtn = document.getElementById("logoutBtn");
let currentStudentId = null;

function showMessage(text, type = "info") {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.className = `message ${type}`;
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
        return false;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        showMessage(error.message, "error");
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

        const authenticated = await requireAuth();
        if (!authenticated) return;

        const name = document.getElementById("name").value.trim();
        const rollNumber = document.getElementById("rollNumber").value.trim();
        const department = document.getElementById("department").value.trim();
        const email = document.getElementById("email").value.trim();

        const validation = validateStudentData(name, rollNumber, department, email);
        if (!validation.valid) {
            showMessage(validation.message, "error");
            return;
        }

        try {
            const isDuplicate = await checkDuplicateRoll(rollNumber, currentStudentId);
            if (isDuplicate) {
                showMessage("A student with this roll number already exists.", "error");
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
            setTimeout(redirectToRecords, 1200);
        } catch (error) {
            showMessage(error.message || "Failed to update student.", "error");
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
        setTimeout(redirectToRecords, 1200);
        return;
    }

    try {
        await loadStudent(studentId);
    } catch (error) {
        showMessage(error.message || "Unable to load student details.", "error");
        setTimeout(redirectToRecords, 1500);
    }
});
