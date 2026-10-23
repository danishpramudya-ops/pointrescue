# 5-WEBSITE — Situs pengenalan POINT RESCUE

Situs statis satu halaman. Tanpa build, tanpa npm — seluruh pustaka sudah
disalin ke `vendor/`. Sekitar 39 MB yang benar-benar disajikan: 20 MB di
antaranya `app/`, build web aplikasi Flutter yang berjalan di dalam mockup
ponsel, dan 13 MB filmnya. Versi lama ada di `5-WEBSITE/` dan boleh dihapus.

## Menjalankan

Harus lewat HTTP (modul ES, `.obj`, dan `.json` tidak bisa dimuat dari
`file://`). Dari folder `POINTRESCUE-FINAL`:

```bash
python 5-WEBSITE/serve.py
```

Lalu buka <http://localhost:8130> (Indonesia) atau
<http://localhost:8130/en/> (Inggris). Jangan pakai `python -m http.server`:
tidak mengirim header no-cache (lihat bagian *Cache* di bawah) **dan** melayani
satu permintaan pada satu waktu — halaman ini memuat dua iframe berat sekaligus
(viewer 3D dan dashboard), yang dengan server satu utas bisa saling menunggu
sampai gagal. `serve.py` sekarang `ThreadingTCPServer`.

## Isi folder

```
index.html         seluruh isi halaman
css/style.css      sistem desain + transisi tiap bagian
js/intro.js        animasi logo pembuka
js/scroll.js       mesin gulir: reveal, split teks, rel horizontal, grafik
js/devices.js      laptop (dashboard asli) + ponsel (layar aplikasi asli)
                   + penutup "menyiapkan model 3D" untuk viewer bagian 04
js/sim.js          simulasi visual Gagasan & Cara kerja
js/i18n.js         teks yang digambar JS (label grafik, simulasi, sakelar)
js/gooey-nav.js    port vanilla <GooeyNav /> React Bits, bertema sinyal
js/tilted-card.js  port vanilla <TiltedCard /> React Bits, kartu tim
js/wireframe-ball.js bola rangka WebGL di penutup
js/validasi.js     lima grafik bagian 07, dari rekaman lapangan asli
assets/validasi.js data 8 sesi uji — salinan apa adanya dari repo tim
app/               `flutter build web` aplikasi tim, jalan di dalam ponsel
proto/             mesin 3D milik tim (three-d-stage, assembly-model, parts/)
proto/hero.html    sorotan 3D di hero — berputar sendiri, tidak bisa disentuh
en/index.html      versi bahasa Inggris, dibangkitkan tools/buat-en.py
link/              halaman tautan resmi (pengganti Linktree), dua bahasa
komparasi/         halaman "Komparasi Sistem" (Point Rescue · Handy Talky · Meshtastic), dua bahasa
qr/                kode QR resmi — situs + halaman tautan; SVG untuk cetak
dash/              dashboard operator asli + shim.js + replay.json
assets/photo/      foto prototipe (sudah di-grade ke arah biru)
assets/video/      film PKM-KC bagian 01 (46 MB, H.264 1080p30) + posternya
assets/img/        logo, wordmark, kartu tim, kontur latar
assets/casing.obj  dipakai parts/casing.js (jalurnya relatif ke halaman)
vendor/three/      Three.js r184
tools/qa-tangkap.py  tangkap layar tiap bagian lewat Chrome headless
tools/render-3d.py   PNG transparan model 3D — bahan infografis & IG
tools/kontur.py      bangkitkan garis kontur SVG untuk latar seksi
tools/narasi.py      (arsip) narasi film lama — tak dipakai sejak filmnya diganti
tools/buat-en.py     bangun en/index.html dari index.html + kamus-en.py
tools/buat-qr.py     bangkitkan kode QR resmi lalu UJI bahwa terbaca
tools/buat-og.py     render kartu pratinjau tautan (assets/img/og-card.jpg)
tools/cek-sebelum-push.py  pemeriksaan keamanan sebelum push — jalankan tiap kali
tools/pangkas-pcb.py       kosongkan jalur tembaga di data 3D papan
tools/sanitasi-validasi.py bulatkan koordinat gateway di data uji
```

## Urutan bagian

Intro logo → Hero → 01 Masalah → 02 Gagasan → 03 Cara kerja → 04 Anatomi 3D →
05 Prototipe → 06 Posko/Dashboard → 07 Pengujian → 08 Aplikasi → 09 HKI →
10 Tim → 11 Penutup.

Bagian "Elektronik" (dulu 05) dihapus pada 23 Okt 2026 atas permintaan tim —
materi desain papan tidak untuk dipublikasikan. Bagian sesudahnya naik satu
nomor, jadi "bagian 08" di catatan lama kini berarti bagian 07 (Pengujian),
dan seterusnya. Transisi `layers` (silang-pudar lapisan) ikut hilang bersamanya.

## Transisi per bagian

Tiap bagian sengaja dibuat berbeda, digerakkan dari satu loop rAF di
`scroll.js` yang menulis nilai ke CSS custom property:

| Bagian      | Transisi                                                     |
|-------------|--------------------------------------------------------------|
| Intro       | cincin sinyal memancar, logo naik, wordmark ter-*wipe*        |
| Hero        | baris judul naik dari mask, angka berhitung, grid parallax    |
| 01 Masalah  | **ScrollExpand** — bingkai membuka jadi full-bleed, film mulai |
| 02 Gagasan  | rel horizontal — gulir tegak digeser jadi gerak mendatar      |
| 03 Cara kerja | garis mesh menggambar dirinya + titik paket berjalan        |
| 04 Anatomi  | viewer 3D interaktif penuh (iframe), penjelasan di sampingnya |
| 05 Prototipe | foto full-bleed keluar dari zoom (1.35 → 1.0)                |
| 06 Posko    | dashboard asli berjalan di dalam layar laptop                  |
| 07 Pengujian | 754 titik ukur asli mengendap, batang jangkauan tumbuh       |
| 08 Aplikasi | ponsel berputar; layar aplikasi berganti sendiri               |
| 09 HKI      | kartu dokumen bangkit dari tumpukan                           |
| 10 Tim      | kartu membuka seperti kartu remi, lalu miring mengikuti kursor |

Semua menghormati `prefers-reduced-motion`: kalau menyala, animasi mati dan
isi tetap terbaca penuh.





## QA visual — cara benar-benar melihat hasilnya

Ini yang paling lama tidak terpecahkan: selama dua sesi pengembangan, tidak ada
satu pun perubahan yang benar-benar dilihat hasilnya. Panel browser di dalam
editor tidak bisa dipakai — `innerWidth` jadi 0, rAF beku, `document.hidden`
selalu `true`, `getComputedStyle` mengembalikan nilai basi, dan screenshot-nya
time out. Chrome sungguhan lewat MCP pun sama saja **selama jendelanya
tertutup jendela lain**: Chrome berhenti menggambar area yang tidak terlihat,
jadi tangkapan layarnya keluar setengah kosong — dan itu stabil antar
percobaan, sehingga gampang salah dibaca sebagai "bagiannya memang rusak".

Yang berhasil: **Chrome headless dikemudikan Playwright.** Halamannya tidak
pernah tertutup apa pun, jadi yang tergambar memang yang ada.

```bash
pip install playwright                       # driver saja, Chrome yang terpasang dipakai
python 5-WEBSITE/serve.py                    # terminal lain
python 5-WEBSITE/tools/qa-tangkap.py         # 25 tangkapan → tools/tangkapan/
python 5-WEBSITE/tools/qa-tangkap.py --lebar 390 --tinggi 844 --awalan m
```

Dua hal yang membuat skripnya bisa dipercaya:

- **Menggulir bertahap, bukan melompat.** Seluruh transisi di situs ini
  digerakkan posisi gulir; `scrollTo` sekali lompat menangkapnya di pose yang
  salah. Skripnya menggulir 36 langkah lalu menunggu 1 detik.
- **`--enable-unsafe-swiftshader`** supaya radar WebGL dan three.js tetap
  tergambar di headless, dan `--autoplay-policy=no-user-gesture-required`
  supaya film bagian 01 mau berjalan.

`_log.json` di folder keluaran berisi galat konsol, galat halaman, permintaan
HTTP yang gagal, dan peringatan kalau halaman jadi bisa digulir mendatar.

**`tools/tangkapan/` bukan bagian situs.** Isinya keluaran sekali pakai dan
gampang membengkak sampai puluhan MB. Hapus sebelum situsnya di-deploy — satu
perintah di atas membuatnya lagi.

## Cache — baca ini kalau perubahan tidak muncul

Berkali-kali selama pengembangan, halaman terlihat "tidak berubah" padahal
CSS/JS-nya sudah diperbarui: browser memakai salinan lama dari cache
(`python -m http.server` tidak mengirim header no-cache). Dua pengaman
sekarang terpasang:

1. Tautan CSS/JS di `index.html` memakai `?v=N`. **Naikkan angkanya** setiap
   kali mengubah `css/` atau `js/`.
2. `serve.py` — server yang mengirim header no-cache. Pakai ini saat
   mengerjakan situsnya:

```bash
python 5-WEBSITE/serve.py
```

## Latar seksi — gradien + kontur topografi

Sebelumnya tiga seksi terang rata abu-abu polos dan berurutan, sementara enam
seksi gelap memakai gradien radial yang **persis sama** — paling terasa di
pasangan Anatomi ↔ Elektronik yang berdampingan langsung tanpa seksi terang di
antaranya, sehingga batas keduanya hilang. (Elektronik sudah dihapus belakangan;
tiga arah cahaya `g-a/g-b/g-c` tetap dipakai bergantian.)

