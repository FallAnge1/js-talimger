// Қорғауға арналған таныстырылым (6 слайд).
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");

const { applyTheme } = require("./apply_theme.js");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const pilot = data.pilot;
const OUT = path.join(__dirname, "..", "Таныстырылым_1-аралық_жоба.pptx");

const THEME = {
  name: "JS-Talimger",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B2130", lt1: "FFFFFF", dk2: "2B3550", lt2: "F3F5F9",
    accent1: "F0C419", accent2: "3B5BDB", accent3: "1E7B45", accent4: "7846BE", accent5: "E07A1F", accent6: "667085",
    hlink: "3B5BDB", folHlink: "7846BE",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.title = "JS-Тәлімгер — 1-аралық жоба";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------- Макеттер ----------
pres.defineSlideMaster({
  title: "DARK_TITLE",
  background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.75, w: 8.8, h: 1.0, fontSize: 48, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 2.85, w: 8.4, h: 0.9, fontSize: 20, color: C.background2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: HEX.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9.0, h: 0.7, fontSize: 30, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { text: { text: "JS-Тәлімгер · 1-аралық бақылау жобасы", options: { x: 0.5, y: 5.2, w: 6, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: HEX.accent6, align: "right" },
});
pres.defineSlideMaster({
  title: "DARK_CLOSE",
  background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9.0, h: 0.7, fontSize: 30, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: "AEB6C8", align: "right" },
});

// JS белгісі түріндегі сары шаршы — таныстырылымның көрнекі мотиві
function badge(slide, text, x, y, size = 0.5, fontSize = 16, name = "badge") {
  slide.addText(text, {
    shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, x, y, w: size, h: size,
    fill: { color: C.accent1 }, color: C.text1, bold: true, fontSize, align: "center", valign: "middle", margin: 0,
    fontFace: "Calibri", objectName: name, isTextBox: true,
  });
}
function card(slide, x, y, w, h, fill, name) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { type: "none" }, objectName: name });
}
const PH = { highlight: "FFFF00", color: "1B2130" };

// ---------- 1. Титул ----------
pres.addSection({ title: "Кіріспе" });
let s = pres.addSlide({ masterName: "DARK_TITLE", sectionTitle: "Кіріспе" });
badge(s, "JS", 0.6, 0.6, 0.9, 30, "logo");
s.addText("JS-Тәлімгер", { placeholder: "title" });
s.addText("JavaScript бойынша ЖИ кері байланысы бар диагностикалық бұлттық веб қосымша", { placeholder: "body" });
s.addText([
  { text: "1-аралық бақылау жобасы · «Педагогикалық зерттеулерді ұйымдастырудағы бұлтты технологиялар»", options: { breakLine: true } },
  { text: "Магистрант: Касым Сагынгали · 7М01511 – Информатика · 2026" },
], { x: 0.6, y: 4.3, w: 8.8, h: 0.7, fontSize: 14, color: "C9D0DE", margin: 0, paraSpaceAfter: 4, objectName: "meta", isTextBox: true });
s.addNotes("Сәлеметсіздер ме. Жобамның тақырыбы — педагогикалық зерттеуге арналған бұлттық веб қосымшаны әзірлеу және ЖИ сервисін API арқылы интеграциялау. Қосымша менің диссертациямның тақырыбына — JavaScript-ті ЖИ көмегімен оқытуға арналған онлайн платформаға — тікелей байланысты.");

