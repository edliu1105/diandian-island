# -*- coding: utf-8 -*-
"""The voice bank (client: the device voice sounds like a robot): every sentence of the app recorded with a neural
Chinese voice - the same voice as the counting numbers (tools/make_voice.py) - into assets/voice/v/<fnv1a>.mp3, and the
list of recorded keys into assets/voice/bank.json (index.html: Bank). Only sentences without a recording are made, so
re-running after new games costs only the new sentences.
usage: python tools/voice_bank.py [lines.json] [--resay]      (default raw/voice_lines.json, a JSON list of sentences;
--resay makes the lines SOUNDS changes again)"""
import os, sys, json, struct, asyncio, subprocess
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'voice', 'v')
TMP = os.path.join(ROOT, 'raw', 'voice', 'v')
VOICE = 'zh-CN-XiaoyiNeural'
# A character with two sounds that the voice reads the wrong way in our lines (2026-11-01: 你能行的 came out as 你能航的 and
# 这一行 as 这一形): the voice is given the same sound written with a character that has only that one sound. The key (the
# file name) stays the line's own text. A line changed here keeps its old clip until it is made again (--resay);
# tests/test_sounds.py: every line with 行 says one of the two
SOUNDS = [('能行', '能形'), ('不行', '不形'), ('一行', '一航'), ('那行', '那航'), ('每行', '每航'), ('行和列', '航和列')]


def spoken(text):
    """what the voice is given for a line"""
    for a, b in SOUNDS:
        text = text.replace(a, b)
    return text


def key(text):
    """FNV-1a over UTF-16 code units - the same as Bank.key in index.html"""
    b = text.encode('utf-16-le')
    h = 0x811c9dc5
    for (cu,) in struct.iter_unpack('<H', b):
        h ^= cu
        h = (h * 16777619) & 0xffffffff
    return '%08x' % h


def trim(src, dst):
    af = ('silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.01,'
          'areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.08,areverse,'
          'afade=t=in:d=0.01')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ac', '1', '-ar', '24000',
                    '-b:a', '40k', dst], check=True)


async def one(sem, text, stats):
    k = key(text)
    dst = os.path.join(OUT, k + '.mp3')
    if os.path.exists(dst) and os.path.getsize(dst) > 300:
        stats['have'] += 1
        return
    raw = os.path.join(TMP, k + '.mp3')
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(spoken(text), VOICE, rate='-6%', pitch='+4Hz').save(raw)
                break
            except Exception as e:
                if attempt == 3:
                    print('FAILED', text, e)
                    stats['fail'] += 1
                    return
                await asyncio.sleep(1.5 * (attempt + 1))
    await asyncio.to_thread(trim, raw, dst)
    stats['made'] += 1
    if stats['made'] % 50 == 0:
        print('made', stats['made'])


async def main():
    args = [a for a in sys.argv[1:] if a != '--resay']
    src = args[0] if args else os.path.join(ROOT, 'raw', 'voice_lines.json')
    lines = sorted(set(t.strip() for t in json.load(open(src, encoding='utf-8')) if t and t.strip()))
    os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
    if '--resay' in sys.argv:
        for t in lines:
            if spoken(t) != t and os.path.exists(os.path.join(OUT, key(t) + '.mp3')):
                os.remove(os.path.join(OUT, key(t) + '.mp3'))
    stats = {'have': 0, 'made': 0, 'fail': 0}
    sem = asyncio.Semaphore(6)
    await asyncio.gather(*(one(sem, t, stats) for t in lines))
    keys = sorted(set(key(t) for t in lines if os.path.exists(os.path.join(OUT, key(t) + '.mp3'))))
    json.dump(keys, open(os.path.join(ROOT, 'assets', 'voice', 'bank.json'), 'w'), separators=(',', ':'))
    size = sum(os.path.getsize(os.path.join(OUT, k + '.mp3')) for k in keys)
    print('lines', len(lines), stats, 'bank', len(keys), 'clips', size // 1024, 'KB')


if __name__ == '__main__':
    asyncio.run(main())
