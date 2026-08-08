const DATA_URL = new URL("../../../content/calendar.json", import.meta.url);
const timeline = document.getElementById("calendar-timeline");
const count = document.getElementById("calendar-count");

// Attende l'accesso condiviso, carica le date statiche e costruisce il Calendario.
async function init() {
  const user = await window.mondoBiancoAuthReady;
  if (!user) return;

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    validateCalendar(data);
    renderCalendar(data.events);
    count.textContent = `${data.events.length} date custodite`;
  } catch (error) {
    console.error("Impossibile caricare il Calendario.", error);
    count.textContent = "Le date non sono disponibili in questo momento.";
  }
}

// Verifica quantità, identificatori e formato delle date senza correggere i dati.
function validateCalendar(data) {
  if (!Array.isArray(data.events) || data.events.length !== 27) {
    throw new Error("Il Calendario deve contenere esattamente 27 date.");
  }

  const ids = new Set();
  data.events.forEach((event) => {
    if (ids.has(event.id)) throw new Error(`Identificatore duplicato: ${event.id}.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) throw new Error(`Data non valida: ${event.date}.`);
    ids.add(event.id);
  });
}

// Usa direttamente l'ordine dell'array JSON e crea le righe annuali di celle.
function renderCalendar(events) {
  const years = new Map();
  events.forEach((event, visualIndex) => {
    const year = event.date.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push({ event, visualIndex });
  });

  const fragment = document.createDocumentFragment();
  years.forEach((entries, year) => fragment.append(createYearGroup(year, entries)));
  timeline.replaceChildren(fragment);
}

// Crea il gruppo di celle appartenenti allo stesso anno.
function createYearGroup(year, entries) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const list = document.createElement("ol");

  section.className = "calendar-year";
  section.setAttribute("aria-labelledby", `calendar-year-${year}`);
  heading.id = `calendar-year-${year}`;
  heading.textContent = year;
  entries.forEach(({ event, visualIndex }) => list.append(createCalendarCell(event, visualIndex)));
  section.append(heading, list);
  return section;
}

// Crea una cella con foglio data e descrizione, alternando i due colori sull'intera sequenza.
function createCalendarCell(event, visualIndex) {
  const item = document.createElement("li");
  const time = document.createElement("time");
  const text = document.createElement("p");

  item.className = visualIndex % 2 === 0 ? "accent-green" : "accent-red";
  time.dateTime = event.date;
  time.setAttribute("aria-label", event.label);
  time.append(createDateFace(event.date));
  text.textContent = event.text;
  item.append(time, text);
  return item;
}

// Costruisce il piccolo foglio da calendario con mese, giorno e anno.
function createDateFace(date) {
  const [year, month, day] = date.split("-").map(Number);
  const face = document.createElement("span");
  const monthLabel = document.createElement("span");
  const dayLabel = document.createElement("span");
  const yearLabel = document.createElement("span");

  face.className = "date-face";
  face.setAttribute("aria-hidden", "true");
  monthLabel.className = "date-face-month";
  monthLabel.textContent = new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
  dayLabel.className = "date-face-day";
  dayLabel.textContent = String(day).padStart(2, "0");
  yearLabel.className = "date-face-year";
  yearLabel.textContent = year;
  face.append(monthLabel, dayLabel, yearLabel);
  return face;
}

void init();
