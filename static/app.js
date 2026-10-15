// Батырманы екі рет басып, жауапты қайта жіберуге жол бермеу және күту хабарламасын көрсету.
document.querySelectorAll("form[data-submit-once]").forEach((form) => {
  form.addEventListener("submit", () => {
    const btn = form.querySelector("button[type=submit]");
    if (!btn) return;
    if (btn.dataset.loading) btn.textContent = btn.dataset.loading;
    // Форма жіберілгеннен кейін ғана өшіреміз, әйтпесе браузер мәнді жібермей қалуы мүмкін.
    setTimeout(() => { btn.disabled = true; }, 0);
  });
});

// Жауап өрісіндегі таңбалар санағышы.
document.querySelectorAll("[data-counter-for]").forEach((counter) => {
  const field = document.getElementById(counter.dataset.counterFor);
  if (!field) return;
  const update = () => { counter.textContent = field.value.length; };
  field.addEventListener("input", update);
  update();
});

// Код жазу өрісінде Tab пернесі шегініс қоссын.
document.querySelectorAll("textarea.code-input").forEach((area) => {
  area.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const { selectionStart: s, selectionEnd: end } = area;
    area.value = area.value.slice(0, s) + "  " + area.value.slice(end);
    area.selectionStart = area.selectionEnd = s + 2;
  });
});
