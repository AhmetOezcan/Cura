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
    const notesEl = document.getElementById("notes-text");
    const avatarEl = document.getElementById("avatar-img");

    if (nameEl) nameEl.textContent = patient.name ?? "";
    if (ageEl) ageEl.textContent = patient.age ?? "-";
    if (roomEl) roomEl.textContent = patient.room_number ?? "-";
    if (diagEl) diagEl.textContent = patient.diagnosis ?? "-";
    if (notesEl) notesEl.textContent = patient.notes ?? "—";
    
    // Medikamenten-Organizer befüllen
    displayMedicationOrganizer(patient.medication ?? "");
    
    // Avatar (Placeholder-Service) — Name URL-encodiert
    if (avatarEl) {
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=27AE60&color=fff`;
    }
}

// Helfer: versucht JSON-Map aus medication-String zu parsen
function parseMedicationMap(text) {
    try {
        const obj = JSON.parse(text);
        if (obj && typeof obj === "object") return obj;
    } catch (e) {}
    return null;
}

// Medikamenten-Wochenorganizer anzeigen und Klick zum Eintragen (POST /medication/day)
function displayMedicationOrganizer(medicationText) {
    const organizer = document.getElementById("medication-organizer");
    if (!organizer) return;

    organizer.innerHTML = "";

    const days = [
        { label: "MO", day: "Montag" },
        { label: "DI", day: "Dienstag" },
        { label: "MI", day: "Mittwoch" },
        { label: "DO", day: "Donnerstag" },
        { label: "FR", day: "Freitag" },
        { label: "SA", day: "Samstag" },
        { label: "SO", day: "Sonntag" }
    ];

    const medsMap = parseMedicationMap(medicationText);

    days.forEach(dayObj => {
        const dayDiv = document.createElement("div");
        dayDiv.className = "medication-day";
        dayDiv.setAttribute("role", "button");
        dayDiv.tabIndex = 0;

        const label = document.createElement("div");
        label.className = "medication-day-label";
        label.textContent = dayObj.label;

        const content = document.createElement("div");
        content.className = "medication-day-content";

        if (medsMap && Array.isArray(medsMap[dayObj.label]) && medsMap[dayObj.label].length > 0) {
            medsMap[dayObj.label].forEach(m => {
                const item = document.createElement("span");
                item.className = "medication-day-item";
                item.textContent = m;
                content.appendChild(item);
            });
            dayDiv.classList.add("has-medication");
        } else if (!medsMap && medicationText && medicationText.trim()) {
            // Fallback: unstrukturierter String — anzeigen
            const item = document.createElement("span");
            item.className = "medication-day-item";
            item.textContent = medicationText;
            content.appendChild(item);
            dayDiv.classList.add("has-medication");
        } else {
            content.textContent = "—";
            content.classList.add("medication-day-empty");
        }

        // Klick: Prompt + POST an /patients/{id}/medication/day
        dayDiv.addEventListener("click", async () => {
            const med = window.prompt(`Medikament für ${dayObj.label} eintragen:`);
            if (!med || !med.trim()) return;

            const patientId = getPatientIdFromURL();
            if (!patientId) {
                alert("Keine Patient-ID gefunden.");
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/patients/${patientId}/medication/day`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ day: dayObj.label, medication: med.trim() })
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(res.status + " " + text);
                }

                // UI-Update: neuen Eintrag anhängen (optimistisch)
                const empty = content.querySelector(".medication-day-empty");
                if (empty) content.innerHTML = "";
                const item = document.createElement("span");
                item.className = "medication-day-item";
                item.textContent = med.trim();
                content.appendChild(item);
                dayDiv.classList.add("has-medication");
            } catch (err) {
                console.error("Fehler beim Speichern der Medikation:", err);
                alert("Speichern fehlgeschlagen: " + (err.message || ""));
            }
        });

        // Enter/Space für Tastatur unterstützen
        dayDiv.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                dayDiv.click();
            }
        });

        dayDiv.appendChild(label);
        dayDiv.appendChild(content);
        organizer.appendChild(dayDiv);
    });
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