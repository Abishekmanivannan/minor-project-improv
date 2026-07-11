const recordsContainer = document.getElementById("recordsContainer");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");
let students = [];
let filteredStudents = [];

function showMessage(text, type = "info") {
    recordsContainer.innerHTML = `<div class="empty-state ${type}">${text}</div>`;
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

async function fetchStudents() {
    const { data, error } = await window.supabaseClient
        .from("students")
        .select("id, name, rollNumber, department, email")
        .order("name", { ascending: true });

    if (error) throw error;

    students = data || [];
    filteredStudents = [...students];
    renderStudents();
}

function renderStudents() {
    if (!filteredStudents.length) {
        recordsContainer.innerHTML = '<div class="empty-state">No students found.</div>';
        return;
    }

    recordsContainer.innerHTML = filteredStudents.map((student) => `
        <article class="student-card">
            <h3>${student.name}</h3>
            <p><strong>Roll Number:</strong> ${student.rollNumber}</p>
            <p><strong>Department:</strong> ${student.department}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            <div class="card-actions">
                <button class="edit-btn" data-id="${student.id}">Edit</button>
                <button class="delete-btn" data-id="${student.id}">Delete</button>
            </div>
        </article>
    `).join("");
}

function filterStudents(query) {
    const searchTerm = query.toLowerCase();
    filteredStudents = students.filter((student) => {
        return [student.name, student.rollNumber, student.department, student.email]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm);
    });
    renderStudents();
}

function editStudent(studentId) {
    if (!studentId) return;
    window.location.href = `edit-student.html?id=${studentId}`;
}

function deleteStudent(studentId) {
    if (!studentId) return;
    window.location.href = `delete-student.html?id=${studentId}`;
}

if (recordsContainer) {
    recordsContainer.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const studentId = button.getAttribute("data-id");
        if (button.classList.contains("edit-btn")) {
            editStudent(studentId);
        } else if (button.classList.contains("delete-btn")) {
            deleteStudent(studentId);
        }
    });
}

if (searchInput) {
    searchInput.addEventListener("input", (e) => filterStudents(e.target.value));
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
    try {
        await fetchStudents();
    } catch (error) {
        showMessage(error.message || "Unable to load student records.", "error");
    }
});
