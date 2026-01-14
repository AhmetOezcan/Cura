"use strict";

//DAY CARDS – echte Datumswerte

const eventsContainer = document.getElementById("eventsContainer");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toDEDate(d) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function weekdayDE(d) {
  return d.toLocaleDateString("de-DE", { weekday: "long" });
}

function labelForDay(offset, d) {
  if (offset === 0) return "Heute";
  if (offset === 1) return "Morgen";
  const w = weekdayDE(d);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function createDayCard(offset, dateObj) {
  const section = document.createElement("section");
  section.className = "day-card";
  section.dataset.date = toISODate(dateObj);

  const header = document.createElement("div");
  header.className = "day-header";

  const h2 = document.createElement("h2");
  h2.textContent = labelForDay(offset, dateObj);

  const dateSpan = document.createElement("span");
  dateSpan.className = "day-date";
  dateSpan.textContent = toDEDate(dateObj);

  header.append(h2, dateSpan);

  const list = document.createElement("div");
  list.className = "event-list";

  section.append(header, list);
  return section;
}

function renderNextDays(count = 7) {
  eventsContainer.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    eventsContainer.appendChild(createDayCard(i, d));
  }
}

// Platzhalter-Events hinzufügen
function addPlaceholderEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const placeholders = [
    { offset: 0, title: "Physiotherapie", time: "10:00" },
    { offset: 0, title: "Mittagessen", time: "12:30" },
    { offset: 1, title: "Musiktherapie", time: "14:00" },
    { offset: 2, title: "Lesestunde", time: "15:00" },
    { offset: 3, title: "Physiotherapie", time: "09:30" },
    { offset: 3, title: "Sturzvorbeugungs-Training", time: "16:00" },
    { offset: 4, title: "Musiktherapie", time: "11:00" },
    { offset: 5, title: "Lesestunde", time: "10:30" },
    { offset: 5, title: "Mittagessen", time: "12:30" },
  ];

  placeholders.forEach(event => {
    const eventDate = new Date(today);
    eventDate.setDate(today.getDate() + event.offset);
    const dateISO = toISODate(eventDate);
    addEventToDay(dateISO, event.title, event.time);
  });
}

renderNextDays();
addPlaceholderEvents();

/* =========================================================
   MODAL
   ========================================================= */

const moreBtn = document.querySelector(".more-btn");
const overlay = document.getElementById("modalOverlay");
const closeBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("eventForm");

const nameInput = document.getElementById("eventName");
const dateInput = document.getElementById("eventDate");
const timeInput = document.getElementById("eventTime");

function openModal() {
  overlay.hidden = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateInput.value = toISODate(today);

  nameInput.focus();
}

function closeModal() {
  overlay.hidden = true;
  form.reset();
}

moreBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (!overlay.hidden && e.key === "Escape") closeModal();
});

/* =========================================================
   EVENTS
   ========================================================= */

function pickColorClass(name) {
  const n = name.toLowerCase();

  if (n.includes("physio")) return "event-green";
  if (n.includes("musik")) return "event-yellow";
  if (n.includes("lese")) return "event-purple";
  if (n.includes("sturz")) return "event-orange";

  return "event-blue";
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function addEventToDay(dateISO, title, timeValue) {
  const dayCard = document.querySelector(
    `.day-card[data-date="${dateISO}"]`
  );

  if (!dayCard) {
    alert("Für dieses Datum gibt es keine Tagesansicht.");
    return;
  }

  const list = dayCard.querySelector(".event-list");

  const item = document.createElement("div");
  item.classList.add("event-item", pickColorClass(title));

  const strong = document.createElement("strong");
  strong.textContent = title;

  const time = document.createElement("span");
  time.className = "event-time";
  time.textContent = timeValue;

  item.append(strong, time);

  const items = Array.from(list.querySelectorAll(".event-item"));
  const newMinutes = toMinutes(timeValue);

  const before = items.find(el => {
    const t = el.querySelector(".event-time").textContent;
    return toMinutes(t) > newMinutes;
  });

  if (before) list.insertBefore(item, before);
  else list.appendChild(item);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = nameInput.value.trim();
  const dateISO = dateInput.value;
  const timeValue = timeInput.value;

  if (!title || !dateISO || !timeValue) return;

  addEventToDay(dateISO, title, timeValue);
  closeModal();
});
