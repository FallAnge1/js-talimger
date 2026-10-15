"""Қосымша архитектурасының сызбасын (PNG) салады."""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
S = 2  # масштаб (жоғары ажыратымдылық үшін)
W, H = 1610 * S, 820 * S

FONT = "C:/Windows/Fonts/arial.ttf"
BOLD = "C:/Windows/Fonts/arialbd.ttf"


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size * S)


INK = (29, 36, 51)
MUTED = (90, 100, 120)
LINE = (70, 80, 100)

img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)


def box(x, y, w, h, fill, outline, title, lines, title_color=INK):
    x, y, w, h = x * S, y * S, w * S, h * S
    d.rounded_rectangle([x, y, x + w, y + h], radius=18 * S, fill=fill, outline=outline, width=3 * S)
    d.text((x + w / 2, y + 22 * S), title, font=font(24, True), fill=title_color, anchor="ma")
    ty = y + 66 * S
    for ln in lines:
        d.text((x + w / 2, ty), ln, font=font(18), fill=MUTED, anchor="ma")
        ty += 27 * S


def arrow(x1, y1, x2, y2, label="", both=False, label_dy=-30, label_dx=0):
    x1, y1, x2, y2 = x1 * S, y1 * S, x2 * S, y2 * S
    d.line([x1, y1, x2, y2], fill=LINE, width=3 * S)

    def head(ax, ay, bx, by):
        import math
        ang = math.atan2(by - ay, bx - ax)
        L = 18 * S
        p1 = (bx - L * math.cos(ang - 0.4), by - L * math.sin(ang - 0.4))
        p2 = (bx - L * math.cos(ang + 0.4), by - L * math.sin(ang + 0.4))
        d.polygon([(bx, by), p1, p2], fill=LINE)

    head(x1, y1, x2, y2)
    if both:
        head(x2, y2, x1, y1)
    if label:
        mx, my = (x1 + x2) / 2 + label_dx * S, (y1 + y2) / 2 + label_dy * S
        for i, part in enumerate(label.split("\n")):
            d.text((mx, my + i * 24 * S), part, font=font(17), fill=INK, anchor="mm")


# Пайдаланушылар
box(40, 150, 280, 170, (238, 242, 255), (59, 91, 219), "Қатысушы", ["браузер", "тест · тапсырма", "кері байланыс"])
box(40, 530, 280, 170, (238, 242, 255), (59, 91, 219), "Зерттеуші / педагог", ["браузер (құпиясөз)", "тексеру · салыстыру", "CSV экспорт"])

# Сервер
box(560, 130, 440, 590, (255, 248, 225), (230, 160, 0), "Flask сервері", [
    "бұлттық платформа: Render.com",
    "",
    "1. жауапты тексеру (бос / көлем)",
    "2. бұлтқа сақтау (response_id)",
    "3. тапсырма мен рубриканы алу",
    "4. ЖИ сұранысын құрастыру",
    "5. JSON құрылымы мен балды тексеру",
    "6. нәтижені интерфейске қайтару",
    "7. педагог тексеруін бөлек сақтау",
    "8. CSV экспорт",
    "",
    "API кілті мен ДҚ кілті —",
    "сервердің орта айнымалыларында",
])

# Бұлттық сервистер
box(1240, 135, 330, 200, (230, 246, 236), (30, 123, 69), "Firebase Firestore", [
    "бұлттық деректер қоры",
    "tasks · responses · test_results",
    "ai_feedback · teacher_review",
])
box(1240, 515, 330, 200, (243, 236, 252), (120, 70, 190), "Google Gemini API", [
    "дайын ЖИ моделі",
    "рубрика бойынша талдау",
    "құрылымдалған JSON жауап",
])

arrow(320, 235, 560, 235, "жауап (HTTPS)", both=True, label_dy=-24)
arrow(320, 615, 560, 615, "тексеру, экспорт", both=True, label_dy=-24)
arrow(1000, 235, 1240, 235, "сақтау / оқу", both=True, label_dy=-24)
arrow(1000, 615, 1240, 615, "тапсырма + рубрика\n+ жауап", both=True, label_dy=-48)
d.text((1120 * S, 640 * S), "JSON: балл, қателер,", font=font(16), fill=MUTED, anchor="ma")
d.text((1120 * S, 662 * S), "ұсыныс", font=font(16), fill=MUTED, anchor="ma")

BARE = "--bare" in sys.argv
if not BARE:
  d.text((W / 2, 40 * S), "«JS-Тәлімгер» қосымшасының архитектурасы", font=font(28, True), fill=INK, anchor="ma")
if not BARE:
  d.text((W / 2, 770 * S), "ЖИ сервисі қолжетімсіз болса да жауап деректер қорында сақталады; педагог бағасы ЖИ нәтижесінен бөлек сақталады.",
       font=font(17), fill=MUTED, anchor="ma")

out = os.path.join(HERE, "architecture_bare.png" if BARE else "architecture.png")
if BARE:
    img = img.crop((0, 110 * S, W, 740 * S))
img.save(out)
print(out)
