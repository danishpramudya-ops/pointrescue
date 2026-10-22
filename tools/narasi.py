# -*- coding: utf-8 -*-
"""Bacakan subtitle film bagian 01, lalu campur ke videonya.

    python 5-WEBSITE/tools/narasi.py                 # Kokoro, suara George
    python 5-WEBSITE/tools/narasi.py --suara onyx
    python 5-WEBSITE/tools/narasi.py --suara mark   # pembaca bawaan Windows
    python 5-WEBSITE/tools/narasi.py --coba         # cuma WAV, video tidak disentuh

Suaranya disintesis di komputer sendiri — nol risiko hak cipta, tidak ada
rekaman orang lain yang dipakai.

TIGA MESIN SUARA:

  kokoro   Kokoro-82M lewat onnxruntime. NEURAL, 24 kHz, jauh paling natural.
           Bobot model dan kodenya sama-sama Apache 2.0, jadi keluarannya
           bebas dipakai. Butuh unduhan model sekali (353 MB), sesudah itu
           seluruhnya lokal.
  onecore  Windows.Media.SpeechSynthesis (WinRT). Mark, David, Zira.
           Konkatenatif, 16 kHz — iramanya luwes tapi jelas terdengar robot.
  sapi     System.Speech (SAPI5). Konkatenatif, 22,05 kHz, paling kaku.

Dua mesin Windows dipertahankan sebagai cadangan: tidak butuh unduhan apa pun
dan selalu ada di mesin Windows mana pun.

JALAN BUNTU YANG SUDAH DICOBA

  Voice "Natural" Windows 11 (Aria, Guy, Jenny) memang neural, tapi TERKUNCI
  untuk Narrator — tidak bisa diakses System.Speech maupun WinRT.
  edge-tts memberi suara neural Azure tanpa kunci API, tapi lisensinya abu-abu
  untuk aset yang dilombakan. Kokoro Apache 2.0 menyelesaikan itu.

SUMBER YANG DIPAKAI

  assets/video/masalah.mp4       hanya trek VIDEO-nya (disalin, tidak di-encode)
  assets/video/masalah-bed.m4a   bed ambien TANPA narasi

Bed-nya disimpan terpisah justru supaya skrip ini bisa dijalankan berulang.
Kalau narasi dicampur ke berkas yang sudah bernarasi, suaranya menumpuk.

WAKTU BARIS

Bukan tebakan. Subtitle-nya ter-burn-in ke gambar, jadi kotak subtitle-nya
dipindai: ffmpeg mengambil 10 bingkai per detik dari potongan
`crop=880:76:200:604`, lalu jumlah piksel putih per kolom dibandingkan antar
bingkai. Hasilnya bersih — tujuh blok 5 detik yang tercatat di MULAI di bawah.
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, "assets", "video", "masalah.mp4")
BED = os.path.join(ROOT, "assets", "video", "masalah-bed.m4a")

BARIS = [
    "Disaster does not choose easy ground.",
    "It lands where the roads end, and the towers fall.",
    "In a single night, a valley is cut off.",
    "No signal. No shared map.",
    "Search teams go in on foot.",
    "Their only link is a voice on a radio.",
    "Every hour on the wrong ridge never comes back.",
]

# detik, dari pemindaian kotak subtitle; + 0,35 s supaya suaranya masuk
# sesudah tulisannya muncul, bukan barengan
MULAI = [0.5, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0]
JEDA = 0.35

SUARA = {
    # Kokoro-82M — neural, Apache 2.0, jalan di CPU, keluaran 24 kHz
    "george":     ("kokoro", "bm_george"),    # pria Inggris, register dokumenter
    "fable":      ("kokoro", "bm_fable"),
    "lewis":      ("kokoro", "bm_lewis"),
    "michael":    ("kokoro", "am_michael"),   # pria Amerika, hangat
    "onyx":       ("kokoro", "am_onyx"),      # pria Amerika, lebih berat
    "adam":       ("kokoro", "am_adam"),
    "heart":      ("kokoro", "af_heart"),     # perempuan Amerika
    "bella":      ("kokoro", "af_bella"),
    # pembaca teks bawaan Windows — dipertahankan sebagai cadangan tanpa unduhan
    "mark":       ("onecore", "Microsoft Mark"),
    "david":      ("onecore", "Microsoft David"),
    "zira":       ("onecore", "Microsoft Zira"),
    "david-sapi": ("sapi", "Microsoft David Desktop"),
    "zira-sapi":  ("sapi", "Microsoft Zira Desktop"),
}

# Model Kokoro disimpan DI LUAR folder situs: 325 MB, dan situs ini tidak
# butuh satu byte pun darinya saat disajikan — narasinya sudah dipanggang
# ke dalam mp4.
MODEL_DIR = os.path.join(os.path.expanduser("~"), ".cache", "kokoro")
MODEL = "kokoro-v1.0.onnx"
VOICES = "voices-v1.0.bin"
UNDUH = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

PS_ONECORE = r"""
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
$mm = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' }
$asTaskGeneric = $mm[0]
function Await($op, $type) {
  $t = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result }