Sekarang tiap seksi dapat dua lapis:

1. **Gradien lembut** menggantikan warna rata, supaya ada kedalaman.
2. **Garis kontur topografi**, dibangkitkan `tools/kontur.py`.

```bash
python 5-WEBSITE/tools/kontur.py    # -> assets/img/kontur-{terang,gelap}.svg
```

### Kenapa kontur, dan kenapa bukan pola berulang

Garis kontur adalah bahasa visual peta pencarian — medan tempat alat ini
dipakai. Jadi teksturnya bukan hiasan yang ditempel dari luar.

Dan ia **bukan pola kecil yang di-repeat**: pola berulang selalu ketahuan
jahitannya. Di sini medannya benar-benar dihitung — jumlah enam gundukan gauss
ditambah dua punggungan sinus — lalu garis isonya ditarik dengan **marching
squares** pada 15 tingkat ketinggian, disambung jadi 24 jalur panjang. Satu
gambar 1600 × 1100, 61 KB, tanpa jahitan.

Kasus ambigu marching squares (dua sudut berseberangan di atas ambang) dipecah
lewat rata-rata keempat sudutnya, supaya garisnya tidak pernah menyilang
sendiri. Potongan-potongannya juga dirangkai dulu jadi jalur panjang — tanpa
itu SVG-nya berisi ribuan `<line>` pendek dan ukurannya membengkak berkali
lipat.

### Cara dipasangnya

| Seksi | Perlakuan |
|---|---|
| Terang (`.sec`) | kontur tinta tipis, dipatok di atas, memudar ke bawah lewat `mask-image` |
| Gelap (`.sec--dark`) | kontur biru tipis + arah cahaya bergantian `g-b` / `g-c` |
| Rel horizontal (`.track`) | konturnya di panel **sticky**-nya, bukan di seksinya |

Dua hal yang menentukan:

- **Dipatok di atas lalu dimudarkan**, bukan di-`cover`. Seksi Masalah
  tingginya 4000 px lebih; kalau gambarnya di-`cover` konturnya membesar
  luar biasa, dan kalau di-`repeat` jahitannya kelihatan.
- **`.track` beda perlakuan.** Seksi itu setinggi 420vh sementara isinya
  dipaku di tengah layar. Lapisan yang dipatok ke atas seksi akan tergulir
  hilang sesudah layar pertama, menyisakan abu-abu rata sepanjang sisanya.
  Jadi konturnya dipasang pada `.track__sticky`, ditulis sebagai background
  berlapis (gradien paper di atas konturnya) supaya tidak perlu bermain
  z-index dengan isi flex di dalamnya.

## Latar jaringan hidup

`js/mesh-bg.js` menggambar satu kanvas 2D tetap di paling belakang halaman:
titik-titik melayang pelan, saling menarik garis saat cukup dekat, sebagian
berdenyut seperti node, dan sesekali ada paket oranye berjalan di antara dua
titik. Bukan sekadar hiasan — itu gambaran mesh LoRa yang dijelaskan situs ini.

Cukup **satu** kanvas untuk seluruh halaman: seksi gelap dibuat tembus 10%
(`rgba(5,26,51,.9)`) sehingga kanvasnya terlihat menembus. Jumlah titik
menyesuaikan luas layar (26–72), berhenti saat sakelar animasi dimatikan.

## Perangkat peraga di dalam halaman

`js/devices.js` menggerakkan dua mockup perangkat — keduanya **di dalam
halaman**, bukan membuka tab atau situs baru.

**Laptop posko (bagian 06).** Bodi laptop digambar penuh dengan CSS — bezel
tebal, titik kamera, merek di dagu layar, engsel selebar 74%, lalu badan bawah
berbentuk **trapesium** (`clip-path`) yang lebih lebar dari layarnya sehingga
terasa punya kedalaman, plus trackpad, takik depan, dan bayangan di meja.
Ada juga pantulan cahaya tipis di kaca layar.

Dashboard operator yang sesungguhnya (`dash/index.html`) berjalan di dalamnya. Iframe-nya dirender pada
**1440 × 900 lalu di-scale** agar muat; kalau iframe-nya langsung dikecilkan,
dashboardnya masuk breakpoint ponsel dan tata letaknya berubah total. Tombol
"Buka layar penuh" tetap ada untuk yang mau berinteraksi lebih leluasa.

**Ponsel (bagian 08).** Sama persis prinsipnya dengan laptop: yang berjalan di
dalamnya **aplikasi Flutter yang sungguhan**, bukan gambarnya. `app/` adalah
`flutter build web` dari `1-PROGRAM/mobile`. Tab bar-nya bisa diketuk, petanya
bisa digeser, rincian nodenya bisa dibuka.

Tidak satu pun berkas aplikasi diubah. Yang ditambahkan cuma satu titik masuk
baru di salinan build, `lib/main_web.dart`, yang merangkai ulang widget dan
repository yang sama — pola yang sudah dipakai tim sendiri di
`tool/tangkap_hki.dart`. Bedanya dengan `main.dart`: alur splash → onboarding →
login → pindai node dilewati (pengunjung situs tidak punya node untuk
disambungkan), dan keadaan mesh yang disuntikkan sama persis dengan yang dipakai
gambar HKI — node 1203/1222/2001, jejak, pembuktian tautan, riwayat pesan.

Cara membangun ulang kalau aplikasinya berubah:

```bash
cp -r 1-PROGRAM/mobile /tmp/mobileweb          # jangan build di folder tim
cd /tmp/mobileweb
flutter create --platforms=web --project-name pointrescue .
cp <main_web.dart>  lib/main_web.dart
flutter build web --release -t lib/main_web.dart
```

Lalu salin `build/web` ke `5-WEBSITE/app/` dan ulangi **tiga suntingan wajib**:

| Berkas | Suntingan | Kenapa |
|---|---|---|
| `index.html` | `<base href="/">` → `<base href="./">` | disajikan dari `/app/`, bukan akar situs; tanpa ini `flutter_bootstrap.js` dicari di akar dan 404 |
| `flutter_bootstrap.js` | `config: { useLocalCanvasKit: true }` | tanpa ini CanvasKit **diambil dari gstatic.com**. Situs ini harus bisa dibuka tanpa internet — itu justru inti alatnya |
| `flutter_service_worker.js` | dihapus, `serviceWorkerSettings` dibuang | cache-nya 20 MB di browser pengunjung dan berkali-kali menyajikan versi lama |

Yang boleh dipangkas dari hasil build: seluruh `canvaskit/*.symbols` dan
`canvaskit/skwasm*` (skwasm hanya dipakai build `--wasm`). 34 MB → 20 MB, dan
aplikasinya tetap jalan.

Iframe-nya dirender **390 × 844 lalu di-scale** — alasan yang sama dengan
dashboard. Tangkapan layar HKI tetap dipakai sebagai poster di belakangnya,
jadi layarnya sudah terisi sejak detik pertama sementara CanvasKit masih dimuat.

## Catatan: url() di dalam custom property

Latar foto kartu Masalah **tidak** boleh dikirim lewat `style="--bg:url(...)"`
di HTML. `url()` relatif di dalam custom property diresolusi terhadap **lokasi
stylesheet**, bukan dokumen — `assets/foto.jpg` berubah jadi
`/css/assets/foto.jpg` dan 404. Jalurnya sekarang ditulis langsung di
`style.css` sebagai `url("../assets/photo/masalah-N.jpg")`.

## Film dan kartu yang bertabrakan (bagian 01)

Tepi bawah film dan tepi atas kartu Masalah terukur berjarak **0 px** — `.se`
diikuti langsung oleh `.wrap` tanpa jarak sama sekali. Lebih buruk lagi,
kartunya muncul dengan `rotateX(-42deg)` dari `transform-origin:50% -60%`,
jadi badannya menjulur ke atas dan benar-benar menembus filmnya selama animasi.

Sekarang `.se + .wrap` diberi `padding-top:clamp(64px,7vw,120px)` (terukur
112 px pada layar 1600), dan tepi bawah filmnya dikasih gradien `.se__stage::after`
supaya larut ke warna seksi — bukan berhenti sebagai potongan lurus.

## Tiga jebakan yang ketahuan saat QA visual pertama

Ketiganya sudah diperbaiki; dicatat karena polanya gampang terulang.

**Selektor keturunan yang bocor.** Kartu hasil di bagian 07 memakai
`<b><span data-count="716">…</span><small>m</small></b>`, sedangkan CSS-nya
punya `.result span{ display:block; font-size:14.5px }` untuk keterangan di
bawahnya. `span` itu juga mengenai penghitung di dalam `<b>` — angkanya jadi
14,5 px dan turun baris, sementara satuannya (`.3em` dari 66 px ≈ 20 px)
justru terlihat lebih besar. Ketiga kartunya terbaca seperti rusak.
Perbaikannya `.result > span`. Kalau sebuah blok punya elemen bersarang,
selektornya harus anak langsung.

**Rasio yang dikunci di elemen yang salah.** `.phone` memegang
`aspect-ratio:620/1342` **dan** `padding:10px`. Padding piksel tetap tidak ikut
diskalakan, jadi layar di dalamnya berakhir 0,4388 — bukan 0,4620 — dan
`object-fit:cover` memotong sekitar 5% sisi kiri-kanan tangkapan layar HKI yang
justru harus tampil apa adanya. Sekarang rasionya dipegang `.phone__screen`;
bodi ponselnya menyesuaikan.

