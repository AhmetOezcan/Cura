const form = document.getElementById("announcement-form");
const list = document.getElementById("announcement-list");
const msg = document.getElementById("form-msg");

function formatDate(isoString) {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function addAnnouncementToTop(item) {
  const li = document.createElement("li");

  const h2 = document.createElement("h2");
  h2.textContent = item.title;

  const p = document.createElement("p");
  p.textContent = item.message;

  const small = document.createElement("small");
  small.textContent = `von ${item.author} • ${formatDate(item.created_at)}`;

  li.appendChild(h2);
  li.appendChild(p);
  li.appendChild(small);

  list.prepend(li);
}

async function loadAnnouncements() {
  list.innerHTML = ""; // alte placeholder weg
  try {
    const res = await fetch("http://127.0.0.1:8000/announcements");
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.detail || "Konnte Announcements nicht laden";
      return;
    }

    data.forEach((item) => {
      const li = document.createElement("li");

      const h2 = document.createElement("h2");
      h2.textContent = item.title;

      const p = document.createElement("p");
      p.textContent = item.message;

      const small = document.createElement("small");
      small.textContent = `von ${item.author} • ${formatDate(item.created_at)}`;

      li.appendChild(h2);
      li.appendChild(p);
      li.appendChild(small);

      list.appendChild(li);
    });
  } catch (e) {
    msg.textContent = "Server nicht erreichbar (Backend läuft?)";
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  msg.textContent = "";

  const title = document.getElementById("title").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!title || !message) {
    msg.textContent = "Bitte Titel und Nachricht ausfüllen.";
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        message,
        author: "Du" // später echter User
      })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.detail || "Posting fehlgeschlagen";
      return;
    }

    addAnnouncementToTop(data);
    form.reset();
    msg.textContent = "Announcement gespeichert";
  } catch (e) {
    msg.textContent = "Server nicht erreichbar (Backend läuft?)";
  }
});

// beim Start laden
loadAnnouncements();
