// Basis-URL deines Backends
const API_BASE_URL = "http://127.0.0.1:8000";

// Container für die Patienten-Karten holen
const patientList = document.getElementById("patient-list");

// Hilfsfunktion: eine Patientenkarte als <article> bauen
function createPatientCard(patient) {
    const article = document.createElement("article");
    article.classList.add("patient-card");

    const name = document.createElement("h2");
    name.textContent = patient.name;

    const age = document.createElement("p");
    age.textContent = `Alter: ${patient.age}`;

    const room = document.createElement("p");
    room.textContent = `Zimmernummer: ${patient.room_number}`;

    const diagnosis = document.createElement("p");
    diagnosis.textContent = `Diagnose: ${patient.diagnosis}`;

    const meds = document.createElement("p");
    meds.textContent = `Medikamente: ${patient.medication}`;

    const notes = document.createElement("p");
    notes.textContent = `Notizen: ${patient.notes}`;

    article.appendChild(name);
    article.appendChild(age);
    article.appendChild(room);
    article.appendChild(diagnosis);
    article.appendChild(meds);
    article.appendChild(notes);

    return article;
}

// Patienten vom Backend laden und in die Seite einfügen
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
        console.error(error);
        const err = document.createElement("p");
        err.textContent = "Fehler beim Verbinden mit dem Server.";
        err.style.color = "red";
        err.style.padding = "16px";
        patientList.appendChild(err);
    }
}

// Wenn Seite geladen ist → Patienten holen
document.addEventListener("DOMContentLoaded", loadPatients);