// ---------- 2. Зерттеу міндеті ----------
pres.addSection({ title: "Зерттеу" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Зерттеу" });
s.addText("Зерттеу міндеті", { placeholder: "title" });
s.addText([
  { text: "Мәселе", options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } },
  { text: "JS-ті бастап үйренушілер циклдерде, массивтерде және DOM оқиғаларында тұрақты қателер жібереді, ал әр практикалық жауапқа жеке кері байланыс беру педагогтен көп уақыт талап етеді.", options: { fontSize: 15, color: C.text2 } },
], { x: 0.5, y: 1.2, w: 5.4, h: 1.45, valign: "top", margin: 0, objectName: "problem", isTextBox: true });
card(s, 0.5, 2.85, 5.4, 2.1, HEX.lt2, "question-card");
s.addText([
  { text: "Зерттеу сұрағы", options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } },
  { text: "Білім алушылар JS тапсырмаларында қандай қателер жібереді, ЖИ оларды педагогпен салыстырғанда қаншалықты дұрыс анықтайды және деңгейлік тапсырмадан кейін деңгейі өзгере ме?", options: { italic: true, fontSize: 15, color: C.text2 } },
], { x: 0.75, y: 3.0, w: 4.9, h: 1.8, valign: "top", margin: 0, objectName: "question", isTextBox: true });
const stats = [["20", "сұрақ: диагностикалық + қорытынды тест"], ["3 × 5", "деңгей × тапсырма банкі, ЖИ таңдайды"], ["4 × 2", "рубрика: 4 критерий, 0–2 балдан"]];
stats.forEach(([num, label], i) => {
  const y = 1.2 + i * 1.27;
  card(s, 6.3, y, 3.2, 1.1, HEX.lt2, `stat-card-${i}`);
  s.addText(num, { x: 6.5, y: y + 0.1, w: 1.25, h: 0.9, fontSize: 34, bold: true, color: C.accent2, valign: "middle", margin: 0, fontFace: "Cambria", objectName: `stat-num-${i}`, isTextBox: true });
  s.addText(label, { x: 7.8, y: y + 0.1, w: 1.6, h: 0.9, fontSize: 13, color: C.text2, valign: "middle", margin: 0, objectName: `stat-label-${i}`, isTextBox: true });
});
s.addNotes("Педагогикалық мәселе: практикалық тапсырмаларға жедел әрі нақты кері байланыс беру қиын. Зерттеу сұрағым — оқушылар қандай қателер жібереді және ЖИ кері байланысы оларды педагогпен салыстырғанда қаншалықты дұрыс анықтайды. Ол үшін қосымшада 10 сұрақтық тест және рубрикасы бар 3 практикалық тапсырма бар.");