**`.wrap--wide` bukan cuma untuk viewer.** Bagian 04 memakainya untuk seluruh
isi seksi, jadi judul dan teksnya mulai di 20 px sementara semua seksi lain
mulai di 170 px (pada layar 1600 px). Sekarang `.head` dan `.anat__intro`
diberi `padding-inline:max(0px, calc((100% - var(--wrap)) / 2))`, jadi
teksnya segaris dengan seksi lain sementara viewer-nya tetap selebar mungkin.
Jangan pakai `margin-inline:auto` untuk ini — `.head` punya `max-width`
sendiri, dan auto-margin malah menengahkannya.

## Simulasi visual (Gagasan & Cara kerja)

`js/sim.js` menggambar lima simulasi SVG kecil, semuanya digerakkan satu loop
rAF bersama. Hanya yang terlihat di layar yang dianimasikan; saat sakelar
animasi dimatikan tiap simulasi tetap digambar sekali pada pose informatif,
jadi tidak pernah kosong.

| `data-sim` | Menjelaskan |
|---|---|
| `nooperator` | Menara seluler mati → tiga unit membentuk tautannya sendiri |
| `flooding` | Paket menyebar hop demi hop, jatah hop turun, salinan dibuang |
| `situasi` | Satu paket, dua tujuan: dasbor posko dan aplikasi genggam |
| `fallback` | Peta berjenjang: ubin daring → tersimpan → grid buatan program |
| `mesh` | Paket menempuh K→S→G, dengan jeda acak 400–700 ms tiap node |

Empat yang pertama duduk di kartu Gagasan (seksi terang), jadi masing-masing
diberi panel gelap `.tcard__sim` supaya palet warnanya konsisten. `mesh`
duduk langsung di seksi terang, karena itu warnanya beda (biru tua & slate).

## Suara film — bed ambien + narasi

> **Arsip.** Film ini (cuplikan Wikimedia + narasi Kokoro) diganti video PKM-KC
> milik tim pada 23 Okt 2026 — lihat *Bagian 01* di bawah. `masalah.mp4` sudah
> tidak ada di folder, jadi `tools/narasi.py` tidak bisa dijalankan lagi tanpa
> mengambil berkasnya dari riwayat git. Yang masih berlaku dari bagian ini
> hanya **Jebakan: tombolnya tertimbun nav**.

`assets/video/masalah.mp4` punya dua lapis audio, **keduanya dibuat sendiri**,
nol risiko hak cipta:

1. **Bed ambien**, disintesis ffmpeg — drone 55 Hz + 82 Hz, angin (pink noise
   di-lowpass 340 Hz), beberapa blip radio tipis. Disimpan terpisah sebagai
   `assets/video/masalah-bed.m4a`, **tanpa narasi**.
2. **Narasi**, tujuh baris subtitle yang sama, dibacakan model TTS neural
   **Kokoro-82M** (Apache 2.0) yang berjalan di komputer sendiri.

### Membuat ulang narasinya

```bash
python 5-WEBSITE/tools/narasi.py                  # Kokoro, suara George
python 5-WEBSITE/tools/narasi.py --suara onyx
python 5-WEBSITE/tools/narasi.py --suara mark     # pembaca bawaan Windows
python 5-WEBSITE/tools/narasi.py --coba           # cuma WAV, video tidak disentuh
```

**Bed-nya sengaja disimpan sebagai berkas sendiri.** Kalau narasi dicampur ke
mp4 yang sudah bernarasi, suaranya menumpuk. Skrip itu selalu merakit dari
trek video `masalah.mp4` (disalin `-c:v copy`, tidak di-encode ulang) + bed
bersih + narasi baru, jadi aman dijalankan berkali-kali.

### Tiga mesin suara, dan kenapa bawaannya Kokoro

| Mesin | Suara | Sifat |
|---|---|---|
| **kokoro** | George, Fable, Lewis, Michael, Onyx, Adam, Heart, Bella | **neural**, 24 kHz, jauh paling natural |
| `onecore` | Mark, David, Zira | konkatenatif, 16 kHz, iramanya luwes tapi jelas robot |
| `sapi` | David Desktop, Zira Desktop | konkatenatif, 22 kHz, paling kaku |

Dua mesin Windows itu dipertahankan sebagai cadangan: keduanya tidak butuh
unduhan apa pun dan selalu ada di mesin Windows mana pun.

**Kokoro-82M**, Apache 2.0, 82 juta parameter, jalan di CPU biasa lewat
onnxruntime. Lisensinya penting: bobot model dan kodenya sama-sama Apache 2.0,
jadi keluarannya bebas dipakai — sejalan dengan disiplin lisensi yang sudah
dipegang situs ini untuk footage dan bed ambien.

```bash
pip install --ignore-requires-python kokoro-onnx soundfile
mkdir -p ~/.cache/kokoro && cd ~/.cache/kokoro
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
curl -sL -O $BASE/kokoro-v1.0.onnx      # 325 MB
curl -sL -O $BASE/voices-v1.0.bin       # 28 MB
```

Tiga hal yang perlu diketahui:

- **`--ignore-requires-python` itu wajib.** `kokoro-onnx` menutup Python 3.14
  di metadata-nya, padahal seluruh dependensinya (onnxruntime 1.29, numpy,
  phonemizer, espeakng-loader) sudah punya wheel 3.14 dan jalan tanpa masalah.
  Tanpa bendera itu pip berputar-putar mundur mencari versi yang cocok dan
  tidak pernah selesai.
- **Modelnya disimpan di luar folder situs** (`~/.cache/kokoro/`). 353 MB, dan
  situs tidak butuh satu byte pun darinya saat disajikan — narasinya sudah
  dipanggang ke dalam mp4.
- **Butuh internet sekali saja**, saat mengunduh model. Sesudah itu seluruhnya
  lokal.

### Jalan buntu yang sempat dicoba

**Voice "Natural" Windows 11** (Aria, Guy, Jenny) memang neural dan gratis,
tapi **terkunci untuk Narrator**. Tidak bisa diakses `System.Speech` maupun
`Windows.Media.SpeechSynthesis`, jadi tidak bisa dipakai skrip mana pun.

**`edge-tts`** memberi suara neural Azure lewat endpoint Read Aloud milik Edge
tanpa kunci API. Kualitasnya bagus, tapi lisensinya abu-abu untuk aset yang
akan dilombakan — dan situs ini sudah teliti soal lisensi footage, jadi tidak
konsisten kalau narasinya justru dari sumber yang tidak jelas izinnya. Kokoro
Apache 2.0 menyelesaikan itu tanpa kompromi kualitas.

### Timing-nya bukan tebakan

Subtitle-nya sudah ter-*burn-in* ke gambar, jadi kotak subtitle-nya dipindai
dulu: ffmpeg mengambil 10 bingkai per detik dari potongan
`crop=880:76:200:604`, lalu jumlah piksel putih per kolom dibandingkan antar
bingkai untuk mencari batas segmen. Hasilnya bersih — tujuh blok 5 detik mulai
di 0,5 / 5 / 10 / 15 / 20 / 25 / 30 detik. Tiap baris ditaruh **+0,35 detik**
sesudah subtitle-nya muncul, supaya suaranya menyusul tulisannya, bukan
barengan.

Tiap baris dipangkas heningnya di kedua ujung, di-highpass 90 Hz, dikompresi
tipis, dinormalkan ke −17 LUFS. Bed ambien di-*duck* di bawah narasi lewat
`sidechaincompress` (ratio 9, release 450 ms), lalu seluruhnya lewat
`alimiter`. Terukur: naik ke sekitar −20 dB saat ada suara, turun ke −27…−34 dB
di sela-selanya.

### Jebakan: tombolnya tertimbun nav

Video tetap `muted` di markup karena browser melarang autoplay bersuara —
narasinya baru terdengar setelah tombol **Suara** ditekan. Tombol itu dulu
`top:20px`, sementara nav bar setinggi `var(--nav-h)` = 68 px dan ber-z-index
60 melawan 4. Artinya tombolnya **tertimbun sepenuhnya**: tidak terlihat,
tidak bisa diklik, dan narasi filmnya tidak pernah kedengaran oleh siapa pun.

Sekarang `top:calc(var(--nav-h) + 18px)`, ukurannya diperbesar, dan di
bawahnya ada ajakan sekali jalan — *"Filmnya ada narasinya — tekan Suara"* —
yang hilang sendiri begitu suaranya dinyalakan.

## Ilustrasi bencana

Tiap kartu di bagian Masalah punya latar fotonya sendiri (`.fc::before`),
diambil sebagai still dari klip berlisensi bebas di Wikimedia Commons, lalu
digelapkan dan digrade ke biru supaya teks di atasnya tetap terbaca:

1. Lembah hutan berlumpur — wilayah tanpa sinyal — *Rescue work after Mundakkai
   devastation*, Makks2010, **CC0**
2. Tim menyisir puing — waktu yang tak bisa ditawar — *Philippines Landslide*,
   VOA News, public domain
3. Kota terendam dari udara — koordinasi yang buta — *Aerial video of the
   aftermath of the flood in Aqqala*, Mohammad Moheimany, **CC BY 4.0**

**Jangan hapus blok "Sumber gambar latar" di bagian 01.** Still nomor 3
turunan dari karya CC BY 4.0 — lisensinya mewajibkan nama pencipta, sumber, dan
lisensi tercantum. Blok itu dulu berbagi tempat dengan transkrip film lama; saat
filmnya diganti, transkripnya dibuang tapi atribusi ini sengaja dipertahankan.
Daftar URL aslinya ada di `assets/video/_sumber-footage.json`.

## Sakelar animasi

`js/motion.js` memasang satu tombol di nav yang mengatur SELURUH animasi situs.

