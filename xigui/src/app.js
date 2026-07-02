const DATA_URL = "./src/data/questions.json";
const STORAGE_KEY = "xigui.qa.learned.v1";

const state = {
  data: null,
  query: "",
  chapter: "all",
  mode: "list",
  revealed: new Set(),
  learned: loadLearned(),
  flashIndex: 0,
  flashRevealed: false,
};

const els = {
  totalCount: document.querySelector("#totalCount"),
  learnedCount: document.querySelector("#learnedCount"),
  sourceMeta: document.querySelector("#sourceMeta"),
  searchInput: document.querySelector("#searchInput"),
  chapterSelect: document.querySelector("#chapterSelect"),
  chapterList: document.querySelector("#chapterList"),
  resultCount: document.querySelector("#resultCount"),
  activeFilter: document.querySelector("#activeFilter"),
  modeButtons: document.querySelectorAll("[data-mode]"),
  listView: document.querySelector("#listView"),
  flashView: document.querySelector("#flashView"),
  emptyState: document.querySelector("#emptyState"),
  flashMeta: document.querySelector("#flashMeta"),
  flashQuestion: document.querySelector("#flashQuestion"),
  flashAnswer: document.querySelector("#flashAnswer"),
  prevCard: document.querySelector("#prevCard"),
  nextCard: document.querySelector("#nextCard"),
  revealCard: document.querySelector("#revealCard"),
  markFlash: document.querySelector("#markFlash"),
};

init();

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`题库加载失败：${response.status}`);
    }
    state.data = await response.json();
    renderFilters();
    bindEvents();
    render();
  } catch (error) {
    els.resultCount.textContent = "加载失败";
    els.emptyState.hidden = false;
    els.emptyState.querySelector("span").textContent = error.message;
  }
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    state.flashIndex = 0;
    state.flashRevealed = false;
    render();
  });

  els.chapterSelect.addEventListener("change", (event) => {
    setChapter(event.target.value);
  });

  els.chapterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chapter]");
    if (button) {
      setChapter(button.dataset.chapter);
    }
  });

  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      state.flashIndex = 0;
      state.flashRevealed = false;
      render();
    });
  });

  els.listView.addEventListener("click", (event) => {
    const revealButton = event.target.closest("[data-reveal]");
    const learnButton = event.target.closest("[data-learn]");
    if (revealButton) {
      toggleReveal(revealButton.dataset.reveal);
    }
    if (learnButton) {
      toggleLearned(learnButton.dataset.learn);
    }
  });

  els.prevCard.addEventListener("click", () => moveFlash(-1));
  els.nextCard.addEventListener("click", () => moveFlash(1));
  els.revealCard.addEventListener("click", () => {
    state.flashRevealed = !state.flashRevealed;
    renderFlash();
  });
  els.markFlash.addEventListener("click", () => {
    const item = filteredQuestions()[state.flashIndex];
    if (item) {
      toggleLearned(item.id);
    }
  });
}

function setChapter(chapter) {
  state.chapter = chapter;
  state.flashIndex = 0;
  state.flashRevealed = false;
  render();
}

function renderFilters() {
  const options = [
    `<option value="all">全部章节</option>`,
    ...state.data.chapters.map(
      (chapter) =>
        `<option value="${escapeAttr(chapter.title)}">${escapeHtml(chapter.title)}（${chapter.count}）</option>`,
    ),
  ];
  els.chapterSelect.innerHTML = options.join("");

  els.chapterList.innerHTML = [
    chapterButton("all", "全部章节", state.data.count),
    ...state.data.chapters.map((chapter) => chapterButton(chapter.title, chapter.title, chapter.count)),
  ].join("");
}

function chapterButton(value, label, count) {
  return `
    <button type="button" class="chapter-button" data-chapter="${escapeAttr(value)}">
      <span>${escapeHtml(label)}</span>
      <span>${count}</span>
    </button>
  `;
}

