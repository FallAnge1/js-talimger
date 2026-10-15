"""Құжатты PDF-ке, содан кейін беттерді PNG суреттерге айналдырады (тексеру үшін).

Қолданылуы: python render.py <файл.docx|файл.pptx> <шығыс_қалтасы>
"""

import os
import subprocess
import sys

import fitz

src = os.path.abspath(sys.argv[1])
out_dir = os.path.abspath(sys.argv[2])
os.makedirs(out_dir, exist_ok=True)
pdf = os.path.join(out_dir, os.path.splitext(os.path.basename(src))[0] + ".pdf")
ps1 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "to_pdf.ps1")
subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1, src, pdf], check=True)
doc = fitz.open(pdf)
print("беттер:", len(doc))
for i, page in enumerate(doc, start=1):
    path = os.path.join(out_dir, f"page-{i:02d}.png")
    page.get_pixmap(dpi=80).save(path)
    print(path)