// ---------- 3. Архитектура ----------
pres.addSection({ title: "Қосымша" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Қосымша" });
s.addText("Қосымша архитектурасы", { placeholder: "title" });
const img = path.join(__dirname, "architecture_bare.png");
s.addImage({ path: img, x: 0.5, y: 1.1, w: 9.0, h: 9.0 * 1260 / 3220, objectName: "architecture", altText: "Қосымша архитектурасы: браузер, Flask сервері, Firestore, Gemini API" });
s.addText([
  { text: "Flask (Render.com) · Firebase Firestore · Google Gemini API", options: { bold: true, breakLine: true } },
  { text: "API кілті тек серверде · жауап ЖИ-ден бұрын сақталады · педагог бағасы ЖИ нәтижесінен бөлек сақталады" },
], { x: 0.5, y: 4.6, w: 9.0, h: 0.55, fontSize: 13, color: C.text2, margin: 0, objectName: "arch-notes", isTextBox: true });
s.addNotes("Архитектура: қатысушы мен зерттеуші браузер арқылы Flask серверімен жұмыс істейді. Сервер Render.com бұлттық платформасында орналасқан. Деректер Firebase Firestore-да бес жинақта сақталады, ЖИ талдауын Google Gemini API жасайды. API кілті браузерге берілмейді, ол сервердің орта айнымалысында тұр.");

// ---------- 4. ЖИ интеграциясы ----------
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Қосымша" });
s.addText("ЖИ интеграциясы және педагог тексеруі", { placeholder: "title" });
const steps = ["Тест → деңгей", "ЖИ тапсырма таңдайды", "Жауап → бұлт", "ЖИ: рубрика бойынша талдау", "Педагог тексеруі", "Қорытынды тест"];
steps.forEach((label, i) => {
  const x = 0.5 + i * 1.5;
  badge(s, String(i + 1), x + 0.45, 1.2, 0.55, 18, `step-${i + 1}`);
  if (i < steps.length - 1) {
    s.addShape(pres.shapes.LINE, { x: x + 1.08, y: 1.475, w: 0.84, h: 0, line: { color: HEX.accent6, width: 1.25, endArrowType: "triangle" }, objectName: `step-arrow-${i + 1}` });
  }
  s.addText(label, { x, y: 1.85, w: 1.45, h: 0.65, fontSize: 13, color: C.text1, align: "center", valign: "top", margin: 0, objectName: `step-label-${i + 1}`, isTextBox: true });
});
card(s, 0.5, 2.75, 4.35, 2.25, HEX.lt2, "json-card");
s.addText([
  { text: "ЖИ жауабы (құрылымдалған JSON)", options: { bold: true, fontSize: 15, color: C.text1, breakLine: true } },
  { text: "strengths — дұрыс тұстар", options: { bullet: true, breakLine: true } },
  { text: "errors — анықталған қателер", options: { bullet: true, breakLine: true } },
  { text: "recommendation — келесі қадам", options: { bullet: true, breakLine: true } },
  { text: "criteria_scores, suggested_score (0–8)", options: { bullet: true, breakLine: true } },
  { text: "needs_review — педагог тексеруі қажет пе", options: { bullet: true } },
], { x: 0.7, y: 2.9, w: 4.0, h: 2.0, fontSize: 14, color: C.text2, valign: "top", margin: 0, paraSpaceAfter: 3, objectName: "json-text", isTextBox: true });
card(s, 5.15, 2.75, 4.35, 2.25, HEX.lt2, "safety-card");
s.addText([
  { text: "Сенімділік", options: { bold: true, fontSize: 15, color: C.text1, breakLine: true } },
  { text: "ЖИ қолжетімсіз болса да жауап сақталады", options: { bullet: true, breakLine: true } },
  { text: "Қайта сұрау көшірме жасамайды (response_id)", options: { bullet: true, breakLine: true } },
  { text: "Жауаптағы нұсқаулар орындалмайды", options: { bullet: true, breakLine: true } },
  { text: "Тексерілмеген нәтиже арнайы белгіленеді", options: { bullet: true, breakLine: true } },
  { text: "Педагог бағасы бөлек сақталады", options: { bullet: true } },
], { x: 5.35, y: 2.9, w: 4.0, h: 2.0, fontSize: 14, color: C.text2, valign: "top", margin: 0, paraSpaceAfter: 3, objectName: "safety-text", isTextBox: true });
s.addNotes("Жұмыс тәртібі: жауап алдымен бұлтқа сақталады, содан кейін сервер тапсырма мен рубриканы деректер қорынан алып, Gemini-ге сұраныс жібереді. ЖИ жауабы бекітілген JSON өрістерімен келеді, сервер балдың 0–8 аралығында екенін тексереді. Педагог зерттеуші бетінде ЖИ нәтижесін көріп, өз бағасын қояды; екеуі бөлек сақталады. Осы жерде қосымшаны көрсетемін: бір жауап жіберу, бұлтта сақталуы, ЖИ кері байланысы, педагог тексеруі және CSV экспорт.");

// ---------- 5. Сынақ нәтижелері ----------
// ---------- 5. Қатемен жұмыс ----------
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Қосымша" });
s.addText("Қатемен жұмыс: кеңес және қайта тексеру", { placeholder: "title" });
s.addImage({ path: path.join(__dirname, "revision_screen.png"), x: 0.5, y: 1.15, w: 5.55, h: 5.55 * 1360 / 2220,
  objectName: "revision-screen", altText: "Кері байланыс беті: 1-талпыныс 5/8, 2-талпыныс 8/8, ЖИ кеңесшісі" });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.15, w: 5.55, h: 5.55 * 1360 / 2220, rectRadius: 0.06,
  fill: { type: "none" }, line: { color: "E2E8F0", width: 1 }, objectName: "revision-frame" });
const revRows = [
  ["1", "Түзету — 2 рет", "Кері байланысқа сүйеніп кодты түзетеді, ЖИ рубрика бойынша қайта бағалайды"],
  ["2", "ЖИ кеңесі — 2 рет", "Дайын шешімсіз бағыттаушы кеңес; өз сұрағын қоюға болады"],
  ["3", "Балл өсімі өлшенеді", "1-талпыныс → соңғы: кері байланыстың оқуға әсері"],
  ["4", "Деректер бөлек", "Бастапқы жауап өзгермейді; әр талпынысты педагог тексереді"],
];
revRows.forEach(([n, head, body], i) => {
  const y = 1.15 + i * 0.9;
  badge(s, n, 6.35, y + 0.05, 0.42, 14, `rev-badge-${i}`);
  s.addText([
    { text: head, options: { bold: true, color: C.text1, breakLine: true } },
    { text: body, options: { color: C.text2, fontSize: 12 } },
  ], { x: 6.9, y, w: 2.6, h: 0.82, fontSize: 14, valign: "top", margin: 0, objectName: `rev-text-${i}`, isTextBox: true });
});
s.addNotes("Қосымша функция — қатемен жұмыс. Кері байланысты алған соң қатысушы кодын тағы екі рет түзетіп жібере алады, ЖИ әр талпынысты рубрика бойынша қайта бағалайды. Түсінбесе, ЖИ-ден дайын шешімсіз бағыттаушы кеңес сұрайды — бір тапсырмаға екі рет. Мысалда бірінші талпыныс 5 балл болды, кеңестен кейін қате түзетіліп, 8 балл алынды. Бастапқы жауап өзгермейді, сондықтан талпыныстар арасындағы балл өсімін зерттеу деректері ретінде талдауға болады.");

