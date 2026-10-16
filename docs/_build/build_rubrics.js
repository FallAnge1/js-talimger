// Қосымша А: диагностикалық және қорытынды тест, деңгейлік тапсырмалар банкі және бағалау рубрикасы.
const { data, p, center, h1, h2, bullet, tableTitle, codeBlock, table, makeDoc, save, spacer } = require("./common");

const letters = ["A", "B", "C", "D"];
const LEVEL_KEYS = ["low", "mid", "high"];
const children = [];
let tableNo = 1;

function testTable(test, title) {
  children.push(tableTitle(`А.${tableNo++}-кесте – ${title}`));
  children.push(table(
    ["№", "Сұрақ", "Жауап нұсқалары", "Дұрыс жауап", "Тақырып"],
    test.questions.map((q, i) => [
      { text: String(i + 1), center: true },
      q.text,
      q.options.map((o, j) => ({ text: `${letters[j]}) ${o}`, mono: true })),
      { text: `${letters[q.correct]}) ${q.options[q.correct]}`, mono: true },
      q.topic,
    ]),
    [450, 2900, 2555, 1600, 1850],
    { size: 22 },
  ));
}

children.push(center({ text: "Қосымша А", b: true }, { after: 60 }));
children.push(center({ text: "«JS-Тәлімгер» қосымшасының тесттері, деңгейлік тапсырмалары және бағалау рубрикасы", b: true }, { after: 200 }));

children.push(p("Қатысушының жолы үш кезеңнен тұрады: диагностикалық тест (10 сұрақ) деңгейді анықтайды; деңгейдің 5 тапсырмадан тұратын банкінен ЖИ әлсіз тақырыптарды бекітуге ең пайдалы тапсырманы таңдайды; соңында тақырыптары бірдей параллель қорытынды тест деңгейдің өзгерісін көрсетеді. Тесттер автоматты бағаланады. Практикалық жауапты ЖИ осы рубрика бойынша талдайды, соңғы бағаны педагог бекітеді. Әр тапсырманың нұсқасы (version) жауаппен бірге сақталады."));

// ---------- 1. Диагностикалық тест ----------
children.push(h1("1. Диагностикалық тест"));
children.push(p(`Мақсаты: білім алушының JavaScript негіздері бойынша бастапқы деңгейін және әлсіз тақырыптарын анықтау. Әр сұраққа бір дұрыс жауап бар; дұрыс жауап — 1 балл, барлығы ${data.test.questions.length} балл.`));
testTable(data.test, "Диагностикалық тест сұрақтары, жауап нұсқалары және тақырып");
children.push(spacer(60));
children.push(tableTitle(`А.${tableNo++}-кесте – Деңгейлер`));
children.push(table(["Деңгей", "Тест балы", "Берілетін тапсырмалар"], LEVEL_KEYS.map((k) => [
  data.levels[k].name, `${data.levels[k].range[0]}–${data.levels[k].range[1]}`,
  data.tasks.filter((t) => t.level === k).map((t) => t.task_id).join(", "),
]), [2500, 2000, 4855], { size: 22, boldFirstCol: true }));

// ---------- 2. Деңгейлік тапсырмалар ----------
children.push(h1("2. Деңгейлік практикалық тапсырмалар және рубрикалар"));
children.push(p("Әр тапсырма төрт критерий бойынша бағаланады, әр критерий 0–2 балл, барлығы 8 балл. Әр тапсырмада тест тақырыптарымен байланыс көрсетілген: ЖИ таңдау жасағанда осы тақырыптарды қатысушының әлсіз тақырыптарымен салыстырады. Код серверде орындалмайды, ол мәтін ретінде талданады."));

LEVEL_KEYS.forEach((lv, li) => {
  const lvl = data.levels[lv];
  children.push(h1(`2.${li + 1}. ${lvl.name} деңгей (${lvl.range[0]}–${lvl.range[1]} балл)`));
  data.tasks.filter((t) => t.level === lv).forEach((t) => {
    children.push(h2(`${t.task_id}. ${t.title}`));
    children.push(p([{ text: "Өлшенетін дағды: ", b: true }, t.skill, { text: " · Тақырыптар: ", b: true }, (t.topics || []).join(", ")], { noIndent: true }));
    children.push(p({ text: "Тапсырма мәтіні:", b: true }, { noIndent: true, keepNext: true }));
    children.push(...codeBlock(t.text, 24, true));
    children.push(p({ text: "Күтілетін жауап (педагогке арналған үлгі):", b: true }, { noIndent: true, keepNext: true, before: 120 }));
    children.push(...codeBlock(t.expected_answer));
    children.push(tableTitle(`А.${tableNo++}-кесте – ${t.task_id} тапсырмасының бағалау рубрикасы`));
    children.push(table(
      ["Критерий", "0 балл", "1 балл", "2 балл"],
      [
        ...t.criteria.map((c) => [c.name, c.levels[0], c.levels[1], c.levels[2]]),
        [{ text: "Барлығы", b: true }, "", "", { text: `${t.max_score} балл`, b: true }],
      ],
      [2755, 2200, 2200, 2200],
      { size: 22, firstColFill: true },
    ));
    children.push(p({ text: "Ықтимал қателер:", b: true }, { noIndent: true, keepNext: true, before: 120 }));
    t.typical_errors.forEach((e) => children.push(bullet(e)));
  });
});

// ---------- 3. Қорытынды тест ----------
children.push(h1("3. Қорытынды (параллель) тест"));
children.push(p("Деңгейлік тапсырмадан кейін тапсырылады. Сұрақтар жаңа, бірақ тақырыптары мен реті диагностикалық тестпен бірдей, сондықтан нәтижелер тақырып бойынша тікелей салыстырылады және жауаптарды жаттап алу әсері азаяды. Деңгей сол шкала бойынша есептеледі."));
testTable(data.post_test, "Қорытынды тест сұрақтары, жауап нұсқалары және тақырып");

children.push(h1("4. Практикалық тапсырманың жалпы бағалау шкаласы"));
children.push(table(
  ["Балл (бір тапсырма)", "Деңгей", "Түсіндірме"],
  [
    ["0–3", "Төмен", "Негізгі ұғымдар меңгерілмеген, шешім жұмыс істемейді немесе тапсырмаға сай емес"],
    ["4–6", "Орта", "Шешімнің негізі дұрыс, бірақ шекаралық жағдайларда немесе түсіндірмеде қателер бар"],
    ["7–8", "Жоғары", "Шешім толық дұрыс, шекаралық жағдайлар ескерілген, түсіндірме қисынды"],
  ],
  [2300, 1500, 5555],
));
children.push(spacer(60));
children.push(p("ЖИ ұсынған балл автоматты түрде соңғы баға болып саналмайды: педагог оны «Зерттеуші бетінде» тексеріп, қажет болса түзетеді. ЖИ бағасы мен педагог бағасы деректер қорында бөлек сақталады. Тапсырмалар банкі ЖИ көмегімен (Claude) дайындалып, магистрант тексерді (Қосымша Ә)."));

save(makeDoc(children), "Қосымша_А_Тапсырмалар_мен_рубрика.docx");
