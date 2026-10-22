(function () {
    'use strict';

    const CONFIG = {
        FETCH_INTERVAL: 1000,

        OFFLINE_TIMEOUT: 60000,

        GPS_URL: 'gps.json',
        DEFAULT_CENTER: [-7.953850, 112.614955],
        DEFAULT_ZOOM: 16,
        MARKER_ZOOM: 18,

        DEMO_MODE: false,

        TILE_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        TILE_SUBDOMAINS: 'abc',
        TILE_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };

    function createOfflineTileLayer() {
        const sub = CONFIG.TILE_SUBDOMAINS;

        const HybridLayer = L.TileLayer.extend({
            createTile: function (coords, done) {
                const tile = document.createElement('img');
                tile.setAttribute('role', 'presentation');

                const s = sub[(coords.x + coords.y) % sub.length];
                const remote = CONFIG.TILE_URL
                    .replace('{s}', s)
                    .replace('{z}', coords.z)
                    .replace('{x}', coords.x)
                    .replace('{y}', coords.y);
                const local = `tiles/${coords.z}/${coords.x}/${coords.y}.png`;

                tile.onload = () => done(null, tile);
                tile.onerror = () => {
                    tile.onerror = () => {
                        drawGridTile(tile, coords);
                        noteGridFallback();
                        done(null, tile);
                    };
                    tile.src = local;
                };
                tile.src = remote;
                return tile;
            },
        });

        return new HybridLayer('', {
            maxZoom: 19,
            attribution: CONFIG.TILE_ATTRIBUTION,
        });
    }

    let gridBadgeShown = false;
    function noteGridFallback() {
        if (gridBadgeShown) return;
        gridBadgeShown = true;
        const badge = document.getElementById('offlineMapBadge');
        if (badge) badge.style.display = 'flex';
    }

    function drawGridTile(tile, coords) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= size; i += 64) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
        }

        const n = Math.pow(2, coords.z);
        const lng = coords.x / n * 360 - 180;
        const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * coords.y / n)));
        const lat = latRad * 180 / Math.PI;

        ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.font = '10px monospace';
        ctx.fillText(`${lat.toFixed(3)}, ${lng.toFixed(3)}`, 6, 14);

        tile.src = canvas.toDataURL('image/png');
    }

    const DEVICE_ROLES = {
        '001': { name: 'Home Base',        short: 'BASE',  role: 'command', icon: 'home',      color: 'var(--blue)' },
        '002': { name: 'Victim Alpha',     short: 'VIC-A', role: 'victim',  icon: 'emergency', color: 'var(--red)' },
        '003': { name: 'Victim Bravo',     short: 'VIC-B', role: 'victim',  icon: 'emergency', color: 'var(--red)' },
        '004': { name: 'SAR Team Alpha',   short: 'SAR-A', role: 'sar',     icon: 'local_hospital', color: 'var(--orange)' },
        '005': { name: 'SAR Team Bravo',   short: 'SAR-B', role: 'sar',     icon: 'local_hospital', color: 'var(--orange)' }
    };

    const NATO_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
    const _derivedRoles = {};

    function deriveRoleFromId(id) {
        const m = /^(GATEWAY|SAR|KORBAN)-(\d+)$/.exec(String(id));
        if (!m) return null;
        if (_derivedRoles[id]) return _derivedRoles[id];

        const n = parseInt(m[2], 10) % 1000;
        const nato = NATO_NAMES[n - 1];
        const tag = nato ? nato[0] : String(n);

        let def;
        if (m[1] === 'SAR') {
            def = { name: 'SAR Team ' + (nato || n), short: 'SAR-' + tag, role: 'sar', icon: 'local_hospital', color: 'var(--orange)' };
        } else if (m[1] === 'KORBAN') {
            def = { name: 'Victim ' + (nato || n), short: 'VIC-' + tag, role: 'victim', icon: 'emergency', color: 'var(--red)' };
        } else {
            def = { name: 'Command Post', short: 'BASE', role: 'command', icon: 'home', color: 'var(--blue)' };
        }
        _derivedRoles[id] = def;
        return def;
    }

    const BASE_ROLE = { name: 'Command Post', short: 'BASE', role: 'command', icon: 'home', color: 'var(--blue)' };

    function getDeviceRole(id) {
        if (id === 'BASE') return BASE_ROLE;
        if (DEVICE_ROLES[id]) return DEVICE_ROLES[id];
        const derived = deriveRoleFromId(id);
        if (derived) return derived;
        return { name: 'Unknown Entity ' + id, role: 'unknown', icon: 'satellite_alt', color: '#94A3B8' };
    }

    function getRoleSvg(role, color, S) {
        if (role === 'total') {
            const size = S * 1.6;
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}px" height="${size}px" viewBox="0 0 40 40" style="flex-shrink:0;">
                    <polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="${color}" opacity="0.15" />
                    <polygon points="20,8 30.5,14 30.5,26 20,32 9.5,26 9.5,14" fill="${color}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
                    <circle cx="20" cy="20" r="5" fill="none" stroke="#fff" stroke-width="2"/>
                    <circle cx="20" cy="20" r="2" fill="#fff"/>
                </svg>`;
        } else if (role === 'command') {
            const size = S * 1.75;
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}px" height="${size}px" viewBox="0 0 40 40" style="flex-shrink:0;">
                    <circle cx="20" cy="20" r="16" fill="${color}" opacity="0.15" class="marker-pulse-ring" />
                    <rect x="10" y="10" width="20" height="20" rx="4" fill="${color}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))" />
                    <path d="M15 24v-6l5-4 5 4v6h-3v-4h-4v4h-3z" fill="#fff" />
                </svg>`;
        } else if (role === 'victim') {
            const size = S * 1.83;
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}px" height="${size}px" viewBox="0 0 44 44" style="flex-shrink:0;">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="2" class="victim-pulse" />
                    <circle cx="22" cy="22" r="14" fill="${color}" filter="drop-shadow(0 4px 6px rgba(239,68,68,0.4))" />
                    <circle cx="22" cy="15" r="3" fill="#fff" />
                    <path d="M22 19c-2.5 0-4 1.5-4 3v4h2v6h4v-6h2v-4c0-1.5-1.5-3-4-3z" fill="#fff" />
                </svg>`;
        } else if (role === 'sar') {
            const size = S * 1.83;
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}px" height="${size}px" viewBox="0 0 44 44" style="flex-shrink:0;">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="2" class="victim-pulse" />
                    <circle cx="22" cy="22" r="14" fill="${color}" filter="drop-shadow(0 4px 6px rgba(243,108,33,0.4))" />
                    <g class="sar-icon-svg" style="transform-origin: 22px 22px;">
                        <image href="assets/sar-icon.png" x="8" y="8" width="28" height="28" />
                    </g>
                </svg>`;
        } else {
            return `<span class="material-icons-round" style="font-size:${S*1.2}px; color:${color}; flex-shrink:0;">satellite_alt</span>`;
        }
    }

    let map = null;
    let mapInitialized = false;
    const devices = {};
    let selectedDeviceId = null;
    let colorCounter = 0;
    let fetchErrorCount = 0;
    let lastGlobalUpdate = null;

    const simulator = {
        '004': {
            lat: -7.953500, lon: 112.615200, angle: 0, battery: 92,
            mission: 'Searching Area A', speed: 2.5,
            waitTimer: 0, pauseInterval: 25
        },
        '005': {
            lat: -7.953500, lon: 112.612800, angle: 0, battery: 87,
            mission: 'Moving to Victim Bravo', speed: 1.8,
            waitTimer: 0, phase: 'moving'
        }
    };

    const DOM = {
        map: document.getElementById('map'),
        mapOverlayInfo: document.getElementById('mapOverlayInfo'),
        mapOverlayText: document.getElementById('mapOverlayText'),

        matrixPanel: document.getElementById('matrixPanel'),
        distanceList: document.getElementById('distanceList'),
        distanceCount: document.getElementById('distanceCount'),

        basePanel: document.getElementById('basePanel'),
        baseStatus: document.getElementById('baseStatus'),
        baseGpsBtn: document.getElementById('baseGpsBtn'),
        basePinBtn: document.getElementById('basePinBtn'),
        baseLatInput: document.getElementById('baseLatInput'),
        baseLngInput: document.getElementById('baseLngInput'),
        baseSaveBtn: document.getElementById('baseSaveBtn'),
        baseResetBtn: document.getElementById('baseResetBtn'),
        baseCloseBtn: document.getElementById('baseCloseBtn'),
        baseHint: document.getElementById('baseHint'),

        replayBar: document.getElementById('replayBar'),
        replayNode: document.getElementById('replayNode'),
        replayPlayBtn: document.getElementById('replayPlayBtn'),
        replaySlider: document.getElementById('replaySlider'),
        replayTime: document.getElementById('replayTime'),
        replaySpeedBtn: document.getElementById('replaySpeedBtn'),
        replayCloseBtn: document.getElementById('replayCloseBtn'),

        rosterList: document.getElementById('rosterList'),
        rosterSearch: document.getElementById('rosterSearch'),
        rosterChips: document.getElementById('rosterChips'),
        chipAll: document.getElementById('chipAll'),
        chipOnline: document.getElementById('chipOnline'),
        chipOffline: document.getElementById('chipOffline'),

        mcStates: document.getElementById('mcStates'),
        commsList: document.getElementById('commsList'),
        commsFilter: document.getElementById('commsFilter'),
        chatCount: document.getElementById('chatCount'),

        missionPill: document.getElementById('missionPill'),
        missionLabel: document.getElementById('missionLabel'),
        missionElapsed: document.getElementById('missionElapsed'),
        headerTicker: document.getElementById('headerTicker'),
        onlineRatio: document.getElementById('onlineRatio'),
        onlineRatioText: document.getElementById('onlineRatioText'),
        headerAddr: document.getElementById('headerAddr'),
        headerAddrText: document.getElementById('headerAddrText'),
        clock: document.getElementById('clock'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebar: document.getElementById('sidebar'),
    };

    let uiState = 'mission';
    let rosterFilter = 'all';
    let rosterQuery = '';
    let followDeviceId = null;
    let chatFilterId = null;
    let connected = false;
    let missionStart = parseInt(localStorage.getItem('pr_mission_start') || '0', 10) || null;
    const eventLog = [];
    const hiddenTrails = new Set();
    let trailDataCache = {};
    let basePoint = null;
    let baseMarker = null;
    let baseSetMode = false;
    let serverAddressUrl = null;

    let currentLang = localStorage.getItem('pr_lang') || 'en';

    const I18N = {
        en: {
            subtitle: 'Mission Command Center',
            f_all: 'All', f_online: 'Online', f_offline: 'Offline',
            search_nodes: 'Search nodes…',
            command_post: 'Command Post', use_phone_gps: 'Use this device location',
            click_map: 'Click point on map', or_type_coord: 'or type coordinates',
            save: 'Save', reset: 'Reset', not_set: 'Command Post not set',
            base_hint: 'The Command Post is the reference for distances & nearest team. A phone can also send its GPS here over local WiFi.',
            node_distances: 'Node Distances', measurements: 'Measurements',
            total_lines: 'Total Lines', longest: 'Longest', shortest: 'Shortest',
            measure_start: 'MEASURE — click map or a marker',
            measure_end: 'MEASURE — click the end point (right-click to cancel)',
            measure_next: 'MEASURE — click to start the next one',
            no_measurements: 'No measurements yet. Click the map to start.',
            delete_measurement: 'Delete this measurement',
            mission_comms: 'Mission Comms', msg_placeholder: 'Message team… use @ to mention',
            no_messages: 'No messages yet', no_msg_node: 'No messages from this node',
            sending: 'sending…', queued_mesh: 'queued to LoRa mesh',
            mission_status: 'Mission Status', active_alerts: 'Active Alerts', mission_timeline: 'Mission Timeline',
            live_trace: 'Live Trace', device_health: 'Device Health', nearest_nodes: 'Nearest Nodes',
            mission_control: 'Mission Control',
            online: 'online', moving: 'moving', alerts: 'alerts', idle: 'idle',
            speed: 'Speed', heading: 'Heading', dist_travelled: 'Distance travelled', track_duration: 'Track duration',
            speed_history: 'Speed history', collecting: 'collecting movement data…',
            trail: 'Trail', replay: 'Replay', clear: 'Clear',
            battery: 'Battery', satellites: 'Satellites', altitude: 'Altitude', last_update: 'Last update',
            latitude: 'Latitude', longitude: 'Longitude', mission: 'Mission',
            btn_focus: 'Focus', btn_follow: 'Follow', btn_message: 'Message', btn_last_pos: 'Last position',
            nearest: 'Nearest',
            no_events: 'No events yet — waiting for mission data',
            no_match: 'No matching nodes', last_seen: 'last seen', upd: 'upd', awaiting: 'awaiting signal',
            need_2_nodes: 'Need at least 2 positioned nodes', pairs: 'pairs',
            following: 'FOLLOWING', click_to_stop: '(click to stop)', waiting_gps: 'Waiting for GPS data...',
            ph_standby: 'STANDBY', ph_connecting: 'CONNECTING', ph_linklost: 'LINK LOST',
            ph_active: 'MISSION ACTIVE', ph_monitoring: 'MONITORING',
            ph_active_s: 'ACTIVE',
            ev_joined: 'joined the mesh', ev_online: 'back online', ev_offline: 'lost signal',
            ev_trails_cleared: 'Movement trails cleared', ev_mission_start: 'Mission tracking started',
            ev_cp_set: 'Command Post set', src_phone: 'phone GPS', src_manual: 'manual',
        },
        id: {
            subtitle: 'Pusat Komando Misi',
            f_all: 'Semua', f_online: 'Online', f_offline: 'Offline',
            search_nodes: 'Cari node…',
            command_post: 'Command Post', use_phone_gps: 'Pakai lokasi HP ini',
            click_map: 'Klik titik di peta', or_type_coord: 'atau ketik koordinat',
            save: 'Simpan', reset: 'Reset', not_set: 'Posko belum di-set',
            base_hint: 'Posko jadi titik acuan jarak & tim terdekat. HP juga bisa mengirim koordinat GPS ke sini lewat WiFi lokal.',
            node_distances: 'Jarak Antar Node', measurements: 'Pengukuran',
            total_lines: 'Total Garis', longest: 'Terjauh', shortest: 'Terdekat',
            measure_start: 'UKUR — klik peta atau marker',
            measure_end: 'UKUR — klik titik akhir (klik-kanan untuk batal)',
            measure_next: 'UKUR — klik untuk mulai pengukuran berikutnya',
            no_measurements: 'Belum ada pengukuran. Klik peta untuk mulai.',
            delete_measurement: 'Hapus pengukuran ini',
            mission_comms: 'Komunikasi Misi', msg_placeholder: 'Pesan ke tim… pakai @ untuk mention',
            no_messages: 'Belum ada pesan', no_msg_node: 'Belum ada pesan dari node ini',
            sending: 'mengirim…', queued_mesh: 'diantre ke mesh LoRa',
            mission_status: 'Status Misi', active_alerts: 'Peringatan Aktif', mission_timeline: 'Linimasa Misi',
            live_trace: 'Jejak Langsung', device_health: 'Kesehatan Perangkat', nearest_nodes: 'Node Terdekat',
            mission_control: 'Kontrol Misi',
            online: 'online', moving: 'bergerak', alerts: 'peringatan', idle: 'diam',
            speed: 'Kecepatan', heading: 'Arah', dist_travelled: 'Jarak tempuh', track_duration: 'Durasi gerak',
            speed_history: 'Riwayat kecepatan', collecting: 'mengumpulkan data gerak…',
            trail: 'Jejak', replay: 'Putar Ulang', clear: 'Hapus',
            battery: 'Baterai', satellites: 'Satelit', altitude: 'Ketinggian', last_update: 'Update terakhir',
            latitude: 'Lintang', longitude: 'Bujur', mission: 'Misi',
            btn_focus: 'Fokus', btn_follow: 'Ikuti', btn_message: 'Pesan', btn_last_pos: 'Posisi terakhir',
            nearest: 'Terdekat',
            no_events: 'Belum ada kejadian — menunggu data misi',
            no_match: 'Tak ada node cocok', last_seen: 'terlihat', upd: 'upd', awaiting: 'menunggu sinyal',
            need_2_nodes: 'Butuh minimal 2 node ber-posisi', pairs: 'pasangan',
            following: 'MENGIKUTI', click_to_stop: '(klik untuk berhenti)', waiting_gps: 'Menunggu data GPS...',
            ph_standby: 'SIAGA', ph_connecting: 'MENYAMBUNG', ph_linklost: 'KONEKSI PUTUS',
            ph_active: 'MISI AKTIF', ph_monitoring: 'MEMANTAU',
            ph_active_s: 'AKTIF',
            ev_joined: 'bergabung ke mesh', ev_online: 'kembali online', ev_offline: 'kehilangan sinyal',
            ev_trails_cleared: 'Jejak pergerakan dihapus', ev_mission_start: 'Pelacakan misi dimulai',
            ev_cp_set: 'Command Post di-set', src_phone: 'GPS HP', src_manual: 'manual',
        },
    };

    function t(key) {
        return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
    }

    function applyStaticI18n() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const val = t(el.getAttribute('data-i18n'));
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) el.setAttribute(attr, val);
            else el.textContent = val;
        });
    }

    function updateLangToggle() {
        const b = document.getElementById('langToggleBtn');
        if (b) b.textContent = currentLang.toUpperCase();
    }

    function setLang(lang) {
        currentLang = lang;
        localStorage.setItem('pr_lang', lang);
        applyStaticI18n();
        updateLangToggle();
        refreshUI();
        renderComms(true);
        if (measureMode) updateMeasurementUI();
    }

    function initMap() {
        if (mapInitialized) return;

        map = L.map('map', {
            center: CONFIG.DEFAULT_CENTER,
            zoom: CONFIG.DEFAULT_ZOOM,
            zoomControl: false,
            attributionControl: true,
        });

        createOfflineTileLayer().addTo(map);

        map.on('contextmenu', function(e) {
            if (measureMode) resetMeasure();
        });

        mapInitialized = true;
        DOM.mapOverlayText.textContent = 'Waiting for GPS data...';

        window.addEventListener('resize', function() {
            if (map) map.invalidateSize();
        });
    }

    function createRoleMarkerIcon(roleDef) {
        let svg = '';
        let className = 'custom-marker';

        if (roleDef.role === 'command') {
            className += ' marker-command';
            svg = getRoleSvg('command', roleDef.color, 24);
        } else if (roleDef.role === 'victim') {
            className += ' marker-victim';
            svg = getRoleSvg('victim', roleDef.color, 24);
        } else if (roleDef.role === 'sar') {
            className += ' marker-sar';
            svg = getRoleSvg('sar', roleDef.color, 24);
        } else {
            className += ' marker-unknown';
            svg = getRoleSvg('unknown', roleDef.color, 24);
        }

        return L.divIcon({
            html: svg,
            className: className,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            popupAnchor: [0, -20],
        });
    }

    function getDeviceColor(index) {
        return DEVICE_COLORS[index % DEVICE_COLORS.length];
    }

    function formatAge(ms) {
        const s = Math.max(0, Math.round(ms / 1000));
        if (s < 5) return 'just now';
        if (s < 60) return s + 's ago';
        const m = Math.round(s / 60);
        if (m < 60) return m + 'm ago';
        return Math.round(m / 60) + 'h ago';
    }

    function formatHMS(ms) {
        const s = Math.max(0, Math.floor(ms / 1000));
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${h}:${m}:${ss}`;
    }

    function cardinalOf(deg) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
    }

    function shortClock(ts) {
        return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    function logEvent(type, deviceId, text) {
        eventLog.unshift({ ts: Date.now(), type: type, deviceId: deviceId, text: text });
        if (eventLog.length > 80) eventLog.pop();
    }

    function ensureMissionStart() {
        if (!missionStart) {
            missionStart = Date.now();
            localStorage.setItem('pr_mission_start', String(missionStart));
            logEvent('mission', null, t('ev_mission_start'));
        }
    }

    function detectEvents() {
        Object.keys(devices).forEach(function (id) {
            const d = devices[id];
            const name = getDeviceRole(id).name;
            const online = isDeviceOnline(d);

            if (!d._seen) {
                d._seen = true;
                ensureMissionStart();
                logEvent('node-new', id, `<b>${name}</b> ${t('ev_joined')}`);
                d._wasOnline = online;
            }

            if (online !== d._wasOnline) {
                logEvent(online ? 'online' : 'offline', id,
                    online ? `<b>${name}</b> ${t('ev_online')}` : `<b>${name}</b> ${t('ev_offline')}`);
                d._wasOnline = online;
                if (!online) d._offlineSince = Date.now();
            }
            if (!online && !d._offlineSince) d._offlineSince = Date.now();
        });
    }

    function nearestNodesOf(id, limit) {
        const me = devices[id];
        if (!me || !me.data) return [];
        const out = [];
        Object.keys(devices).forEach(function (oid) {
            if (oid === id) return;
            const o = devices[oid];
            if (!o.data || !isDeviceOnline(o)) return;
            out.push({
                id: oid,
                dist: calculateHaversine(me.data.latitude, me.data.longitude, o.data.latitude, o.data.longitude),
            });
        });
        if (basePoint) {
            out.push({
                id: 'BASE',
                dist: calculateHaversine(me.data.latitude, me.data.longitude, basePoint.lat, basePoint.lng),
            });
        }
        out.sort((a, b) => a.dist - b.dist);
        return out.slice(0, limit || 3);
    }

    function isDeviceOnline(device) {
        if (!device.lastUpdate) return false;
        return (Date.now() - device.lastUpdate) < CONFIG.OFFLINE_TIMEOUT;
    }

    function formatTime(timestamp) {
        if (!timestamp) return '—';
        const d = new Date(timestamp);
        return d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    function processGPSData(dataArray) {
        const now = Date.now();
        lastGlobalUpdate = now;

        dataArray.forEach(function (entry) {
            const id = entry.device_id;

            if (!devices[id]) {
                const roleDef = getDeviceRole(id);
                const icon = createRoleMarkerIcon(roleDef);

                const marker = L.marker(
                    [entry.latitude, entry.longitude],
                    { icon: icon }
                ).addTo(map);

                devices[id] = {
                    data: entry,
                    marker: marker,
                    lastUpdate: now,
                    lastRealUpdate: entry.isDemo ? 0 : now,
                    roleDef: roleDef,
                    color: roleDef.color,
                    heading: 0
                };

                marker.on('click', function (e) {
                    if (measureMode) {
                        const currentData = devices[id].data;
                        const deviceName = devices[id].roleDef ? devices[id].roleDef.name : id;
                        addMeasurementNode(currentData.latitude, currentData.longitude, deviceName);
                        setTimeout(() => marker.closePopup(), 10);
                    } else {
                        selectDevice(id);
                    }
                });

                if (Object.keys(devices).length === 1) {
                    map.setView([entry.latitude, entry.longitude], CONFIG.DEFAULT_ZOOM);
                }

            } else {
                const device = devices[id];

                if (!entry.isDemo) {
                    device.lastRealUpdate = now;
                }

                {
                    const dx = entry.longitude - device.data.longitude;
                    const dy = entry.latitude - device.data.latitude;
                    if (Math.abs(dx) > 0.00001 || Math.abs(dy) > 0.00001) {
                        device.heading = ((Math.atan2(dx, dy) * 180 / Math.PI) + 360) % 360;
                    }
                }

                device.data = entry;
                device.lastUpdate = now;
                device.marker.setLatLng([entry.latitude, entry.longitude]);

                if (!device.speedHist) device.speedHist = [];
                const spd = Number(entry.speed);
                if (!Number.isNaN(spd)) {
                    device.speedHist.push(spd);
                    if (device.speedHist.length > 30) device.speedHist.shift();
                }

                if (followDeviceId === id && map && !replay.active) {
                    map.panTo([entry.latitude, entry.longitude], { animate: true, duration: 0.5 });
                }

                if (device.roleDef.role === 'sar' && device.marker._icon) {
                    const svg = device.marker._icon.querySelector('.sar-icon-svg');
                    if (svg) svg.style.transform = `rotate(${device.heading}deg)`;
                }
            }
        });

        Object.keys(devices).forEach(function (id) {
            const device = devices[id];
            const online = isDeviceOnline(device);
            const d = device.data;
            const popupHTML = buildPopupHTML(id, d, device.color, online);
            device.marker.bindPopup(popupHTML, { closeButton: true, maxWidth: 260 });

            if (device.marker._icon) {
                device.marker._icon.classList.toggle('marker-selected', selectedDeviceId === id);
            }
        });

        refreshUI();
    }

    function refreshUI() {
        detectEvents();
        renderTopBar();
        renderRoster();
        renderMissionControl();
        updateMapOverlay();
        updateCompass();
        if (DOM.matrixPanel && DOM.matrixPanel.style.display !== 'none') {
            updateDistancePanel();
        }
    }

    function buildPopupHTML(id, data, color, online) {
        const statusClass = online ? 'online' : 'offline';
        const statusText = online ? 'Online' : 'Offline';
        const roleDef = getDeviceRole(id);

        const isDemo = data.isDemo ? '<span class="demo-badge-inline">SIMULATED</span>' : '';
        const missionHtml = data.mission ? `<div class="popup-row"><span class="popup-row-label">Mission</span><span class="popup-row-value">${data.mission}</span></div>` : '';
        const batteryHtml = data.battery !== undefined ? `<div class="popup-row"><span class="popup-row-label">Battery</span><span class="popup-row-value">${data.battery}%</span></div>` : '';

        const popupIconHtml = getRoleSvg(roleDef.role, color, 14);

        return `
            <div class="popup-content">
                <div class="popup-header">
                    <div class="popup-header-title-row">
                        ${popupIconHtml}
                        <span class="popup-device-name">${roleDef.name}</span>
                        ${isDemo}
                    </div>
                    <span class="popup-status ${statusClass}">${statusText}</span>
                </div>
                <div class="popup-row">
                    <span class="popup-row-label">Latitude</span>
                    <span class="popup-row-value">${Number(data.latitude).toFixed(6)}</span>
                </div>
                <div class="popup-row">
                    <span class="popup-row-label">Longitude</span>
                    <span class="popup-row-value">${Number(data.longitude).toFixed(6)}</span>
                </div>
                ${batteryHtml}
                ${missionHtml}
                <div class="popup-row">
                    <span class="popup-row-label">Speed</span>
                    <span class="popup-row-value">${data.speed} km/h</span>
                </div>
                <div class="popup-row">
                    <span class="popup-row-label">Satellites</span>
                    <span class="popup-row-value">${data.satellites}</span>
                </div>
            </div>`;
    }

    const MOVING_KMH = 0.8;

    function missionCounts() {
        let online = 0, total = 0, moving = 0, offline = 0;
        Object.keys(devices).forEach(function (id) {
            total++;
            const d = devices[id];
            if (isDeviceOnline(d)) {
                online++;
                if (Number(d.data.speed) >= MOVING_KMH) moving++;
            } else {
                offline++;
            }
        });
        return { online, total, moving, offline };
    }

    function latestAlert() {
        let best = null;
        Object.keys(devices).forEach(function (id) {
            const d = devices[id];
            if (!isDeviceOnline(d) && d._offlineSince) {
                if (!best || d._offlineSince > best.since) best = { kind: 'offline', id: id, since: d._offlineSince };
            }
        });
        return best;
    }

    function renderTopBar() {
        const c = missionCounts();

        let label, pillCls = 'connection-status mission-pill';
        if (!connected && c.total === 0) { label = t('ph_connecting'); pillCls += ' pill-standby'; }
        else if (!connected) { label = t('ph_linklost'); pillCls += ' error'; }
        else if (c.moving > 0) { label = t('ph_active'); }
        else if (c.online > 0) { label = t('ph_monitoring'); }
        else { label = t('ph_standby'); pillCls += ' pill-standby'; }

        DOM.missionLabel.textContent = label;
        DOM.missionPill.className = pillCls;
        DOM.missionElapsed.textContent = missionStart ? formatHMS(Date.now() - missionStart) : '';

        DOM.onlineRatioText.textContent = `${c.online}/${c.total} ONLINE`;
        DOM.onlineRatio.classList.toggle('ratio-warn', c.total > 0 && c.online < c.total);

        const alert = latestAlert();
        if (alert) {
            const name = getDeviceRole(alert.id).name;
            DOM.headerTicker.style.display = 'flex';
            DOM.headerTicker.className = 'header-ticker';
            DOM.headerTicker.innerHTML =
                `<span class="material-icons-round" style="font-size:13px;">sensors_off</span> ${name} offline · ${formatAge(Date.now() - alert.since)}`;
            DOM.headerTicker.dataset.deviceId = alert.id;
        } else {
            DOM.headerTicker.style.display = 'none';
        }
    }

    function rosterEntries() {
        const liveIds = Object.keys(devices);
        const meshMode = liveIds.some(id => !DEVICE_ROLES[id]);
        const ids = new Set(meshMode ? liveIds : [...Object.keys(DEVICE_ROLES), ...liveIds]);
        const list = [];
        ids.forEach(function (id) {
            const roleDef = getDeviceRole(id);
            const device = devices[id];
            const online = device ? isDeviceOnline(device) : false;
            const moving = online && Number(device.data.speed) >= MOVING_KMH;
            let prio = 3;
            if (device && !online) prio = 0;
            else if (moving) prio = 1;
            else if (online) prio = 2;
            list.push({ id, roleDef, device, online, moving, prio });
        });
        list.sort((a, b) => (a.prio - b.prio) || a.id.localeCompare(b.id));
        return list;
    }

    function renderRoster() {
        if (!DOM.rosterList) return;
        const entries = rosterEntries();

        const c = missionCounts();
        DOM.chipAll.textContent = entries.length;
        DOM.chipOnline.textContent = c.online;
        DOM.chipOffline.textContent = entries.length - c.online;

        const q = rosterQuery.trim().toLowerCase();
        let html = '';

        entries.forEach(function (e) {
            if (rosterFilter === 'online' && !e.online) return;
            if (rosterFilter === 'offline' && e.online) return;
            if (q && !(`${e.roleDef.name} ${e.id} ${e.roleDef.short || ''}`.toLowerCase().includes(q))) return;

            const activeClass = (selectedDeviceId === e.id) ? ' active' : '';
            const warnClass = (e.device && !e.online) ? ' dev-offline-warn' : '';

            let sub, statusClass;
            if (e.device && !e.online) {
                sub = `<span class="sub-offline">${t('last_seen')} ${formatAge(Date.now() - e.device.lastUpdate)}</span>`;
                statusClass = 'offline';
            } else if (e.moving) {
                const hd = e.device.heading !== undefined ? ` · ${Math.round(e.device.heading)}° ${cardinalOf(e.device.heading)}` : '';
                sub = `<span class="sub-moving">${t('moving')} · ${e.device.data.speed} km/h${hd}</span>`;
                statusClass = 'online';
            } else if (e.online) {
                sub = `${t('idle')} · ${t('upd')} ${formatAge(Date.now() - e.device.lastUpdate)}`;
                statusClass = 'online';
            } else {
                sub = t('awaiting');
                statusClass = 'awaiting';
            }

            let extraInfo = '';
            if (e.device && e.device.data.mission) {
                extraInfo = `<div class="device-item-mission">${e.device.data.mission}</div>`;
            }
            if (e.device && e.device.data.isDemo) {
                extraInfo += `<span class="demo-badge-inline">SIMULATED</span>`;
            }

            const iconHtml = getRoleSvg(e.roleDef.role, e.roleDef.color, 14);
            const itemStyle = `color:${e.roleDef.color}; display:flex; align-items:center; justify-content:center; background: transparent; box-shadow: none; border-radius: 0;`;

            html += `
                <div class="device-item${activeClass}${warnClass}" data-device-id="${e.id}" onclick="window.__selectDevice('${e.id}')">
                    <span class="device-item-color" style="${itemStyle}">${iconHtml}</span>
                    <div class="device-item-info">
                        <div class="device-item-name">${e.roleDef.name}</div>
                        <div class="device-item-coords device-item-sub">${sub}</div>
                        ${extraInfo}
                    </div>
                    <span class="device-item-status ${statusClass}" title="${statusClass}"></span>
                </div>`;
        });

        DOM.rosterList.innerHTML = html ||
            `<div class="device-list-empty"><span class="material-icons-round">search_off</span><span>${t('no_match')}</span></div>`;
    }

    function selectDevice(id) {
        if (!devices[id]) return;

        clearDistanceHighlight();

        selectedDeviceId = id;
        uiState = 'node';
        chatFilterId = id;
        const device = devices[id];

        map.setView(
            [device.data.latitude, device.data.longitude],
            Math.max(map.getZoom(), CONFIG.MARKER_ZOOM),
            { animate: true }
        );

        device.marker.openPopup();

        applyTrailEmphasis();
        refreshUI();
        renderComms(true);

        closeMobileSidebar();
    }

    function deselectDevice() {
        if (replay.active) closeReplay();
        selectedDeviceId = null;
        uiState = 'mission';
        chatFilterId = null;
        followDeviceId = null;
        clearDistanceHighlight();
        applyTrailEmphasis();
        refreshUI();
        renderComms(true);
    }

    window.__selectDevice = selectDevice;

    function getTraceStats(id) {
        const pts = trailDataCache[id];
        if (!Array.isArray(pts) || pts.length < 2) return null;
        let dist = 0;
        for (let i = 1; i < pts.length; i++) {
            dist += calculateHaversine(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
        }
        const t0 = pts[0].ts, t1 = pts[pts.length - 1].ts;
        const heading = bearingDeg(
            [pts[pts.length - 2].lat, pts[pts.length - 2].lng],
            [pts[pts.length - 1].lat, pts[pts.length - 1].lng]
        );
        return { dist, durMs: (t1 - t0) * 1000, heading, points: pts.length, t0, t1 };
    }

    function sparklineSVG(hist, color) {
        if (!hist || hist.length < 2) {
            return '<span class="trace-spark-empty">collecting movement data…</span>';
        }
        const w = 200, h = 26;
        const max = Math.max(...hist, 0.5);
        const pts = hist.map((v, i) =>
            `${(i / (hist.length - 1) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 5)).toFixed(1)}`
        ).join(' ');
        return `<svg class="trace-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
                    <polyline points="${pts}" fill="none" style="stroke:${color}" stroke-width="1.6"
                              stroke-linejoin="round" stroke-linecap="round"/>
                </svg>`;
    }

    function mcHeader(icon, label) {
        return `<div class="status-card-header"><span class="material-icons-round">${icon}</span><span>${label}</span></div>`;
    }

    function renderMissionControl() {
        if (!DOM.mcStates) return;
        if (uiState === 'node' && selectedDeviceId && devices[selectedDeviceId]) {
            renderNodeFocus();
        } else {
            uiState = 'mission';
            renderMissionState();
        }
    }

    function renderMissionState() {
        const c = missionCounts();

        let phase = t('ph_standby'), phaseCls = 'phase-standby';
        if (!connected && c.total > 0) { phase = t('ph_linklost'); phaseCls = 'phase-alert'; }
        else if (c.moving > 0) { phase = t('ph_active_s'); phaseCls = 'phase-active'; }
        else if (c.online > 0) { phase = t('ph_monitoring'); phaseCls = 'phase-active'; }

        let alertsHtml = '';
        Object.keys(devices).forEach(function (id) {
            const d = devices[id];
            if (!isDeviceOnline(d)) {
                alertsHtml += `
                    <div class="alert-item alert-warn">
                        <div class="alert-item-title">
                            <span class="material-icons-round">sensors_off</span>
                            ${getDeviceRole(id).name} ${t('f_offline').toLowerCase()}
                            <span class="alert-age">${formatAge(Date.now() - d.lastUpdate)}</span>
                        </div>
                        <div class="alert-item-actions">
                            <button class="mc-btn" data-action="focus" data-id="${id}"><span class="material-icons-round">my_location</span>${t('btn_last_pos')}</button>
                        </div>
                    </div>`;
            }
        });

        let tlHtml = '';
        eventLog.slice(0, 25).forEach(function (ev) {
            const meta = {
                'offline':   { icon: 'sensors_off', cls: 'tl-warn' },
                'online':    { icon: 'sensors', cls: 'tl-ok' },
                'node-new':  { icon: 'satellite_alt', cls: 'tl-info' },
                'chat':      { icon: 'chat_bubble', cls: 'tl-info' },
                'trail-clear': { icon: 'delete_sweep', cls: '' },
                'mission':   { icon: 'flag', cls: 'tl-ok' },
            }[ev.type] || { icon: 'info', cls: '' };
            tlHtml += `
                <div class="tl-item ${meta.cls}" ${ev.deviceId ? `data-action="select" data-id="${ev.deviceId}"` : ''}>
                    <span class="material-icons-round">${meta.icon}</span>
                    <span class="tl-text">${ev.text}</span>
                    <span class="tl-time">${shortClock(ev.ts)}</span>
                </div>`;
        });

        DOM.mcStates.innerHTML = `
            <div class="mc-card">
                ${mcHeader('flag', t('mission_status'))}
                <div class="mission-phase-row">
                    <span class="mission-phase ${phaseCls}">${phase}</span>
                    <span class="mission-phase-elapsed">${missionStart ? formatHMS(Date.now() - missionStart) : '—'}</span>
                </div>
                <div class="mission-meta">
                    <span><b>${c.online}/${c.total}</b> ${t('online')}</span>
                    <span><b>${c.moving}</b> ${t('moving')}</span>
                    <span><b>${c.offline}</b> ${t('alerts')}</span>
                </div>
            </div>
            ${alertsHtml ? `<div class="mc-card">${mcHeader('warning', t('active_alerts'))}${alertsHtml}</div>` : ''}
            <div class="mc-card">
                ${mcHeader('history', t('mission_timeline'))}
                <div class="tl-list">${tlHtml || `<div class="tl-empty">${t('no_events')}</div>`}</div>
            </div>`;
    }

    function renderNodeFocus() {
        const id = selectedDeviceId;
        const device = devices[id];
        const d = device.data;
        const roleDef = device.roleDef;
        const online = isDeviceOnline(device);

        const statusClass = online ? 'online' : 'offline';
        const statusText = online ? 'Online' : 'Offline';
        const isDemo = d.isDemo ? '<span class="demo-badge-inline">SIMULATED</span>' : '';

        const trace = getTraceStats(id);
        const heading = device.heading !== undefined ? device.heading : (trace ? trace.heading : undefined);
        const headingStr = heading !== undefined
            ? `<span class="heading-arrow" style="transform: rotate(${Math.round(heading)}deg)">▲</span> ${Math.round(heading)}° ${cardinalOf(heading)}`
            : '—';
        const canReplay = !!(trace && trace.t0 && trace.t1 && trace.t1 > trace.t0);

        let nearHtml = '';
        nearestNodesOf(id, 3).forEach(function (n) {
            const nd = getDeviceRole(n.id);
            nearHtml += `
                <div class="distance-row" data-action="pair" data-id="${n.id}">
                    <div class="distance-pair">
                        <div class="distance-pair-nodes">
                            <span class="dpn" style="color:${nd.color}">${nd.short || n.id}</span>
                            <span class="material-icons-round">sync_alt</span>
                            <span class="dpn" style="color:${roleDef.color}">${roleDef.short || id}</span>
                        </div>
                    </div>
                    <span class="distance-value">${formatDistance(n.dist)}</span>
                </div>`;
        });

        DOM.mcStates.innerHTML = `
            <button class="mc-back" data-action="back"><span class="material-icons-round">arrow_back</span>${t('mission_control')}</button>
            <div class="mc-card">
                <div class="nf-header">
                    <div class="nf-icon" style="color:${roleDef.color}">${getRoleSvg(roleDef.role, roleDef.color, 24)}</div>
                    <div class="nf-title">
                        <h2>${roleDef.name} ${isDemo}</h2>
                        <span class="nf-role">${roleDef.role}</span>
                    </div>
                    <span class="detail-status ${statusClass}"><span class="status-dot"></span><span class="status-label">${statusText}</span></span>
                </div>
                <div class="nf-actions">
                    <button class="mc-btn" data-action="focus" data-id="${id}"><span class="material-icons-round">my_location</span>${t('btn_focus')}</button>
                    <button class="mc-btn ${followDeviceId === id ? 'active' : ''}" data-action="follow" data-id="${id}"><span class="material-icons-round">gps_fixed</span>${t('btn_follow')}</button>
                    <button class="mc-btn" data-action="message" data-id="${id}"><span class="material-icons-round">alternate_email</span>${t('btn_message')}</button>
                </div>
            </div>
            <div class="mc-card">
                ${mcHeader('radar', t('live_trace'))}
                <div class="trace-grid">
                    <div class="trace-stat"><span class="trace-stat-label">${t('speed')}</span><span class="trace-stat-value">${d.speed !== undefined ? d.speed + ' km/h' : '—'}</span></div>
                    <div class="trace-stat"><span class="trace-stat-label">${t('heading')}</span><span class="trace-stat-value">${headingStr}</span></div>
                    <div class="trace-stat"><span class="trace-stat-label">${t('dist_travelled')}</span><span class="trace-stat-value">${trace ? formatDistance(trace.dist) : '—'}</span></div>
                    <div class="trace-stat"><span class="trace-stat-label">${t('track_duration')}</span><span class="trace-stat-value">${trace ? formatHMS(trace.durMs) : '—'}</span></div>
                </div>
                <div class="trace-spark-wrap">
                    <div class="trace-spark-label">${t('speed_history')}</div>
                    ${sparklineSVG(device.speedHist, roleDef.color)}
                </div>
                <div class="trace-actions">
                    <button class="mc-btn ${hiddenTrails.has(id) ? '' : 'active'}" data-action="trail" data-id="${id}"><span class="material-icons-round">route</span>${t('trail')}</button>
                    <button class="mc-btn" data-action="replay" data-id="${id}" ${canReplay ? '' : 'disabled style="opacity:0.45;cursor:default;"'}><span class="material-icons-round">replay</span>${t('replay')}</button>
                    <button class="mc-btn btn-danger" data-action="cleartrails"><span class="material-icons-round">delete_sweep</span>${t('clear')}</button>
                </div>
            </div>
            <div class="mc-card">
                ${mcHeader('monitor_heart', t('device_health'))}
                <div class="vitals-grid">
                    ${d.battery !== undefined ? `<div class="trace-stat"><span class="trace-stat-label">${t('battery')}</span><span class="trace-stat-value">${d.battery}%</span></div>` : ''}
                    <div class="trace-stat"><span class="trace-stat-label">${t('satellites')}</span><span class="trace-stat-value">${d.satellites !== undefined ? d.satellites : '—'}</span></div>
                    <div class="trace-stat"><span class="trace-stat-label">${t('altitude')}</span><span class="trace-stat-value">${d.altitude !== undefined ? d.altitude + ' m' : '—'}</span></div>
                    <div class="trace-stat"><span class="trace-stat-label">${t('last_update')}</span><span class="trace-stat-value">${formatAge(Date.now() - device.lastUpdate)}</span></div>
                    <div class="trace-stat"><span class="trace-stat-label">${t('latitude')}</span><span class="trace-stat-value">${Number(d.latitude).toFixed(5)}°</span></div>
                    <div class="trace-stat"><span class="trace-stat-label">${t('longitude')}</span><span class="trace-stat-value">${Number(d.longitude).toFixed(5)}°</span></div>
                </div>
                ${d.mission ? `<div class="mission-meta" style="margin-top:8px;"><span>${t('mission')}: <b>${d.mission}</b></span></div>` : ''}
            </div>
            ${nearHtml ? `<div class="mc-card">${mcHeader('social_distance', t('nearest_nodes'))}<div class="nearest-list">${nearHtml}</div></div>` : ''}`;
    }

    function handleMcAction(e) {
        const el = e.target.closest('[data-action]');
        if (!el || el.disabled) return;
        const action = el.dataset.action;
        const id = el.dataset.id;

        if (action === 'back') deselectDevice();
        else if (action === 'select' && id && devices[id]) selectDevice(id);
        else if (action === 'focus' && id && devices[id]) {
            const d = devices[id];
            map.flyTo([d.data.latitude, d.data.longitude], Math.max(map.getZoom(), 16), { duration: 0.8 });
            if (uiState !== 'node' || selectedDeviceId !== id) selectDevice(id);
        }
        else if (action === 'follow' && id) {
            followDeviceId = (followDeviceId === id) ? null : id;
            if (followDeviceId && devices[id]) {
                map.panTo([devices[id].data.latitude, devices[id].data.longitude], { animate: true });
            }
            refreshUI();
        }
        else if (action === 'message' && id) {
            const input = document.getElementById('chatInput');
            const short = getDeviceRole(id).short || id;
            if (input) { input.value = `@${short} `; input.focus(); }
        }
        else if (action === 'trail' && id) {
            if (hiddenTrails.has(id)) hiddenTrails.delete(id);
            else hiddenTrails.add(id);
            renderTrails(trailDataCache);
            renderMissionControl();
        }
        else if (action === 'replay' && id) openReplay(id);
        else if (action === 'cleartrails') clearTrails();
        else if (action === 'pair' && id && selectedDeviceId) {
            highlightDistancePair(selectedDeviceId, id);
        }
    }

    function updateMapOverlay() {
        if (!DOM.mapOverlayInfo) return;

        if (measureMode) {
            DOM.mapOverlayInfo.style.display = '';
            return;
        }
        if (followDeviceId && devices[followDeviceId]) {
            DOM.mapOverlayInfo.style.display = '';
            DOM.mapOverlayText.innerHTML =
                `${t('following')} — ${getDeviceRole(followDeviceId).name} <span style="opacity:0.6">${t('click_to_stop')}</span>`;
            return;
        }
        if (Object.keys(devices).length === 0) {
            DOM.mapOverlayInfo.style.display = '';
            DOM.mapOverlayText.textContent = t('waiting_gps');
            return;
        }
        DOM.mapOverlayInfo.style.display = 'none';
    }

    const BASE_URL = 'base.json';

    function pointOf(id) {
        if (id === 'BASE') return basePoint ? { lat: basePoint.lat, lng: basePoint.lng } : null;
        const d = devices[id];
        if (d && d.data && typeof d.data.latitude === 'number') {
            return { lat: d.data.latitude, lng: d.data.longitude };
        }
        return null;
    }

    function createBaseIcon() {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42" overflow="visible">' +
            '<defs><filter id="baseShadow" x="-30%" y="-20%" width="160%" height="150%">' +
            '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/></filter></defs>' +
            '<path d="M18 0 L36 8 V24 C36 34 18 42 18 42 S0 34 0 24 V8 Z" fill="#153B7A" stroke="#fff" stroke-width="1.5" filter="url(#baseShadow)"/>' +
            '<path d="M18 11 l8 7 h-2.4 v7 h-4 v-4.5 h-3.2 V25 h-4 v-7 H10 z" fill="#fff"/>' +
            '</svg>';
        return L.divIcon({
            html: svg, className: 'custom-marker-base',
            iconSize: [36, 42], iconAnchor: [18, 42], popupAnchor: [0, -42],
        });
    }

    function renderBaseMarker() {
        if (!map) return;
        if (!basePoint) {
            if (baseMarker) { map.removeLayer(baseMarker); baseMarker = null; }
            return;
        }
        if (!baseMarker) {
            baseMarker = L.marker([basePoint.lat, basePoint.lng], {
                icon: createBaseIcon(),
                zIndexOffset: -50,
            }).addTo(map);
            baseMarker.on('click', function () {
                if (measureMode) { addMeasurementNode(basePoint.lat, basePoint.lng, 'Command Post'); return; }
                baseMarker.openPopup();
            });
        } else {
            baseMarker.setLatLng([basePoint.lat, basePoint.lng]);
        }
        baseMarker.bindPopup(
            '<div class="popup-content"><div class="popup-header">' +
            '<div class="popup-header-title-row"><span class="popup-device-name">Command Post</span></div>' +
            '<span class="popup-status online">POSKO</span></div>' +
            '<div class="popup-row"><span class="popup-row-label">Latitude</span><span class="popup-row-value">' + basePoint.lat.toFixed(6) + '</span></div>' +
            '<div class="popup-row"><span class="popup-row-label">Longitude</span><span class="popup-row-value">' + basePoint.lng.toFixed(6) + '</span></div>' +
            '<div class="popup-row"><span class="popup-row-label">Sumber</span><span class="popup-row-value">' + baseSourceLabel(basePoint.source) + '</span></div>' +
            '</div>', { closeButton: true, maxWidth: 240 });
    }

    function applyBase(data) {
        const valid = data && typeof data.lat === 'number' && typeof data.lng === 'number';
        const changed = valid
            ? (!basePoint || basePoint.lat !== data.lat || basePoint.lng !== data.lng)
            : (basePoint !== null);

        basePoint = valid ? { lat: data.lat, lng: data.lng, source: data.source } : null;
        renderBaseMarker();
        renderBasePanel();

        if (changed) {
            if (valid) logEvent('mission', null, `${t('ev_cp_set')} (${data.source === 'mobile' ? t('src_phone') : t('src_manual')})`);
            if (DOM.matrixPanel && DOM.matrixPanel.style.display !== 'none') updateDistancePanel();
        }
    }

    async function fetchBase() {
        try {
            const res = await fetch(BASE_URL + '?t=' + Date.now());
            if (!res.ok) throw new Error('HTTP ' + res.status);
            applyBase(await res.json());
        } catch (_) {  }
    }

    async function saveBase(lat, lng, source) {
        try {
            const res = await fetch('/api/base', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: lat, lng: lng, source: source || 'dashboard' }),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            applyBase({ lat: lat, lng: lng, source: source || 'dashboard' });
            setBaseHint(`Posko tersimpan: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            return true;
        } catch (e) {
            setBaseHint(`Gagal menyimpan: ${e.message}. Pastikan server.py aktif.`, true);
            return false;
        }
    }

    async function clearBase() {
        try {
            const res = await fetch('/api/base', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clear: true }),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
        } catch (_) {  }
        applyBase({});
        setBaseHint('Posko direset.');
    }

    function setBaseHint(text, isError) {
        if (!DOM.baseHint) return;
        DOM.baseHint.textContent = text;
        DOM.baseHint.classList.toggle('error', !!isError);
    }

    function renderBasePanel() {
        if (!DOM.baseStatus) return;
        if (basePoint) {
            DOM.baseStatus.className = 'base-status is-set';
            DOM.baseStatus.innerHTML =
                `<span class="material-icons-round">home_pin</span>` +
                `<span><b>${basePoint.lat.toFixed(5)}, ${basePoint.lng.toFixed(5)}</b><br>` +
                `<span class="base-src">${currentLang === 'id' ? 'sumber' : 'source'}: ${baseSourceLabel(basePoint.source)}</span></span>`;
        } else {
            DOM.baseStatus.className = 'base-status';
            DOM.baseStatus.innerHTML =
                `<span class="material-icons-round">location_off</span><span>${t('not_set')}</span>`;
        }
    }

    function toggleBasePanel(forceOpen) {
        if (!DOM.basePanel) return;
        const open = (typeof forceOpen === 'boolean') ? forceOpen : DOM.basePanel.style.display === 'none';
        DOM.basePanel.style.display = open ? '' : 'none';
        const btn = document.getElementById('tcBaseBtn');
        if (btn) btn.classList.toggle('active', open);
        if (open) {
            renderBasePanel();
            setBaseHint('Posko jadi titik acuan jarak & tim terdekat. HP juga bisa mengirim koordinat GPS lewat WiFi lokal.');
        } else {
            setBaseSetMode(false);
        }
    }

    function setBaseSetMode(on) {
        baseSetMode = on;
        if (DOM.basePinBtn) DOM.basePinBtn.classList.toggle('active', on);
        if (map) map.getContainer().style.cursor = on ? 'crosshair' : '';
        if (on) {
            DOM.mapOverlayInfo.style.display = '';
            DOM.mapOverlayText.innerHTML = 'SET POSKO — klik titik command post di peta';
        } else {
            updateMapOverlay();
        }
    }

    function baseSourceLabel(src) {
        switch (src) {
            case 'mobile':    return 'HP GPS (app)';
            case 'browser':   return 'HP GPS (browser)';
            case 'manual':    return 'input manual';
            case 'dashboard': return 'klik peta';
            default:          return src || 'manual';
        }
    }

    function useDeviceLocation() {
        if (!navigator.geolocation) {
            setBaseHint('Browser ini tidak mendukung GPS.', true);
            return;
        }
        if (!window.isSecureContext) {
            setBaseHint('Browser memblokir GPS di HTTP. Buka dashboard lewat https:// (jalankan server.py --https) agar tombol ini aktif.', true);
            return;
        }
        setBaseHint('Membaca GPS HP…');
        if (DOM.baseGpsBtn) DOM.baseGpsBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            function (pos) {
                if (DOM.baseGpsBtn) DOM.baseGpsBtn.disabled = false;
                const acc = pos.coords.accuracy ? ` (±${Math.round(pos.coords.accuracy)} m)` : '';
                saveBase(pos.coords.latitude, pos.coords.longitude, 'browser');
                setBaseHint('Posko di-set dari GPS HP' + acc + '.');
            },
            function (err) {
                if (DOM.baseGpsBtn) DOM.baseGpsBtn.disabled = false;
                let msg = 'Gagal baca GPS: ' + err.message;
                if (err.code === 1) msg = 'Izin lokasi ditolak / diblokir. Izinkan lokasi di browser & pastikan buka lewat https://.';
                else if (err.code === 2) msg = 'Posisi tidak tersedia. Pastikan GPS HP menyala.';
                else if (err.code === 3) msg = 'GPS timeout. Coba lagi di area terbuka.';
                setBaseHint(msg, true);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    }

    function setupBaseControls() {
        DOM.baseCloseBtn.addEventListener('click', () => toggleBasePanel(false));
        DOM.baseGpsBtn.addEventListener('click', useDeviceLocation);
        DOM.basePinBtn.addEventListener('click', () => setBaseSetMode(!baseSetMode));
        DOM.baseResetBtn.addEventListener('click', clearBase);
        DOM.baseSaveBtn.addEventListener('click', function () {
            const lat = parseFloat(DOM.baseLatInput.value);
            const lng = parseFloat(DOM.baseLngInput.value);
            if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                setBaseHint('Latitude/Longitude tidak valid.', true);
                return;
            }
            saveBase(lat, lng, 'manual');
            DOM.baseLatInput.value = '';
            DOM.baseLngInput.value = '';
        });
    }

    let selectedDistanceKey = null;
    let distanceHighlightLayer = null;
    let compassPairIds = null;

    function distancePairKey(id1, id2) {
        return [id1, id2].sort().join('|');
    }

    function shortDeviceName(id) {
        const roleDef = getDeviceRole(id);
        return roleDef.short || id;
    }

    function getPositionedNodes() {
        const list = [];
        if (basePoint) {
            list.push({ id: 'BASE', latitude: basePoint.lat, longitude: basePoint.lng, color: '#153B7A' });
        }
        Object.keys(devices).forEach(function (id) {
            const dev = devices[id];
            if (!dev.data) return;
            if (typeof dev.data.latitude !== 'number' || typeof dev.data.longitude !== 'number') return;
            if (!isDeviceOnline(dev)) return;
            list.push({
                id: id,
                latitude: dev.data.latitude,
                longitude: dev.data.longitude,
                color: dev.color,
            });
        });
        return list;
    }

    function clearDistanceHighlight() {
        if (distanceHighlightLayer) {
            map.removeLayer(distanceHighlightLayer);
            distanceHighlightLayer = null;
        }
        selectedDistanceKey = null;
        compassPairIds = null;
        updateCompass();
    }

    function highlightDistancePair(id1, id2) {
        const key = distancePairKey(id1, id2);
        if (selectedDistanceKey === key) {
            clearDistanceHighlight();
            updateDistancePanel();
            return;
        }
        clearDistanceHighlight();

        const a = pointOf(id1);
        const b = pointOf(id2);
        if (!a || !b) return;

        const latlngs = [[a.lat, a.lng], [b.lat, b.lng]];
        const dist = calculateHaversine(a.lat, a.lng, b.lat, b.lng);

        const line = L.polyline(latlngs, {
            color: '#F36C21', weight: 3, opacity: 0.85, dashArray: '8 6',
        });
        const mid = [(latlngs[0][0] + latlngs[1][0]) / 2, (latlngs[0][1] + latlngs[1][1]) / 2];
        const labelHtml = `<div class="distance-label-name">${shortDeviceName(id1)} ⇄ ${shortDeviceName(id2)}</div><div class="distance-label-value">${formatDistance(dist)}</div>`;
        const label = L.marker(mid, {
            icon: L.divIcon({ className: 'distance-label-icon', html: labelHtml, iconSize: null }),
            interactive: false,
        });

        distanceHighlightLayer = L.layerGroup([line, label]).addTo(map);
        map.fitBounds(L.latLngBounds(latlngs), { padding: [80, 80], maxZoom: 18 });

        selectedDistanceKey = key;
        compassPairIds = [id1, id2];
        updateCompass();
        updateDistancePanel();
    }

    function updateDistancePanel() {
        if (!DOM.distanceList) return;

        const nodes = getPositionedNodes();

        if (nodes.length < 2) {
            DOM.distanceList.innerHTML =
                '<div class="distance-empty">' +
                '<span class="material-icons-round">social_distance</span>' +
                '<span>' + t('need_2_nodes') + '</span></div>';
            if (DOM.distanceCount) DOM.distanceCount.textContent = '';
            if (distanceHighlightLayer) clearDistanceHighlight();
            return;
        }

        const pairs = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                pairs.push({
                    a: a, b: b,
                    key: distancePairKey(a.id, b.id),
                    dist: calculateHaversine(a.latitude, a.longitude, b.latitude, b.longitude),
                });
            }
        }
        pairs.sort(function (p, q) { return p.dist - q.dist; });

        if (DOM.distanceCount) DOM.distanceCount.textContent = pairs.length + ' ' + t('pairs');

        const nearestKey = pairs[0].key;
        let html = '';
        pairs.forEach(function (p) {
            const cls = 'distance-row'
                + (p.key === nearestKey ? ' nearest' : '')
                + (p.key === selectedDistanceKey ? ' selected' : '');
            html +=
                `<div class="${cls}" data-a="${p.a.id}" data-b="${p.b.id}">
                    <div class="distance-pair">
                        <div class="distance-pair-nodes">
                            <span class="dpn" style="color:${p.a.color}">${shortDeviceName(p.a.id)}</span>
                            <span class="material-icons-round">sync_alt</span>
                            <span class="dpn" style="color:${p.b.color}">${shortDeviceName(p.b.id)}</span>
                        </div>
                        ${p.key === nearestKey ? `<span class="distance-pair-meta">${t('nearest')}</span>` : ''}
                    </div>
                    <span class="distance-value">${formatDistance(p.dist)}</span>
                </div>`;
        });

        DOM.distanceList.innerHTML = html;
    }

    if (DOM.distanceList) {
        DOM.distanceList.addEventListener('click', function (e) {
            const row = e.target.closest('.distance-row');
            if (!row) return;
            highlightDistancePair(row.dataset.a, row.dataset.b);
        });
    }

    function toggleMatrixPanel(forceOpen) {
        if (!DOM.matrixPanel) return;
        const open = (typeof forceOpen === 'boolean')
            ? forceOpen
            : DOM.matrixPanel.style.display === 'none';
        DOM.matrixPanel.style.display = open ? '' : 'none';
        const btn = document.getElementById('tcMatrixBtn');
        if (btn) btn.classList.toggle('active', open);
        if (open) updateDistancePanel();
        else clearDistanceHighlight();
    }

    async function fetchGPSData() {
        try {
            const response = await fetch(CONFIG.GPS_URL + '?t=' + Date.now());

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            let data = await response.json();

            if (!Array.isArray(data)) {
                data = [data];
            }

            processGPSData(data);
            runDemoSimulation();

            fetchErrorCount = 0;
            setConnectionStatus(true);

        } catch (err) {
            fetchErrorCount++;
            console.warn('[PointRescue] Fetch error:', err.message);

            if (fetchErrorCount >= 3) {
                setConnectionStatus(false);
            }

            runDemoSimulation();

            refreshUI();
        }
    }

    function runDemoSimulation() {
        if (!CONFIG.DEMO_MODE) return;

        if (Object.keys(devices).some(id => !DEVICE_ROLES[id])) return;

        const now = Date.now();
        const dummyPayloads = [];

        const realAlpha = devices['004'];
        if (!realAlpha || (now - realAlpha.lastRealUpdate > CONFIG.OFFLINE_TIMEOUT)) {
            const sim = simulator['004'];

            sim.battery = Math.max(0, sim.battery - 0.005);

            dummyPayloads.push({
                device_id: '004',
                latitude: sim.lat,
                longitude: sim.lon,
                altitude: +(450 + Math.random() * 2).toFixed(1),
                speed: 0,
                satellites: Math.floor(9 + Math.random() * 4),
                isDemo: true,
                battery: sim.battery.toFixed(1),
                mission: sim.mission
            });
        }

        const realBravo = devices['005'];
        if (!realBravo || (now - realBravo.lastRealUpdate > CONFIG.OFFLINE_TIMEOUT)) {
            const sim = simulator['005'];

            sim.battery = Math.max(0, sim.battery - 0.005);

            dummyPayloads.push({
                device_id: '005',
                latitude: sim.lat,
                longitude: sim.lon,
                altitude: +(440 + Math.random() * 2).toFixed(1),
                speed: 0,
                satellites: Math.floor(9 + Math.random() * 4),
                isDemo: true,
                battery: sim.battery.toFixed(1),
                mission: sim.mission
            });
        }

        if (dummyPayloads.length > 0) {
            processGPSData(dummyPayloads);
        }
    }

    const TRAIL_URL = 'trail.json';

    let trailVisible = true;
    const trailLayers = {};

    const TRAIL_MAX_ARROWS = 6;

    const TRAIL_ROLE_COLORS = {
        command: '#153B7A',
        victim:  '#EF4444',
        sar:     '#F36C21',
        unknown: '#94A3B8'
    };

    function trailColorFor(deviceId) {
        const roleDef = getDeviceRole(deviceId);
        return TRAIL_ROLE_COLORS[roleDef.role] || TRAIL_ROLE_COLORS.unknown;
    }

    function bearingDeg(a, b) {
        const toRad = d => d * Math.PI / 180;
        const p1 = toRad(a[0]);
        const p2 = toRad(b[0]);
        const dl = toRad(b[1] - a[1]);
        const y = Math.sin(dl) * Math.cos(p2);
        const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    function buildTrailArrows(latlngs, color) {
        const arrows = [];
        const segments = latlngs.length - 1;
        if (segments < 1) return arrows;

        const stride = Math.max(1, Math.ceil(segments / TRAIL_MAX_ARROWS));

        for (let i = 0; i < segments; i++) {
            const isLast = (i === segments - 1);
            if (!isLast && i % stride !== 0) continue;

            const a = latlngs[i];
            const b = latlngs[i + 1];
            const angle = bearingDeg(a, b);
            const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            const size = isLast ? 18 : 13;

            const icon = L.divIcon({
                className: 'trail-arrow',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
                html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"
                            style="transform: rotate(${angle}deg); opacity: ${isLast ? 1 : 0.65};">
                         <path d="M12 2 L19 20 L12 16 L5 20 Z" fill="${color}"
                               stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
                       </svg>`,
            });

            arrows.push(L.marker(mid, { icon, interactive: false, keyboard: false }));
        }
        return arrows;
    }

    function renderTrails(trails) {
        Object.keys(trailLayers).forEach(id => {
            if (!trails[id]) {
                map.removeLayer(trailLayers[id]);
                delete trailLayers[id];
            }
        });

        Object.entries(trails).forEach(([id, points]) => {
            if (!Array.isArray(points) || points.length < 2 || hiddenTrails.has(id)) {
                if (trailLayers[id]) {
                    map.removeLayer(trailLayers[id]);
                    delete trailLayers[id];
                }
                return;
            }

            const latlngs = points.map(p => [p.lat, p.lng]);
            const color = trailColorFor(id);

            let opacity = 0.75;
            if (selectedDeviceId) opacity = (selectedDeviceId === id) ? 0.95 : 0.22;

            if (trailLayers[id]) map.removeLayer(trailLayers[id]);

            const line = L.polyline(latlngs, {
                color,
                weight: selectedDeviceId === id ? 4 : 3,
                opacity,
                dashArray: '6, 6',
            });
            line.bindTooltip(`Trail — ${getDeviceRole(id).name} · ${points.length} points`, { sticky: true });

            const arrows = (selectedDeviceId && selectedDeviceId !== id) ? [] : buildTrailArrows(latlngs, color);
            const group = L.layerGroup([line, ...arrows]);
            trailLayers[id] = group;

            if (trailVisible) group.addTo(map);
        });
    }

    function applyTrailEmphasis() {
        renderTrails(trailDataCache);
    }

    let trailClearedUntil = 0;

    async function fetchTrails() {
        try {
            const res = await fetch(TRAIL_URL + '?t=' + Date.now());
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const trails = await res.json();
            if (Date.now() < trailClearedUntil) return;
            trailDataCache = (trails && typeof trails === 'object') ? trails : {};
            renderTrails(trailDataCache);
        } catch (_) {
        }
    }

    function toggleTrails() {
        trailVisible = !trailVisible;
        const btn = document.getElementById('tcTrailBtn');
        if (btn) btn.classList.toggle('active', trailVisible);

        Object.values(trailLayers).forEach(layer => {
            if (trailVisible) layer.addTo(map);
            else map.removeLayer(layer);
        });
    }

    async function clearTrails() {
        if (!confirm('Hapus semua jejak pergerakan?\n\nPakai ini saat misi pencarian sudah selesai. Jejak yang dihapus tidak bisa dikembalikan.')) {
            return;
        }

        try {
            const res = await fetch('/api/trail/clear', { method: 'POST' });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            Object.values(trailLayers).forEach(layer => map.removeLayer(layer));
            Object.keys(trailLayers).forEach(id => delete trailLayers[id]);
            trailDataCache = {};
            trailClearedUntil = Date.now() + 4000;
            if (replay.active) closeReplay();
            logEvent('trail-clear', null, t('ev_trails_cleared'));
            refreshUI();
        } catch (e) {
            alert(`Gagal menghapus jejak: ${e.message}\nPastikan server.py & serial_listener.py aktif.`);
        }
    }

    const replay = {
        active: false, id: null, pts: [], t: 0, t0: 0, t1: 0,
        speed: 1, timer: null, ghost: null, playing: false,
    };
    const REPLAY_SPEEDS = [1, 4, 16];

    function openReplay(id) {
        const pts = trailDataCache[id];
        if (!Array.isArray(pts) || pts.length < 2 || !pts[0].ts) return;
        if (replay.active) closeReplay();

        replay.active = true;
        replay.id = id;
        replay.pts = pts;
        replay.t0 = pts[0].ts;
        replay.t1 = pts[pts.length - 1].ts;
        replay.t = replay.t0;
        replay.speed = 1;
        DOM.replaySpeedBtn.textContent = '1×';
        DOM.replayNode.textContent = 'REPLAY — ' + getDeviceRole(id).name;

        const color = trailColorFor(id);
        replay.ghost = L.marker([pts[0].lat, pts[0].lng], {
            icon: L.divIcon({
                className: 'replay-ghost',
                html: `<div class="ghost-ring" style="border-color:${color}"></div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
            }),
            interactive: false,
            zIndexOffset: 500,
        }).addTo(map);

        DOM.replayBar.style.display = 'flex';
        map.fitBounds(L.latLngBounds(pts.map(p => [p.lat, p.lng])), { padding: [70, 70], maxZoom: 17 });
        replayFrame();
        replayPlay();
    }

    function replayFrame() {
        const r = replay;
        if (!r.active) return;
        let pos = [r.pts[r.pts.length - 1].lat, r.pts[r.pts.length - 1].lng];
        for (let i = 1; i < r.pts.length; i++) {
            if (r.pts[i].ts >= r.t) {
                const a = r.pts[i - 1], b = r.pts[i];
                const span = Math.max(0.001, b.ts - a.ts);
                const f = Math.min(1, Math.max(0, (r.t - a.ts) / span));
                pos = [a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f];
                break;
            }
        }
        r.ghost.setLatLng(pos);
        DOM.replaySlider.value = Math.round((r.t - r.t0) / Math.max(1, r.t1 - r.t0) * 1000);
        DOM.replayTime.textContent = new Date(r.t * 1000).toLocaleTimeString('id-ID',
            { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function replayPlay() {
        const r = replay;
        if (!r.active || r.playing) return;
        if (r.t >= r.t1) r.t = r.t0;
        r.playing = true;
        DOM.replayPlayBtn.querySelector('.material-icons-round').textContent = 'pause';
        r.timer = setInterval(function () {
            r.t += 0.1 * r.speed;
            if (r.t >= r.t1) { r.t = r.t1; replayPause(); }
            replayFrame();
        }, 100);
    }

    function replayPause() {
        const r = replay;
        r.playing = false;
        if (r.timer) { clearInterval(r.timer); r.timer = null; }
        if (DOM.replayPlayBtn) {
            DOM.replayPlayBtn.querySelector('.material-icons-round').textContent = 'play_arrow';
        }
    }

    function closeReplay() {
        replayPause();
        if (replay.ghost) { map.removeLayer(replay.ghost); replay.ghost = null; }
        replay.active = false;
        replay.id = null;
        DOM.replayBar.style.display = 'none';
    }

    function setupReplayControls() {
        DOM.replayPlayBtn.addEventListener('click', function () {
            if (replay.playing) replayPause(); else replayPlay();
        });
        DOM.replayCloseBtn.addEventListener('click', closeReplay);
        DOM.replaySpeedBtn.addEventListener('click', function () {
            const i = REPLAY_SPEEDS.indexOf(replay.speed);
            replay.speed = REPLAY_SPEEDS[(i + 1) % REPLAY_SPEEDS.length];
            DOM.replaySpeedBtn.textContent = replay.speed + '×';
        });
        DOM.replaySlider.addEventListener('input', function () {
            if (!replay.active) return;
            replayPause();
            replay.t = replay.t0 + (Number(DOM.replaySlider.value) / 1000) * (replay.t1 - replay.t0);
            replayFrame();
        });
    }

    const CHAT_URL = 'chat.json';

    let pendingChats = [];
    let lastChatCount = 0;
    let chatMessages = [];

    function setChatHint(text, isError = false) {
        const hint = document.getElementById('chatHint');
        if (!hint) return;
        hint.textContent = text;
        hint.classList.toggle('error', isError);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function chatRoleOf(m) {
        if (m.is_mine) return 'command';
        const s = String(m.device_id || m.role || '').toUpperCase();
        if (s.includes('SAR')) return 'sar';
        if (s.includes('KORBAN') || s.includes('VIC')) return 'victim';
        if (s.includes('GATEWAY') || s.includes('BASE') || s.includes('POSKO')) return 'command';
        const rd = DEVICE_ROLES[m.device_id];
        return rd ? rd.role : 'unknown';
    }

    function renderMention(escaped) {
        return escaped.replace(/@([A-Za-z0-9_\-]+)/g, '<span class="mention">@$1</span>');
    }

    let _commsKey = '';
    function renderComms(force) {
        const list = DOM.commsList;
        if (!list) return;

        let msgs = chatMessages;
        if (chatFilterId) {
            msgs = msgs.filter(m => m.device_id === chatFilterId || m.is_mine);
        }

        const sysTypes = { 'offline': '', 'online': '' };
        const sys = eventLog
            .filter(ev => ev.type in sysTypes)
            .slice(0, 8)
            .map(ev => ({ _sys: true, ts: ev.ts / 1000, text: ev.text.replace(/<[^>]+>/g, ''), cls: sysTypes[ev.type] }));

        const feed = [...msgs, ...sys].sort((a, b) => (a.ts || 0) - (b.ts || 0));

        if (DOM.commsFilter) {
            if (chatFilterId) {
                DOM.commsFilter.style.display = 'inline-flex';
                DOM.commsFilter.innerHTML = `${getDeviceRole(chatFilterId).short || chatFilterId} <span class="material-icons-round" style="font-size:11px;">close</span>`;
            } else {
                DOM.commsFilter.style.display = 'none';
            }
        }

        const total = msgs.length + pendingChats.length;
        if (DOM.chatCount) DOM.chatCount.textContent = total ? `${total}` : '';

        const key = `${chatFilterId}|${msgs.length}|${pendingChats.length}|${sys.length}|${msgs.length ? msgs[msgs.length - 1].ts : 0}`;
        if (!force && key === _commsKey) return;
        _commsKey = key;

        if (feed.length === 0 && pendingChats.length === 0) {
            list.innerHTML = `
                <div class="chat-empty">
                    <span class="material-icons-round">chat_bubble_outline</span>
                    <span>${chatFilterId ? t('no_msg_node') : t('no_messages')}</span>
                </div>`;
            return;
        }

        let html = '';
        let group = null;
        const flush = () => { if (group) { html += group.html + '</div>'; group = null; } };

        feed.forEach(function (item) {
            if (item._sys) {
                flush();
                html += `<div class="cm-sys ${item.cls}">${escapeHtml(item.text)}</div>`;
                return;
            }
            const who = item.is_mine ? 'POSKO' : (item.device_id || item.role || '?');
            const role = chatRoleOf(item);
            const mine = !!item.is_mine;
            const time = new Date((item.ts || 0) * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const devAttr = (!mine && devices[item.device_id]) ? `data-dev="${item.device_id}"` : '';
            const body = `<div class="cm-bubble" ${devAttr}>${renderMention(escapeHtml(item.msg || ''))}</div>`;

            if (group && group.who === who && (item.ts - group.lastTs) <= 180) {
                group.html += body;
                group.lastTs = item.ts;
            } else {
                flush();
                const avatar = `<span class="cm-avatar" style="color:${getDeviceRole(item.device_id).color || 'var(--text-muted)'}">${getRoleSvg(role === 'unknown' ? 'total' : role, 'currentColor', 10)}</span>`;
                group = {
                    who: who,
                    lastTs: item.ts,
                    html: `<div class="cm-group ${mine ? 'mine' : ''}">
                        <div class="cm-head" ${devAttr}>
                            ${avatar}
                            <span class="cm-who rc-${role}">${escapeHtml(who)}</span>
                            <span class="cm-time">${time}</span>
                        </div>${body}`,
                };
            }
        });
        flush();

        pendingChats.forEach(function (msg) {
            html += `<div class="cm-group mine">
                <div class="cm-head"><span class="cm-who rc-command">POSKO</span><span class="cm-time">${t('sending')}</span></div>
                <div class="cm-bubble">${renderMention(escapeHtml(msg))}</div>
                <span class="cm-pending">${t('queued_mesh')}</span>
            </div>`;
        });

        list.innerHTML = html;
        list.scrollTop = list.scrollHeight;
    }

    let _chatInit = false;
    let _lastChatTs = 0;

    async function fetchChat() {
        try {
            const res = await fetch(CHAT_URL + '?t=' + Date.now());
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const messages = await res.json();

            if (pendingChats.length) {
                const sent = new Set(messages.filter(m => m.is_mine).map(m => m.msg));
                pendingChats = pendingChats.filter(msg => !sent.has(msg));
            }

            chatMessages = Array.isArray(messages) ? messages : [];

            const maxTs = chatMessages.reduce((m, x) => Math.max(m, x.ts || 0), 0);
            if (_chatInit) {
                chatMessages.forEach(function (m) {
                    if (!m.is_mine && (m.ts || 0) > _lastChatTs) {
                        const who = m.device_id || m.role || '?';
                        const snippet = String(m.msg || '').slice(0, 42);
                        logEvent('chat', devices[m.device_id] ? m.device_id : null,
                            `<b>${escapeHtml(who)}</b>: ${escapeHtml(snippet)}`);
                    }
                });
            }
            _lastChatTs = Math.max(_lastChatTs, maxTs);
            _chatInit = true;

            renderComms(false);
        } catch (_) {
        }
    }

    async function sendChat(event) {
        event.preventDefault();
        const input = document.getElementById('chatInput');
        const btn = document.getElementById('chatSend');
        if (!input || !btn) return;

        const msg = input.value.trim();
        if (!msg) return;

        btn.disabled = true;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ msg }),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            input.value = '';
            pendingChats.push(msg);
            renderComms(true);
            await fetchChat();
            setChatHint('Queued to LoRa mesh — delivery can take a few seconds.');
        } catch (e) {
            setChatHint(`Send failed: ${e.message}. Make sure server.py & serial_listener.py are running.`, true);
        } finally {
            btn.disabled = false;
        }
    }

    function setupChat() {
        const form = document.getElementById('chatForm');
        if (form) form.addEventListener('submit', sendChat);

        DOM.commsList.addEventListener('click', function (e) {
            const el = e.target.closest('[data-dev]');
            if (el && devices[el.dataset.dev]) selectDevice(el.dataset.dev);
        });

        DOM.commsFilter.addEventListener('click', function () {
            chatFilterId = null;
            renderComms(true);
        });
    }

    function setConnectionStatus(isConnected) {
        connected = isConnected;
        renderTopBar();
    }

    function updateClock() {
        const now = new Date();
        DOM.clock.textContent = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        if (missionStart) DOM.missionElapsed.textContent = formatHMS(Date.now() - missionStart);
    }

    let overlay = null;

    function setupMobileSidebar() {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        DOM.sidebarToggle.addEventListener('click', function () {
            const isOpen = DOM.sidebar.classList.contains('open');
            if (isOpen) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });

        overlay.addEventListener('click', closeMobileSidebar);
    }

    function openMobileSidebar() {
        DOM.sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
    }

    function closeMobileSidebar() {
        DOM.sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    async function fetchServerInfo() {
        try {
            const res = await fetch('/api/serverinfo?t=' + Date.now());
            if (!res.ok) return;
            const info = await res.json();
            if (!info || !info.ip) return;
            const scheme = info.https ? 'https' : 'http';
            serverAddressUrl = `${scheme}://${info.ip}:${info.port}`;
            DOM.headerAddrText.textContent = `${info.ip}:${info.port}`;
            DOM.headerAddr.title = `Buka di HP: ${serverAddressUrl} — klik untuk salin`;
            DOM.headerAddr.style.display = 'flex';
        } catch (_) {  }
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try { document.execCommand('copy'); resolve(); }
            catch (e) { reject(e); }
            finally { document.body.removeChild(ta); }
        });
    }

    function copyServerAddress() {
        if (!serverAddressUrl) return;
        copyToClipboard(serverAddressUrl).then(function () {
            const prev = DOM.headerAddrText.textContent;
            DOM.headerAddrText.textContent = 'Tersalin!';
            setTimeout(function () { DOM.headerAddrText.textContent = prev; }, 1200);
        }).catch(function () {  });
    }

    function setupMissionControls() {
        DOM.rosterSearch.addEventListener('input', function () {
            rosterQuery = DOM.rosterSearch.value;
            renderRoster();
        });
        DOM.rosterChips.addEventListener('click', function (e) {
            const chip = e.target.closest('.roster-chip');
            if (!chip) return;
            rosterFilter = chip.dataset.filter;
            DOM.rosterChips.querySelectorAll('.roster-chip').forEach(c =>
                c.classList.toggle('active', c === chip));
            renderRoster();
        });

        DOM.mcStates.addEventListener('click', handleMcAction);

        DOM.headerTicker.addEventListener('click', function () {
            const id = DOM.headerTicker.dataset.deviceId;
            if (id && devices[id]) selectDevice(id);
        });

        DOM.headerAddr.addEventListener('click', copyServerAddress);

        const langBtn = document.getElementById('langToggleBtn');
        if (langBtn) langBtn.addEventListener('click', function () {
            setLang(currentLang === 'en' ? 'id' : 'en');
        });

        DOM.mapOverlayInfo.addEventListener('click', function () {
            if (followDeviceId) {
                followDeviceId = null;
                refreshUI();
            }
        });

        document.getElementById('matrixCloseBtn').addEventListener('click', function () {
            toggleMatrixPanel(false);
        });

        setupReplayControls();
        setupBaseControls();
    }

    function init() {
        initMap();
        applyStaticI18n();
        updateLangToggle();
        setupMobileSidebar();
        setupMissionControls();
        updateClock();

        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const themeIcon = themeToggleBtn.querySelector('.theme-icon');

        let currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeIcon.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';

        themeToggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            themeIcon.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
            setTimeout(() => { map.invalidateSize(); }, 260);
        });

        window.addEventListener('resize', () => { map.invalidateSize(); });

        setInterval(updateClock, 1000);

        fetchGPSData();
        setInterval(fetchGPSData, CONFIG.FETCH_INTERVAL);

        setupChat();
        fetchChat();
        setInterval(fetchChat, 2000);

        fetchTrails();
        setInterval(fetchTrails, 5000);

        fetchBase();
        setInterval(fetchBase, 5000);

        fetchServerInfo();

        new TacticalControl().addTo(map);
        new CompassControl().addTo(map);

        refreshUI();
        renderComms(true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    let measureMode = false;
    let measurements = [];
    let currentMeasurementNodes = [];
    let selectedMeasurementId = null;
    let measureIdCounter = 0;

    const DOM_MH = {
        panel: document.getElementById('measureHistoryPanel'),
        btnCollapse: document.getElementById('measureCollapseBtn'),
        list: document.getElementById('measureList'),
        summaryTotal: document.getElementById('measureSummaryTotal'),
        summaryLongest: document.getElementById('measureSummaryLongest'),
        summaryShortest: document.getElementById('measureSummaryShortest'),
        badge: document.getElementById('measureCountBadge')
    };

    DOM_MH.btnCollapse?.addEventListener('click', () => {
        DOM_MH.panel.classList.toggle('collapsed');
    });

    const TacticalControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div');
            container.style.display = 'flex';
            container.style.alignItems = 'flex-start';

            const mainCtrl = L.DomUtil.create('div', 'tactical-control-panel', container);

            const iconZoomIn = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            const iconZoomOut = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            const iconRuler = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3l-13.6 6.8c-.8.4-1.8.1-2.2-.7L2 14.6c-.4-.8-.1-1.8.7-2.2L16.3 5.6c.8-.4 1.8-.1 2.2.7l3.5 6.8c.4.8.1 1.8-.7 2.2z"></path><path d="M14.5 7.5L16 10.5"></path><path d="M11.5 9L13 12"></path><path d="M8.5 10.5L10 13.5"></path></svg>`;

            const iconTrail = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="5" r="2"></circle><path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6"></path></svg>`;
            const iconTrailClear = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

            const iconMatrix = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="5" r="2.2"></circle><circle cx="19" cy="7" r="2.2"></circle><circle cx="8" cy="19" r="2.2"></circle><line x1="6.8" y1="6.2" x2="17.2" y2="6.8"></line><line x1="5.8" y1="7.1" x2="7.5" y2="17"></line><line x1="17.5" y1="8.7" x2="9.7" y2="17.6"></line></svg>`;
            const iconBase = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 L12 3 l9 7.5"></path><path d="M5 9.5 V20 h14 V9.5"></path><path d="M10 20 v-5 h4 v5"></path></svg>`;

            mainCtrl.innerHTML = `
                <button class="tc-btn tc-zoom-in" title="Zoom In">${iconZoomIn}</button>
                <button class="tc-btn tc-zoom-out" title="Zoom Out">${iconZoomOut}</button>
                <button class="tc-btn tc-measure" id="tcMeasureBtn" title="Measure Distance">${iconRuler}</button>
                <button class="tc-btn tc-trail active" id="tcTrailBtn" title="Show/Hide Trails">${iconTrail}</button>
                <button class="tc-btn tc-trail-clear" id="tcTrailClearBtn" title="Clear Trails">${iconTrailClear}</button>
                <button class="tc-btn tc-matrix" id="tcMatrixBtn" title="Node Distance Matrix">${iconMatrix}</button>
                <button class="tc-btn tc-base" id="tcBaseBtn" title="Set Command Post">${iconBase}</button>
            `;

            const toolbar = L.DomUtil.create('div', 'tactical-toolbar-panel', container);
            toolbar.id = 'tacticalToolbarPanel';
            toolbar.innerHTML = `
                <button class="tc-btn-wide undo-btn" id="tcUndoBtn" title="Undo Last (Ctrl+Z)"><span class="material-icons-round">undo</span> Undo</button>
                <button class="tc-btn-wide delete-btn" id="tcDeleteBtn" title="Delete Selected (Del)"><span class="material-icons-round">delete</span> Delete</button>
                <button class="tc-btn-wide" id="tcClearBtn" title="Clear All (Ctrl+Shift+Del)"><span class="material-icons-round">clear_all</span> Clear All</button>
            `;

            L.DomEvent.disableClickPropagation(container);

            mainCtrl.querySelector('.tc-zoom-in').onclick = () => map.zoomIn();
            mainCtrl.querySelector('.tc-zoom-out').onclick = () => map.zoomOut();
            mainCtrl.querySelector('#tcMeasureBtn').onclick = toggleMeasureMode;
            mainCtrl.querySelector('#tcTrailBtn').onclick = toggleTrails;
            mainCtrl.querySelector('#tcTrailClearBtn').onclick = clearTrails;
            mainCtrl.querySelector('#tcMatrixBtn').onclick = toggleMatrixPanel;
            mainCtrl.querySelector('#tcBaseBtn').onclick = () => toggleBasePanel();

            toolbar.querySelector('#tcUndoBtn').onclick = undoLastMeasurement;
            toolbar.querySelector('#tcDeleteBtn').onclick = deleteSelectedMeasurement;
            toolbar.querySelector('#tcClearBtn').onclick = clearAllMeasurements;

            return container;
        }
    });

    const CompassControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-compass-tactical');
            container.innerHTML = `
                <svg width="88" height="88" viewBox="0 0 100 100" class="premium-compass-svg">
                    <circle cx="50" cy="50" r="48" fill="rgba(11, 18, 32, 0.75)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5"/>
                    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0, 0, 0, 0.5)" stroke-width="2"/>
                    <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" stroke-dasharray="1 6.505" />
                    <circle cx="50" cy="50" r="43" fill="none" stroke="#FF8A00" stroke-width="4" stroke-dasharray="2 65.54" stroke-dashoffset="1" />
                    <text x="50" y="24" text-anchor="middle" fill="#FF8A00" font-size="16" font-weight="800" font-family="Poppins">N</text>
                    <text x="50" y="86" text-anchor="middle" fill="#CBD5E1" font-size="13" font-weight="700" font-family="Poppins">S</text>
                    <text x="82" y="55" text-anchor="middle" fill="#CBD5E1" font-size="13" font-weight="700" font-family="Poppins">E</text>
                    <text x="18" y="55" text-anchor="middle" fill="#CBD5E1" font-size="13" font-weight="700" font-family="Poppins">W</text>
                    <circle cx="50" cy="50" r="24" fill="none" stroke="#FF8A00" stroke-width="1.5" opacity="0.6"/>
                    <!-- Jarum berputar: menunjuk dari posko ke target (id dipakai updateCompass) -->
                    <g id="compassNeedle">
                        <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.7))">
                            <polygon class="compass-needle-arrow" points="50,28 36,62 50,56" fill="var(--compass-arrow-left)" />
                            <polygon class="compass-needle-arrow" points="50,28 64,62 50,56" fill="var(--compass-arrow-right)" />
                        </g>
                        <polygon points="50,68 54,72 50,76 46,72" fill="#FF8A00" filter="drop-shadow(0 2px 4px rgba(255,138,0,0.5))"/>
                    </g>
                </svg>
                <div class="compass-readout" id="compassReadout" style="display:none;">
                    <span class="compass-bearing" id="compassBearing"></span>
                    <span class="compass-target" id="compassTarget"></span>
                </div>
            `;
            return container;
        }
    });

    function updateCompass() {
        const needle = document.getElementById('compassNeedle');
        if (!needle) return;
        const readout = document.getElementById('compassReadout');

        let originId = null, targetId = null, origin = null, tp = null;

        if (compassPairIds) {
            const a = pointOf(compassPairIds[0]);
            const b = pointOf(compassPairIds[1]);
            if (a && b) {
                originId = compassPairIds[0]; targetId = compassPairIds[1];
                origin = a; tp = b;
            } else {
                compassPairIds = null;
            }
        }

        if (!origin) {
            if (selectedDeviceId && pointOf(selectedDeviceId)) {
                targetId = selectedDeviceId;
            }

            if (!targetId) {
                needle.style.transform = 'rotate(0deg)';
                needle.style.opacity = '0';
                needle.classList.remove('locked');
                if (readout) readout.style.display = 'none';
                return;
            }

            originId = basePoint ? 'BASE' : null;
            origin = basePoint
                ? { lat: basePoint.lat, lng: basePoint.lng }
                : (map ? { lat: map.getCenter().lat, lng: map.getCenter().lng } : null);
            tp = pointOf(targetId);
        }

        if (!origin || !tp) {
            needle.style.opacity = '0';
            needle.classList.remove('locked');
            if (readout) readout.style.display = 'none';
            return;
        }

        const brg = bearingDeg([origin.lat, origin.lng], [tp.lat, tp.lng]);
        const dist = calculateHaversine(origin.lat, origin.lng, tp.lat, tp.lng);

        needle.style.transform = 'rotate(' + brg + 'deg)';
        needle.style.opacity = '1';
        needle.classList.add('locked');

        if (readout) {
            readout.style.display = 'flex';
            document.getElementById('compassBearing').textContent = Math.round(brg) + '° ' + cardinalOf(brg);
            const originLabel = originId ? (getDeviceRole(originId).short || originId) : 'CTR';
            document.getElementById('compassTarget').textContent =
                originLabel + ' → ' + (getDeviceRole(targetId).short || targetId) + ' · ' + formatDistance(dist);
        }
    }

    function calculateHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const f1 = lat1 * Math.PI/180;
        const f2 = lat2 * Math.PI/180;
        const df = (lat2-lat1) * Math.PI/180;
        const dl = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(df/2) * Math.sin(df/2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) * Math.sin(dl/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function formatDistance(meters) {
        if (meters < 1000) return `${meters.toFixed(1)} m`;
        return `${(meters / 1000).toFixed(2)} km`;
    }

    function toggleMeasureMode() {
        measureMode = !measureMode;
        const btn = document.getElementById('tcMeasureBtn');
        const toolbar = document.getElementById('tacticalToolbarPanel');

        if (measureMode) {
            btn.classList.add('active');
            toolbar.classList.add('active');
            DOM_MH.panel.style.display = 'flex';
            DOM.mapOverlayInfo.style.display = '';
            DOM.mapOverlayText.textContent = t('measure_start');
            Object.values(devices).forEach(d => d.marker.closePopup());
            map.getContainer().style.cursor = 'crosshair';
            updateMeasurementUI();
        } else {
            btn.classList.remove('active');
            toolbar.classList.remove('active');
            DOM_MH.panel.style.display = 'none';
            updateMapOverlay();
            map.getContainer().style.cursor = '';
            clearCurrentMeasurementNodes();
            selectMeasurement(null);
        }
    }

    window.addMeasurementNode = function(lat, lng, nameHint = null) {
        if (!measureMode) return;

        const node = { lat, lng, nameHint };
        currentMeasurementNodes.push(node);

        if (currentMeasurementNodes.length === 1) {
            const mkr = L.marker([lat, lng], {
                icon: L.divIcon({ className: 'measure-node-icon fade-in', iconSize: [12,12], iconAnchor: [6,6] }),
                interactive: false
            }).addTo(map);
            currentMeasurementNodes[0].tempMarker = mkr;
            DOM.mapOverlayText.textContent = t('measure_end');
        } else if (currentMeasurementNodes.length === 2) {
            completeMeasurement();
            DOM.mapOverlayText.textContent = t('measure_next');
        }
    };

    function completeMeasurement() {
        measureIdCounter++;
        const id = 'meas_' + measureIdCounter;
        const p1 = currentMeasurementNodes[0];
        const p2 = currentMeasurementNodes[1];

        let mName = `Measurement ${measureIdCounter}`;
        if (p1.nameHint && p2.nameHint && p1.nameHint !== p2.nameHint) {
            mName = `${p1.nameHint} → ${p2.nameHint}`;
        }

        const distMeters = calculateHaversine(p1.lat, p1.lng, p2.lat, p2.lng);
        const distString = formatDistance(distMeters);

        const line = L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
            color: '#f97316',
            weight: 4,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'animated-polyline fade-in measure-line-glow'
        }).addTo(map);

        const midLat = (p1.lat + p2.lat) / 2;
        const midLng = (p1.lng + p2.lng) / 2;

        const labelHtml = `<div class="distance-label-name">${mName}</div><div class="distance-label-value">${distString}</div>`;
        const labelMarker = L.marker([midLat, midLng], {
            icon: L.divIcon({ className: 'distance-label-icon fade-in', html: labelHtml, iconSize: null }),
            interactive: true
        }).addTo(map);

        const endMarker = L.marker([p2.lat, p2.lng], {
            icon: L.divIcon({ className: 'measure-node-icon fade-in flash-animation', iconSize: [12,12], iconAnchor: [6,6] }),
            interactive: false
        }).addTo(map);

        const startMarker = p1.tempMarker;
        const startEl = startMarker && startMarker.getElement();
        if (startEl) startEl.classList.add('flash-animation');

        const measurementObj = { id, name: mName, points: [p1, p2], line, startMarker, endMarker, labelMarker, distMeters, distString };
        measurements.push(measurementObj);

        line.on('click', () => selectMeasurement(id));
        labelMarker.on('click', () => selectMeasurement(id));

        clearCurrentMeasurementNodes();
        selectMeasurement(id);
    }

    function clearCurrentMeasurementNodes() {
        if (currentMeasurementNodes.length === 1 && currentMeasurementNodes[0].tempMarker) {
            map.removeLayer(currentMeasurementNodes[0].tempMarker);
        }
        currentMeasurementNodes = [];
    }

    function resetMeasure() {
        if (!measureMode) return;
        clearCurrentMeasurementNodes();
        selectMeasurement(null);
        if (DOM.mapOverlayText) DOM.mapOverlayText.textContent = t('measure_start');
    }

    function selectMeasurement(id) {
        selectedMeasurementId = id;
        measurements.forEach(m => {
            const isSelected = m.id === id;
            if (m.line.getElement()) {
                if (isSelected) {
                    m.line.getElement().classList.add('measure-line-selected');
                    m.line.getElement().classList.add('flash-animation');
                    m.line.setStyle({ weight: 6, color: '#ff9d00' });
                } else {
                    m.line.getElement().classList.remove('measure-line-selected');
                    m.line.setStyle({ weight: 4, color: '#f97316' });
                }
                if(isSelected) {
                    m.line.getElement().style.animation = 'none';
                    m.line.getElement().offsetHeight;
                    m.line.getElement().style.animation = null;
                }
            }
            if (m.labelMarker.getElement()) {
                if (isSelected) m.labelMarker.getElement().classList.add('selected');
                else m.labelMarker.getElement().classList.remove('selected');
            }
            if (m.startMarker.getElement()) {
                if (isSelected) m.startMarker.getElement().classList.add('selected');
                else m.startMarker.getElement().classList.remove('selected');
            }
            if (m.endMarker.getElement()) {
                if (isSelected) m.endMarker.getElement().classList.add('selected');
                else m.endMarker.getElement().classList.remove('selected');
            }
        });
        updateMeasurementUI();
    }

    function removeMeasurement(id) {
        const index = measurements.findIndex(m => m.id === id);
        if (index > -1) {
            const m = measurements[index];
            map.removeLayer(m.line);
            map.removeLayer(m.startMarker);
            map.removeLayer(m.endMarker);
            map.removeLayer(m.labelMarker);
            measurements.splice(index, 1);
        }
        if (selectedMeasurementId === id) selectedMeasurementId = null;
        updateMeasurementUI();
    }

    function deleteSelectedMeasurement() {
        if (selectedMeasurementId) removeMeasurement(selectedMeasurementId);
    }

    function undoLastMeasurement() {
        if (measurements.length > 0) {
            const last = measurements[measurements.length - 1];
            removeMeasurement(last.id);
        }
    }

    function clearAllMeasurements() {
        [...measurements].forEach(m => removeMeasurement(m.id));
        measureIdCounter = 0;
    }

    function updateMeasurementUI() {
        if (!measureMode) return;

        DOM_MH.badge.textContent = measurements.length;

        if (measurements.length === 0) {
            DOM_MH.summaryTotal.textContent = '0';
            DOM_MH.summaryLongest.textContent = '—';
            DOM_MH.summaryShortest.textContent = '—';
            DOM_MH.list.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:11px;">${t('no_measurements')}</div>`;
            return;
        }

        DOM_MH.summaryTotal.textContent = measurements.length;

        let maxD = -1, minD = Infinity;
        measurements.forEach(m => {
            if (m.distMeters > maxD) maxD = m.distMeters;
            if (m.distMeters < minD) minD = m.distMeters;
        });

        DOM_MH.summaryLongest.textContent = formatDistance(maxD);
        DOM_MH.summaryShortest.textContent = formatDistance(minD);

        DOM_MH.list.innerHTML = '';
        measurements.forEach((m, idx) => {
            const item = document.createElement('div');
            item.className = 'measure-list-item' + (selectedMeasurementId === m.id ? ' selected' : '');

            item.innerHTML = `
                <div class="measure-item-info">
                    <div class="measure-item-index">${idx + 1}</div>
                    <input type="text" class="measure-item-name" value="${m.name}" title="Click to rename" spellcheck="false" />
                </div>
                <div class="measure-item-distance">${m.distString}</div>
                <button class="measure-item-delete" type="button" title="${t('delete_measurement')}" aria-label="${t('delete_measurement')}">
                    <span class="material-icons-round">close</span>
                </button>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    selectMeasurement(m.id);
                    map.fitBounds(m.line.getBounds(), { padding: [50, 50], maxZoom: 18 });
                }
            });

            const input = item.querySelector('.measure-item-name');
            input.addEventListener('change', (e) => {
                m.name = e.target.value.trim() || `Measurement ${idx + 1}`;
                e.target.value = m.name;
                const labelHtml = `<div class="distance-label-name">${m.name}</div><div class="distance-label-value">${m.distString}</div>`;
                m.labelMarker.setIcon(L.divIcon({ className: 'distance-label-icon' + (selectedMeasurementId===m.id?' selected':''), html: labelHtml, iconSize: null }));
            });
            input.addEventListener('click', (e) => e.stopPropagation());

            item.querySelector('.measure-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                removeMeasurement(m.id);
            });

            DOM_MH.list.appendChild(item);
        });
    }

    document.addEventListener('keydown', function(e) {
        if (!measureMode) return;

        const typingInInput = document.activeElement && document.activeElement.tagName === 'INPUT';

        if (e.key === 'Escape') {
            if (typingInInput) { document.activeElement.blur(); return; }
            toggleMeasureMode();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!typingInInput) {
                if (e.ctrlKey && e.shiftKey) {
                    clearAllMeasurements();
                } else {
                    deleteSelectedMeasurement();
                }
            }
        } else if (e.key.toLowerCase() === 'z' && e.ctrlKey) {
            if (typingInInput) return;
            undoLastMeasurement();
        }
    });

    setTimeout(() => {
        if (map) {
            map.on('click', function(e) {
                if (measureMode) {
                    addMeasurementNode(e.latlng.lat, e.latlng.lng, null);
                } else if (baseSetMode) {
                    saveBase(e.latlng.lat, e.latlng.lng, 'dashboard');
                    setBaseSetMode(false);
                } else if (selectedDeviceId) {
                    deselectDevice();
                }
            });
        }
    }, 500);

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || measureMode) return;
        if (baseSetMode) setBaseSetMode(false);
        else if (replay.active) closeReplay();
        else if (selectedDeviceId) deselectDevice();
    });

})();
