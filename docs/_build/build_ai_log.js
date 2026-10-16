// Қосымша Ә: ЖИ қолдану журналы.
const { data, p, center, h1, bullet, tableTitle, codeBlock, table, makeDoc, save, spacer, ph } = require("./common");

const pilot = data.pilot;
const model = pilot ? (pilot.find((r) => r.model) || {}).model || data.default_model : data.default_model;
const pilotDate = pilot ? pilot[0].requested_at.slice(0, 10) : null;
const children = [];

children.push(center({ text: "Қосымша Ә", b: true }, { after: 60 }));
children.push(center({ text: "ЖИ қолдану журналы", b: true }, { after: 200 }));

children.push(p("Журналда «JS-Тәлімгер» қосымшасында және жобаны әзірлеу барысында қолданылған жасанды интеллект құралдары, сұраныс нұсқалары, модель атаулары, қолданылған күні, жауап үлгісі және магистрант енгізген түзетулер көрсетіледі."));

// ---------- 1 ----------
children.push(h1("1. Қосымшадағы ЖИ сервисі"));
children.push(table(
  ["Параметр", "Мәні"],
  [
    ["Провайдер және API", "Google Gemini API (Google AI Studio), REST: generateContent"],
    ["Модель", `${data.default_model}; қосалқы — ${data.fallback_model}; Gemini жауап бермесе — Groq (openai/gpt-oss-120b, qwen/qwen3.8-27b)`],
    ["Қолдану мақсаты", "Практикалық тапсырмаға берілген ашық жауапқа (JavaScript коды + түсіндірме) рубрика бойынша қалыптастырушы кері байланыс беру"],
    ["Сұраныс нұсқасы", `v1 → ${data.prompt_version} (prompt_version өрісі әр ЖИ нәтижесімен бірге сақталады)`],
    ["Генерация параметрлері", "temperature = 0.2; responseMimeType = application/json; responseSchema — құрылымдалған JSON; күту уақыты — 45 с"],
    ["Кілтті сақтау", "GEMINI_API_KEY — тек сервердің орта айнымалысында; репозиторийде және браузер кодында жоқ"],
    ["Жіберілетін деректер", "Тапсырма мәтіні, рубрика, күтілетін жауап үлгісі және қатысушының анонимді жауабы. Қатысушы коды ЖИ-ге жіберілмейді"],
  ],
  [2700, 6655],
  { boldFirstCol: true, firstColFill: true },
));

