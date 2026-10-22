# -*- coding: utf-8 -*-
"""Kamus terjemahan Indonesia → Inggris untuk situs Point Rescue.

Dipakai tools/buat-en.py. Kuncinya adalah teks yang terlihat persis seperti
di index.html (spasi antar kata boleh berbeda — pencocokannya memakai \\s+).

Film di bagian 01 tidak diterjemahkan: narasi dan subtitle Indonesianya sudah
ter-burn-in ke gambar. Halaman Inggris hanya memberi tahu bahwa filmnya
berbahasa Indonesia (lihat "Filmnya ada narasinya" dan label aria-label film).
"""

KAMUS = {
    # ── judul halaman & nav ───────────────────────────────────────────────
    "POINT RESCUE — Pelacak Taktis Wearable untuk Wilayah Tanpa Sinyal":
        "POINT RESCUE — Wearable Tactical Tracker for Areas With No Signal",
    "POINT RESCUE: pelacak taktis wearable berbasis algoritma controlled flooding untuk menemukan korban bencana lewat jaringan radio LoRa 433 MHz di wilayah tanpa sinyal. PKM-KC 2026, Universitas Brawijaya.":
        "POINT RESCUE: a wearable tactical tracker built on a controlled-flooding algorithm that finds disaster victims over a 433 MHz LoRa radio network in areas with no signal. PKM-KC 2026, Universitas Brawijaya.",
    "Masalah": "Problem",
    "Gagasan": "Approach",
    "Cara kerja": "How it works",
    "Anatomi": "Anatomy",
    "Prototipe": "Prototype",
    "Pengujian": "Field data",
    "Aplikasi": "App",
    "HKI": "Copyright",
    "Tim": "Team",

    # ── hero ──────────────────────────────────────────────────────────────
    "PKM-KC 2026 · Universitas Brawijaya": "PKM-KC 2026 · Universitas Brawijaya",
    "Pelacak taktis": "A tactical",
    "berbasis algoritma": "tracker built on a",
    "untuk menemukan korban bencana lewat jaringan radio di wilayah yang kehilangan seluruh sinyal.":
        "algorithm, finding disaster victims over a radio network in areas that have lost every signal.",
    "meter tautan teruji": "metres of tested link",
    "menara seluler": "cell towers needed",
    "Bedah perangkatnya": "Take it apart",
    "Lihat dashboard": "See the dashboard",
    "· rakitan 17 part · casing PLA 84 × 145 × 35 mm":
        "· 17-part assembly · PLA case 84 × 145 × 35 mm",
    "Gulir": "Scroll",

    # ── 01 masalah ────────────────────────────────────────────────────────
    "01 — Masalah": "01 — Problem",
    "Operasi pencarian selalu terjadi di tempat yang paling tidak diinginkan teknologi: hutan, lereng gunung, lembah sungai, kawasan yang baru diratakan bencana. Justru di sanalah menara seluler roboh, listrik padam, dan setiap aplikasi yang menuntut internet berhenti berguna.":
        "Search operations always happen exactly where technology least wants to be: forest, mountain slope, river valley, ground a disaster has just flattened. And that is precisely where the cell towers have come down, the power is out, and every app that demands the internet stops being of any use.",
    "Suara": "Sound",
    "Ketika jaringan padam,": "When the network goes dark,",
    "pencarian dimulai dari nol.": "the search starts from zero.",
    "Wilayah tanpa sinyal": "Areas with no signal",
    "Titik": "A",
    "bukan pengecualian — itu medan kerja harian tim SAR. Perangkat yang butuh sinyal seluler untuk sekadar membuka peta akan mati fungsi persis saat paling dibutuhkan.":
        "is not the exception — it is a search-and-rescue team's daily working ground. Any device that needs a cellular signal just to open a map stops working at exactly the moment it matters most.",
    "Waktu yang tak bisa ditawar": "Time that cannot be negotiated",
    "Peluang korban selamat menurun tajam tiap jam. Setiap jam yang habis menyisir area yang salah tidak pernah kembali — dan penyisiran tanpa koordinasi adalah penyebab paling umum waktu terbuang itu.":
        "A victim's chance of survival drops sharply with every hour. Every hour spent sweeping the wrong area never comes back — and uncoordinated sweeping is the most common reason those hours are lost.",
    "Koordinasi yang buta": "Coordination in the blind",
    "Tanpa kanal data bersama, posko tak tahu di mana timnya dan tim tak tahu apa yang sudah disisir tim lain. Laporan berjalan lewat radio suara, satu per satu, lalu hilang begitu percakapan selesai.":
        "With no shared data channel, the command post does not know where its teams are and the teams do not know what other teams have already covered. Reports travel by voice radio, one at a time, and vanish the moment the conversation ends.",
    "Point Rescue berangkat dari satu keputusan desain:":
        "Point Rescue starts from a single design decision:",
    "jangan pernah bergantung pada infrastruktur yang paling mungkin ikut hancur.":
        "never depend on the infrastructure most likely to be destroyed alongside everything else.",
    "Video PKM-KC": "PKM-KC video",
    "Filmnya ada narasinya — tekan Suara":
        "Narrated and subtitled in Indonesian — press Sound",
    "Sumber gambar latar": "Background image credits",
    "Gambar latar tiga kartu di atas bersifat ilustratif —":
        "The background images on the three cards above are illustrative —",
    "bukan dokumentasi penerjunan Point Rescue":
        "they are not documentation of a Point Rescue deployment",
    ". Seluruhnya berlisensi bebas dan diambil dari":
        ". Every image is freely licensed and taken from",
    "Operasi pencarian Mundakkai": "Mundakkai search operation",
    "Tanah longsor Filipina": "Philippines landslide",
    "Banjir Aqqala dari udara": "Aqqala flood from the air",

    # ── 02 gagasan ────────────────────────────────────────────────────────
    "02 — Gagasan": "02 — Approach",
    "Jaringan yang dibawa sendiri oleh tim.": "A network the team carries in with them.",
    "Tanpa operator": "No carrier",
    "Begitu dinyalakan, tiap unit langsung membentuk jaringan radio mandiri bersama unit lain di sekitarnya. Tidak ada kartu SIM, tidak ada pendaftaran, tidak ada server. Setiap unit sekaligus pengirim, penerima, dan penerus pesan.":
        "The moment it is switched on, every unit forms an independent radio network with the other units around it. No SIM card, no registration, no server. Each unit is at once sender, receiver and relay.",
    "Muatan maksimum 64 byte": "64-byte maximum payload",
    "Paket yang diterima diteruskan lagi oleh node lain, sehingga jangkauan efektif jauh melampaui jangkauan satu radio. Penerusan itu dikendalikan supaya udara tidak tersumbat salinan pesan yang sama.":
        "A packet that arrives is forwarded again by other nodes, so effective range reaches far beyond what a single radio can cover. That forwarding is deliberately controlled so the air does not clog with copies of the same message.",
    "Batas 1–4 lompatan per jenis paket": "1–4 hop budget per packet type",
    "Jeda acak 400–700 ms": "Random 400–700 ms delay",
    "Penekanan duplikat via nomor urut": "Duplicate suppression by sequence number",
    "Gambaran situasi": "Shared picture",
    "Data yang sama sampai ke dua tempat: dasbor operator di posko dan aplikasi Android di genggaman personel. Tim tak perlu kembali ke posko hanya untuk tahu keadaan.":
        "The same data reaches two places: the operator dashboard at the command post and the Android app in a rescuer's hand. Nobody has to walk back to the post just to find out what is happening.",
    "Peta taktis, jejak, kompas": "Tactical map, trails, compass",
    "Pesan misi dua arah": "Two-way mission messaging",
    "Seluruh pengolahan di perangkat": "All processing on the device",
    "Bertahan saat gagal": "Holding up when things fail",
    "Tiap keputusan teknis lahir dari satu pertanyaan: apa yang terjadi kalau bagian ini tidak bekerja? Peta punya tiga tingkat cadangan, posisi terakhir ditahan, tautan bisa dibuktikan sampai posko.":
        "Every technical decision comes from one question: what happens if this part does not work? The map has three fallback levels, the last valid position is held, and a link can be proven all the way to the command post.",
    "Peta berjenjang tiga tingkat": "Three-tier map fallback",
    "Penahanan posisi sah terakhir": "Last valid position held",
    "Pembuktian tautan berjenjang": "Tiered link proof",

    # ── 03 cara kerja ─────────────────────────────────────────────────────
    "03 — Cara kerja": "03 — How it works",
    "Tiga peran, satu jaringan.": "Three roles, one network.",
    "Perangkat kerasnya sama; yang membedakan hanya peran yang diberikan firmware. Ketiganya bicara dalam protokol identik, jadi setiap unit bisa menjadi penerus bagi unit lain tanpa pengaturan tambahan.":
        "The hardware is identical; the only difference is the role the firmware gives it. All three speak the same protocol, so any unit can relay for any other with no extra configuration.",
    "korban": "victim",
    "posko": "post",
    "korban ·": "victim ·",
    "tim SAR ·": "SAR team ·",
    "gateway posko": "command-post gateway",
    "Node KORBAN": "VICTIM node",
    "Dibawa korban atau ditinggal di titik temuan":
        "Carried by a victim, or left at the point where one is found",
    "Memancarkan identitas dan koordinat berkala. Cukup satu tombol untuk aktif — tanpa layar, tanpa menu, tetap bekerja di dalam tas.":
        "Broadcasts its identity and coordinates at intervals. One button to arm it — no screen, no menu, still working from inside a bag.",
    "Node SAR": "SAR node",
    "Dibawa personel di lapangan": "Carried by personnel in the field",
    "Selain memancar sendiri, node SAR jadi jembatan Bluetooth ke aplikasi Android: paket dari jaringan masuk ke layar, pesan dari layar keluar ke jaringan.":
        "As well as broadcasting, the SAR node bridges over Bluetooth to the Android app: packets from the network reach the screen, messages from the screen reach the network.",
    "Node GATEWAY": "GATEWAY node",
    "Terpasang di posko": "Installed at the command post",
    "Tersambung ke komputer posko lewat USB dan menuangkan seluruh lalu lintas jaringan ke dasbor operator.":
        "Connects to the post's computer over USB and pours all network traffic into the operator dashboard.",
    "Batas lompatan.": "Hop budget.",
    "Tiap paket membawa jatah": "Every packet carries a",
    ". Denyut nadi hanya satu lompatan, pesan misi sampai empat. Jatah habis, paket berhenti.":
        "allowance. A heartbeat gets one hop, a mission message up to four. When the budget runs out, the packet stops.",
    "Jeda acak.": "Random delay.",
    "Sebelum meneruskan, node menunggu 400–700 ms secara acak. Dua node yang mendengar paket sama tidak meneruskannya pada saat persis sama.":
        "Before forwarding, a node waits a random 400–700 ms. Two nodes that hear the same packet will not re-send it at exactly the same instant.",
    "Penekanan duplikat.": "Duplicate suppression.",
    "Node mencatat nomor urut terakhir tiap pengirim. Salinan yang datang belakangan lewat jalur berbeda dibuang.":
        "Each node records the last sequence number from every sender. A copy that arrives later by a different path is discarded.",

    # ── 04 anatomi ────────────────────────────────────────────────────────
    "04 — Anatomi": "04 — Anatomy",
    "Bongkar sendiri, lapis demi lapis.": "Take it apart yourself, layer by layer.",
    "Model di bawah adalah rakitan lengkap 17 part — casing dari berkas OBJ hasil cetak, part lainnya dimodelkan sesuai ukuran aslinya. Jalur tembaga PCB sengaja tidak ditampilkan.":
        "The model below is the complete 17-part assembly — the case from the printed OBJ file, every other part modelled at its real size. The PCB's copper routing is deliberately left out.",
    "— geser penggeser atau tekan tombolnya untuk membongkar unit":
        "— drag the slider or press the button to pull the unit apart",
    "— munculkan nama tiap part beserta garis penunjuknya":
        "— bring up every part's name with its leader line",
    "— buat casing tembus pandang supaya isinya terlihat":
        "— make the case transparent so the insides show",
    "Iso/Depan/Samping/Atas": "Iso/Front/Side/Top",
    "— putar otomatis atau kunci ke sudut baku":
        "— spin automatically or lock to a standard angle",
    "Daftar di kanan:": "List on the right:",
    "menyorot part,": "highlights a part,",
    "mengisolasinya": "isolates it",
    "Case (mm) · PLA cetak 3D": "Case (mm) · 3D-printed PLA",
    "Carrier PCB (mm) · FR-4 1,6": "Carrier PCB (mm) · FR-4 1.6",
    "Devkit 30 pin · 51,4 × 28,3 mm": "30-pin devkit · 51.4 × 28.3 mm",
    "GPS · patch luar lewat u.FL": "GPS · external patch over u.FL",
    "Sel 3,7 V · pengisian micro-USB": "3.7 V cell · micro-USB charging",
    "Menyiapkan model 3D — 17 part": "Preparing the 3D model — 17 parts",

    # ── 05 prototipe ──────────────────────────────────────────────────────
    "05 — Prototipe": "05 — Prototype",
    "Bukan render.": "Not a render.",
    "Sudah berdiri di meja.": "It already sits on the bench.",
    "Unit yang sama inilah yang dibawa berjalan menjauhi gateway sampai sinyalnya habis.":
        "This is the same unit that was walked away from the gateway until the signal ran out.",
    "Patch GPS menghadap langit, LED hijau menandakan kunci satelit":
        "GPS patch facing the sky, green LED for satellite lock",
    "Satu tombol untuk seluruh operasi — tanpa menu, tanpa konfigurasi":
        "One button for the whole operation — no menu, no configuration",
    "Cukup ringkas untuk digenggam atau dikaitkan ke rompi":
        "Small enough to hold, or to clip onto a vest",

    # ── 06 dashboard ──────────────────────────────────────────────────────
    "06 — Posko": "06 — Command post",
    "Seluruh jaringan, dalam satu layar.": "The whole network, on one screen.",
    "Node gateway menuangkan tiap paket yang terdengar ke komputer posko. Konsol di bawah ini berjalan dengan data hasil rekaman":
        "The gateway node pours every packet it hears into the post's computer. The console below is running on recorded data from",
    "— pola gerak, RSSI, dan lalu lintas pesan yang sama seperti saat sistem dijalankan sungguhan.":
        "— the same movement pattern, RSSI and message traffic as when the system is run for real.",
    "Simulasi berjalan": "Simulation running",
    "Buka layar penuh →": "Open full screen →",
    "Itu dashboard operator yang sesungguhnya — kode yang sama dengan yang didaftarkan sebagai HKI — berjalan di dalam halaman ini dengan data hasil rekaman":
        "That is the real operator dashboard — the same code registered for copyright — running inside this page on recorded data from",
    ": empat node, pola gerak dan lalu lintas paket yang sama seperti saat sistem dijalankan sungguhan.":
        ": four nodes, the same movement and packet traffic as when the system is run for real.",
    "Aplikasi POINTRESCUE · build web · mode demo":
        "POINTRESCUE app · web build · demo mode",
    "Tutup ✕": "Close ✕",
    "Dashboard Gateway POINTRESCUE · mode peragaan":
        "POINTRESCUE Gateway Dashboard · demonstration mode",

    # ── 07 pengujian ──────────────────────────────────────────────────────
    "07 — Pengujian": "07 — Field data",
    "Jarak terjauh per sesi, dipisah antara tautan langsung dan lewat relai":
        "Farthest distance per session, split between direct links and relayed links",
    "Delapan sesi, satu berkas rekaman.": "Eight sessions, one recording.",
    "Seluruh angka di bawah ini ditarik dari rekaman serial gateway pada delapan sesi lapangan — paket yang benar-benar diterima posko, bukan simulasi dan bukan hitungan teoretis. Yang ditampilkan termasuk yang tidak enak dibaca: node yang mati-hidup sendiri, paket yang datang tanpa posisi sah, dan sesi dengan PDR di bawah 30 persen.":
        "Every number below is drawn from the gateway's serial recording across eight field sessions — packets the command post actually received, not a simulation and not a theoretical calculation. What is shown includes the parts that do not read well: nodes rebooting on their own, packets arriving with no valid position, and sessions with a PDR under 30 per cent.",
    "sesi rekaman": "recorded sessions",
    "menit di lapangan": "minutes in the field",
    "paket diterima posko": "packets received at the post",
    "paket dipancarkan": "packets transmitted",
    "meter · tautan langsung terjauh": "metres · farthest direct link",
    "kali node menyala ulang": "node reboots",
    "RSSI terhadap jarak ·": "RSSI against distance ·",
    "paket hop-0 ber-fix GPS sah": "hop-0 packets with a valid GPS fix",
    "Sumbu jaraknya berskala akar supaya seratus meter pertama tidak berdesakan di tepi kiri — di situlah sinyalnya jatuh paling curam. Hanya paket":
        "The distance axis uses a square-root scale so the first hundred metres do not crowd against the left edge — that is where the signal falls most steeply. Only",
    "yang dipakai: paket hop-1 membawa RSSI node yang merelai, bukan node asalnya, dan memasukkannya akan membuat grafik seolah makin jauh sinyal makin kuat. Paket tanpa fix GPS juga dibuang karena koordinatnya karangan firmware. Klik nama sesi untuk menyaring.":
        "packets are used: a hop-1 packet carries the RSSI of the node that relayed it, not of the node it came from, and including those would make the chart appear to show signal getting stronger with distance. Packets without a GPS fix are discarded too, because their coordinates are invented by the firmware. Click a session name to filter.",
    "Jarak terjauh yang masih sampai · per sesi":
        "Farthest distance still reached · per session",
    "Batang berarsir berarti paket itu sampai": "A hatched bar means the packet arrived",
    "lewat relai": "via a relay",
    "node lain, bukan langsung. Batang putus-putus pada uji multi-hop adalah batas atas: penguji mencatat bahwa lima belas paket terakhir kemungkinan direlai walau terhitung nol hop, jadi angka yang boleh disebut tautan langsung adalah batang penuhnya.":
        "on another node rather than directly. The dashed bar on the multi-hop test is an upper bound: the tester noted that the last fifteen packets were probably relayed even though they counted as zero hops, so the figure that may be called a direct link is the solid bar.",
    "Packet Delivery Ratio · per node, urut waktu":
        "Packet Delivery Ratio · per node, in time order",
    "Dihitung dari kesinambungan nomor urut paket. Satu node memakai satu penghitung untuk semua jenis paket, jadi ini PDR":
        "Computed from the continuity of packet sequence numbers. A node uses one counter for every packet type, so this is a",
    "agregat per node": "per-node aggregate PDR",
    "— lubang di deretan nomor memberi tahu ada paket hilang, tapi tidak memberi tahu jenisnya.":
        "— a gap in the sequence tells you a packet was lost, but not which kind.",
    "Mutu data lokasi · fix GPS sah dibanding paket tanpa fix":
        "Location data quality · valid GPS fixes against packets with none",
    "Saat GPS belum mengunci satelit, firmware tetap mengirim paket — dengan koordinat karangan yang sama untuk setiap node. Paket seperti itu dibuang dari analisis jarak, dan di aplikasi lapangan ditandai":
        "While the GPS has not yet locked onto satellites, the firmware still sends packets — with the same invented coordinates for every node. Packets like that are discarded from the distance analysis, and in the field app they are marked",
    "posisi lama": "stale position",
    ". Penandaan itu bukan hiasan: ia jawaban atas batang merah di grafik ini.":
        ". That marking is not decoration: it is the answer to the red bars in this chart.",
    "Empat hal yang": "Four things that",
    "tidak": "must not",
    "boleh disimpulkan dari data ini": "be concluded from this data",
    "Titik posko dua sesi terakhir adalah perkiraan":
        "The post location for the last two sessions is an estimate",
    "Gateway tidak punya GPS. Pada 30 Juli titiknya diukur dengan menempelkan satu node ber-GPS di posko; pada 14 dan 18 Agustus titiknya diambil dari paket ber-RSSI terkuat. Perkiraan itu meleset 8 m dan 16 m dari titik terukur — sebanding dengan galat fix GPS itu sendiri, tapi jangan sebut sumbu jarak dua sesi itu hasil pengukuran.":
        "The gateway has no GPS. On 30 July the location was measured by placing a GPS-equipped node at the post; on 14 and 18 August it was taken from the strongest-RSSI packet. Those estimates land 8 m and 16 m from the measured point — comparable to the GPS fix error itself, but do not call the distance axis of those two sessions a measurement.",
    "PDR di sini agregat per node": "PDR here is a per-node aggregate",
    "Satu node, satu penghitung nomor urut untuk semua jenis paket. Jangan mengklaim “PDR SOS sekian persen” dari data ini.":
        "One node, one sequence counter for every packet type. Do not claim an “SOS PDR of X per cent” from this data.",
    "Jangkauan bukan batas maksimum alat": "Range is not the device's maximum",
    "Angkanya adalah jarak terjauh yang": "The figure is the farthest distance that",
    "kebetulan diuji": "happened to be tested",
    "pada sesi itu. Sesinya berhenti karena orangnya berhenti berjalan, bukan karena sinyalnya habis. Jangan sebut angka ini spesifikasi jangkauan.":
        "in that session. The session ended because the person stopped walking, not because the signal ran out. Do not quote this number as a range specification.",
    "Sesi-sesi ini bukan perbandingan setara": "These sessions are not a like-for-like comparison",
    "Jumlah node, lama rekaman, dan medannya berbeda-beda; sesi 24 Juli bahkan memakai firmware dengan format berbeda, dan dua sesi tidak punya tanggal tercatat. Jangan mengurutkannya sebagai “makin lama makin baik”.":
        "Node count, recording length and terrain all differ; the 24 July session even used firmware with a different format, and two sessions have no recorded date. Do not read them as “steadily getting better”.",
    "Node mati-hidup sendiri di setiap sesi": "Nodes reboot on their own in every session",
    "Nomor urut paket kembali ke awal tiap kali sebuah node menyala ulang —":
        "The packet sequence number returns to the start every time a node reboots —",
    "22 kali": "22 times",
    "sepanjang delapan sesi, sejak rekaman paling awal. Data ini membuktikan kejadiannya, tapi tidak sebabnya: tegangan jatuh, program crash, dan kabel longgar meninggalkan jejak yang sama persis di rekaman gateway. Firmware sekarang mencetak baris":
        "across the eight sessions, right from the earliest recording. This data proves it happens, but not why: a voltage drop, a program crash and a loose cable leave exactly the same trace in the gateway log. The firmware now prints a",
    "berisi sebab reboot menurut ESP32 sendiri.":
        "line carrying the reboot reason according to the ESP32 itself.",
    "Yang sudah terbukti": "What has been proven",
    "Parameter radionya sama di ketiga peran — SF10, BW 125 kHz, CR 4/5, sync word":
        "The radio parameters are identical across all three roles — SF10, BW 125 kHz, CR 4/5, sync word",
    "— dan itulah yang membuat kedelapan sesi bisa dibandingkan. Pada uji multi-hop, gateway diam, satu node menjauh, satu node berdiri di tengah: delapan paket terbukti sampai":
        "— and that is what makes the eight sessions comparable at all. In the multi-hop test the gateway stayed put, one node walked away and one node stood in the middle: eight packets are proven to have arrived",
    ", terjauh 391 m, sementara tautan langsung terjauh yang tercatat 1.891 m.":
        ", the farthest at 391 m, while the farthest recorded direct link was 1,891 m.",
    "Lihat angkanya sebagai tabel": "View the numbers as a table",
    "Angka dihitung": "The numbers are computed by",
    "dari rekaman serial gateway, lalu disusun jadi":
        "from the gateway's serial recording, then assembled into",
    "oleh": "by",
    ". Halaman ini menyajikan, tidak menghitung ulang.":
        ". This page presents them; it does not recompute them.",

    # ── 08 aplikasi ───────────────────────────────────────────────────────
    "08 — Genggam": "08 — In hand",
    "Aplikasi Point Rescue berjalan langsung di halaman ini, mode demo":
        "The Point Rescue app running live on this page, demo mode",
    "Posko yang ikut berjalan.": "A command post that walks with you.",
    "Aplikasi Android tersambung ke node SAR lewat Bluetooth Low Energy. Lima wilayah kerja — Dasbor, Peta, Node, Pesan, Lainnya — dan seluruhnya berfungsi tanpa internet. Yang berjalan di ponsel sebelah ini":
        "The Android app connects to a SAR node over Bluetooth Low Energy. Five working areas — Dashboard, Map, Nodes, Messages, More — and all of them function without the internet. What is running on the phone beside this is",
    "aplikasinya sendiri": "the app itself",
    ", di-build ke web dari kode Flutter yang sama: ketuk tab bar-nya, geser petanya, buka rincian nodenya.":
        ", built for the web from the same Flutter code: tap the tab bar, pan the map, open a node's detail.",
    "Peta berjenjang": "Tiered map",
    "Ubin tersimpan → sumber daring → grid buatan program":
        "Stored tiles → online source → program-drawn grid",
    "Kompas taktis": "Tactical compass",
    "Arah &amp; jarak dari node tertaut atau GPS ponsel":
        "Bearing &amp; distance from the linked node or the phone's GPS",
    "Pembuktian tautan": "Link proof",
    "Lima tingkat, sampai terbukti diterima gateway":
        "Five levels, up to proof of receipt at the gateway",
    "Sambung ulang": "Reconnect",
    "Jeda berlipat 1 → 30 detik saat tautan putus":
        "Backoff from 1 → 30 seconds when the link drops",
    "27 fitur terdokumentasi · 198 pengujian otomatis lulus · 18.581 baris kode":
        "27 documented features · 198 automated tests passing · 18,581 lines of code",
    "Menyalakan aplikasi": "Starting the app",
    "Aplikasinya sendiri, bukan gambar": "The app itself, not a picture",
    "build web dari kode Flutter yang sama · mode demo, tanpa node":
        "web build from the same Flutter code · demo mode, no node attached",

    # ── 09 HKI ────────────────────────────────────────────────────────────
    "09 — Kekayaan intelektual": "09 — Intellectual property",
    "Terdokumentasi sampai ke nomor barisnya.": "Documented down to the line number.",
    "Dua ciptaan Point Rescue disusun jadi dokumen pendaftaran HKI. Seluruh kutipan kode di dalamnya dibangkitkan langsung dari program yang didaftarkan, jadi dokumennya tidak mungkin melenceng dari perangkat lunaknya.":
        "Two Point Rescue works were assembled into copyright registration documents. Every code excerpt inside them is generated directly from the registered program, so the document cannot drift away from the software it describes.",
    "Ciptaan 1": "Work 1",
    "Dasbor Gateway": "Gateway Dashboard",
    "Deskripsi": "Description",
    "43 hlm · 29 gambar": "43 pp · 29 figures",
    "Cakupan": "Coverage",
    "25 fitur · 5 klaim": "25 features · 5 claims",
    "Lampiran kode": "Code appendix",
    "185 halaman": "185 pages",
    "Ciptaan 2": "Work 2",
    "Aplikasi Perangkat Bergerak": "Mobile Application",
    "Dokumen": "Document",
    "310 halaman": "310 pages",
    "27 fitur · 9 klaim": "27 features · 9 claims",
    "18.581 baris bernomor": "18,581 numbered lines",

    # ── 10 tim & penutup ──────────────────────────────────────────────────
    "10 — Tim": "10 — Team",
    "PKM-KC Universitas Brawijaya 2026.": "PKM-KC Universitas Brawijaya 2026.",
    "Profil FILKOM UB": "FILKOM UB profile",
    "Ketua tim": "Team lead",
    "Dosen pembimbing": "Supervisor",
    "Perancang elektronik": "Electrical engineer",
    "Perancang mekanik": "Mechanical engineer",
    "Perangkat lunak": "Software engineer",
    "Administrasi": "Administration",
    "Teknik Komputer ’24": "Computer Engineering ’24",
    "Sistem Informasi ’25": "Information Systems ’25",
    "Lektor Kepala · Teknik Komputer FILKOM":
        "Associate Professor · Computer Engineering, Faculty of Computer Science",
    "POINTRESCUE: Pelacak Taktis": "POINTRESCUE: A Wearable Tactical Tracker",
    "Berbasis Algoritma": "Built on the",
    "untuk Menemukan Korban Bencana dengan Sistem Komunikasi Radio di Wilayah Tanpa Sinyal":
        "Algorithm, for Finding Disaster Victims by Radio in Areas With No Signal",
    "teknologi yang andal, aman, terpercaya": "technology that is reliable, safe, trusted",
    "Merah": "Red",
    "kondisi darurat dan urgensi": "emergency and urgency",
    "Oranye": "Orange",
    "kesiapsiagaan, energi, respons cepat": "readiness, energy, rapid response",
    "PKM-KC 2026 · FILKOM Universitas Brawijaya":
        "PKM-KC 2026 · Faculty of Computer Science, Universitas Brawijaya",
}

