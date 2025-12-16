// Basis-URL Backend
const API_BASE_URL = "http://127.0.0.1:8000";

// Container für die Patienten-Karten holen
const patientList = document.getElementById("patient-list");


// Eine Patientenkarte als <article> bauen
function createPatientCard(patient) {
    const article = document.createElement("article");
    article.classList.add("patient-card");
    article.dataset.patientId = patient.id;

    // Name
    const name = document.createElement("h2");
    const nameParts = (patient.name || "").trim().split(/\s+/);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ");
    name.append(firstName);
    if (lastName) {
        name.appendChild(document.createElement("br"));
        name.append(lastName);
    }

    // Zimmernummer
    const room = document.createElement("p");
    room.classList.add("patient-room");
    room.textContent = patient.room_number ? `Zimmer ${patient.room_number}` : "Zimmer —";

    // Container für To-Do Vorschau
    const todoTitle = document.createElement("h3");
    todoTitle.textContent = "To-Dos";
    todoTitle.classList.add("todo-preview-title");

    const todoList = document.createElement("ul");
    todoList.classList.add("todo-preview-list");

    // Inhalte ins article packen
    article.appendChild(name);
    article.appendChild(room);
    article.appendChild(todoTitle);
    article.appendChild(todoList);

    // To-Do Vorschau laden (ohne hinzufügen)
    loadTodosPreviewForPatient(patient.id, todoList);

    // Klick auf Karte → zur Detailseite
    article.addEventListener("click", () => {
        window.location.href = `patientenseite.html?id=${patient.id}`;
});
    return article;
}


// To-Do Vorschau (max. 3 Aufgaben) für einen Patienten laden
async function loadTodosPreviewForPatient(patientId, listElement) {
    try {
        const resp = await fetch(`${API_BASE_URL}/patients/${patientId}/todos`);
        if (!resp.ok) {
            throw new Error("Fehler beim Laden der Todos");
        }

        const todos = await resp.json();
        listElement.innerHTML = "";

        if (todos.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Noch keine Aufgaben.";
            li.classList.add("todo-empty");
            listElement.appendChild(li);
            return;
        }

        // nur die ersten 3 To-Dos als Vorschau anzeigen
        const previewTodos = todos.slice(0, 3);

        previewTodos.forEach(todo => {
    const li = document.createElement("li");
    li.textContent = todo.title;
    li.classList.add("todo-item");

    // Status-Klasse hinzufügen
    if (todo.done) {
        li.classList.add("todo-done");
    } else {
        li.classList.add("todo-pending");
    }

    listElement.appendChild(li);
});

        // Wenn es mehr gibt, Hinweis anzeigen
        if (todos.length > 3) {
            const more = document.createElement("li");
            more.textContent = `+ ${todos.length - 3} weitere Aufgabe(n)…`;
            more.classList.add("todo-more");
            listElement.appendChild(more);
        }
    } catch (err) {
        console.error("Fehler beim Laden der To-Dos:", err);
        listElement.innerHTML = "";
        const li = document.createElement("li");
        li.textContent = "Fehler beim Laden der To-Dos.";
        li.classList.add("todo-error");
        listElement.appendChild(li);
    }
}


// Patienten vom Backend laden und Karten bauen
async function loadPatients() {
    try {
        const response = await fetch(`${API_BASE_URL}/patients`);
        if (!response.ok) {
            throw new Error("Fehler beim Laden der Patienten");
        }

        const patients = await response.json();

        // alten Inhalt leeren
        patientList.innerHTML = "";

        // für jeden Patienten eine Karte bauen
        patients.forEach((patient) => {
            const card = createPatientCard(patient);
            patientList.appendChild(card);
        });

        // Falls keine Patienten vorhanden
        if (patients.length === 0) {
            const info = document.createElement("p");
            info.textContent = "Noch keine Patienten angelegt.";
            info.style.padding = "16px";
            patientList.appendChild(info);
        }
    } catch (error) {
        console.error("Fehler beim Laden der Patienten:", error);
        const err = document.createElement("p");
        err.textContent = "Fehler beim Verbinden mit dem Server.";
        err.style.color = "red";
        err.style.padding = "16px";
        patientList.appendChild(err);
    }
}


// Wenn Seite geladen ist → Patienten laden
document.addEventListener("DOMContentLoaded", loadPatients);