// ---------- 2 ----------
children.push(h1("2. Журнал жазбалары"));
const rows = [
  ["1", "2026-10-15", "—", "v1", "Сұраныс нұсқасын әзірлеу. Негіз — әдістемелік нұсқаулықтағы ЖИ нұсқаулығының үлгісі", "—",
    "JavaScript пәніне бейімделді; жауаптағы нұсқауларды орындамау талабы сақталды; жауап <<< >>> белгілерімен шектелді; дайын шешімді жазбау талабы қосылды; нәтиже бекітілген JSON өрістерімен сұралды"],
  ["2", "2026-10-15", "—", "v1", "Рубрика деңгейлерін сұранысқа қосу", "—",
    "Әр критерийдің 0/1/2 балдық сипаттамасы сұранысқа енгізілді; criteria_scores өрісі қосылды"],
  ["3", "2026-10-15", "имитация (mock)", "v1", "Автотесттер: ЖИ шақыруы алмастырылған (дұрыс, бос, API қатесі, қайта жіберу, бұзылған JSON, лимит)", "16/16 тест өтті",
    "Сервердегі құрылымды тексеру: міндетті өрістер, балл 0–8 аралығында; бұзылған жауап «invalid» деп белгіленеді"],
  ["4", "2026-10-15", "gemini-2.5-flash", "v1", "Серверден алғашқы сынақ сұранысы (check_ai.py)", "HTTP 404: модель жаңа пайдаланушыларға қолжетімсіз",
    `Модель ${data.default_model} болып ауыстырылды; модель атауы орта айнымалысына шығарылды`],
];
let n = 5;
if (pilot) {
  const requests = pilot.reduce((a, r) => a + (r.attempts || 1), 0);
  const failed = pilot.filter((r) => (r.failed_attempts || []).length).length;
  const cmp = pilot.filter((r) => r.diff != null);
  const exact = cmp.filter((r) => r.diff === 0).length;
  const mad = (cmp.reduce((a, r) => a + Math.abs(r.diff), 0) / cmp.length).toFixed(2);
  rows.push([String(n++), pilotDate, model, pilot[0].prompt_version, `${pilot.length} модельдік жауаппен сынақ (R01–R${pilot.length}): типтік, prompt injection және 4 даулы жауап`,
    `${requests} сұраныс, ${requests - failed} сәтті; бағалар сәйкестігі ${exact}/${cmp.length}, орташа айырма ${mad}`,
    "Даулы жауаптарда ЖИ баламалы шешімдерді (sort, reduce, onclick) төмен бағалап, бір қатені қайталап жазалағаны анықталды → сұраныстың v2 нұсқасы әзірленді"]);
  rows.push([String(n++), pilotDate, model, "v2", "Сұраныс v2: критерийді мақсатына қарай бағалау, бір қатені бір рет ескеру, рубрикаға тура келмесе needs_review = true",
    data.pilot_v2 ? (() => { const c = data.pilot_v2.filter((r) => r.diff != null); return `сәйкестік ${c.filter((r) => r.diff === 0).length}/${c.length}`; })() : "Барлық сұраныс HTTP 429: тегін лимит — бір модельге тәулігіне 20 сұраныс",
    data.pilot_v2 ? ph("[v2 нәтижесіне қарай түзетулер]") : `Қосалқы модель (${data.fallback_model}) қосылды; v2 тексерісі лимит жаңарғаннан кейін қайталанады`]);
} else {
  rows.push([String(n++), ph("[күні]"), ph("[модель]"), "v1", "Модельдік жауаптармен нақты Gemini арқылы сынақ (python pilot/run_pilot.py)", ph("[нәтиже]"), ph("[түзетулер]")]);
}
rows.push([String(n++), "2026-10-15", data.fallback_model, data.prompt_version, "Бұлттағы нұсқаны тексеру (https://js-talimger.onrender.com): жауап жіберу, Firestore-ға сақтау, ЖИ кері байланысы", "Сәтті: негізгі модель лимиті таусылғандықтан қосалқы модель жауап берді (8/8 балл)", "Сынақ жазбалары өшірілді; күту уақыты өтсе де қосалқы модельге көшу енгізілді"]);
rows.push([String(n++), "2026-10-15", data.default_model, data.hint_prompt_version, "Қатемен жұмыс: ЖИ кеңесшісінің жеке сұранысы (дайын шешімсіз бағыттаушы кеңес, бір тапсырмаға 2 рет)", "Автотесттер (имитация) өтті; нақты сапасы пилотта тексеріледі",
  "Кеңестен код блоктары алынып тасталады; қатысушы сұрағы [[[ ]]] белгілерімен шектеледі; ЖИ қатесі кеңес санын азайтпайды; бұрынғы кеңестер сұранысқа қосылады"]);
rows.push([String(n++), "2026-10-16", "groq: gpt-oss-120b, gpt-oss-20b, qwen3.8-27b", data.prompt_version, "Қосалқы тегін ЖИ таңдау: 14 модельдік жауап үш Groq моделінде", "gpt-oss-120b: 13/14 талданды, педагогпен 9/13 сәйкес, орташа айырма 0.62; gpt-oss-20b нұсқау енгізуге көнді (R10 — 8 балл); qwen3.8-27b дәл, бірақ минуттық лимиті төмен",
  "Тізбек: Gemini 3.8 → Gemini lite → gpt-oss-120b → qwen3.8-27b; gpt-oss-20b алынбады; Groq-та жарамсыз JSON (HTTP 400) кезінде бір рет қайталау"]);
rows.push([String(n++), "2026-10-16", "groq:openai/gpt-oss-120b", data.select_prompt_version, "Деңгейлік тапсырма таңдау: бастапқы деңгей, әлсіз тақырыптар «Типтердің түрленуі, Массивтер, Циклдер, Объектілер»", "A2 (1-ден n-ге дейінгі қосынды) таңдалды; себебі циклдерді бекіту деп қазақ тілінде түсіндірілді",
  "ЖИ-ге тек қатысушы деңгейінің тапсырмалары беріледі; тізімде жоқ код қабылданбайды; ЖИ қолжетімсіз болса — тақырыптар сәйкестігі бойынша автоматты таңдау"]);