Sebelumnya tiap modul membaca `prefers-reduced-motion` sendiri-sendiri lalu
mematikan diri. Di komputer yang setelan *animation effects* Windows-nya mati,
akibatnya radar membeku dan kursor jejak tidak muncul sama sekali — tanpa cara
memulihkannya dari dalam halaman.

Sekarang setelan sistem hanya jadi **nilai awal**; tombolnya bisa menyalakan
atau mematikan kapan saja, dan pilihannya diingat di `localStorage`.

Modul lain memanggil `PRMotion.on`. CSS memakai `html[data-motion="off"]`.

## Police line

Memakai pita asli dari dashboard (`dash/assets/stripe.png`, 1024 × 43, ubin
mulus) yang disalin ke `assets/img/policeline.png`. Dua pita disilangkan dan
digeser ke arah **berlawanan** — `tapeLeft` 24 s dan `tapeRight` 30 s.
Pergeserannya tepat satu ubin (1024 px) supaya loop-nya tidak berkedip.

**Jebakan: pita terpotong lurus.** Strip-nya selebar 120% dan diputar, jadi
ujungnya terangkat sekitar `0,6 x lebar layar x tan(sudut)` — 29 px pada layar
1600 dan 43 px pada 2400. Kotak `.tape` dulu tingginya tetap 104 px dengan
`overflow:hidden`, sehingga ujung pita **dan bayangannya** terpenggal jadi garis
lurus, makin parah makin lebar layarnya. Sekarang tingginya ikut lebar layar
(`calc(88px + 4.2vw)`), strip-nya diposisikan dari tengah kotak, dan margin
negatifnya menyesuaikan supaya tinggi yang dipakai tata letak tetap 48 px.

Terpasang **tujuh kali**, di tiap batas seksi gelap↔terang — tepi keras di
situ yang membuat halaman terasa kaku. Sudut kemiringannya dibalik selang-
seling lewat `.tape--alt` supaya tidak terlihat berulang saat digulir.

## Viewer 3D (bagian 04)

`proto/viewer.html` adalah halaman mandiri yang menjalankan **`site.js` milik
tim tanpa diubah sama sekali** — hanya kerangka HTML dan gayanya yang ditulis
ulang agar sewarna situs, plus importmap diarahkan ke Three.js ter-vendor
supaya jalan tanpa internet.

Halaman utama memuatnya lewat `<iframe>`, jadi seluruh fiturnya utuh: slider
explode, Labels (17 label + garis penunjuk), Ghost, Spin, preset Iso/Depan/
Samping/Atas, daftar 17 part dengan hover-sorot dan klik-isolasi. Penjelasan
dan spesifikasi ada di kolom sebelahnya.

`site.js` butuh id `bomBody`, `dlObj`, `dlGlb`, `dlAnim`, dan `pcb-data` — ada
di viewer.html dalam keadaan tersembunyi supaya tidak melempar error.

Iframe-nya `loading="lazy"` dan isinya berat: three.js, OBJ casing, lalu 17
part dirakit. Selama beberapa detik kotaknya kosong setinggi 920 px tanpa
penjelasan apa pun — pada QA pertama itu sempat terbaca sebagai "bagian 04
rusak total". Sekarang ada `.anat__wait` di belakangnya (pemintal + teks
"Menyiapkan model 3D"), disingkirkan `devices.js` saat iframe-nya selesai.
Penutup itu juga punya jaring pengaman **CSS murni** — animasi 20 detik yang
menghilangkannya sendiri — supaya viewer-nya tidak ikut tersembunyi selamanya
kalau `devices.js` gagal dimuat. Penutup yang menutupi selalu perlu jalan
keluar yang tidak bergantung pada JS.

## Latar Radar

`js/radar.js` adalah port **vanilla** dari komponen `<Radar />` React Bits.
Shader GLSL-nya dipakai apa adanya — cincin, jari-jari, sapuan, falloff, dan
reaksi kursor semuanya identik. Yang ditukar hanya lapisan penggambarnya:
`ogl` diganti WebGL mentah, jadi proyek ini tidak perlu menambah pustaka.

Dipasang cukup dengan satu div; semua prop lewat `data-*` kebab-case:

```html
<div class="radar radar--hero" data-radar
     data-color="#3f8fe8" data-background-color="#000000"
     data-speed="0.55" data-scale="0.58" data-ring-count="9"></div>
```

`backgroundColor` hitam membuat `alpha = length(signal)` di shader, sehingga
kanvasnya **transparan** — hanya garis radar yang tergambar di atas gradien
latar seksi. Warnanya biru saja (`#3f8fe8` di hero, `#2f7fe0` di penutup).

Sekarang terpasang di **hero saja**. Penutupnya dulu memakai radar yang
sama, dan dua ujung halaman jadi terasa kembar — sekarang penutupnya
punya bola rangka sendiri (lihat bagian di bawah). Mau ditambah di seksi lain,
salin saja div-nya; pastikan induknya `position:relative`. Radar berhenti
menggambar saat keluar layar (IntersectionObserver) dan membeku pada satu pose
kalau `prefers-reduced-motion` menyala.

## Bola rangka di penutup

Penutupnya sekarang punya bola rangka berputar: 12 simpul, 30 rusuk,
digambar `js/wireframe-ball.js` di WebGL mentah.

### Kenapa ditulis sendiri, bukan dipasang dari paketnya

Komponen `<WireframeBall />` ada di React Bits **Pro**. Memasangnya berarti
`npx shadcn add`, `components.json`, registry berlisensi, dan variabel
`REACTBITS_LICENSE_KEY`. Tiga hal menghalangi:

- Proyek ini **vanilla tanpa build dan tanpa npm** — tidak ada
  `components.json` maupun `package.json`. Satu perintah itu akan menyeret
  React, Tailwind, dan langkah build ke proyek yang justru dirancang tidak
  punya semuanya.
- **Kunci lisensinya tidak ada** di mesin ini.
- Kode berbayarnya tidak boleh disalin ke sini.

Jadi yang dibawa masuk **visualnya**, ditulis ulang dengan perkakas yang sudah
dipakai situs ini — persis perlakuan yang diberikan ke Radar, GlowCursor,
ScrollExpand, GooeyNav dan TiltedCard sebelumnya.

### Kenapa bukan raymarch

Versi Pro me-raymarch SDF polihedron di dalam shader. Di sini pendekatannya
analitik: 12 simpul diputar dan diproyeksikan di JS, lalu 30 rusuknya dikirim
ke shader sebagai ruas garis layar, dan tiap piksel menghitung jaraknya ke tiap
ruas lalu menumpuk cahayanya.

Alasannya anggaran, bukan kemalasan. Halaman ini sudah menjalankan satu radar
WebGL, mesin 3D three.js di dua tempat, build web Flutter, dan kanvas mesh.
Raymarching SDF butuh puluhan langkah × 30 uji jarak per piksel; cara analitik
butuh 30 uji saja, sekali. Hasil pandangnya sama — rusuk bercahaya lembut yang
meredup di sisi jauh.

### Yang membuatnya nyambung dengan alatnya

Ikosahedron itu **12 simpul dan 30 rusuk** — dan di sini simpulnya digambar
lebih terang daripada rusuknya, dengan sorot oranye pada yang menghadap kamera.
Itu memang maknanya: node dan tautan. Sisi yang membelakangi kamera menipis dan
meredup, jadi bolanya terbaca punya kedalaman, bukan lingkaran datar.

Rusuknya **dihitung, bukan didaftar tangan**: tiap pasang simpul yang jaraknya
sama dengan jarak terpendek adalah rusuk. Daftar 30 pasang yang diketik manual
terlalu mudah salah satu angka, dan cacatnya sulit terlihat.

### Dua hal yang perlu diingat

**Teks penutup butuh scrim.** Sejak masih radar pun paragraf taglinenya sudah
tertimpa garis dan kontrasnya tipis; dengan rusuk yang lebih terang, tanpa
scrim teksnya benar-benar sulit dibaca. Sekarang `.outro__inner::before`
memberi gelap radial di belakang teksnya — radial, bukan kotak, supaya bolanya
tetap terlihat menembus di tepi.

**Scrim itu melebar 14% ke samping**, dan pada layar 390 px itu membuat halaman
bisa digulir mendatar. `overflow:hidden` pada `.outro` yang mengurusnya.
Jebakan ini tidak terlihat oleh pemeriksa lebar biasa: `querySelectorAll`
tidak bisa melihat pseudo-element, jadi elemen yang meluap tidak pernah
tersebut namanya — yang ketahuan cuma `scrollWidth` yang lebih besar.

## Kursor jejak

`js/glow-cursor.js` berbasis komponen `<GlowCursor />` React Bits.

**Model geraknya dipertahankan utuh**: rantai 64 titik yang saling mengejar,
easing kepala terkoreksi frame-rate `1 - (1-followSpeed)^delta`,
`chainEase = clamp(0.28 + followSpeed*0.35, 0.08, 0.92)`, dan idle fade
(`idleTimeout` / `fadeDuration`). Nama propnya sama.

**Penggambarnya ditukar ke SVG.** Shader WebGL aslinya membuat glow lembut yang
menyambung; yang diminta adalah jejak putus-putus dengan ikon sinyal di kepala.
Dash tajam itu pekerjaan SVG, bukan shader. Hasilnya juga lebih ringan —
halaman tidak perlu konteks WebGL ketiga di samping dua radar.

Prop yang berubah makna:

| Prop | Di sini |
|---|---|
| `glowIntensity` | kepekatan salinan jejak yang di-blur (pengganti halo) |
| `pulseSpeed` | kecepatan dash-offset berjalan menyusuri jejak |
| `hotspot`, `noiseStrength`, `glowSpread`, `blendMode` | tidak dipakai |

Kepala kursor adalah motif sinyal Point Rescue — tiga busur konsentris merah →
oranye plus titik pusat — dan **berputar mengikuti arah gerak**. Di atas elemen
yang bisa diklik, jejak menebal dan cincin luar muncul sebagai penanda.

Pengaturannya ada di objek `CFG` pada baris awal berkas.

Kursor bawaan hanya disembunyikan setelah efeknya benar-benar aktif (kelas
`has-cursorfx` di `<html>`), jadi kalau JS gagal kursor normal tetap ada.
Efek ini otomatis mundur di perangkat sentuh (`pointer: coarse`) dan saat
`prefers-reduced-motion` menyala, dan dimatikan di atas overlay dashboard.

## Logo

Ketiga berkas logo diambil dari ekspor Figma yang **sudah transparan**
(`Group 11`, `Group 46`, `watermarkkanan` di folder Downloads):

| Berkas | Isi |
|---|---|
| `assets/img/logo-mark.png` | pin + sayap sinyal, 620×747 |
| `assets/img/wordmark.png` | wordmark stiker POINT RESCUE, 900×613 |
| `assets/img/partners.png` | bar logo mitra (Kemdiktisaintek, Belmawa, PKM, UB) |

Versi sebelumnya ter-*flatten* ke latar putih — itu penyebab kotak putih di
belakang logo pada nav. Jangan pakai `get_screenshot` Figma untuk logo; hasilnya
selalu ikut warna kanvas. Ekspor lewat panel Export di Figma, atau pakai berkas
yang sudah ada ini.

## Bagian 01 — film PKM-KC + ScrollExpand

`js/scroll-expand.js` adalah port **vanilla** dari komponen `<ScrollExpand />`
React Bits (varian JavaScript + CSS). Logikanya dipertahankan apa adanya:
`smoothstep`, `clip-path: inset(...)`, zoom media `mediaZoom → 1`, ambang fade
judul (0.4→0.88), hint (0→0.12), overlay (0.68→1), dan pengikut eksponensial
`smoothing`. React tidak dibawa masuk karena situs ini vanilla.

Satu perilaku ditambahkan di luar komponen asli: **video baru diputar saat
bingkai penuh** (`data-play-at`, bawaan 0.98), lalu dijeda dan dikembalikan ke
awal saat bagian ini ditinggalkan.

Opsi diatur lewat `data-*` pada elemen `.se`, memakai nama kebab-case dari prop
aslinya — mis. `data-start-width="46"`, `data-media-zoom="1.28"`,
`data-scroll-distance="1.15"`, `data-hold-distance="0.75"`.

### Filmnya

`assets/video/pkm-point-rescue.mp4` — **video PKM-KC milik tim sendiri**, 3 menit
28 detik, narasi dan subtitle **berbahasa Indonesia** (subtitle ter-*burn-in*).
Isinya: perkenalan tim, masalah, cara kerja mesh, dashboard dan aplikasi, uji di
UB Forest, lalu kartu penutup. Menggantikan film lama pada 23 Okt 2026.

Berkas sumbernya 421 MB (1080p60, 15,9 Mbps) — jauh di atas batas 100 MB per
berkas di GitHub — jadi dikodekan ulang untuk web:

```
ffmpeg -i "PKM-POINTRESCUE (SUBTITLE).mp4" -map 0:v:0 -map 0:a:0 -map_metadata -1 -map_chapters -1 \
  -vf "fps=30000/1001,scale=1920:1080:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 27 -profile:v high -level 4.1 -maxrate 3500k -bufsize 7M -movflags +faststart \
  -af "alimiter=limit=0.95:level=disabled" -c:a aac -b:a 128k -ar 48000 -ac 2 pkm-point-rescue.mp4
```

Hasilnya 46,5 MB (rata-rata 1,87 Mbps). Alasan tiap pilihan:

- **CRF 27, bukan 24.** CRF 24 keluar 62 MB — di atas ambang peringatan GitHub
  (50 MB). Pada 27, subtitle masih tajam diperiksa 1:1.
- **`+faststart`** supaya mulai diputar tanpa menunggu seluruh berkas turun.
- **30 fps** (sumber 59,94): filmnya didominasi orang bicara dan b-roll, selisihnya
  nyaris tak terlihat dan bitrate-nya separuh.
- **`alimiter`**: puncak sumber +0,6 dBTP; tanpa pembatas, AAC bisa clipping.
  Loudness-nya (−13,9 LUFS) dibiarkan — itu campuran suara tim.
- **Metadata sumber dibuang** (`-map_metadata -1`).

**Subtitle ter-burn-in, jadi `object-fit` ikut dipikirkan.** Subtitle berada di
dasar gambar dan bisa selebar 90% bingkai. `cover` memotongnya begitu layar
bukan 16:9 — ponsel tegak, jendela yang terlalu lebar. Karena itu bawaannya
`contain` (film utuh, dengan pita hitam), dan `cover` hanya dipakai pada
rasio 1,7–2,0 (`@media (min-aspect-ratio:17/10) and (max-aspect-ratio:2/1)`),
rentang di mana potongannya tidak menyentuh teks. Jendela desktop biasa jatuh
di rentang itu, jadi tetap full-bleed.

**Poster** = frame detik 3,0 (kisi pentagon di awal film). Frame produk di detik
14 sempat dipakai tapi buram — bingkai teaser di-zoom 1,28× dan fokusnya jatuh
di tempat lain. Frame detik 3 tajam dan sama dengan adegan pembuka, jadi
peralihan poster → film tidak melompat.

**Server lokal tidak mendukung HTTP Range.** `serve.py` (turunan
`SimpleHTTPRequestHandler`) mengabaikan `Range`, jadi `video.currentTime = …`
tidak bisa melompat ke bagian yang belum terunduh. Di GitHub Pages bisa. Saat QA
lokal, putar film secara nyata sampai adegan yang ingin dilihat.

Untuk menukar film lagi: ganti `pkm-point-rescue.mp4` dan posternya, lalu
sesuaikan `aria-label` di `index.html` dan di `tools/kamus-en.py` — kuncinya
harus tidak diawali kunci KAMUS lain (mis. "Video PKM-KC"), karena KAMUS
diterapkan lebih dulu dan merusak entri ATRIBUT yang lebih panjang.

## Bagian anatomi 3D

> **Sudah tidak dipakai.** Bagian 04 sekarang memuat `proto/viewer.html`
> lewat iframe (lihat *Viewer 3D* di atas). `js/proto.js` tidak dirujuk dari
> mana pun, dan `proto/three-d-stage.js` masih ikut dimuat di `index.html`
> padahal elemen `<three-d-stage>` cuma ada di dalam iframe — iframe itu
> memuat salinannya sendiri. Keduanya aman dihapus; dibiarkan dulu supaya
> keputusannya ada di tim. Catatan di bawah dipertahankan sebagai riwayat.

Memakai mesin 3D tim apa adanya — `three-d-stage.js`, `assembly-model.js`, dan
`parts/*.js` tidak diubah sama sekali. `js/proto.js` hanya:

- memanggil `buildAssembly()` lalu `stage.setObject(model)`
- mengikat `setExplode(u)` + `framer.apply(u)` ke posisi gulir
- meredupkan part yang tidak sedang dibahas (material di-*clone*, warna
  di-lerp ke biru-abu `#37536f`, **bukan** ke hitam — latar halaman sudah
  gelap, part yang digelapkan akan hilang siluetnya)
- membuka `stage._controls` saat tombol **Ambil kendali** ditekan

Urutan langkah di `STEPS` (proto.js) harus sama dengan urutan `.part` di
`#parts` (index.html) — langkah aktif ditentukan dari indeks.

## Bagian dashboard

Tombol **Buka dashboard asli** memuat `dash/index.html` di dalam iframe:
dashboard operator yang sesungguhnya, kode sama dengan yang didaftarkan HKI.

Supaya jalan tanpa server Python, `dash/shim.js` menambal `window.fetch`:

- `gps.json` → bingkai berikutnya dari `replay.json` (80 bingkai, 4 node,
  hasil rekaman `simulate.py` sungguhan), `last_seen` disegarkan ke waktu kini
- `trail.json` → jejak hasil rekaman yang sama
- `base.json`, `chat.json`, `/api/*` → dilayani di memori

**Tidak satu baris pun kode dashboard yang diubah** — hanya satu tag `<script>`
yang disisipkan sebelum `script.js`.

Merekam ulang datanya: jalankan `simulate.py` di `1-PROGRAM/dashboard`, ambil
cuplikan `gps.json` berkala, lalu susun jadi `{frames:[...], trail:{...}}`.

Ubin peta diambil dari OpenStreetMap; tanpa internet peta tampil kosong dan
hanya node yang terlihat — persis perilaku luring yang diklaim di dokumen HKI.

## Bagian 07 — validasi lapangan

Dulu bagian ini cuma tiga kartu angka dan satu **garis regresi yang digambar
tangan**: bentuknya dikarang supaya "terlihat seperti hasil uji". Sekarang
seluruhnya ditarik dari rekaman yang sebenarnya.

`assets/validasi.js` adalah salinan apa adanya dari
`C:\pkm-kc\pkmcc-main\PKM-KC-DANISH\validasi\data.js` — keluaran
`tools/anchorpulse.py` atas rekaman serial gateway delapan sesi, disusun
`tools/susun_validasi.py`. Situs ini **menyajikan, tidak menghitung ulang**,
jadi angkanya tidak akan pernah bisa berbeda dari dokumen tim. Kalau datanya
diperbarui, cukup salin ulang berkas itu.

