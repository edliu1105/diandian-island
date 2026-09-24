# -*- coding: utf-8 -*-
"""QR code for the published app + a printable card (for the parent: scan with the iPad camera -> Safari).
usage: python tools/make_qr.py [url]
out:   docs/qr.png (plain code), docs/qr-card.png (code + name + address + three-step install hint)
dev-only tool (python 'qrcode' + Pillow); the app itself uses no third-party code.
"""
import os, sys
import qrcode
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://edliu1105.github.io/diandian-island/'
q = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=16, border=3)
q.add_data(URL)
q.make(fit=True)
code = q.make_image(fill_color='#2B2118', back_color='white').convert('RGB')
code.save(os.path.join(ROOT, 'docs', 'qr.png'))

W = 1000
card = Image.new('RGB', (W, 1400), '#FFF4D6')
d = ImageDraw.Draw(card)
big = ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc', 84)
mid = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 34)
small = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 30)


def center(y, text, font, fill='#2B2118'):
    w = d.textlength(text, font=font)
    d.text(((W - w) / 2, y), text, font=font, fill=fill)


center(60, '点点岛', big)
center(170, '给 3–4 岁孩子的数量小岛', mid, '#6B5A48')
c = code.resize((720, 720), Image.NEAREST)
card.paste(c, ((W - 720) // 2, 250))
center(990, URL, small, '#2E6FD8')
steps = ['① 用 iPad 相机扫码，在 Safari 中打开', '② 点“分享”→“添加到主屏幕”', '③ 从主屏幕图标打开（第一次联网打开后可离线玩）']
for i, t in enumerate(steps):
    d.text((110, 1070 + i * 70), t, font=small, fill='#2B2118')
card.save(os.path.join(ROOT, 'docs', 'qr-card.png'))
print('qr ->', URL)
