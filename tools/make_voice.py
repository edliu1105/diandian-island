# -*- coding: utf-8 -*-
"""Pre-generate the counting channel (numbers never go through speechSynthesis).

assets/voice/n1..n20.mp3  一 … 二十   (counting sequence uses 二)
assets/voice/o1..o10.mp3  第一 … 第十
assets/voice/silence.mp3  1 s of silence, looped by a hidden <audio> to hold the media session on iOS
usage: python tools/make_voice.py   (needs edge-tts + ffmpeg)
"""
import os, subprocess, asyncio
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'voice')
TMP = os.path.join(ROOT, 'raw', 'voice')
VOICE = 'zh-CN-XiaoyiNeural'
NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']


async def tts(text, path, rate='-8%', pitch='+6Hz'):
    c = edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch)
    await c.save(path)


def trim(src, dst):
    af = ('silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.01,'
          'areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.06,areverse,'
          'afade=t=in:d=0.01')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ac', '1', '-ar', '24000',
                    '-b:a', '48k', dst], check=True)


async def main():
    os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
    jobs = []
    for i, t in enumerate(NUMS, 1):
        jobs.append((t, 'n%d' % i))
    for i in range(1, 11):
        jobs.append(('第' + NUMS[i - 1], 'o%d' % i))
    for text, name in jobs:
        raw = os.path.join(TMP, name + '.mp3')
        for attempt in range(3):
            try:
                await tts(text, raw)
                break
            except Exception as e:
                print('retry', name, e)
        trim(raw, os.path.join(OUT, name + '.mp3'))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '1',
                    '-b:a', '32k', os.path.join(OUT, 'silence.mp3')], check=True)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(len(os.listdir(OUT)), 'files', total // 1024, 'KB')


if __name__ == '__main__':
    asyncio.run(main())