`js/validasi.js` menggambar lima hal dari data itu:

| Yang digambar | Isi |
|---|---|
| Angka pokok | 8 sesi · 337,5 menit · 2.314 diterima · 3.870 dipancarkan · 1.891 m · 22 nyala ulang |
| Sebaran RSSI–jarak | **754 titik ukur asli**, skala akar di sumbu jarak, hanya paket hop-0 ber-fix sah |
| Jangkauan per sesi | tautan langsung vs lewat relai, plus batas atas yang diragukan |
| PDR per node | 12 node di 8 sesi, 22,3% sampai 92,7% |
| Mutu data lokasi | fix GPS sah dibanding paket tanpa fix |

Ditambah blok **"Empat hal yang tidak boleh disimpulkan dari data ini"** —
disalin dari analisis tim sendiri. Itu bagian yang paling meyakinkan di dokumen
mereka dan sebelumnya tidak ada di situs sama sekali.

### Keputusan warna

Sebaran RSSI memakai **satu warna**. Delapan sesi berarti delapan warna yang
saling mirip dan tidak ada satu pun yang lolos uji buta warna berpasangan;
identitas sesi akhirnya dibawa **penyaring** di atas grafik, bukan warna. Klik
nama sesi → sesi itu jadi oranye, sisanya meredup.

Pasangan warna yang benar-benar muncul bersama cuma dua, dan keduanya diuji
dengan `scripts/validate_palette.js`:

| Pasangan | Dipakai di | Hasil |
|---|---|---|
| `#2f7fe0` vs `#e45a07` | jangkauan, sorotan sebaran | lolos enam pemeriksaan, ΔE 27,4 (protan) |
| `#2f7fe0` vs `#d30e10` | fix vs tanpa fix | lolos enam pemeriksaan, ΔE 28,6 (deutan) |

Batang relai tetap diberi **arsir 45°** sebagai pembeda kedua, dan tiap batang
punya label angka langsung — jadi tidak ada identitas yang hanya dibawa warna.
Ada juga tombol *Lihat angkanya sebagai tabel* di bawahnya.

### Catatan angka 716 m

716 m itu nyata, tapi itu **sesi 11 Agustus saja**. Tautan langsung terjauh yang
tercatat sepanjang delapan sesi adalah **1.891 m** (uji multi-hop), dan 1.211 m
di UB Forest 14 Agustus. Angka −116 dBm yang dulu dipasangkan dengan 716 m tidak
ada di berkas data ini; yang tercatat, paket terlemah yang masih terbaca ada di
−126 dBm. Kalau slide tim memakai −116 dBm, itu perlu disamakan dulu — situs
sekarang memakai angka dari `data.js`.

Dua batang jangkauan berarsir dan satu batang putus-putus bukan hiasan:
tim mencatat bahwa lima belas paket terakhir sesi multi-hop kemungkinan direlai
walau terhitung nol hop, jadi 2.231 m ditampilkan sebagai **batas atas**, bukan
sebagai capaian.

## Sorotan 3D di hero

`proto/hero.html` adalah kembaran `viewer.html` untuk dipajang di hero:
model yang sama, tapi **berputar sendiri dan sengaja tidak bisa disentuh**.
Tidak ada slider explode, tidak ada tombol, tidak ada daftar part — semua itu
tetap ada di bagian 04. Di sini modelnya cuma sorotan.

Empat hal yang perlu diketahui kalau halaman itu disunting:

- **Putarannya digerakkan sendiri**, bukan lewat `autoRotate` OrbitControls.
  Control-nya dimatikan total (`enabled = false`), jadi kecepatannya bisa
  diatur dan tidak bergantung pada perilaku internal control yang sudah mati.
- **Toolbar unduh dan keterangan "drag to orbit" ada di shadow DOM stage.**
  Keduanya dibuang lewat `stage.shadowRoot.querySelector(...).remove()` —
  tidak ada berkas tim yang diubah.
- **Warna casing aslinya nyaris hitam**, dan di atas latar hero yang juga
  gelap siluetnya hilang. Materialnya di-clone lalu di-lerp ke slate kebiruan
  `#5d7d9f` pada 0,34 — alasan yang sama dengan peredupan part di bagian 04.
- **Kamera didekatkan 0,74×** setelah `setObject`. Stage membingkai pada
  1,35 × jari-jari, lapang untuk viewer yang bisa diputar, terlalu lapang
  untuk sorotan. Stage membingkai ulang saat ukuran berubah, jadi
  pendekatannya dipasang lagi di handler resize.

Fotonya tetap dipakai sebagai poster sampai modelnya benar-benar tergambar,
jadi hero tidak pernah kosong. `devices.js` memantau judul dokumen di dalam
iframe (`'siap'`) **sejak awal**, tidak menunggu event `load` — iframe lazy
kadang selesai sebelum berkasnya sempat memasang pendengar.

## Nav gooey

`js/gooey-nav.js` port **vanilla** dari komponen `<GooeyNav />` React Bits.
Model geraknya dipertahankan utuh: `noise()`, `getXY()`, `createParticle()`
dan `makeParticles()` disalin apa adanya, sudut partikel tetap
`((360 + noise(8)) / total) * index`, dan trik gooey-nya tetap
`blur(7px) contrast(100)` di atas latar hitam dengan `mix-blend-mode: lighten`.
Prop-nya sama, cuma pindah ke `data-*` kebab-case pada `.nav__links`.

**Yang ditambahkan supaya animasinya bicara soal sinyal**, bukan gelembung:

1. **Cincin pancar** — tiga cincin memuai dari tombol yang baru aktif, motif
   radar yang sama dengan hero dan penutup. Digambar **di luar** lapisan
   gooey; kalau ikut masuk filter, `contrast(100)` menebalkannya jadi gumpalan.
2. **Lompatan paket** — garis putus-putus melengkung ditarik dari tombol yang
   tadi aktif ke tombol yang baru, lalu satu titik oranye berjalan
   menyusurinya. Itu gambaran *controlled flooding*: paket berpindah hop demi
   hop, bukan muncul begitu saja.
3. Warna partikelnya palet Point Rescue, bukan warna bawaan komponennya.

**Beda mendasar dari versi React:** di sana state aktif dipegang React dan
hanya berubah saat diklik. Nav ini juga digerakkan scrollspy, jadi sumber
kebenarannya kelas `.is-active` pada `<a>` dan modulnya mengamati lewat
`MutationObserver`. Efeknya ikut jalan saat orang menggulir — dan
`js/scroll.js` tidak perlu disentuh sama sekali.

### Tiga jebakan waktu memasangnya

**Latar hitamnya bocor.** Trik `contrast(100)` butuh latar hitam seluas
`inset:-70px`. Di komponen aslinya wadahnya setinggi 600 px jadi tidak
kelihatan; di bilah nav setinggi 50 px ia muncul sebagai kotak hitam besar di
bawah nav. Semua lapisan yang mengandung hitam itu sekarang di dalam
`.gnav__lapis` yang ber-`overflow:hidden`.

**Wadah itu wajib punya latar pekat sendiri.** `mix-blend-mode: lighten`
mencampur ke backdrop stacking context terdekat. Dengan latar semi transparan
(`rgba(4,16,30,.55)`) hitamnya masih tembus; harus benar-benar pekat
(`#071626`). Latar itu sekaligus jadi rel pill-nya, dan justru membuat
nav-nya terlihat seperti segmented control.

**Teksnya dobel.** `.gnav__teks` memakai `font:inherit`, dan `inherit`
mengambil dari `.nav__links`, bukan dari `<a>`-nya. Metrik hurufnya jadi beda
dan dua teks tidak bertindih rapi. Sekarang `font`, `letter-spacing` dan
`text-transform` disalin dari `getComputedStyle(<a>)`, dan teks `<a>` yang
aktif dibuat `color:transparent`. Pill-nya juga dilebihkan 11 px kiri-kanan:
`blur(7px) + contrast(100)` mengikis tepinya dan tanpa itu huruf pertama dan
terakhir ikut terpotong.

## Kartu tim

`js/tilted-card.js` port **vanilla** dari komponen `<TiltedCard />` React Bits.

**Model geraknya dipertahankan utuh.** Komponen aslinya memakai `useSpring`
dari `motion/react`, bukan transition CSS — dan itu terasa: kartunya tidak
mengejar kursor dengan easing tetap, tapi punya massa. Kalau di sini diganti
`transition: transform .3s`, gerakannya jadi lain sama sekali. Jadi pegasnya
diintegrasikan sendiri, dengan tetapan yang sama persis:

| Yang dipegasi | stiffness | damping | mass |
|---|---|---|---|
| `rotateX`, `rotateY`, `scale` | 100 | 30 | 2 |
| opacity tooltip | 100 | 10 | 1 (bawaan motion) |
| rotasi tooltip | 350 | 30 | 1 |

```
a = (−k·(x − tujuan) − c·v) / m ;   v += a·dt ;   x += v·dt
```

Rumus sudutnya juga sama — offset kursor dari titik tengah dibagi setengah
ukuran kartu, dikali `rotateAmplitude`, sumbu X dibalik tanda. Tooltip-nya ikut
berputar mengikuti **kecepatan** kursor arah tegak (`−velocityY · 0.6`), bukan
posisinya; detail kecil yang membuatnya terasa punya bobot.

Prop-nya lewat `data-*` pada `.team`:
`data-rotate-amplitude="12"`, `data-scale-on-hover="1.06"`.