function render() {
  if (!state.data) return;

  const filtered = filteredQuestions();
  els.totalCount.textContent = `${state.data.count} 题`;
  els.learnedCount.textContent = `已掌握 ${state.learned.size}`;
  els.sourceMeta.textContent = `${state.data.count} 题 / ${state.data.chapters.length} 章`;
  els.resultCount.textContent = `${filtered.length} 题`;
  els.activeFilter.textContent = state.chapter === "all" ? "全部章节" : state.chapter;
  els.chapterSelect.value = state.chapter;

  els.chapterList.querySelectorAll("[data-chapter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.chapter === state.chapter);
  });

  els.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });

  els.listView.hidden = state.mode !== "list" || filtered.length === 0;
  els.flashView.hidden = state.mode !== "flash" || filtered.length === 0;
  els.emptyState.hidden = filtered.length !== 0;

  if (state.mode === "list") {
    renderList(filtered);
  } else {
    renderFlash();
  }
}

function renderList(items) {
  els.listView.innerHTML = items.map((item) => questionCard(item)).join("");
}

function questionCard(item) {
  const isRevealed = state.revealed.has(item.id);
  const isLearned = state.learned.has(item.id);
  const answer = isRevealed ? answerBlock(item) : "";

  return `
    <article class="question-card" id="${item.id}">
      <div class="card-head">
        <div class="card-meta">
          <span class="pill chapter">${escapeHtml(item.chapter)}</span>
          <span class="pill">第 ${item.chapterQuestionNumber} 题</span>
          <span class="pill">总序 ${item.number}</span>
          ${isLearned ? `<span class="pill learned">已掌握</span>` : ""}
        </div>
      </div>
      <h2 class="question-text">${escapeHtml(item.question)}</h2>
      <div class="card-actions">
        <button type="button" class="primary-action" data-reveal="${item.id}">
          ${isRevealed ? "隐藏答案" : "显示答案"}
        </button>
        <button type="button" class="secondary-action ${isLearned ? "is-learned" : ""}" data-learn="${item.id}">
          ${isLearned ? "取消掌握" : "标记掌握"}
        </button>
      </div>
      ${answer}
    </article>
  `;
}

function renderFlash() {
  const items = filteredQuestions();
  if (!items.length) return;
  if (state.flashIndex >= items.length) {
    state.flashIndex = items.length - 1;
  }

  const item = items[state.flashIndex];
  const isLearned = state.learned.has(item.id);
  els.flashMeta.innerHTML = `
    <span class="pill chapter">${escapeHtml(item.chapter)}</span>
    <span class="pill">第 ${item.chapterQuestionNumber} 题</span>
    <span class="pill">${state.flashIndex + 1} / ${items.length}</span>
    ${isLearned ? `<span class="pill learned">已掌握</span>` : ""}
  `;
  els.flashQuestion.textContent = item.question;
  els.flashAnswer.hidden = !state.flashRevealed;
  els.flashAnswer.innerHTML = state.flashRevealed ? answerHtml(item) : "";
  els.revealCard.textContent = state.flashRevealed ? "隐藏答案" : "显示答案";
  els.markFlash.textContent = isLearned ? "取消掌握" : "标记掌握";
  els.markFlash.classList.toggle("is-learned", isLearned);
}

function answerBlock(item) {
  return `<div class="answer">${answerHtml(item)}</div>`;
}

function answerHtml(item) {
  const tip = item.tip ? `<div class="tip">${escapeHtml(item.tip)}</div>` : "";
  return `${escapeHtml(item.answer)}${tip}`;
}

function filteredQuestions() {
  const query = normalize(state.query);
  return state.data.questions.filter((item) => {
    const chapterMatch = state.chapter === "all" || item.chapter === state.chapter;
    if (!chapterMatch) return false;
    if (!query) return true;
    const haystack = normalize(`${item.question}\n${item.answer}\n${item.tip}\n${item.chapter}`);
    return haystack.includes(query);
  });
}

function toggleReveal(id) {
  if (state.revealed.has(id)) {
    state.revealed.delete(id);
  } else {
    state.revealed.add(id);
  }
  renderList(filteredQuestions());
}

function toggleLearned(id) {
  if (state.learned.has(id)) {
    state.learned.delete(id);
  } else {
    state.learned.add(id);
  }
  saveLearned();
  render();
}

function moveFlash(delta) {
  const items = filteredQuestions();
  if (!items.length) return;
  state.flashIndex = (state.flashIndex + delta + items.length) % items.length;
  state.flashRevealed = false;
  renderFlash();
}

function normalize(value) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function loadLearned() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveLearned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.learned]));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
