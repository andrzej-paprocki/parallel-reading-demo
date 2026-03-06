document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");
  const engSmaller = document.getElementById("eng-smaller");
  const engBigger = document.getElementById("eng-bigger");
  const plSmaller = document.getElementById("pl-smaller");
  const plBigger = document.getElementById("pl-bigger");
  const openColors = document.getElementById("open-colors");
  const closeColors = document.getElementById("close-colors");
  const colorModal = document.getElementById("color-modal");
  const bgColorPicker = document.getElementById("bg-color");
  const engColorPicker = document.getElementById("eng-color");
  const plColorPicker = document.getElementById("pl-color");
  const voiceSelect = document.getElementById("voice-select");
  const rateSlider = document.getElementById("rate-slider");
  const rateValue = document.getElementById("rate-value");
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  if (!eng || !pl || eng.length !== pl.length) {
    content.innerHTML = "<p>Ошибка: массивы eng и pl не загружены или разной длины.</p>";
    return;
  }

  // -------------------- ГОЛОСА --------------------
  let voices = [];
  let currentVoice = localStorage.getItem("voiceIndex");
  let speechRate = parseFloat(localStorage.getItem("speechRate")) || 1.0;

function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  // если голос не сохранён — ищем Google US English
  if (currentVoice === null) {
    const googleVoiceIndex = voices.findIndex(v => 
      v.name.includes("Google US English") && v.lang === "en-US"
    );
    currentVoice = googleVoiceIndex !== -1 ? googleVoiceIndex : 0;
  }

  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (i == currentVoice) option.selected = true;
    voiceSelect.appendChild(option);
  });
}

  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
  voiceSelect.addEventListener("change", () => {
    currentVoice = voiceSelect.value;
    localStorage.setItem("voiceIndex", currentVoice);
  });
  rateSlider.value = speechRate;
  rateValue.textContent = speechRate.toFixed(1);
  rateSlider.addEventListener("input", () => {
    speechRate = parseFloat(rateSlider.value);
    rateValue.textContent = speechRate.toFixed(1);
    localStorage.setItem("speechRate", speechRate);
  });

  let currentUtterance = null;
  let currentButton = null;

  // -------------------- КАРТОЧКИ --------------------
  eng.forEach((sentence, i) => {
    const div = document.createElement("div");
    div.className = "sentence";
    div.dataset.index = i;
    // div.innerHTML = `
    //   <div class="english-wrapper">
    //     <div class="english-text">${sentence}</div>
    //     <button class="speak-btn" title="Произношение">🔊</button>
    //   </div>
    //   <div class="translation">${pl[i]}</div>
    // `;

    div.innerHTML = `
      <div class="english-wrapper">
        <div class="english-text">${sentence}</div>
        <button class="speak-btn" title="Произношение">🔊</button>
        <button class="translate-btn" title="Показать перевод">🌐</button>
      </div>
      <div class="translation">${pl[i]}</div>
    `;

    const speakBtn = div.querySelector(".speak-btn");
    div.addEventListener("click", (e) => {
      const targetBtn = e.target.closest(".speak-btn");
      if (targetBtn) {
        if (currentButton === targetBtn && currentUtterance) {
          speechSynthesis.cancel();
          currentButton.classList.remove("playing");
          currentButton = null;
          currentUtterance = null;
          return;
        }
        if (currentUtterance) {
          speechSynthesis.cancel();
          if (currentButton) currentButton.classList.remove("playing");
        }
        currentButton = targetBtn;
        currentButton.classList.add("playing");
        const utter = new SpeechSynthesisUtterance(sentence);
        utter.lang = "en-US";
        utter.rate = speechRate;
        if (voices[currentVoice]) utter.voice = voices[currentVoice];
        utter.onend = () => { if (currentButton) currentButton.classList.remove("playing"); currentButton = null; currentUtterance = null; };
        currentUtterance = utter;
        speechSynthesis.speak(utter);
        return;
      }
      div.querySelector(".translation").classList.toggle("visible");
      saveLastIndex(i);
    });
    content.appendChild(div);
  });

  // -------------------- ШРИФТЫ --------------------
  let engFont = parseInt(localStorage.getItem("engFont")) || 18;
  let plFont = parseInt(localStorage.getItem("plFont")) || 18;
  const updateFont = () => {
    document.documentElement.style.setProperty("--eng-font-size", `${engFont}px`);
    document.documentElement.style.setProperty("--pl-font-size", `${plFont}px`);
    localStorage.setItem("engFont", engFont);
    localStorage.setItem("plFont", plFont);
  };
  updateFont();
  engSmaller.addEventListener("click", () => { engFont = Math.max(12, engFont - 2); updateFont(); });
  engBigger.addEventListener("click", () => { engFont = Math.min(40, engFont + 2); updateFont(); });
  plSmaller.addEventListener("click", () => { plFont = Math.max(12, plFont - 2); updateFont(); });
  plBigger.addEventListener("click", () => { plFont = Math.min(40, plFont + 2); updateFont(); });

  // -------------------- ЦВЕТА --------------------
  const defaultColors = { bg: "#fafafa", eng: "#222222", pl: "#0077cc" };
  const currentColors = {
    bg: localStorage.getItem("bgColor") || defaultColors.bg,
    eng: localStorage.getItem("engColor") || defaultColors.eng,
    pl: localStorage.getItem("plColor") || defaultColors.pl
  };
  applyColors(currentColors);
  bgColorPicker.value = currentColors.bg;
  engColorPicker.value = currentColors.eng;
  plColorPicker.value = currentColors.pl;
  function applyColors(colors) {
    document.documentElement.style.setProperty("--bg", colors.bg);
    document.documentElement.style.setProperty("--eng-color", colors.eng);
    document.documentElement.style.setProperty("--pl-color", colors.pl);
  }
  openColors.addEventListener("click", () => colorModal.classList.remove("hidden"));
  closeColors && closeColors.addEventListener("click", () => colorModal.classList.add("hidden"));
  [bgColorPicker, engColorPicker, plColorPicker].forEach(input => {
    input.addEventListener("input", () => {
      const colors = { bg: bgColorPicker.value, eng: engColorPicker.value, pl: plColorPicker.value };
      applyColors(colors);
      localStorage.setItem("bgColor", colors.bg);
      localStorage.setItem("engColor", colors.eng);
      localStorage.setItem("plColor", colors.pl);
    });
  });

  // -------------------- DARK MODE --------------------
  const isDark = localStorage.getItem("darkMode") !== "false";
  if (isDark) document.body.classList.add("dark");
  darkModeToggle.checked = isDark;
  darkModeToggle.addEventListener("change", () => {
    const enabled = darkModeToggle.checked;
    document.body.classList.toggle("dark", enabled);
    localStorage.setItem("darkMode", enabled);
  });

  // -------------------- ПЕРЕВОД И ПОДСВЕТКА СЛОВ --------------------
  let highlightedWordEl = null;
  function clearHighlightedWord() {
    if (highlightedWordEl) {
      highlightedWordEl.classList.remove("selected-word");
      highlightedWordEl = null;
    }
  }

  async function translateWord(word) {
    word = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
    if (!word) return "";
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|pl`);
      const data = await res.json();
      let translation = data?.responseData?.translatedText || "";
      if (translation && translation.length > 1 && !translation.includes(word)) return translation;
    } catch (err) {}
    try {
      const res2 = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: word, source: "en", target: "pl" })
      });
      const data2 = await res2.json();
      if (data2?.translatedText) return data2.translatedText;
    } catch (err) {}
    return "(no translation)";
  }

  // function speakWord(text) {
  //   const utter = new SpeechSynthesisUtterance(text);
  //   utter.lang = "en-US";
  //   const voices = speechSynthesis.getVoices();
  //   const v = voices.find(v => v.lang.startsWith("en")) || voices[0];
  //   if (v) utter.voice = v;
  //   utter.rate = speechRate;
  //   speechSynthesis.cancel();
  //   speechSynthesis.speak(utter);
  // }

  function speakWord(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = speechRate;

    // используем голос из настроек
    if (voices[currentVoice]) {
      utter.voice = voices[currentVoice];
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  function showPopup(word, translation) {
    let popup = document.querySelector(".word-popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.className = "word-popup";
      popup.innerHTML = `<span class="word-text"></span><span class="translation-text"></span><button class="speak-en">🔊</button><span class="close-btn">×</span>`;
      document.body.appendChild(popup);
      popup.querySelector(".close-btn").addEventListener("click", () => { popup.remove(); clearHighlightedWord(); });
    }
    popup.querySelector(".word-text").textContent = word;
    popup.querySelector(".translation-text").textContent = translation;
    popup.querySelector(".speak-en").onclick = () => speakWord(word);
  }

  function makeWordsClickable() {
    document.querySelectorAll(".english-text").forEach(span => {
      const words = span.textContent.split(/\s+/).filter(w => w.trim() !== "");
      span.innerHTML = words.map(w => {
        const clean = w.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
        const prefix = w.match(/^[^a-zA-Z]+/)?.[0] || '';
        const suffix = w.match(/[^a-zA-Z]+$/)?.[0] || '';
        return `<span class="word">${prefix}<span class="word-highlight" data-clean="${clean}">${clean}</span>${suffix}</span>`;
      }).join(" ");
    });
    document.querySelectorAll(".word-highlight").forEach(wordEl => {
      // wordEl.addEventListener("click", async e => {
      //   e.stopPropagation();
      //   clearHighlightedWord();
      //   highlightedWordEl = wordEl;
      //   wordEl.classList.add("selected-word");
      //   const cleanWord = wordEl.dataset.clean;
      //   if (!cleanWord) return;
      //   wordEl.classList.add("loading");
      //   const translation = await translateWord(cleanWord);
      //   wordEl.classList.remove("loading");
      //   showPopup(cleanWord, translation);
      // });
      wordEl.addEventListener("click", async e => {
        e.stopPropagation();
        clearHighlightedWord();
        highlightedWordEl = wordEl;
        wordEl.classList.add("selected-word");

        const cleanWord = wordEl.dataset.clean;
        if (!cleanWord) return;

        speakWord(cleanWord);   // ← автоматическое произношение

        wordEl.classList.add("loading");
        const translation = await translateWord(cleanWord);
        wordEl.classList.remove("loading");

        showPopup(cleanWord, translation);
      });

    });
  }
  makeWordsClickable();

  // -------------------- Сохранение скролла --------------------
  function saveLastIndex(i) { localStorage.setItem("lastIndex", i); }
  const savedIndex = parseInt(localStorage.getItem("lastIndex"));
  if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < eng.length) {
    const el = content.querySelector(`.sentence[data-index="${savedIndex}"]`);
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
  }
  window.addEventListener("scroll", () => {
    const sentences = document.querySelectorAll(".sentence");
    for (let i = sentences.length - 1; i >= 0; i--) {
      const rect = sentences[i].getBoundingClientRect();
      if (rect.top < window.innerHeight / 2) { saveLastIndex(i); break; }
    }
  });
});