### Dua hal yang sengaja berbeda dari versi React

1. **`showMobileWarning` tidak diikutkan.** Komponen aslinya menampilkan
   tulisan *"This effect is not optimized for mobile"* kepada pengunjung.
   Memberi tahu orang bahwa halamannya kurang bagus di perangkat mereka tidak
   menolong siapa pun — di sini efeknya cukup dimatikan pada penunjuk kasar.
2. **Teks tooltip tidak ditulis manual**, melainkan diambil dari keterangan
   kartunya sendiri, potongan sebelum `·` — "Ketua Tim", "Dosen Pembimbing",
   "Anggota". Akibatnya versi bahasa Inggrisnya ikut benar
   ("Team lead", "Supervisor", "Member") **tanpa satu pun entri kamus
   tambahan**.

### Isi kartunya

Tiap kartu memuat tiga hal yang berbeda, dan sengaja dibedakan:

| Bagian | Isi | Kenapa terpisah |
|---|---|---|
| `<b>` | nama | — |
| `.team__peran` | **peran di proyek** — Ketua tim, Perancang mekanik, Perancang elektronik, Perangkat lunak, Administrasi, Dosen pembimbing | kontribusi orangnya |
| `.team__prodi` | program studi & angkatan | asal-usulnya, bukan kontribusinya |
| `.team__tautan` | LinkedIn, GitHub, Instagram | verifikasi pihak ketiga |

Peran itu juga yang muncul di tooltip kartu miring — dibaca dari
`.team__peran` di markup, bukan ditulis ulang di JS, jadi versi bahasa
Inggrisnya ikut benar tanpa entri kamus tambahan.

**Dosen pembimbing dapat perlakuan berbeda.** Alih-alih ikon, tautannya berupa
pil berteks *"Profil FILKOM UB"* yang menunjuk ke
`filkom.ub.ac.id/profile/dosen/wijaya.kurniawan` — halaman resmi universitas,
bukan profil pihak ketiga yang tidak bisa diverifikasi. Statusnya (**Lektor
Kepala**, Departemen Teknik Informatika, Prodi Teknik Komputer) juga diambil
dari halaman itu, bukan dikarang. Lambang toga sempat dicoba sebagai ikon dan
di 15 px hasilnya cuma gumpalan; satu tautan yang berdiri sendiri memang lebih
jelas sebagai label.

Ikon LinkedIn/GitHub/Instagram digambar sebagai `<symbol>` sekali di atas
seksinya lalu dipanggil `<use>` — bukan path yang diulang sebelas kali.

Tiap tautan keluar memakai `rel="noopener noreferrer me"` dan `aria-label`
yang menyebut nama orangnya, jadi pembaca layar tidak cuma mendengar
"LinkedIn" sebelas kali.

### Dua jebakan waktu memasangnya

**Transform-nya bertabrakan.** `<figure>` sudah memegang animasi reveal "kartu
remi" (`rotateY(38deg) translateZ(-60px)` → `none`). Kalau kemiringan kursor
ditulis ke elemen yang sama, keduanya saling menimpa. Sekarang `<figure>`
jadi wadah perspektifnya dan `.team__kartu` di dalamnya yang dimiringkan —
struktur yang sama dengan komponen aslinya (`figure` → `inner`).

**Tooltip tertimbun kartu sebelahnya.** `perspective` membuat tiap `<figure>`
jadi stacking context sendiri, jadi tooltip kartu ke-3 tergambar di bawah
kartu ke-4 berapa pun z-index-nya. Perbaikannya `.team figure:hover{ z-index:5 }`
pada figure-nya, bukan pada tooltip-nya.

## Versi bahasa Inggris

Situsnya sekarang dua bahasa: `index.html` (Indonesia) dan `en/index.html`
(Inggris), saling menunjuk lewat tombol **EN/ID** di nav dan `hreflang`.
Keduanya HTML statis biasa — **tidak ada build saat menyajikan**, dan tidak
ada JS yang menerjemahkan di browser, jadi mesin pencari melihat halaman
Inggris yang utuh.

Halaman Inggrisnya **dibangkitkan**, bukan ditulis dua kali:

```bash
python 5-WEBSITE/tools/buat-en.py     # jalankan tiap kali index.html berubah
```

- `tools/kamus-en.py` — terjemahannya, **ditulis tangan**. 240 entri teks +
  25 entri atribut (`alt`, `title`, `aria-label`). Tidak ada mesin penerjemah.
- `tools/buat-en.py` — menerapkan kamusnya (yang **terpanjang dulu**, supaya
  potongan pendek tidak merusak kalimat panjang yang memuatnya), membetulkan
  jalur relatif jadi `../`, menyetel `<html lang="en" data-base="../">`, dan
  membalik tombol bahasa.

Skripnya **gagal berisik**: kalau ada satu saja potongan teks yang tidak punya
terjemahan, ia menyebutkan potongannya dan keluar dengan kode 1. Jadi tidak
mungkin ada halaman Inggris yang diam-diam masih separuh bahasa Indonesia.

**Teks yang digambar JS tidak tersentuh skrip itu** — label sumbu grafik,
tooltip, judul kolom tabel, tulisan di dalam simulasi SVG, dan label sakelar
animasi semuanya dibuat saat halaman berjalan. Itu urusan `js/i18n.js`, yang
membaca `<html lang>` dan menyediakan `PRText()` serta `PRLocale`
(`id-ID` → `2.314` dan `337,5`; `en-GB` → `2,314` dan `337.5`).

> Jebakan yang sempat kena: pembantu terjemahan itu semula bernama `T`, dan
> tiap fungsi grafik di `validasi.js` memakai `T` sebagai margin atas
> (`var W, H, L, R, T, B`). Namanya menutupi yang global dan seluruh bagian 07
> mati dengan `T is not a function`. Sekarang namanya `TX`.

**Jalur di dalam JS harus sadar basis.** `en/index.html` disajikan satu
tingkat lebih dalam, jadi `dash/index.html` dan `app/index.html` yang
di-*hardcode* di `devices.js` sekarang memakai
`document.documentElement.dataset.base`.

## PNG model 3D untuk infografis

`tools/render-3d.py` mengeluarkan **PNG berlatar transparan** dari model yang
sama dengan bagian 04 — bahan infografis, poster, dan konten Instagram.

```bash
python 5-WEBSITE/serve.py                 # terminal lain
python 5-WEBSITE/tools/render-3d.py       # -> tools/render/
```

16 berkas, ~3 MB total, dipotong rapat ke isi gambarnya:

| Kelompok | Isi |
|---|---|
| `unit-*` | unit tertutup dari 6 sudut: iso, depan, samping, atas, belakang, tiga-perempat |
| `bongkar-*` | rakitan terbongkar 30% / 60% / penuh, dengan garis penunjuk antar part |
| `tembus-*` | casing tembus pandang, isinya terlihat |
| `poster-berdiri*` | pose berdiri miring seperti sorotan hero — untuk feed potret |

Ditambah `_part.txt` dan `_part.json`: **daftar 17 part beserta
spesifikasinya**, ditarik langsung dari `assembly-model.js`. Itu bahan menulis
label infografis, dan karena sumbernya model yang sama, labelnya tidak mungkin
melenceng dari gambarnya.

Pilihan:

```bash
--sisi 3600        kanvas render lebih besar
--hanya iso        cuma satu sudut
--warna-asli       warna casing apa adanya, tanpa diangkat ke slate
--tanpa-potong     biarkan kanvasnya persegi penuh
```

Beberapa hal yang menentukan hasilnya:

- **Bayangan lantai dimatikan** (`stage._ground.visible = false`). Kalau tidak,
  ada bayangan setengah transparan menempel di bawah tiap PNG dan tidak bisa
  dipakai di atas latar terang.
- **Latarnya benar-benar transparan** lewat `screenshot(omit_background=True)`,
  bukan warna solid yang dihapus belakangan — jadi tepinya bersih, tanpa halo.
- **Dipotong rapat** ke kotak piksel yang benar-benar terisi, dengan margin 4%.
  Tanpa itu tiap berkas penuh ruang kosong dan harus dirapikan lagi di Canva.
- **Warna casing diangkat** ke slate kebiruan seperti sorotan hero; aslinya
  nyaris hitam dan hilang di atas latar navy. Bisa dimatikan `--warna-asli`.
- **Rotasi bawaan model dipertahankan.** `buildAssembly` sudah memberi model
  orientasinya sendiri; menyetelnya ke nol mengubah semua pembingkaian. Yang
  dipakai pose berdiri hanya nilai mutlak `(-0.10, 0, -0.62)`, sama dengan hero.
- **`setGhost` mengubah material asli**, sedangkan pengangkat warna sudah
  menggantinya dengan salinan. Pengangkatnya harus dijalankan ulang sesudah
  `setGhost`, kalau tidak mode tembus pandang tidak pernah terlihat.

`proto/render.html` adalah halaman kerjanya — bukan bagian situs, tidak
ditautkan dari mana pun. Sudut kameranya `VIEWS` yang sama dengan `site.js`.

> `tools/render/` dan `tools/tangkapan/` sama-sama keluaran, bukan isi situs.
> Hapus keduanya sebelum deploy.

## Alamat resmi, halaman tautan, dan QR

Alamat resmi situs: **https://danishpramudya-ops.github.io/pointrescue/** (versi Inggris di
`/en/`). Halaman tautan resmi — pengganti Linktree untuk bio Instagram dan poster — ada di `/link/`.

