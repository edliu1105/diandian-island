# -*- coding: utf-8 -*-
"""The voice bank (client: the device voice sounds like a robot): every sentence of the app recorded with a neural
Chinese voice - the same voice as the counting numbers (tools/make_voice.py) - into assets/voice/v/<fnv1a>.mp3, and the
list of recorded keys into assets/voice/bank.json (index.html: Bank). Only sentences without a recording are made, so
re-running after new games costs only the new sentences.
usage: python tools/voice_bank.py [lines.json]      (default raw/voice_lines.json, a JSON list of sentences)"""
import os, sys, json, struct, asyncio, subprocess
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'voice', 'v')
TMP = os.path.join(ROOT, 'raw', 'voice', 'v')
VOICE = 'zh-CN-XiaoyiNeural'


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
                await edge_tts.Communicate(text, VOICE, rate='-6%', pitch='+4Hz').save(raw)
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
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'raw', 'voice_lines.json')
    lines = sorted(set(t.strip() for t in json.load(open(src, encoding='utf-8')) if t and t.strip()))
    os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
    stats = {'have': 0, 'made': 0, 'fail': 0}
    sem = asyncio.Semaphore(6)
    await asyncio.gather(*(one(sem, t, stats) for t in lines))
    keys = sorted(set(key(t) for t in lines if os.path.exists(os.path.join(OUT, key(t) + '.mp3'))))
    json.dump(keys, open(os.path.join(ROOT, 'assets', 'voice', 'bank.json'), 'w'), separators=(',', ':'))
    size = sum(os.path.getsize(os.path.join(OUT, k + '.mp3')) for k in keys)
    print('lines', len(lines), stats, 'bank', len(keys), 'clips', size // 1024, 'KB')


if __name__ == '__main__':
    asyncio.run(main())