$syn = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$v = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices |
     Where-Object { $_.DisplayName -eq '__VOICE__' }
if (-not $v) { throw 'Voice __VOICE__ tidak terpasang' }
$syn.Voice = $v
$teks = Get-Content -Raw -Encoding UTF8 '__LIST__' | ConvertFrom-Json
$i = 1
foreach ($l in $teks) {
  $esc = $l.Replace('&','&amp;').Replace('<','&lt;')
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
          "<prosody rate='-14%' pitch='-4%'>$esc</prosody></speak>"
  $stream = Await $syn.SynthesizeSsmlToStreamAsync($ssml) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $size = [uint32]$stream.Size
  $rd = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  Await $rd.LoadAsync($size) ([uint32]) | Out-Null
  $bytes = New-Object byte[] $size
  $rd.ReadBytes($bytes)
  $rd.Dispose(); $stream.Dispose()
  [System.IO.File]::WriteAllBytes((Join-Path '__OUT__' ('n{0:D2}.wav' -f $i)), $bytes)
  $i++
}
$syn.Dispose()
"""

PS_SAPI = r"""
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$teks = Get-Content -Raw -Encoding UTF8 '__LIST__' | ConvertFrom-Json
$i = 1
foreach ($l in $teks) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice('__VOICE__'); $s.Rate = -2; $s.Volume = 100
  $s.SetOutputToWaveFile((Join-Path '__OUT__' ('n{0:D2}.wav' -f $i)))
  $s.Speak($l); $s.Dispose(); $i++
}
"""


def jalan(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def sintesis_kokoro(voice, kerja, model_dir, laju):
    """Kokoro-82M lewat onnxruntime. Semuanya berjalan lokal; internet cuma
    dibutuhkan sekali, saat mengunduh berkas modelnya."""
    NL = chr(10)
    m = os.path.join(model_dir, MODEL)
    v = os.path.join(model_dir, VOICES)
    kurang = [x for x in (m, v) if not os.path.exists(x)]
    if kurang:
        pesan = ["Berkas model Kokoro belum ada:"]
        pesan += ["  " + x for x in kurang]
        pesan += ["", "Unduh sekali saja:",
                  '  mkdir -p "%s"' % model_dir,
                  '  curl -sL -o "%s/%s" %s/%s' % (model_dir, MODEL, UNDUH, MODEL),
                  '  curl -sL -o "%s/%s" %s/%s' % (model_dir, VOICES, UNDUH, VOICES),
                  "", "Atau pakai suara bawaan Windows:  --suara mark"]
        sys.exit(NL.join(pesan))
    try:
        from kokoro_onnx import Kokoro
        import soundfile as sf
    except ImportError:
        sys.exit(NL.join([
            "Butuh:  pip install --ignore-requires-python kokoro-onnx soundfile",
            "",
            "Bendera --ignore-requires-python itu perlu: paketnya menutup",
            "Python 3.14 di metadata-nya, padahal seluruh dependensinya",
            "(onnxruntime, numpy, phonemizer, espeakng-loader) sudah punya",
            "wheel 3.14 dan jalan tanpa masalah.",
        ]))
    k = Kokoro(m, v)
    for i, baris in enumerate(BARIS, 1):
        audio, sr = k.create(baris, voice=voice, speed=laju, lang="en-us")
        sf.write(os.path.join(kerja, "n%02d.wav" % i), audio, sr)


def sintesis(mesin, voice, kerja):
    import json
    daftar = os.path.join(kerja, "baris.json")
    with open(daftar, "w", encoding="utf-8") as f:
        json.dump(BARIS, f, ensure_ascii=False)
    skrip = (PS_ONECORE if mesin == "onecore" else PS_SAPI)
    skrip = (skrip.replace("__VOICE__", voice)
                  .replace("__OUT__", kerja.replace("\\", "\\\\"))
                  .replace("__LIST__", daftar.replace("\\", "\\\\")))
    p = os.path.join(kerja, "synth.ps1")
    with open(p, "w", encoding="utf-8") as f:
        f.write(skrip)
    jalan(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", p])


# Pangkas hening di kedua ujung, lalu ratakan. Pemangkasan ini yang membuat
# tiap baris jatuh tepat sesudah subtitle-nya muncul, bukan meleset karena
# hening bawaan dari mesin suaranya.
POLES = (
    "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02:detection=peak,"
    "areverse,"
    "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02:detection=peak,"
    "areverse,"
    "highpass=f=90,"
    # sedikit angkat kejelasan di 3 kHz dan udara di 6 kHz — voice OneCore
    # keluarannya 16 kHz jadi terdengar tumpul kalau dibiarkan apa adanya
    "equalizer=f=3000:t=q:w=1.4:g=2.5,"
    "equalizer=f=6000:t=q:w=1.2:g=2,"
    "acompressor=threshold=-20dB:ratio=3.2:attack=8:release=200,"
    "loudnorm=I=-17:TP=-2:LRA=9,"
    "aresample=48000"
)


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ap = argparse.ArgumentParser(description="Narasi film bagian 01")
    ap.add_argument("--suara", default="george", choices=sorted(SUARA))
    ap.add_argument("--laju", type=float, default=0.92,
                    help="kecepatan bicara Kokoro; < 1 lebih pelan")
    ap.add_argument("--model-dir", default=MODEL_DIR)
    ap.add_argument("--coba", action="store_true",
                    help="cuma keluarkan WAV narasinya, video tidak disentuh")
    ap.add_argument("--keluaran", default=os.path.join(ROOT, "tools", "narasi"))
    args = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg tidak ada di PATH")
    for f in (VIDEO, BED):
        if not os.path.exists(f):
            sys.exit("tidak ketemu: " + f)

    mesin, voice = SUARA[args.suara]
    kerja = tempfile.mkdtemp(prefix="narasi-")
    try:
        print("menyintesis %d baris  ·  %s  (%s)" % (len(BARIS), voice, mesin))
        if mesin == "kokoro":
            sintesis_kokoro(voice, kerja, args.model_dir, args.laju)
        else:
            sintesis(mesin, voice, kerja)

        bersih = []
        for i in range(1, len(BARIS) + 1):
            masuk = os.path.join(kerja, "n%02d.wav" % i)
            keluar = os.path.join(kerja, "p%02d.wav" % i)
            jalan(["ffmpeg", "-v", "error", "-i", masuk, "-af", POLES,
                   "-ac", "2", "-ar", "48000", keluar, "-y"])
            bersih.append(keluar)

        if args.coba:
            os.makedirs(args.keluaran, exist_ok=True)
            for i, f in enumerate(bersih, 1):
                shutil.copy(f, os.path.join(args.keluaran, "baris-%02d.wav" % i))
            print("WAV narasi -> " + args.keluaran)
            return

        # satu filtergraph: tiap baris digeser ke waktunya, dicampur jadi trek
        # narasi, lalu bed ambiennya di-duck di bawahnya
        masuk = ["-i", VIDEO, "-i", BED]
        for f in bersih:
            masuk += ["-i", f]

        bagian = []
        for i, mulai in enumerate(MULAI):
            ms = int(round((mulai + JEDA) * 1000))
            bagian.append("[%d:a]adelay=%d|%d[a%d]" % (i + 2, ms, ms, i))
        campur = "".join("[a%d]" % i for i in range(len(MULAI)))
        graf = ";".join(bagian) + ";" + (
            campur + "amix=inputs=%d:normalize=0,apad,atrim=0:38.04[vo];" % len(MULAI) +
            "[vo]asplit=2[vo1][kunci];"
            "[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[bed];"
            # ducking: bed turun saat narator bicara, naik lagi di sela-selanya
            "[bed][kunci]sidechaincompress=threshold=0.02:ratio=9:attack=15:release=450[duck];"
            "[duck][vo1]amix=inputs=2:normalize=0[mix];"
            "[mix]alimiter=limit=0.94[out]"
        )

        sementara = os.path.join(kerja, "hasil.mp4")
        jalan(["ffmpeg", "-v", "error"] + masuk +
              ["-filter_complex", graf,
               "-map", "0:v", "-map", "[out]",
               "-c:v", "copy", "-c:a", "aac", "-b:a", "144k",
               "-movflags", "+faststart", sementara, "-y"])
        shutil.copy(sementara, VIDEO)
        print("narasi tercampur -> " + VIDEO)
        print("videonya disalin apa adanya (-c:v copy), tidak di-encode ulang.")
    finally:
        shutil.rmtree(kerja, ignore_errors=True)


if __name__ == "__main__":
    main()
