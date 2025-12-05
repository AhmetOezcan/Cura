const API_BASE_URL = "http://127.0.0.1:8000";

// Patient-ID aus URL-Parameter auslesen
function getPatientIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// Back-Button: nutze history.back(), fallback auf Bewohner.html
function setupBackButton() {
    const btn = document.getElementById("back-btn");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "Bewohner.html";
        }
    });
}

// DOM ready: Back-Button einrichten und Daten laden
document.addEventListener("DOMContentLoaded", () => {
    setupBackButton();
    loadPatientDetails();
});

// Patient-Details laden
async function loadPatientDetails() {
    const patientId = getPatientIdFromURL();
    
    if (!patientId) {
        const page = document.getElementById("patient-page");
        if (page) page.innerHTML = "<p>Keine Patient-ID gefunden. <a href='Bewohner.html'>Zurück</a></p>";
        return;
    }

    try {
        const resp = await fetch(`${API_BASE_URL}/patients/${patientId}`);
        if (!resp.ok) {
            throw new Error("Patient nicht gefunden");
        }

        const patient = await resp.json();
        displayPatientDetails(patient);
        loadPatientTodos(patientId);
    } catch (err) {
        console.error("Fehler beim Laden:", err);
        const page = document.getElementById("patient-page");
        if (page) page.innerHTML = `<p>Fehler: ${err.message}</p><a href='Bewohner.html'>Zurück</a>`;
    }
}

// Patient-Details anzeigen
function displayPatientDetails(patient) {
    const nameEl = document.getElementById("patient-name");
    const ageEl = document.getElementById("patient-age");
    const roomEl = document.getElementById("patient-room");
    const diagEl = document.getElementById("patient-diagnosis");
    const medEl = document.getElementById("medication-text");
    const notesEl = document.getElementById("notes-text");
    const avatarEl = document.getElementById("avatar-img");

    if (nameEl) nameEl.textContent = patient.name ?? "";
    if (ageEl) ageEl.textContent = patient.age ?? "-";
    if (roomEl) roomEl.textContent = patient.room_number ?? "-";
    if (diagEl) diagEl.textContent = patient.diagnosis ?? "-";
    if (medEl) medEl.textContent = patient.medication ?? "—";
    if (notesEl) notesEl.textContent = patient.notes ?? "—";
    
    // Avatar (Placeholder-Service) — Name URL-encodiert
    if (avatarEl) {
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=27AE60&color=fff`;
    }
}

// Todos für Patient laden (interaktiv, optimistisches Update + Persistenz)
async function loadPatientTodos(patientId) {
    try {
        const resp = await fetch(`${API_BASE_URL}/patients/${patientId}/todos`);
        if (!resp.ok) throw new Error("Todos nicht gefunden");

        const todos = await resp.json();
        const todosList = document.getElementById("todos-list");
        if (!todosList) return;
        todosList.innerHTML = "";
        todosList.classList.add("todos-list");

        if (!Array.isArray(todos) || todos.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Keine Aufgaben vorhanden.";
            li.className = "todo-empty";
            todosList.appendChild(li);
            return;
        }

        todos.forEach(todo => {
            const li = document.createElement("li");
            li.className = "todo-row";
            if (todo.done) li.classList.add("todo-done");

            // Checkbox-Element (button für einfaches Styling)
            const checkbox = document.createElement("button");
            checkbox.type = "button";
            checkbox.className = "todo-checkbox";
            checkbox.setAttribute("aria-label", todo.done ? "Aufgabe erledigt" : "Aufgabe als erledigt markieren");
            checkbox.setAttribute("aria-checked", todo.done ? "true" : "false");
            checkbox.dataset.todoId = todo.id;

            const inner = document.createElement("span");
            inner.className = "check";
            checkbox.appendChild(inner);

            // Titel
            const span = document.createElement("span");
            span.className = "todo-title";
            span.textContent = todo.title;

            // Klick-Handler: optimistisch UI updaten, dann PATCH an Backend
            checkbox.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Optimistisches UI-Update
                const nowDone = li.classList.toggle("todo-done");
                checkbox.setAttribute("aria-label", nowDone ? "Aufgabe erledigt" : "Aufgabe als erledigt markieren");
                checkbox.setAttribute("aria-checked", nowDone ? "true" : "false");

                try {
                    const res = await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ done: nowDone })
                    });

                    if (!res.ok) {
                        throw new Error("Speichern fehlgeschlagen");
                    }
                    // Optional: const updated = await res.json();
                } catch (err) {
                    console.error("Fehler beim Speichern des Todo-Status:", err);
                    // Rollback bei Fehler
                    const rolledBack = li.classList.toggle("todo-done");
                    checkbox.setAttribute("aria-label", rolledBack ? "Aufgabe erledigt" : "Aufgabe als erledigt markieren");
                    checkbox.setAttribute("aria-checked", rolledBack ? "true" : "false");
                }
            });

            li.appendChild(checkbox);
            li.appendChild(span);
            todosList.appendChild(li);
        });
    } catch (err) {
        console.error("Fehler beim Laden der Todos:", err);
        const todosList = document.getElementById("todos-list");
        if (todosList) todosList.innerHTML = "<li>Fehler beim Laden der To-Dos</li>";
    }
}