# atribut alt / title / aria-label
ATRIBUT = {
    "Perangkat Point Rescue digenggam, antena terpasang":
        "A Point Rescue unit held in the hand, antenna fitted",
    "Model 3D Point Rescue berputar": "The Point Rescue 3D model, rotating",
    "Film PKM-KC Point Rescue: masalahnya, cara kerja sistem, dan hasil uji lapangan. Narasi dan subtitle berbahasa Indonesia.":
        "Point Rescue PKM-KC film: the problem, how the system works, and the field-test results. Narration and subtitles are in Indonesian.",
    "Nyalakan suara dan narasi film": "Turn on the film's sound and narration",
    "Model 3D rakitan Point Rescue — explode, label, dan isolasi part":
        "Point Rescue 3D assembly — explode, labels and part isolation",
    "Isi perangkat: ESP32, LoRa, GPS, charger, dan sel 18650":
        "Inside the device: ESP32, LoRa, GPS, charger and 18650 cell",
    "Antena, LED indikator, dan patch GPS di muka atas":
        "Antenna, indicator LEDs and GPS patch on the top face",
    "LED indikator dan tombol di dalam casing":
        "Indicator LEDs and button inside the case",
    "Unit Point Rescue digenggam": "A Point Rescue unit held in the hand",
    "Dashboard Gateway POINTRESCUE berjalan dengan data rekaman simulate.py":
        "The POINTRESCUE Gateway Dashboard running on recorded simulate.py data",
    "Tutup": "Close",
    "Aplikasi Point Rescue": "The Point Rescue app",
    "Dashboard Gateway Point Rescue": "The Point Rescue Gateway Dashboard",
    "Saring menurut sesi": "Filter by session",
    "Sebaran RSSI terhadap jarak dari delapan sesi uji lapangan":
        "RSSI against distance across eight field-test sessions",
    "Jarak terjauh per sesi, dipisah antara tautan langsung dan lewat relai":
        "Farthest distance per session, split between direct links and relayed ones",
    "Packet delivery ratio tiap node pada tiap sesi":
        "Packet delivery ratio for each node in each session",
    "Profil dosen Wijaya Kurniawan di FILKOM UB":
        "Wijaya Kurniawan's lecturer profile at FILKOM UB",
    "Perbandingan paket dengan fix GPS sah dan tanpa fix pada tiap sesi":
        "Packets with a valid GPS fix compared with those without, per session",
    "Layar dasbor aplikasi Point Rescue": "The Point Rescue app dashboard screen",
    "Aplikasi Point Rescue berjalan langsung di halaman ini, mode demo":
        "The Point Rescue app running live in this page, in demo mode",
}
