const elements = {
  playlistName: document.querySelector("#playlist-name"),
  playlistIntroduction: document.querySelector("#playlist-introduction"),
  playlistLink: document.querySelector("#playlist-link"),
  songsIntroduction: document.querySelector("#songs-introduction"),
  trackList: document.querySelector("#track-list"),
  songsList: document.querySelector("#songs-list"),
  stolenIntroduction: document.querySelector("#stolen-introduction"),
  stolenWords: document.querySelector("#stolen-words"),
  error: document.querySelector("#music-error")
};

// Crea il player SoundCloud soltanto dopo un'azione esplicita dell'utente.
function loadPlayer(button, song) {
  const iframe = document.createElement("iframe");
  iframe.title = `Player di ${song.title}`;
  iframe.allow = "autoplay";
  iframe.loading = "lazy";
  iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23d8c8a8&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;
  button.replaceWith(iframe);
}

// Costruisce una canzone completa mantenendo introduzione e testo separati.
function createSong(song, index) {
  const article = document.createElement("article");
  article.id = `song-${song.id}`;
  article.className = "song-entry";

  const lines = song.lyrics.split("\n").map((line) => `<p>${line}</p>`).join("");
  article.innerHTML = `
    <header><span>${String(index + 1).padStart(2, "0")}</span><h3></h3></header>
    <p class="song-introduction"></p>
    <div class="song-player"><button type="button">Ascolta su SoundCloud <span aria-hidden="true">▶</span></button></div>
    <details class="lyrics"><summary>Leggi il testo completo <span aria-hidden="true">＋</span></summary><div>${lines}</div></details>`;
  article.querySelector("h3").textContent = song.title;
  article.querySelector(".song-introduction").textContent = song.introduction;
  article.querySelector(".song-player button").addEventListener("click", (event) => loadPlayer(event.currentTarget, song));
  return article;
}

// Collega il rimando a "I Ponti", ora che la pagina esiste.
function renderSongsIntroduction(text) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\[\s*🌈\s*I Ponti\s*\]/, '<a class="music-inline-mark" href="../ponti/">🌈 I Ponti</a>');
}

// Renderizza indice, canzoni e citazioni nell'ordine dichiarato dal JSON.
function renderMusic(data) {
  elements.playlistName.textContent = data.playlist.name;
  elements.playlistIntroduction.textContent = data.playlist.introduction;
  elements.playlistLink.href = data.playlist.url;
  elements.songsIntroduction.innerHTML = renderSongsIntroduction(data.songsIntroduction);
  elements.stolenIntroduction.textContent = data.stolenWords.introduction;

  data.songs.forEach((song, index) => {
    const link = document.createElement("a");
    link.href = `#song-${song.id}`;
    link.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong></strong>`;
    link.querySelector("strong").textContent = song.title;
    elements.trackList.append(link);
    elements.songsList.append(createSong(song, index));
  });

  data.stolenWords.items.forEach((item) => {
    const quote = document.createElement("blockquote");
    quote.innerHTML = `<p></p><cite></cite>`;
    quote.querySelector("p").textContent = item.quote;
    quote.querySelector("cite").textContent = item.source;
    elements.stolenWords.append(quote);
  });
}

// Carica e valida il contenuto statico della pagina.
async function init() {
  try {
    const response = await fetch("../content/music.json");
    if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
    const data = await response.json();
    if (data.songs?.length !== 9 || !Array.isArray(data.stolenWords?.items)) throw new Error("Contenuto musicale incompleto");
    renderMusic(data);
  } catch (error) {
    console.error("Errore nel caricamento delle Cuffiette:", error);
    elements.error.hidden = false;
  }
}

void init();