pres.addSection({ title: "Нәтижелер" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Нәтижелер" });
s.addText("Сынақ нәтижелері", { placeholder: "title" });
card(s, 0.5, 1.2, 3.3, 3.75, HEX.lt2, "tech-card");
s.addText("40/40", { x: 0.7, y: 1.35, w: 2.9, h: 0.95, fontSize: 48, bold: true, color: C.accent3, margin: 0, fontFace: "Cambria", objectName: "tech-num", isTextBox: true });
s.addText([
  { text: "техникалық сынақ өтті", options: { bold: true, color: C.text1, breakLine: true } },
  { text: "дұрыс және бос жауап", options: { bullet: true, breakLine: true } },
  { text: "API қатесі, қайта жіберу", options: { bullet: true, breakLine: true } },
  { text: "бұзылған JSON, балл аралығы", options: { bullet: true, breakLine: true } },
  { text: "рұқсатсыз кіру, CSV экспорт", options: { bullet: true, breakLine: true } },
  { text: "ЖИ лимиті → қосалқы модель", options: { bullet: true, breakLine: true } },
  { text: "деңгей, бұғаттау, қорытынды тест", options: { bullet: true } },
], { x: 0.7, y: 2.35, w: 2.95, h: 2.5, fontSize: 14, color: C.text2, valign: "top", margin: 0, paraSpaceAfter: 4, objectName: "tech-list", isTextBox: true });

if (pilot) {
  const labels = pilot.map((r) => r.response_code);
  s.addChart(pres.charts.BAR, [
    { name: "ЖИ бағасы", labels, values: pilot.map((r) => (r.ai_score == null ? 0 : r.ai_score)) },
    { name: "Педагог бағасы", labels, values: pilot.map((r) => r.teacher_score) },
  ], {
    x: 4.1, y: 1.15, w: 5.4, h: 3.0, barDir: "col", barGrouping: "clustered",
    chartColors: [HEX.accent2, HEX.accent1], showLegend: true, legendPos: "t", legendFontSize: 11, legendFontFace: "+mn-lt",
    showTitle: true, title: `ЖИ мен педагог бағалары (${pilot.length} модельдік жауап, 0–8)`, titleFontSize: 12, titleColor: HEX.dk1, titleFontFace: "+mn-lt",
    valAxisMaxVal: 8, valAxisMinVal: 0, valAxisMajorUnit: 2, valAxisLabelFontSize: 10, catAxisLabelFontSize: 10,
    valAxisLabelColor: HEX.accent6, catAxisLabelColor: HEX.accent6, valAxisLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt",
    valGridLine: { color: "E3E6EE", size: 0.5 }, catGridLine: { style: "none" }, objectName: "score-chart",
  });
  const cmp = pilot.filter((r) => r.diff != null);
  const mad = cmp.length ? (cmp.reduce((a, r) => a + Math.abs(r.diff), 0) / cmp.length).toFixed(1) : "—";
  const exact = cmp.filter((r) => r.diff === 0).length;
  const ok = pilot.filter((r) => r.ai_status === "done").length;
  const dis = pilot.filter((r) => r.diff).map((r) => r.response_code).join(", ");
  s.addText([
    { text: `Толық сәйкестік: ${exact}/${cmp.length} · орташа айырма: ${mad} балл`, options: { bold: true, color: C.text1, breakLine: true } },
    { text: `Айырмашылық тек даулы жауаптарда (${dis}): ЖИ баламалы шешімдерді төмен бағалады → сұраныс v2`, options: { color: C.text2 } },
  ], { x: 4.1, y: 4.2, w: 5.4, h: 0.8, fontSize: 13, margin: 0, valign: "top", objectName: "pilot-metrics", isTextBox: true });
} else {
  card(s, 4.1, 1.2, 5.4, 3.8, HEX.lt2, "pilot-card");
  s.addText([
    { text: "ЖИ мен педагог бағаларын салыстыру", options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } },
    { text: "10 модельдік жауап: әр тапсырмаға дұрыс, жартылай дұрыс, қате жауап + нұсқау енгізу әрекеті", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "[Диаграмма Gemini сынағынан кейін толтырылады: python pilot/run_pilot.py]", options: { ...PH, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Келесі кезең: 5–10 қатысушымен пилоттық тексеру" },
  ], { x: 4.35, y: 1.4, w: 4.9, h: 3.4, fontSize: 14, color: C.text2, valign: "top", margin: 0, objectName: "pilot-text", isTextBox: true });
}
s.addNotes("Техникалық сынақтың барлық жағдайлары автотесттермен тексерілді: 16 тесттің 16-сы өтті. ЖИ сапасын тексеру үшін 14 модельдік жауап дайындадым: дұрыс, жартылай дұрыс, қате, нұсқау енгізу әрекеті және рубрикаға тура келмейтін төрт даулы жауап. Педагог бағасын ЖИ нәтижесін көрмей тұрып қойдым. Типтік жауаптарда бағалар толық сәйкес келді, ЖИ max = 0 сияқты мағыналық қателерді де тапты және нұсқау енгізуге көнбеді. Айырмашылық тек даулы жауаптарда болды: ЖИ рубриканы сөзбе-сөз қолданып, sort, reduce, onclick сияқты баламалы шешімдерді төмен бағалады және needs_review белгісін қоймады. Сондықтан сұраныстың v2 нұсқасын жасадым, ал барлық ЖИ нәтижесі педагог тексергенге дейін тексерілмеген деп белгіленеді.");

// ---------- 6. Қорытынды ----------
pres.addSection({ title: "Қорытынды" });
s = pres.addSlide({ masterName: "DARK_CLOSE", sectionTitle: "Қорытынды" });
s.addText("Қорытынды және келесі қадамдар", { placeholder: "title" });
const cols = [
  ["Нәтиже", "Бұлтта жұмыс істейтін қосымша: жауап → Firestore → Gemini → педагог тексеруі → CSV экспорт"],
  ["Шектеулер", "Код мәтін ретінде талданады; тегін лимит — бір модельге тәулігіне 20 сұраныс; модельдік деректер аз"],
  ["Келесі қадам", "Тек педагог тексерген бағалар — дұрыс белгі; әр тапсырмаға 30–50 тексерілген жауап"],
];
cols.forEach(([head, body], i) => {
  const x = 0.5 + i * 3.07;
  card(s, x, 1.25, 2.86, 2.9, HEX.dk2, `close-card-${i}`);
  badge(s, String(i + 1), x + 0.25, 1.45, 0.5, 16, `close-badge-${i}`);
  s.addText(head, { x: x + 0.25, y: 2.05, w: 2.4, h: 0.45, fontSize: 18, bold: true, color: C.background1, margin: 0, fontFace: "Cambria", objectName: `close-head-${i}`, isTextBox: true });
  s.addText(body, { x: x + 0.25, y: 2.5, w: 2.4, h: 1.55, fontSize: 14, color: "D5DBE7", valign: "top", margin: 0, objectName: `close-body-${i}`, isTextBox: true });
});
s.addText([
  { text: "Қосымша: ", options: { bold: true } }, { text: "js-talimger.onrender.com", options: { hyperlink: { url: "https://js-talimger.onrender.com" }, color: "F0C419" } },
  { text: "    Код: ", options: { bold: true } }, { text: "github.com/FallAnge1/js-talimger", options: { hyperlink: { url: "https://github.com/FallAnge1/js-talimger" }, color: "F0C419" } },
], { x: 0.5, y: 4.45, w: 9.0, h: 0.4, fontSize: 14, color: C.background1, margin: 0, objectName: "links", isTextBox: true });
s.addNotes("Қорытынды: зерттеу міндетін шешетін, деректерді бұлтта сақтайтын және ЖИ кері байланысын педагог бақылауымен беретін қосымша жасалды. Шектеулері — код орындалмайды, тегін API лимиттері бар, әзірге модельдік деректер аз. Келесі қадам — пилоттық тексеру және 2-аралық жобаға педагог тексерген деректерді жинау. Назарларыңызға рахмет.");

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("жазылды:", path.basename(OUT));
})();