rows.push([String(n++), "—", data.default_model, data.prompt_version, "5–10 қатысушымен пилоттық тексеру", "Жоспарланған", "—"]);
children.push(tableTitle("Ә.1-кесте – ЖИ сұраныстарының журналы"));
children.push(table(["№", "Күні", "Модель", "Нұсқа", "Мақсаты / жағдай", "Нәтиже", "Магистрант енгізген түзетулер"], rows,
  [400, 1100, 1250, 800, 1950, 1300, 2555], { size: 20, allowSplit: true }));

// ---------- 3 ----------
children.push(h1("3. Сұраныс мәтіні (нұсқа " + data.prompt_version + ")"));
children.push(p("v2 нұсқасында v1-ге үш талап қосылды: баламалы дұрыс тәсілді критерийдің мақсатына қарай бағалау, бір қатені бір критерийде ғана ескеру және шешім рубрикаға тура келмесе needs_review = true қою. Қалған мәтін v1-мен бірдей."));
children.push(p({ text: "Жүйелік нұсқаулық (systemInstruction):", b: true }, { noIndent: true, keepNext: true }));
children.push(...codeBlock(data.system_instruction));
children.push(p({ text: "Пайдаланушы сұранысының үлгісі (P1 тапсырмасы, модельдік жауап M02):", b: true }, { noIndent: true, keepNext: true, before: 160 }));
children.push(...codeBlock(data.sample_prompt, 16));

children.push(p({ text: `Деңгейлік тапсырма таңдау нұсқаулығы (нұсқа ${data.select_prompt_version}):`, b: true }, { noIndent: true, keepNext: true, before: 160 }));
children.push(...codeBlock(data.select_instruction));
children.push(p({ text: `ЖИ кеңесшісінің жүйелік нұсқаулығы (нұсқа ${data.hint_prompt_version}):`, b: true }, { noIndent: true, keepNext: true, before: 160 }));
children.push(...codeBlock(data.hint_instruction));

children.push(h1("4. ЖИ жауабының үлгісі"));
if (pilot) {
  const sample = pilot.find((r) => r.model_answer_id === "M02") || pilot[0];
  children.push(p(`Төменде ${sample.response_code} жауабына (${sample.kind}) ${sample.model} моделінің ${sample.requested_at.slice(0, 10)} күні қайтарған жауабы берілген. Педагог бағасы: ${sample.teacher_score} балл.`));
  let raw = sample.raw_text;
  try { raw = JSON.stringify(JSON.parse(raw), null, 2); } catch (e) { /* бастапқы мәтін */ }
  children.push(...codeBlock(raw, 16));
} else {
  children.push(p([ph("[Нақты Gemini жауабы pilot/run_pilot.py іске қосылғаннан кейін осында қойылады.]"), " Төменде күтілетін жауаптың құрылымы ғана көрсетілген (бұл нақты ЖИ жауабы емес):"]));
  children.push(...codeBlock(JSON.stringify({
    strengths: ["…"], errors: ["…"], recommendation: "…",
    criteria_scores: [{ criterion: "…", score: 0, comment: "…" }], suggested_score: 0, needs_review: true,
  }, null, 2), 18));
}

children.push(h1("5. Жобаны әзірлеуде қолданылған ЖИ құралдары"));
children.push(p("Академиялық адалдық талабына сай жобаны әзірлеу кезінде қолданылған ЖИ құралдары да көрсетіледі."));
children.push(table(
  ["Күні", "Құрал / модель", "Не үшін қолданылды", "Магистрант енгізген түзетулер"],
  [
    ["2026-10-15", "Claude (Anthropic), Claude Opus 5.5", "Қосымша кодының, деңгейлік тапсырмалар банкінің (15 тапсырма) мен рубрикалардың, қорытынды тесттің, модельдік жауаптардың, есеп пен таныстырылымның алғашқы нұсқасын дайындау", "Тапсырмаларды, рубриканы және модельдік жауаптардың педагог бағаларын тексеріп бекітті; ЖИ нәтижелерін талдап, сұраныстың v2 нұсқасына шешім қабылдады"],
  ],
  [1300, 2000, 3000, 3055],
  { size: 22 },
));
children.push(spacer(60));
children.push(p("Ескерту: ЖИ ұсынған бағалар мен түсіндірмелер автоматты түрде дұрыс деп қабылданбайды. Барлық ЖИ нәтижелері педагог тексеруінен өтеді, ал 2-аралық жобада тек педагог тексерген бағалар дұрыс белгі ретінде пайдаланылады."));

save(makeDoc(children), "Қосымша_Ә_ЖИ_қолдану_журналы.docx");