Alamat itu tersimpan di satu tempat, `<link rel="canonical">` di `index.html`, dan dibaca oleh
`tools/buat-qr.py`. Tempat lain yang menyebutnya (semuanya mutlak, karena pratinjau tautan di
WhatsApp/Instagram mewajibkannya): `og:url` dan `og:image` di `index.html` dan `link/index.html`.

**Kode QR yang sudah dicetak tidak bisa diubah**, jadi alamatnya harus final sebelum dicetak.
Kalau suatu saat situs pindah: (1) ganti canonical dan `og:*` di dua berkas tadi, (2) jalankan
`python tools/buat-og.py` bila kartunya berubah, (3) jalankan `python tools/buat-qr.py`, dan (4) taruh
halaman pengalih di alamat lama supaya QR yang telanjur tercetak tetap sampai. GitHub Pages tidak
mengalihkan sendiri saat repo diganti nama.

**Halaman `link/`** — satu berkas HTML tanpa pustaka dan tanpa pelacak, bergaya navy dalam yang sama dengan
situs: bidang radar dengan **model 3D unit yang asli** berputar di tengahnya (`proto/hero.html` dalam iframe;
dimuat setelah halaman tampil, dan dilewati bila gerak dikurangi atau penghemat data menyala), logo + nama di
bawahnya, lalu rantai tombol kaca dengan sebutir paket oranye yang merayap di sela-selanya (hanya terlihat di
celah antar tombol karena tombolnya buram). Keterangan tombol ditulis sebagai kalimat biasa, bukan huruf kapital
mono, supaya mudah dibaca. Sengaja tenang: satu titik fokus (unit 3D), satu tombol utama.

Menambah tautan: salin satu `<li>` di dalam `<ul class="chain">`, ganti `href`, ikon, dan dua teks bahasanya
(`<span lang="id">` / `<span lang="en">`). Tautan ke situs mengikuti bahasa yang dipilih lewat `data-href-en`.
Sentuhan pada tombol memancarkan cincin dari titik jari dan bergetar 8 ms di ponsel yang mendukung. Seluruh
animasi mati di `prefers-reduced-motion`, dan halaman tetap utuh tanpa JavaScript (berbahasa Indonesia).

Sempat dibuat juga versi "poster lapangan" (cobalt, tipografi raksasa, lingkup radar) — tim memilih yang navy
karena poster terasa terlalu ramai. Versi poster masih ada di riwayat git (commit `1bfbbe8`).

**QR** di `qr/` (SVG untuk cetak, PNG untuk slide): koreksi galat tingkat H, logo menutup < 4% area,
modul navy `#093261` di atas putih. Setiap berkas diuji dibaca ulang oleh ZXing sebelum disimpan —
ukuran asli, diperkecil sampai 150 px, diburamkan, JPEG kasar, dan diputar; satu saja gagal, skrip
berhenti. Pakai varian `-polos` (tanpa logo) bila QR dicetak lebih kecil dari ±2,5 cm.

**Kartu pratinjau** (`assets/img/og-card.jpg`, 1200 × 630) dirender dari `tools/og-card.html`: navy dalam yang
sama dengan situs, foto prototipe asli, logo, dan police line. `og:description` halaman Inggris diterjemahkan
lewat kamus yang sama dengan isi halaman.

## Halaman komparasi (`komparasi/`)

Permintaan klien: infografis "Komparasi Sistem" (Point Rescue, Handy Talky, Meshtastic pada tiga kriteria:
Pull & Play, Dashboard Pencarian, Hemat Biaya) dijadikan halaman tersendiri. Dibangun ulang sebagai HTML,
bukan gambar infografisnya ditempel, supaya bisa dibaca pembaca layar, mengikuti lebar layar, dan punya
versi Inggris.

**Satu berkas, dua bahasa.** Seperti `link/`: tiap teks punya `<span lang="id">` dan `<span lang="en">`.
Bahasa dipilih lewat `?lang=id|en`, kalau tidak ada lewat pilihan terakhir pengunjung (kunci
`localStorage` yang sama dengan halaman tautan), kalau tidak ada ikut bahasa peramban; tanpa JavaScript
halaman berbahasa Indonesia. Tautan dari `index.html` membawa `?lang=id`; `tools/buat-en.py` mengubahnya jadi
`../komparasi/?lang=en` di `en/index.html` (lihat `komparasi/` di regex jalur dan satu entri `ATRIBUT`).

**Tabelnya tabel sungguhan** (`<table>` dengan `<th scope>`), bukan susunan `div`. Di ponsel tiap baris
menjadi kartu — `display:block` menghapus semantik tabel di sebagian peramban, jadi `role="table|row|cell|…"`
ditulis eksplisit. Tanda ✓/✗ punya teks tersembunyi ("Ya"/"Tidak") untuk pembaca layar; jumlah ✓ per
kolom ("Kriteria terpenuhi") dihitung dari tabel itu, bukan angka terpisah.

**Gambar yang dipakai semuanya milik tim**: render 3D unit (`assets/img/komparasi-unit.png`, dari
`tools/render/poster-berdiri.png`), tangkapan layar dashboard asli (`assets/img/komparasi-dashboard.jpg`,
atribusi OpenStreetMap ikut terlihat di petanya), dan layar aplikasi asli (`assets/app/app-2.jpg`).
Handy Talky dan Meshtastic sengaja digambar sebagai piktogram garis, bukan foto: foto di infografis aslinya
tidak jelas lisensinya. Kalau tim ingin foto asli, pakai yang tim punya haknya atau yang berlisensi bebas
(Wikimedia Commons) dan catat sumbernya seperti blok "Sumber gambar latar" di bagian 01.

**Angka harga** (< Rp 500 ribu · Rp 120–300 ribu · Rp 1–2 juta per unit) berasal dari infografis klien dan
BELUM ada di dokumen mana pun di repo ini. Skrip presentasi PKP2 menyebut Meshtastic "Rp1–3 juta", bukan
"1–2 juta" — samakan salah satunya sebelum tampil. Mengubah harga: ganti teks di tabel, di grafik, DAN
variabel `--min` / `--max` pada batang grafik (satuan ribu rupiah; sumbu 0 … `--skala`).

**Teks pembanding hanya memuat yang ada di materi tim** (artikel Kompasiana dan skrip PKP2): mekanisme
reed switch + magnet pada tali penarik, dashboard posko yang berjalan tanpa internet, Handy Talky "hanya
suara", Meshtastic "dirancang untuk penggunaan umum". Catatan kaki halaman menyebut bahwa perbandingannya
hanya pada tiga kriteria dan bahwa merek pembanding milik pemiliknya.

**Pintu masuk**: jembatan di akhir bagian 01 (`.bridge` — "Handy Talky dan Meshtastic sudah ada. Lalu apa
bedanya Point Rescue?"), tautan di footer, dan satu baris di halaman tautan. Sengaja TIDAK dimasukkan ke
`.nav__links`: `js/scroll.js` memanggil `querySelector(href)` untuk tiap tautan di sana, dan `komparasi/`
bukan selektor yang sah — satu tautan non-hash akan mematikan seluruh mesin gulir.

## Keamanan

Situs ini statis: tidak ada server, basis data, formulir, atau login yang bisa diserang. Risiko yang
nyata ada di dua tempat — **akun GitHub** (aktifkan 2FA dan pakai kata sandi unik) dan **isi repo**
(rahasia yang ikut ter-commit). Karena itu:

- `python tools/cek-sebelum-push.py` dijalankan sebelum tiap push. Ia memeriksa tepat berkas yang akan
  ter-commit: kunci/token, berkas desain PCB, jalur tembaga di data 3D, koordinat presisi di data uji,
  berkas ≥ 50 MB, dan email git yang bukan alamat noreply. Kode keluarnya 1 bila ada yang gagal.
- **Desain PCB tidak dipublikasikan.** Data 3D papan (`proto/pcb-data.json` dan salinan inline di
  `proto/viewer.html`) hanya memuat outline, pad, dan lubang; jalur tembaganya dikosongkan oleh
  `tools/pangkas-pcb.py`. Jalankan lagi setiap kali data itu diganti.
- **Koordinat gateway dibulatkan ke 3 desimal** (± 110 m) di `assets/validasi.js` oleh
  `tools/sanitasi-validasi.py`. Kode situs tidak memakainya, jadi grafik tidak berubah. Jalankan lagi
  setiap kali data tim disalin ulang.
- `<meta http-equiv="Content-Security-Policy">` di halaman utama hanya memuat
  `object-src 'none'; base-uri 'self'; form-action 'self'`. GitHub Pages tidak bisa memasang header HTTP
  (CSP penuh, `X-Frame-Options`, dan sebagainya) — itu batas platform. Kalau suatu saat butuh header
  penuh, taruh Cloudflare di depannya atau pindah host.
- Pihak ketiga yang dipanggil browser pengunjung: Google Fonts (huruf), ubin peta OpenStreetMap (di
  dalam dashboard dan aplikasi), dan font cadangan bawaan Flutter. Selebihnya semua berasal dari situs
  sendiri; Three.js, Leaflet, dan CanvasKit dipajang lokal.
- Tautan keluar memakai `rel="noopener"` (halaman `link/`: `noopener noreferrer`).

## Catatan

- Angka 716 m / −116 dBm dan kisaran −88…−118 dBm berasal dari slide pengujian
  tim. Grafik di bagian 07 menggambarkan **pola** hasil uji (garis regresi,
  zona saturasi < 50 m, ambang sensitivitas), bukan sebaran titik mentah —
  supaya tidak ada angka yang dikarang.
- Spesifikasi part di bagian anatomi diambil langsung dari `assembly-model.js`,
  jadi selalu cocok dengan modelnya.
