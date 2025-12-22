const APP_VERSION = "v32.4";

// === NOVA LÓGICA DE CORES (DEGRADÊ DINÂMICO) ===
const GRADIENT_KEYS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

function getDynamicColor(index, total) {
    if (total <= 1) return GRADIENT_KEYS[0];
    const position = (index / (total - 1)) * (GRADIENT_KEYS.length - 1);
    const idx1 = Math.floor(position);
    const idx2 = Math.min(GRADIENT_KEYS.length - 1, Math.ceil(position));
    const factor = position - idx1;
    const hex2rgb = (hex) => {
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        };
    };
    const c1 = hex2rgb(GRADIENT_KEYS[idx1]);
    const c2 = hex2rgb(GRADIENT_KEYS[idx2]);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r},${g},${b})`;
}

// === STATE MANAGER ===
const st = {
    cfg: { t: 60, r: 3, survTime: 30, survBonus: 5, solo: false, tts: false, ttsWord: false, ttsRate: 1.1 },
    t: [{ n: "Time A", s: 0 }, { n: "Time B", s: 0 }],
    rd: 1, trn: 0, cat: null, q: [], skp: [], h: [], pts: 0, on: false, logs: [],
    roundMode: 'normal', usedWords: {}, playedCats: [], cw: ""
};

// === AUDIO MANAGER (SFX) ===
const aud = {
    sfxEnabled: true, volume: 1.0,
    init: () => {
        const saved = localStorage.getItem('pnt_sfx');
        if (saved !== null) aud.sfxEnabled = (saved === 'true');
        const savedVol = localStorage.getItem('pnt_vol_sfx');
        if (savedVol !== null) aud.volume = parseFloat(savedVol);
        aud.syncUI();
    },
    p: (i) => {
        if (!aud.sfxEnabled) return;
        const a = document.getElementById('snd-' + i);
        if (a) {
            a.volume = aud.volume;
            a.currentTime = 0; a.play().catch(() => { });
        }
    },
    l: (i, o) => {
        if (!aud.sfxEnabled) { if (!o) { const a = document.getElementById('snd-' + i); if (a) a.pause(); } return; }
        const a = document.getElementById('snd-' + i);
        if (a) {
            a.volume = aud.volume;
            if (o) { a.currentTime = 0; a.loop = true; a.play().catch(() => { }); }
            else { a.pause(); a.loop = false; }
        }
    },
    toggle: () => {
        aud.sfxEnabled = !aud.sfxEnabled;
        localStorage.setItem('pnt_sfx', aud.sfxEnabled);
        aud.syncUI();
    },
    setVolume: (v) => {
        aud.volume = parseFloat(v);
        localStorage.setItem('pnt_vol_sfx', aud.volume);
    },
    syncUI: () => {
        const chk = document.getElementById('chk-sfx-opt');
        if (chk) chk.checked = aud.sfxEnabled;
        const rng = document.getElementById('rng-vol-sfx');
        if (rng) rng.value = aud.volume;
    }
};

// === BACKGROUND MUSIC MANAGER (WEB AUDIO API) ===
const musicMgr = {
    ctx: null, source: null, gainNode: null, buffer: null,
    enabled: false, volume: 0.3,
    init: () => {
        const saved = localStorage.getItem('pnt_bgm');
        musicMgr.enabled = (saved === 'true');
        const savedVol = localStorage.getItem('pnt_vol_bgm');
        if (savedVol !== null) musicMgr.volume = parseFloat(savedVol);

        // PRELOAD AUDIO IMMEDIATELY
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        musicMgr.ctx = new AudioContext();
        fetch('assets/musica.mp3')
            .then(r => r.arrayBuffer())
            .then(d => musicMgr.ctx.decodeAudioData(d))
            .then(b => {
                musicMgr.buffer = b;
                if (musicMgr.enabled && musicMgr.ctx.state === 'running') musicMgr.play();
            }).catch(e => console.log('Audio init err:', e));

        // UNLOCK AUDIO CONTEXT ON FIRST INTERACTION
        const unlock = () => {
            if (musicMgr.ctx && musicMgr.ctx.state !== 'running') {
                musicMgr.ctx.resume().then(() => {
                    if (musicMgr.enabled) musicMgr.play();
                });
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);

        musicMgr.syncUI();
    },
    play: () => {
        if (!musicMgr.ctx || !musicMgr.buffer || !musicMgr.enabled) return;
        // SE JÁ ESTIVER TOCANDO (source existe), NÃO REINICIA
        if (musicMgr.source) return;

        musicMgr.source = musicMgr.ctx.createBufferSource();
        musicMgr.source.buffer = musicMgr.buffer;
        musicMgr.source.loop = true;
        musicMgr.source.loopStart = 8;
        musicMgr.source.loopEnd = 32;

        musicMgr.gainNode = musicMgr.ctx.createGain();
        musicMgr.gainNode.gain.value = musicMgr.volume;

        musicMgr.source.connect(musicMgr.gainNode);
        musicMgr.gainNode.connect(musicMgr.ctx.destination);
        musicMgr.source.start(0, 8);
    },
    stop: () => {
        if (musicMgr.source) {
            try { musicMgr.source.stop(); } catch (e) { }
            musicMgr.source = null;
        }
    },
    toggle: () => {
        musicMgr.enabled = !musicMgr.enabled;
        localStorage.setItem('pnt_bgm', musicMgr.enabled);
        if (musicMgr.enabled) musicMgr.play(); else musicMgr.stop();
        musicMgr.syncUI();
    },
    setVolume: (v) => {
        musicMgr.volume = parseFloat(v);
        localStorage.setItem('pnt_vol_bgm', musicMgr.volume);
        if (musicMgr.gainNode) musicMgr.gainNode.gain.value = musicMgr.volume;
    },
    syncUI: () => {
        const chk = document.getElementById('chk-bgm-opt');
        if (chk) chk.checked = musicMgr.enabled;
        const rng = document.getElementById('rng-vol-bgm');
        if (rng) rng.value = musicMgr.volume;
    }
};

// === ACESSIBILIDADE (TTS) ===
const tts = {
    speak: (text, callback) => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'pt-BR';
        u.rate = st.cfg.ttsRate || 1.1;
        if (callback) u.onend = callback;
        window.speechSynthesis.speak(u);
    }
};

// === A11Y MANAGER ===
const a11y = {
    update: (activeScreenId) => {
        // Hide all screens from A11Y
        document.querySelectorAll('.screen').forEach(s => {
            if (s.id === 'screen-' + activeScreenId) {
                s.setAttribute('aria-hidden', 'false');
                s.style.visibility = 'visible';
            } else {
                s.setAttribute('aria-hidden', 'true');
                s.style.visibility = 'hidden';
            }
        });
    },
    trapModal: (isOpen) => {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.setAttribute('aria-hidden', isOpen ? 'true' : (s.classList.contains('active') ? 'false' : 'true'));
            if (isOpen) s.setAttribute('inert', '');
            else s.removeAttribute('inert');
        });
        const modal = document.getElementById('modal-overlay');
        modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
};

const THEMES = [
    { id: 'default', name: 'Original', bg: '#0a0319', grad: 'radial-gradient(circle at center, #2e1065 0%, #0a0319 100%)', p: '#6366f1', s: '#ec4899', a: '#fbbf24' },
    { id: 'dark-amber', name: 'Dark/Amber', bg: '#000000', grad: 'radial-gradient(circle at center, #333 0%, #000 100%)', p: '#e65100', s: '#f6a609', a: '#ffffff' },
    { id: 'blue-orange', name: 'Blue/Orange', bg: '#020617', grad: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', p: '#e65100', s: '#f6a609', a: '#fbbf24' },
    { id: 'cyber', name: 'Cyber Punk', bg: '#0a0319', grad: 'radial-gradient(circle at center, #2e1065 0%, #0a0319 100%)', p: '#e65100', s: '#f6a609', a: '#fbbf24' },
    { id: 'forest', name: 'Forest', bg: '#022c22', grad: 'radial-gradient(circle at center, #14532d, #022c22)', p: '#22c55e', s: '#84cc16', a: '#fef08a' },
    { id: 'dracula', name: 'Vampire', bg: '#000000', grad: 'radial-gradient(circle, #7f1d1d 0%, #000 100%)', p: '#d68f9a', s: '#ff7777', a: '#fca5a5' },
    { id: 'ocean', name: 'Ocean', bg: '#164e63', grad: 'radial-gradient(circle at center, #0e7490, #164e63)', p: '#06b6d4', s: '#22d3ee', a: '#cffafe' },
    { id: 'royal', name: 'Royal', bg: '#0a0319', grad: 'radial-gradient(circle at center, #581c87 0%, #0a0319 100%)', p: '#a855f7', s: '#f472b6', a: '#fde047' },
    { id: 'high-contrast', name: 'High Contrast', bg: '#000000', grad: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)', p: '#0055ff', s: '#ff0000', a: '#ffff00' }
];

let CURRENT_THEME = 'default';

// WAKE LOCK MANAGER
const wakeLockMgr = {
    sentinel: null,
    request: async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockMgr.sentinel = await navigator.wakeLock.request('screen');
            }
        } catch (err) { console.log('WakeLock err:', err); }
    },
    release: () => {
        if (wakeLockMgr.sentinel) {
            wakeLockMgr.sentinel.release();
            wakeLockMgr.sentinel = null;
        }
    }
};

const themeMgr = {
    init: () => {
        const container = document.getElementById('theme-selector');
        container.innerHTML = '';
        THEMES.forEach(t => {
            const div = document.createElement('div');
            div.className = 'theme-option';
            if (t.id === CURRENT_THEME) div.classList.add('active');
            div.style.background = t.grad !== 'none' ? t.grad : t.bg;
            div.onclick = () => themeMgr.set(t.id);
            container.appendChild(div);
        });
        themeMgr.apply(CURRENT_THEME);
    },
    set: (id) => {
        CURRENT_THEME = id;
        themeMgr.init();
        themeMgr.apply(id);
        storage.save();
    },
    apply: (id) => {
        const t = THEMES.find(x => x.id === id) || THEMES[0];
        const root = document.documentElement;
        root.style.setProperty('--bg-color', t.bg);
        root.style.setProperty('--bg-gradient', t.grad);
        root.style.setProperty('--primary', t.p);
        root.style.setProperty('--secondary', t.s);
        root.style.setProperty('--accent', t.a);
    }
};

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
const DEFAULT_CATS = [
    { n: "ANIMAIS", w: ["Gato", "Cachorro", "Elefante", "Girafa", "Leão", "Tubarão", "Panda", "Zebra", "Macaco"] },
    { n: "FILMES", w: ["Titanic", "Avatar", "Matrix", "Shrek", "Barbie", "Batman", "Frozen", "Vingadores", "Coringa"] },
    { n: "OBJETOS", w: ["Mesa", "Cadeira", "Celular", "Espelho", "Sofá", "Copo", "Relógio", "Sapato", "Computador"] },
    { n: "AÇÕES", w: ["Correr", "Dançar", "Nadar", "Dormir", "Comer", "Beijar", "Gritar", "Chorar", "Pular"] },
    { n: "FAMOSOS", w: ["Neymar", "Anitta", "Messi", "Beyoncé", "Xuxa", "Pelé", "Madonna", "Silvio Santos"] },
    { n: "LUGARES", w: ["Praia", "Escola", "Shopping", "Cinema", "Hospital", "Igreja", "Parque", "Banco"] }
];

// DATA STRUCTURE: [{ name: "Name", data: [cats] }]
let GLOBAL_SHEETS_DATA = [{ name: "Padrão", data: JSON.parse(JSON.stringify(DEFAULT_CATS)) }];
let CURRENT_SHEET_IDX = 0;
let SOURCE_TYPE = 'default';
let CURRENT_ROUND_CATS = [];
let DATA_DIRTY = false;



const ui = {
    modal: (title, html, actions) => {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-msg').innerHTML = html;
        const actionBox = document.getElementById('modal-actions');
        actionBox.innerHTML = '';
        actions.forEach(a => {
            const btn = document.createElement('button');
            btn.className = a.cls || 'btn btn-small';
            if (a.style) btn.style = a.style;
            btn.innerText = a.txt;
            btn.onclick = () => {
                if (a.close !== false) {
                    document.getElementById('modal-overlay').style.display = 'none';
                    a11y.trapModal(false);
                }
                if (a.fn) a.fn();
            };
            actionBox.appendChild(btn);
        });
        document.getElementById('modal-overlay').style.display = 'flex';
        a11y.trapModal(true);
    },
    alert: (msg) => { ui.modal("Atenção", msg, [{ txt: "OK" }]); },
    confirm: (msg, cb) => { ui.modal("Confirmação", msg, [{ txt: "Sim", fn: cb }, { txt: "Não", cls: 'btn btn-small btn-outline' }]); },
    showResult: (catName, catColor, cb) => {
        const html = `<div id="result-cat-display" style="color:${catColor}; font-size:2.5rem; font-weight:900; text-transform:uppercase; line-height:1.1; margin-bottom:20px">${catName}</div>`;

        if (st.cfg.ttsWord) {
            const waitForTTS = st.cfg.tts;
            const animState = waitForTTS ? 'paused' : 'running';

            const bar = `<div style="width:100%; height:8px; background:rgba(255,255,255,0.2); border-radius:4px; overflow:hidden; margin-top:15px;">
                <div id="auto-start-bar" style="width:0%; height:100%; background:var(--success); animation: fillBar 2s linear forwards; animation-play-state: ${animState};"></div>
            </div>`;
            ui.modal("CATEGORIA", html + bar, []);

            if (!waitForTTS) {
                setTimeout(() => {
                    document.getElementById('modal-overlay').style.display = 'none';
                    a11y.trapModal(false);
                    cb();
                }, 2000);
            }
        } else {
            ui.modal("CATEGORIA", html, [{ txt: "COMEÇAR", fn: cb }]);
        }
    }
};

function smartSplit(text) {
    const clean = text.replace(/\*+$/, '');
    if (clean.length <= 12) return { text: clean, lines: 1 };
    const words = clean.split(' ');
    if (words.length === 1) return { text: clean, lines: 1 };
    let best = 0, min = Infinity, cur = 0, tot = clean.length;
    for (let i = 0; i < words.length - 1; i++) { cur += words[i].length; const d = Math.abs(cur - (tot - cur)); if (d < min) { min = d; best = i; } }
    return { text: `${words.slice(0, best + 1).join(' ')}<br>${words.slice(best + 1).join(' ')}`, lines: 2, maxLen: Math.max(words.slice(0, best + 1).join(' ').length, words.slice(best + 1).join(' ').length) };
}

const storage = {
    save: () => {
        const data = {
            cats: GLOBAL_SHEETS_DATA, source: SOURCE_TYPE,
            t1: document.getElementById('t1').value, t2: document.getElementById('t2').value,
            time: document.getElementById('opt-time').value, rounds: document.getElementById('opt-rounds').value,
            mode: document.getElementById('opt-mode').value,
            threshold: document.getElementById('opt-threshold').value,
            theme: CURRENT_THEME,
            survTime: document.getElementById('opt-surv-time').value,
            survBonus: document.getElementById('opt-surv-bonus').value,
            solo: document.getElementById('opt-players').value,
            solo: document.getElementById('opt-players').value,
            tts: st.cfg.tts, ttsWord: st.cfg.ttsWord, ttsRate: st.cfg.ttsRate
        };
        localStorage.setItem('pnt_data_v22', JSON.stringify(data));
    },
    load: () => {
        try {
            const data = JSON.parse(localStorage.getItem('pnt_data_v22'));
            if (data) {
                if (data.cats && Array.isArray(data.cats)) {
                    if (data.cats.length > 0) {
                        // MIGRATION CHECK: If old format (array of arrays), convert to objects
                        if (Array.isArray(data.cats[0])) {
                            GLOBAL_SHEETS_DATA = data.cats.map((d, i) => ({ name: `Aba ${i + 1}`, data: d }));
                        } else if (data.cats[0].data) {
                            // New format
                            GLOBAL_SHEETS_DATA = data.cats;
                        } else {
                            // Fallback for single sheet old format wrapped oddly
                            GLOBAL_SHEETS_DATA = [{ name: "Padrão", data: data.cats }];
                        }
                    }
                }

                if (data.source) SOURCE_TYPE = data.source;
                if (data.t1) document.getElementById('t1').value = data.t1;
                if (data.t2) document.getElementById('t2').value = data.t2;
                if (data.time) document.getElementById('opt-time').value = data.time;
                if (data.rounds) document.getElementById('opt-rounds').value = data.rounds;
                if (data.mode) document.getElementById('opt-mode').value = data.mode;
                if (data.threshold) document.getElementById('opt-threshold').value = data.threshold;
                if (data.theme) CURRENT_THEME = data.theme;
                if (data.survTime) document.getElementById('opt-surv-time').value = data.survTime;
                if (data.survBonus) document.getElementById('opt-surv-bonus').value = data.survBonus;
                if (data.solo) {
                    document.getElementById('opt-players').value = data.solo;
                    st.cfg.solo = data.solo == '1';
                }
                if (data.tts !== undefined) st.cfg.tts = data.tts;
                if (data.tts !== undefined) st.cfg.tts = data.tts;
                if (data.ttsWord !== undefined) st.cfg.ttsWord = data.ttsWord;
                if (data.ttsRate !== undefined) st.cfg.ttsRate = parseFloat(data.ttsRate);

                app.toggleThresholdVisibility();
                app.toggleSolo();
            }
        } catch (e) { localStorage.removeItem('pnt_data_v22'); }
    }
};

const dataMgr = {
    isTableMode: true,
    init: () => {
        if (CURRENT_SHEET_IDX >= GLOBAL_SHEETS_DATA.length) CURRENT_SHEET_IDX = 0;
        dataMgr.updateSheetSelector();
        dataMgr.renderTable();
    },
    updateSheetSelector: () => {
        const sel = document.getElementById('sheet-selector');
        sel.innerHTML = '';
        GLOBAL_SHEETS_DATA.forEach((s, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = `${s.name} (${s.data.length} cats)`;
            if (i === parseInt(CURRENT_SHEET_IDX)) opt.selected = true;
            sel.appendChild(opt);
        });
    },
    switchSheet: (idx) => {
        dataMgr.syncFromTable();
        CURRENT_SHEET_IDX = parseInt(idx);
        dataMgr.init();
    },
    toggleView: () => { },
    addSheet: () => {
        if (!paywall.isPro && GLOBAL_SHEETS_DATA.length >= 1) {
            paywall.show();
            return;
        }
        dataMgr.syncFromTable();
        GLOBAL_SHEETS_DATA.push({ name: "Nova Aba", data: [{ n: "NOVA CAT", w: ["A", "B"] }] });
        CURRENT_SHEET_IDX = GLOBAL_SHEETS_DATA.length - 1;
        dataMgr.init();
        storage.save();
    },
    removeSheet: () => {
        if (GLOBAL_SHEETS_DATA.length <= 1) {
            ui.alert("Você não pode apagar a única aba restante.");
            return;
        }
        ui.confirm("Tem certeza que deseja apagar esta aba inteira?", () => {
            GLOBAL_SHEETS_DATA.splice(CURRENT_SHEET_IDX, 1);
            CURRENT_SHEET_IDX = 0;
            dataMgr.init();
            storage.save();
        });
    },
    renameSheet: () => {
        const currentName = GLOBAL_SHEETS_DATA[CURRENT_SHEET_IDX].name;
        const newName = prompt("Novo nome da aba:", currentName);
        if (newName && newName.trim() !== "") {
            GLOBAL_SHEETS_DATA[CURRENT_SHEET_IDX].name = newName.trim();
            dataMgr.updateSheetSelector();
            storage.save();
        }
    },
    moveSheet: (dir) => {
        const newIdx = CURRENT_SHEET_IDX + dir;
        if (newIdx < 0 || newIdx >= GLOBAL_SHEETS_DATA.length) return;

        dataMgr.syncFromTable(); // Save current state first

        // Swap
        const temp = GLOBAL_SHEETS_DATA[CURRENT_SHEET_IDX];
        GLOBAL_SHEETS_DATA[CURRENT_SHEET_IDX] = GLOBAL_SHEETS_DATA[newIdx];
        GLOBAL_SHEETS_DATA[newIdx] = temp;

        CURRENT_SHEET_IDX = newIdx;
        dataMgr.init();
        storage.save();
    },
    markDirty: () => { DATA_DIRTY = true; },
    syncFromJSON: () => { },
    syncFromTable: () => {
        const rows = document.querySelectorAll('.table-row');
        if (rows.length === 0 && !document.getElementById('screen-options').classList.contains('active')) return;

        const newCats = [];
        rows.forEach(r => {
            const n = r.querySelector('.table-input-cat').value;
            const wStr = r.querySelector('.table-input-words').value;
            if (n && wStr) {
                // MUDANÇA: split por ;
                const w = wStr.split(';').map(s => s.trim()).filter(s => s);
                if (w.length) newCats.push({ n, w });
            }
        });

        if (document.getElementById('view-table').classList.contains('active')) {
            GLOBAL_SHEETS_DATA[CURRENT_SHEET_IDX].data = newCats;
        }
    },
    renderTable: () => {
        const container = document.getElementById('table-rows');
        if (!container) return;
        container.innerHTML = '';

        const currentData = GLOBAL_SHEETS_DATA[CURRENT_SHEET_IDX] ? GLOBAL_SHEETS_DATA[CURRENT_SHEET_IDX].data : [];

        currentData.forEach((cat, idx) => {
            const row = document.createElement('div');
            row.className = 'table-row';
            // MUDANÇA: join com ;
            row.innerHTML = `<input type="text" class="table-input-cat" value="${cat.n}" placeholder="Categoria" oninput="dataMgr.markDirty()"><input type="text" class="table-input-words" value="${cat.w.join('; ')}" placeholder="Palavras (use ; para separar)" oninput="dataMgr.markDirty()"><button class="btn btn-del" onclick="this.parentElement.remove(); dataMgr.markDirty()">×</button>`;
            container.appendChild(row);
        });
    },
    addTableRow: () => {
        // PAYWALL CHECK: MAX 10 CATEGORIES
        const currentRows = document.querySelectorAll('.table-row').length;
        if (!paywall.isPro && currentRows >= 10) {
            paywall.show();
            return;
        }

        const container = document.getElementById('table-rows');
        const row = document.createElement('div');
        row.className = 'table-row';
        // MUDANÇA: placeholder com ;
        row.innerHTML = `<input type="text" class="table-input-cat" placeholder="NOVA" oninput="dataMgr.markDirty()"><input type="text" class="table-input-words" placeholder="A; B; C..." oninput="dataMgr.markDirty()"><button class="btn btn-del" onclick="this.parentElement.remove(); dataMgr.markDirty()">×</button>`;
        container.appendChild(row);
    },
    save: () => {
        dataMgr.syncFromTable();
        SOURCE_TYPE = 'default';
        storage.save();
        DATA_DIRTY = false;
        ui.alert("Salvo com sucesso!");
    },
    reset: () => {
        ui.confirm("Resetar tudo para o padrão?", () => {
            GLOBAL_SHEETS_DATA = [{ name: "Padrão", data: JSON.parse(JSON.stringify(DEFAULT_CATS)) }];
            CURRENT_SHEET_IDX = 0; SOURCE_TYPE = 'default';
            // REMOVIDO RESET DE TEMA
            dataMgr.init(); storage.save();
        });
    },
    copyPrompt: () => { navigator.clipboard.writeText("Gere JSON: [{\"n\":\"CAT\", \"w\":[\"A\",\"B\"]}]").then(() => ui.alert("Prompt copiado!")); },
    loadDefault: () => {
        document.getElementById('sheet-input').value = "https://docs.google.com/spreadsheets/d/1adTHnrCTt5bEmFowjqjFaPng04cWF0sY5Xn6YdGtLDo/edit?usp=drivesdk";
        dataMgr.loadSheet();
    },
    loadSheet: async () => {
        // PAYWALL CHECK: GOOGLE SHEETS IMPORT
        if (!paywall.isPro) {
            paywall.show();
            return;
        }

        const url = document.getElementById('sheet-input').value;
        if (!url) return;

        // SHOW LOADING MODAL
        const loadingHtml = `
            <div style="width:100%; margin-top:10px;">
                <div style="width:100%; height:10px; background:rgba(255,255,255,0.2); border-radius:5px; overflow:hidden;">
                    <div id="load-progress" style="width:0%; height:100%; background:var(--success); transition: width 0.2s;"></div>
                </div>
                <div style="text-align:center; margin-top:5px; font-size:0.8rem; opacity:0.7;">Baixando dados...</div>
            </div>
        `;
        ui.modal("Carregando...", loadingHtml, []); // No actions to block close

        // Simulate progress
        let progress = 0;
        const pBar = document.getElementById('load-progress');
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) progress = 90;
            if (pBar) pBar.style.width = progress + '%';
        }, 100);

        try {
            // DELAY ARTIFICIAL
            await new Promise(r => setTimeout(r, 800));

            let exportUrl = url;
            if (url.includes('docs.google.com/spreadsheets')) {
                const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                    const id = match[1];
                    exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
                }
            }
            const response = await fetch(exportUrl);
            if (!response.ok) throw new Error("Network");
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = (e) => {
                clearInterval(interval);
                if (pBar) pBar.style.width = '100%';

                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const parsedSheets = [];
                workbook.SheetNames.forEach(sheetName => {
                    if (!paywall.isPro && parsedSheets.length >= 1) return;
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    const cats = [];
                    if (json.length > 0) {
                        const headers = json[0];
                        for (let c = 0; c < headers.length; c++) {
                            const name = headers[c]; if (!name) continue;
                            const words = [];
                            for (let r = 1; r < json.length; r++) { if (json[r] && json[r][c]) words.push(String(json[r][c]).trim()); }
                            if (words.length > 0) cats.push({ n: name, w: words });
                        }
                    }
                    if (cats.length > 0) parsedSheets.push({ name: sheetName, data: cats });
                });

                setTimeout(() => {
                    if (parsedSheets.length > 0) {
                        GLOBAL_SHEETS_DATA = parsedSheets; SOURCE_TYPE = 'sheets';
                        CURRENT_SHEET_IDX = 0;
                        dataMgr.init(); storage.save();
                        if (!paywall.isPro && workbook.SheetNames.length > 1) {
                            ui.alert(`Sucesso! 1 aba carregada (Versão Grátis). Seja PRO para carregar todas.`);
                        } else {
                            ui.alert(`Sucesso! ${parsedSheets.length} abas carregadas.`);
                        }
                    } else { ui.alert("Nenhuma categoria encontrada."); }
                }, 500);
            };
            reader.readAsArrayBuffer(blob);
        } catch (e) {
            clearInterval(interval);
            console.error(e);

            // CUSTOM ERROR MESSAGE FOR PRIVATE SHEETS
            let msg = "Erro ao ler planilha.";
            if (e.message === "Network" || e.message.includes("Failed to fetch")) {
                msg = "Não foi possível acessar a planilha.<br><br>Verifique se ela está pública:<br>1. Clique em 'Compartilhar'<br>2. Mude para 'Qualquer pessoa com o link'";
            }

            ui.alert(msg);
        }
    },
    exportExcel: () => {
        try {
            const t1Name = st.t[0].n;
            const t2Name = st.t[1].n;
            const isSolo = st.cfg.solo;
            const rows = [];
            let accA = 0;
            let accB = 0;
            const maxRounds = st.cfg.r;

            for (let r = 1; r <= maxRounds; r++) {
                const logA = st.logs.find(l => l.r === r && l.t === 0);
                const sA = logA ? logA.s : 0;
                accA += sA;

                const row = {};
                row["Rodada"] = r;
                row[t1Name] = sA;
                row["Total " + t1Name] = accA;

                if (!isSolo) {
                    const logB = st.logs.find(l => l.r === r && l.t === 1);
                    const sB = logB ? logB.s : 0;
                    accB += sB;
                    row[t2Name] = sB;
                    row["Total " + t2Name] = accB;
                }
                rows.push(row);
            }

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Placar");
            XLSX.writeFile(wb, "palavra_na_testa_placar.xlsx");
        } catch (e) {
            ui.alert("Erro ao gerar planilha: " + e.message);
        }
    }
};

/* SENSOR & NAV LOGIC */
const sensor = {
    z: 0, wait: false,
    resetState: true,
    calibrating: false,
    samples: [],
    restingZ: 0,
    triggerTimer: null,
    pendingAction: null,
    init: () => { if (window.DeviceMotionEvent) window.addEventListener('devicemotion', sensor.handle); },
    handle: (e) => {
        const acc = e.accelerationIncludingGravity; if (!acc) return;
        const currentZ = acc.z || 0;
        sensor.z = currentZ;

        if (sensor.calibrating) {
            sensor.samples.push(currentZ);
            return;
        }

        if (st.on && !sensor.wait) {
            const diff = currentZ - sensor.restingZ;

            if (sensor.resetState) {
                let targetAction = null;
                // Down (Correct): z < restingZ - 7.0
                // Up (Skip): z > restingZ + 7.0
                if (diff < -7.0) targetAction = 'correct';
                else if (diff > 7.0) targetAction = 'skip';

                if (targetAction) {
                    if (sensor.pendingAction !== targetAction) {
                        if (sensor.triggerTimer) clearTimeout(sensor.triggerTimer);

                        sensor.pendingAction = targetAction;
                        sensor.triggerTimer = setTimeout(() => {
                            game.act(targetAction === 'correct');
                            sensor.pause();
                            sensor.resetState = false;
                            sensor.triggerTimer = null;
                            sensor.pendingAction = null;
                        }, 100); // 100ms debounce
                    }
                } else {
                    if (sensor.triggerTimer) {
                        clearTimeout(sensor.triggerTimer);
                        sensor.triggerTimer = null;
                        sensor.pendingAction = null;
                    }
                }
            } else {
                if (Math.abs(diff) < 2.0) sensor.resetState = true;
            }
        }
    },
    pause: () => {
        sensor.wait = true;
        if (sensor.triggerTimer) { clearTimeout(sensor.triggerTimer); sensor.triggerTimer = null; sensor.pendingAction = null; }
        setTimeout(() => sensor.wait = false, 1500);
    }
};
sensor.init();

/* KEYBOARD SUPPORT */
const keyboard = {
    init: () => {
        document.addEventListener('keydown', (e) => {
            if (!st.on) return;
            // UI: ▼ ACERTOU | ▲ PULAR
            if (e.code === 'ArrowDown') game.act(true);
            else if (e.code === 'ArrowUp') game.act(false);
        });
    }
};
keyboard.init();

const app = {
    to: (id) => {
        if (document.querySelector('#screen-game.active')) game.stop();
        wheel.stop();

        const currentScreen = document.querySelector('.screen.active');
        const nextScreen = document.getElementById('screen-' + id);

        if (currentScreen && currentScreen !== nextScreen) {
            currentScreen.classList.remove('active');
        }

        if (nextScreen) {
            nextScreen.classList.add('active');
            nextScreen.scrollTop = 0; // SCROLL RESET
        }

        // TRANSPARENCY FOR CAMERA (GAME SCREEN)
        if (id === 'game') document.body.classList.add('transparent-bg');
        else document.body.classList.remove('transparent-bg');

        a11y.update(id); // UPDATE A11Y STATE
        if (id === 'options') {
            dataMgr.init();
            themeMgr.init(); // FORCE THEME RENDER
            musicMgr.syncUI();
            aud.syncUI();
        }
        const homeBtn = document.getElementById('home-btn');

        if (id === 'home' || id === 'options') {
            homeBtn.style.display = 'none';
            wakeLockMgr.release();
            game.stopAll();
            document.getElementById('timer-num').innerText = st.cfg.t;
            st.rd = 1; st.trn = 0; st.pts = 0; st.t[0].s = 0; st.t[1].s = 0;
            st.logs = [];
            st.usedWords = {}; st.playedCats = [];
        } else {
            homeBtn.style.display = 'block';
        }

        if (id === 'teams') {
            document.getElementById('t1-conf').value = document.getElementById('t1').value;
            document.getElementById('t2-conf').value = document.getElementById('t2').value;

            // Solo logic for Teams Screen
            const t2Group = document.getElementById('group-t2-conf');
            if (st.cfg.solo && t2Group) t2Group.style.display = 'none';
            else if (t2Group) t2Group.style.display = 'block';

            const root = getComputedStyle(document.documentElement);
            document.getElementById('lbl-t1').style.color = root.getPropertyValue('--primary');
            if (!st.cfg.solo) document.getElementById('lbl-t2').style.color = root.getPropertyValue('--secondary');
            document.getElementById('t1-conf').style.borderLeftColor = root.getPropertyValue('--primary');
            if (!st.cfg.solo) document.getElementById('t2-conf').style.borderLeftColor = root.getPropertyValue('--secondary');
        }

        if (id === 'intro') {
            app.setMode(st.roundMode);
        }
    },
    toggleSolo: () => {
        const val = document.getElementById('opt-players').value;
        st.cfg.solo = (val == '1');

        const t2Input = document.getElementById('group-t2');
        if (st.cfg.solo) t2Input.style.display = 'none';
        else t2Input.style.display = 'block';
    },
    setMode: (m) => {
        st.roundMode = m;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        if (m === 'normal') document.getElementById('btn-mode-normal').classList.add('active');
        else document.getElementById('btn-mode-surv').classList.add('active');
    },
    openAccessModal: () => {
        const html = `
            <div style="display: flex; flex-direction: column; gap: 15px; align-items: flex-start; width: 100%; padding: 10px;">
                <div style="display: flex; width: 100%; gap: 10px; justify-content: space-between;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 1rem; flex: 1; color: white; background:rgba(255,255,255,0.1); padding:10px; border-radius:10px;">
                        <input type="checkbox" id="chk-tts-narrator" ${st.cfg.tts ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--success);">
                        <div style="line-height:1.1;">
                            <div style="font-weight:bold; font-size:0.9em; text-transform:uppercase;">Narrador</div>
                            <div style="font-size:0.75em; opacity:0.7; margin-top:2px;">Voz do jogo</div>
                        </div>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 1rem; flex: 1; color: white; background:rgba(255,255,255,0.1); padding:10px; border-radius:10px;">
                        <input type="checkbox" id="chk-tts-word" ${st.cfg.ttsWord ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--success);">
                        <div style="line-height:1.1;">
                            <div style="font-weight:bold; font-size:0.9em; text-transform:uppercase;">Ler Palavra</div>
                            <div style="font-size:0.75em; opacity:0.7; margin-top:2px;">Fala a carta</div>
                        </div>
                    </label>
                </div>
                
                <div style="width:100%; background:rgba(255,255,255,0.05); padding:12px; border-radius:10px; display:flex; align-items:center; gap:15px;">
                    <!-- LABEL BLOCO -->
                    <div style="line-height:1.1; flex-shrink:0;">
                        <div style="font-weight:bold; font-size:0.9em; text-transform:uppercase;">Velocidade da Voz</div>
                        <div style="font-size:0.75em; opacity:0.7; margin-top:2px;">Ajuste o ritmo</div>
                    </div>
                    
                    <!-- SLIDER NO MEIO -->
                    <input type="range" id="rng-tts-rate" min="0.5" max="2.5" step="0.1" value="${st.cfg.ttsRate || 1.1}" style="flex:1; accent-color:var(--success);" oninput="document.getElementById('lbl-tts-rate').innerText = parseFloat(this.value).toFixed(1) + 'x'">
                    
                    <!-- VALOR NA PONTA -->
                    <span id="lbl-tts-rate" style="opacity:0.9; font-weight:bold; font-size:1.1em; background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:5px; min-width:50px; text-align:center;">${(st.cfg.ttsRate || 1.1).toFixed(1)}x</span>
                </div>
            </div>
        `;

        ui.modal("Acessibilidade", html, [
            {
                txt: "SALVAR",
                cls: "btn",
                style: "flex: 1; margin:0;",
                fn: () => {
                    st.cfg.tts = document.getElementById('chk-tts-narrator').checked;
                    st.cfg.ttsWord = document.getElementById('chk-tts-word').checked;

                    st.cfg.ttsRate = parseFloat(document.getElementById('rng-tts-rate').value);
                    storage.save();
                    if (st.cfg.tts) tts.speak("Configurações salvas");
                }
            },
            {
                txt: "CANCELAR",
                cls: "btn btn-outline",
                style: "flex: 1; margin:0;"
            }
        ]);
    },
    tryHome: () => {
        if (DATA_DIRTY) {
            ui.confirm("Há alterações não salvas. Deseja sair e perder as mudanças?", () => {
                DATA_DIRTY = false;
                app.to('home');
            });
        } else {
            ui.confirm("Voltar ao menu inicial?", () => { app.to('home'); });
        }
    },
    toggleThresholdVisibility: () => {
        const mode = document.getElementById('opt-mode').value;
        const el = document.getElementById('group-threshold');
        if (mode === 'auto') el.style.display = 'block'; else el.style.display = 'none';
    },
    start: () => {
        aud.p('click');
        musicMgr.play(); // START MUSIC
        wakeLockMgr.request();
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(response => { }).catch(console.error);
        }
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (!isIOS) {
            if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { });
            else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
        }
        st.t[0].n = document.getElementById('t1').value || "Time A";
        st.t[1].n = document.getElementById('t2').value || "Time B";
        st.cfg.t = parseInt(document.getElementById('opt-time').value) || 60;
        st.cfg.r = parseInt(document.getElementById('opt-rounds').value) || 3;
        st.cfg.survTime = parseInt(document.getElementById('opt-surv-time').value) || 30;
        st.cfg.survBonus = parseInt(document.getElementById('opt-surv-bonus').value) || 5;
        st.cfg.solo = (document.getElementById('opt-players').value == '1');

        storage.save();
        app.to('teams');
    },
    confirmTeams: (onlySave) => {
        st.t[0].n = document.getElementById('t1-conf').value || "Time A";
        if (!st.cfg.solo) st.t[1].n = document.getElementById('t2-conf').value || "Time B";

        document.getElementById('t1').value = st.t[0].n;
        if (!st.cfg.solo) document.getElementById('t2').value = st.t[1].n;

        storage.save();
        if (!onlySave) app.prep();
    },
    prep: () => {
        if (st.rd > st.cfg.r) { app.end(); return; }
        if (!GLOBAL_SHEETS_DATA || GLOBAL_SHEETS_DATA.length === 0 || !GLOBAL_SHEETS_DATA[0]) {
            GLOBAL_SHEETS_DATA = [JSON.parse(JSON.stringify(DEFAULT_CATS))];
        }

        // Logic for rounds in Solo vs Versus
        let turnIdx = 0;
        let effectiveSheets = GLOBAL_SHEETS_DATA.length;

        if (st.cfg.solo) {
            // In solo, turn index is simply round index - 1
            turnIdx = st.rd - 1;
        } else {
            // In versus, it calculates based on 2 turns per round
            turnIdx = (st.rd - 1) * 2 + st.trn;
            if (effectiveSheets > 1 && effectiveSheets % 2 !== 0) effectiveSheets -= 1;
        }

        const sheetIdx = turnIdx % effectiveSheets;
        CURRENT_ROUND_CATS = GLOBAL_SHEETS_DATA[sheetIdx].data;

        if (!CURRENT_ROUND_CATS || CURRENT_ROUND_CATS.length === 0) {
            CURRENT_ROUND_CATS = GLOBAL_SHEETS_DATA[0].data;
        }

        const t = st.t[st.trn];
        const root = getComputedStyle(document.documentElement);

        // Solo Mode always uses Primary Color
        const color = (st.cfg.solo) ? root.getPropertyValue('--primary') :
            (st.trn === 0 ? root.getPropertyValue('--primary') : root.getPropertyValue('--secondary'));

        document.getElementById('lbl-rd').innerText = st.rd;
        document.getElementById('lbl-tm').innerText = t.n;
        document.getElementById('lbl-tm').style.color = color;
        app.to('intro');
    },
    toWheel: () => { aud.p('click'); wheel.init(); app.to('wheel'); },
    next: () => {
        aud.p('click');

        if (st.cfg.solo) {
            st.rd++; // Solo just increments round
        } else {
            st.trn++;
            if (st.trn > 1) { st.trn = 0; st.rd++; }
        }

        if (st.cfg.solo) {
            // Hide T2 box and center T1
            document.getElementById('score-box-2').style.display = 'none';
            document.getElementById('final-title').innerText = "FIM DE JOGO";

            let msg = "";
            if (t1.s > 20) msg = "INCRÍVEL!";
            else if (t1.s > 10) msg = "MANDOU BEM!";
            else msg = "BOA TENTATIVA!";

            const w = document.getElementById('winner');
            w.innerText = msg;
            w.style.color = c1;
        } else {
            // Normal Versus Logic
            document.getElementById('score-box-2').style.display = 'block';
            document.getElementById('fn-2').innerText = t2.n; document.getElementById('fs-2').innerText = t2.s;
            document.getElementById('fn-2').style.color = c2;

            const w = document.getElementById('winner');
            if (t1.s > t2.s) { w.innerText = t1.n + " VENCEU!"; w.style.color = c1; }
            else if (t2.s > t1.s) { w.innerText = t2.n + " VENCEU!"; w.style.color = c2; }
            else { w.innerText = "EMPATE"; w.style.color = "white"; }
        }

        aud.p('win'); app.to('final');
    }
};

/* WHEEL LOGIC REMAINS SAME */
const wheel = {
    el: null, jackpot: null, mode: 'wheel', ang: 0, offsetY: 0, spin: false, timer: null,
    stop: () => { if (wheel.timer) clearTimeout(wheel.timer); wheel.spin = false; },
    init: () => {
        const mode = document.getElementById('opt-mode').value;
        const thresh = parseInt(document.getElementById('opt-threshold').value) || 12;
        if (!CURRENT_ROUND_CATS || CURRENT_ROUND_CATS.length === 0) CURRENT_ROUND_CATS = DEFAULT_CATS;
        if (mode === 'wheel') wheel.mode = 'wheel';
        else if (mode === 'jackpot') wheel.mode = 'jackpot';
        else { wheel.mode = CURRENT_ROUND_CATS.length > thresh ? 'jackpot' : 'wheel'; }

        const wc = document.getElementById('wheel-container');
        const jc = document.getElementById('jackpot-container');

        wc.style.display = wheel.mode === 'wheel' ? 'block' : 'none';
        jc.style.display = wheel.mode === 'jackpot' ? 'block' : 'none';

        wheel.el = document.getElementById('wheel-spinner');
        wheel.jackpot = document.getElementById('jackpot-strip');
        wheel.jackpot.style.transition = 'none';

        // Reset básico
        wheel.el.style.transition = 'none';
        wheel.el.style.transform = 'rotate(0deg)';
        wheel.ang = 0;

        if (wheel.mode === 'wheel') {
            wheel.setupWheel();
            wheel.attachDrag(wc);
        } else {
            wheel.setupJackpot();
            wheel.attachDrag(jc);

            // === CORREÇÃO DE ALINHAMENTO COM LOOP INFINITO ===
            setTimeout(() => {
                const containerH = jc.offsetHeight;
                const itemEl = wheel.jackpot.firstElementChild;
                const itemH = itemEl ? itemEl.offsetHeight : 0;

                if (containerH && itemH) {
                    const n = CURRENT_ROUND_CATS.length;
                    // Começa no conjunto 15 (meio da lista gigante) para ter itens acima e abaixo
                    const startSet = 15;

                    // Cálculo: Centro da Tela - Metade do Item - Altura dos 15 conjuntos anteriores
                    // O "+ 18" no final empurra a lista para baixo
                    wheel.offsetY = (containerH / 2) - (itemH / 2) - (startSet * n * itemH) + 18;

                    wheel.jackpot.style.transform = `translateY(${wheel.offsetY}px)`;
                }
            }, 0);
        }
    },
    setupWheel: () => {
        let g = "conic-gradient(", h = ""; const count = CURRENT_ROUND_CATS.length; const sliceDeg = 360 / count;
        CURRENT_ROUND_CATS.forEach((c, i) => {
            // MUDANÇA: COR DINÂMICA
            const color = getDynamicColor(i, count);
            const start = i * sliceDeg; const end = (i + 1) * sliceDeg;
            g += `${color} ${start}deg ${end}deg,`;
            const mid = start + (sliceDeg / 2);
            const split = smartSplit(c.n);
            let fontSize = 4; const refLen = split.lines === 1 ? c.n.length : split.maxLen;
            if (refLen > 8) fontSize = 4 * (8 / refLen);
            h += `<div class="slice-wrapper" style="transform:rotate(${mid - 90}deg)"><span class="slice-text" style="font-size:${fontSize}vh">${split.text}</span></div>`;
        });
        wheel.el.style.background = g.slice(0, -1) + ")"; wheel.el.innerHTML = h;
    },
    setupJackpot: () => {
        let h = ""; const list = [];
        for (let k = 0; k < 30; k++) { CURRENT_ROUND_CATS.forEach(c => list.push(c)); }
        const n = CURRENT_ROUND_CATS.length;
        list.forEach((c, i) => {
            const realIndex = i % n;
            const color = getDynamicColor(realIndex, n);
            const text = c.n.replace(/\*+$/, '');

            // === CORREÇÃO DE FONTE (AJUSTE BRANDO) ===
            let fontSize = 5; // Tamanho padrão (grande)

            // Só diminui se passar de 15 letras
            if (text.length > 15) {
                // Reduz 0.15vh para cada letra excedente
                fontSize = 5 - ((text.length - 15) * 0.15);
            }

            // Trava num tamanho mínimo legível (2.5vh)
            if (fontSize < 2.5) fontSize = 2.5;

            h += `<div class="jackpot-item" style="background:${color}; font-size:${fontSize}vh">${text}</div>`;
        });
        wheel.jackpot.innerHTML = h;
    },
    attachDrag: (target) => {
        let startY = 0, lastY = 0, startTime = 0, startAng = 0, lastAng = 0, angularVelocity = 0, linearVelocity = 0, lastMoveTime = 0;
        const getAngle = (e, el) => {
            const rect = el.getBoundingClientRect(); const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
        };
        const onStart = (e) => {
            if (wheel.spin) return;
            if (wheel.mode === 'wheel') { startAng = getAngle(e, target); lastAng = startAng; } else { startY = e.touches ? e.touches[0].clientY : e.clientY; lastY = startY; }
            lastMoveTime = Date.now(); startTime = lastMoveTime; angularVelocity = 0; linearVelocity = 0;
            document.addEventListener('touchmove', onMove, { passive: false }); document.addEventListener('touchend', onEnd);
            document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onEnd);
        };
        const onMove = (e) => {
            e.preventDefault(); const now = Date.now(); const dt = now - lastMoveTime;
            if (wheel.mode === 'wheel') {
                const curAng = getAngle(e, target); let delta = curAng - lastAng;
                if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
                wheel.ang += delta; wheel.el.style.transform = `rotate(${wheel.ang}deg)`;
                if (dt > 0) { const instantVel = delta / dt; angularVelocity = (instantVel * 0.5) + (angularVelocity * 0.5); }
                lastAng = curAng;
            } else {
                const curY = e.touches ? e.touches[0].clientY : e.clientY; const delta = curY - lastY; wheel.offsetY += delta;
                const itemEl = wheel.jackpot.querySelector('.jackpot-item');
                if (itemEl) { const stripH = itemEl.offsetHeight * CURRENT_ROUND_CATS.length; if (wheel.offsetY > 0) wheel.offsetY -= stripH; if (wheel.offsetY < -stripH * 15) wheel.offsetY += stripH; }
                wheel.jackpot.style.transform = `translateY(${wheel.offsetY}px)`;
                if (dt > 0) { const instantVel = delta / dt; linearVelocity = (instantVel * 0.5) + (linearVelocity * 0.5); }
                lastY = curY;
            }
            lastMoveTime = now;
        };
        const onEnd = () => {
            document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd);
            document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd);
            const totalDuration = Date.now() - startTime;
            if (totalDuration < 30) {
                const msg = document.getElementById('msg-time');
                msg.style.opacity = 1;
                msg.style.visibility = 'visible';
                setTimeout(() => {
                    msg.style.opacity = 0;
                    msg.style.visibility = 'hidden';
                }, 1500);
                return;
            }
            if (Date.now() - lastMoveTime > 100) { angularVelocity = 0; linearVelocity = 0; }
            if (wheel.mode === 'wheel') { if (Math.abs(angularVelocity) < 0.01) { showForceMsg(); return; } wheel.go(angularVelocity); }
            else { if (Math.abs(linearVelocity) < 0.01) { showForceMsg(); return; } wheel.go(linearVelocity); }
        };
        target.onmousedown = onStart; target.ontouchstart = onStart;
    },
    go: (velocity) => {
        if (wheel.spin) return; wheel.spin = true; aud.l('spin', true);
        // === NOVA LÓGICA DE ASTERISCOS ===
        let effectiveSheets = GLOBAL_SHEETS_DATA.length;
        let turnIdx = 0;
        if (st.cfg.solo) {
            turnIdx = st.rd - 1;
        } else {
            turnIdx = (st.rd - 1) * 2 + st.trn;
            if (effectiveSheets > 1 && effectiveSheets % 2 !== 0) effectiveSheets -= 1;
        }
        // Visit count for the current sheet (1-based)
        const visitCount = Math.floor(turnIdx / effectiveSheets) + 1;

        let winnerIdx = -1;

        // 1. Identify cheats (all categories with asterisks)
        const cheats = CURRENT_ROUND_CATS.map((c, i) => {
            const match = c.n.match(/(\*+)$/);
            return match ? { index: i, count: match[1].length } : null;
        }).filter(x => x !== null);

        if (cheats.length > 0) {
            // 2. Filter for exact visitCount match
            const exactMatches = cheats.filter(x => x.count === visitCount);

            if (exactMatches.length > 0) {
                // Pick random from exact matches
                winnerIdx = exactMatches[Math.floor(Math.random() * exactMatches.length)].index;
            } else {
                // Fallback: Pick random from ALL cheats (preserving old behavior)
                winnerIdx = cheats[Math.floor(Math.random() * cheats.length)].index;
            }
        } else {
            // No cheats, random normal with repetition check
            // Filter out played categories
            let available = CURRENT_ROUND_CATS.map((c, i) => ({ c, i })).filter(item => !st.playedCats.includes(item.c.n));

            // If all categories played, reset list (fallback)
            if (available.length === 0) {
                st.playedCats = [];
                available = CURRENT_ROUND_CATS.map((c, i) => ({ c, i }));
            }

            const picked = available[Math.floor(Math.random() * available.length)];
            winnerIdx = picked.i;
        }
        const duration = 3;
        if (wheel.mode === 'wheel') {
            const sliceDeg = 360 / CURRENT_ROUND_CATS.length; const currentAngle = wheel.ang; const spins = 5 * 360;
            const targetOffset = -(winnerIdx * sliceDeg) - (sliceDeg / 2); const dir = Math.sign(velocity) || 1; const totalRot = spins * dir;
            const finalAngle = currentAngle + totalRot + targetOffset - (currentAngle % 360);
            wheel.el.style.transition = `transform ${duration}s cubic-bezier(0.1, 0, 0.1, 1)`; wheel.el.style.transform = `rotate(${finalAngle}deg)`; wheel.ang = finalAngle;
            wheel.timer = setTimeout(() => wheel.finish(winnerIdx), duration * 1000);
        } else {
            const itemEl = wheel.jackpot.querySelector('.jackpot-item'); if (!itemEl) return;
            const itemH = itemEl.getBoundingClientRect().height; const n = CURRENT_ROUND_CATS.length; const dir = Math.sign(velocity);
            const startSet = 15; const startY = -(startSet * n * itemH);
            wheel.jackpot.style.transition = 'none'; wheel.jackpot.style.transform = `translateY(${startY}px)`; wheel.jackpot.offsetHeight;
            const targetSetOffset = (dir > 0) ? -3 : 3; const targetSet = startSet + targetSetOffset;
            const containerH = document.getElementById('jackpot-container').offsetHeight; const centerOffset = containerH / 2;
            const winnerItemIndex = (targetSet * n) + winnerIdx; const finalTargetY = centerOffset - (winnerItemIndex * itemH) - (itemH / 2);
            wheel.jackpot.style.transition = `transform ${duration}s cubic-bezier(0.1, 0, 0.1, 1)`; wheel.jackpot.style.transform = `translateY(${finalTargetY}px)`;
            setTimeout(() => wheel.finish(winnerIdx), duration * 1000);
        }
    },
    finish: (idx) => {
        aud.l('spin', false); aud.p('win');
        const cat = CURRENT_ROUND_CATS[idx]; st.cat = cat;
        // MUDANÇA: COR DINÂMICA
        const color = getDynamicColor(idx, CURRENT_ROUND_CATS.length);

        // ANIMATION: SELECTION PULSE
        if (wheel.mode === 'wheel') {
            // Hard to target specific slice in CSS only, but we can flash the screen or something
        } else {
            const items = wheel.jackpot.querySelectorAll('.jackpot-item');
            // We need to find the winning item. It's complicated due to the infinite scroll logic.
            // Simplified: Flash the result modal with extra flair
        }

        const onTTSFinish = () => {
            if (st.cfg.ttsWord) {
                const bar = document.getElementById('auto-start-bar');
                if (bar) {
                    bar.style.animationPlayState = 'running';
                    setTimeout(() => {
                        const ov = document.getElementById('modal-overlay');
                        if (ov.style.display !== 'none') {
                            ov.style.display = 'none';
                            a11y.trapModal(false);
                            game.pre();
                        }
                    }, 2000);
                }
            }
        };

        // TTS: CATEGORIA
        if (st.cfg.tts) tts.speak("Categoria sorteada: " + cat.n.replace(/\*+$/, ''), onTTSFinish);

        ui.showResult(cat.n.replace(/\*+$/, ''), color, () => game.pre()); wheel.spin = false;

        // WHEEL PULSE EFFECT
        if (wheel.mode === 'wheel') {
            const slices = wheel.el.querySelectorAll('.slice-text');
            if (slices[idx]) slices[idx].classList.add('anim-pulse');
        } else {
            document.getElementById('jackpot-container').classList.add('anim-pulse');
            setTimeout(() => document.getElementById('jackpot-container').classList.remove('anim-pulse'), 1000);
        }

        // Add to played categories if not cheat (cheats can repeat)
        if (!cat.n.includes('*')) {
            if (!st.playedCats.includes(cat.n)) st.playedCats.push(cat.n);
        }
    }
};

function showForceMsg() {
    const msg = document.getElementById('msg-force');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 1000);
}

const game = {
    tmr: null, preTmr: null, editList: [], curTime: 0, maxTime: 0,
    stop: () => { if (game.tmr) clearInterval(game.tmr); },
    stopAll: () => { if (game.tmr) clearInterval(game.tmr); if (game.preTmr) clearInterval(game.preTmr); st.on = false; },
    pre: () => {
        app.to('game'); st.on = false;

        // START CALIBRATION
        sensor.calibrating = true;
        sensor.samples = [];

        const isSurv = st.roundMode === 'survival'; game.maxTime = isSurv ? st.cfg.survTime : st.cfg.t; game.curTime = game.maxTime;
        document.getElementById('timer-num').innerText = game.curTime;
        document.querySelector('.timer-wrapper').style.background = `conic-gradient(var(--secondary) 0deg, var(--secondary) 360deg)`;

        const d = document.getElementById('word-disp'); let c = 3;
        d.innerText = c;
        d.classList.remove('anim-pop');
        void d.offsetWidth; // Trigger reflow
        d.classList.add('anim-pop');

        // TTS: 3
        if (st.cfg.tts) tts.speak("Três");

        game.preTmr = setInterval(() => {
            c--;
            if (c > 0) {
                d.innerText = c;
                d.classList.remove('anim-pop');
                void d.offsetWidth; // Trigger reflow
                d.classList.add('anim-pop');
                // TTS: 2, 1
                if (st.cfg.tts) tts.speak(c.toString());
            } else {
                clearInterval(game.preTmr);
                d.innerText = "VAI!";
                d.classList.remove('anim-pop');
                void d.offsetWidth; // Trigger reflow
                d.classList.add('anim-pop');
                // TTS: VALENDO
                if (st.cfg.tts) tts.speak("Valendo!");

                setTimeout(game.run, 600);
            }
        }, 1000);
    },
    run: () => {
        // STOP CALIBRATION & CALCULATE RESTING Z
        sensor.calibrating = false;
        if (sensor.samples.length > 0) {
            const sum = sensor.samples.reduce((a, b) => a + b, 0);
            sensor.restingZ = sum / sensor.samples.length;
        } else {
            sensor.restingZ = 0;
        }
        // console.log("Resting Z:", sensor.restingZ);

        game.stop(); st.on = true; st.pts = 0; st.h = []; st.skp = [];

        // Filter words
        const allWords = [...st.cat.w];
        // === WORD ORDER CHEAT LOGIC ===
        const clean = (w) => w.replace(/\*+$/, '');
        const used = st.usedWords[st.cat.n] || [];

        // 1. Separate Cheats vs Normal
        // We only consider words NOT in used list (comparing clean versions)
        const available = allWords.filter(w => !used.includes(clean(w)));

        // Reset if empty
        if (available.length === 0) {
            st.usedWords[st.cat.n] = [];
            // Recalculate available from full list
            available.push(...allWords);
        }

        const cheatMap = {}; // { 1: [w1, w2], 2: [w3] ... }
        const normalWords = [];

        available.forEach(w => {
            const match = w.match(/(\*+)$/);
            if (match) {
                const level = match[1].length;
                if (!cheatMap[level]) cheatMap[level] = [];
                cheatMap[level].push(w);
            } else {
                normalWords.push(w);
            }
        });

        // Shuffle normal words
        normalWords.sort(() => Math.random() - 0.5);

        // 2. Build the Ordered List
        const finalQueue = [];
        // Determine max slots needed (either max cheat level or total words)
        // We'll just iterate enough to cover potential cheats
        const maxCheat = Math.max(...Object.keys(cheatMap).map(Number), 0);
        const totalNeeded = available.length;

        // We build the list from position 1 onwards
        // If a position has a cheat, use it. If not, use a normal word.
        // Any remaining normal words are appended at the end.

        let normalIdx = 0;

        // Phase 1: Fill slots up to maxCheat (or until we run out of words)
        for (let i = 1; i <= Math.max(maxCheat, totalNeeded); i++) {
            if (cheatMap[i] && cheatMap[i].length > 0) {
                // Pick random cheat for this level
                const picked = cheatMap[i][Math.floor(Math.random() * cheatMap[i].length)];
                finalQueue.push(picked);
            } else {
                // No cheat for this slot, use normal word if available
                if (normalIdx < normalWords.length) {
                    finalQueue.push(normalWords[normalIdx]);
                    normalIdx++;
                }
            }
        }

        // If we still have normal words left (e.g. maxCheat was small), add them
        while (normalIdx < normalWords.length) {
            finalQueue.push(normalWords[normalIdx]);
            normalIdx++;
        }

        // 3. Set Queue (Reverse for pop())
        st.q = finalQueue.reverse();

        game.next();
        const tn = document.getElementById('timer-num'); const tw = document.querySelector('.timer-wrapper');
        const root = getComputedStyle(document.documentElement); const sec = root.getPropertyValue('--secondary').trim();
        game.tmr = setInterval(() => {
            game.curTime--; tn.innerText = game.curTime;

            // TTS: 10 SEGUNDOS
            if (st.cfg.tts && game.curTime === 10) tts.speak("Dez segundos");

            let pct = ((game.maxTime - game.curTime) / game.maxTime) * 360; if (pct < 0) pct = 0;
            tw.style.background = `conic-gradient(${sec} ${pct}deg, rgba(255,255,255,0.1) ${pct}deg)`;
            if (game.curTime <= 0) { game.stop(); game.end(); }
        }, 1000);
    },
    next: () => {
        if (st.q.length === 0) { if (st.skp.length > 0) { st.q = [...st.skp].sort(() => Math.random() - 0.5); st.skp = []; } else { game.stop(); game.end(); return; } }
        st.cw = st.q.pop();
        // STRIP ASTERISKS FOR DISPLAY
        const displayWord = st.cw.replace(/\*+$/, '');
        document.getElementById('word-disp').innerText = displayWord;

        // CORREÇÃO DO BUG "LER PALAVRA"
        const currentWordSnapshot = st.cw;

        if (st.cfg.ttsWord) {
            setTimeout(() => {
                // Comparamos a variável de snapshot com a variável de estado
                if (st.on && st.cw === currentWordSnapshot) {
                    tts.speak(displayWord);
                }
            }, 800);
        }
    },
    act: (win) => {
        if (!st.on) return;
        if (win) {
            // Save CLEAN word to history
            const cleanWord = st.cw.replace(/\*+$/, '');
            aud.p('ok'); st.pts++; st.h.push({ w: cleanWord, ok: true });

            // ANIMATION: ACERTOU
            game.flash('fb-ok');
            const wd = document.getElementById('word-disp');
            wd.style.transform = "translate(-50%, -50%) scale(1.2)";
            setTimeout(() => wd.style.transform = "translate(-50%, -50%) scale(1)", 200);

            // TTS: ACERTOU
            if (st.cfg.tts) tts.speak("Acertou!");

            if (st.roundMode === 'survival') {
                game.curTime += st.cfg.survBonus; document.getElementById('timer-num').innerText = game.curTime;
                const animEl = document.getElementById('bonus-anim'); animEl.innerText = `+${st.cfg.survBonus}s`;
                animEl.classList.remove('anim'); void animEl.offsetWidth; animEl.classList.add('anim');
                let pct = ((game.maxTime - game.curTime) / game.maxTime) * 360; if (pct < 0) pct = 0;
                const root = getComputedStyle(document.documentElement); const sec = root.getPropertyValue('--secondary').trim();
                document.querySelector('.timer-wrapper').style.background = `conic-gradient(${sec} ${pct}deg, rgba(255,255,255,0.1) ${pct}deg)`;
            }
        } else {
            const cleanWord = st.cw.replace(/\*+$/, '');
            aud.p('pass'); st.h.push({ w: cleanWord, ok: false });

            // ANIMATION: PULOU
            game.flash('fb-no'); st.skp.push(st.cw);
            const wd = document.getElementById('word-disp');
            wd.classList.add('anim-shake');
            setTimeout(() => wd.classList.remove('anim-shake'), 400);

            // TTS: PULOU
            if (st.cfg.tts) tts.speak("Pulou!");
        }

        // DELAY WORD CHANGE
        setTimeout(() => {
            game.next();
        }, 600);
    },
    flash: (id) => {
        const e = document.getElementById(id);
        e.classList.add('active');
        setTimeout(() => {
            e.classList.remove('active');
        }, 600);
    },
    end: () => {
        try {
            st.on = false; game.stop(); st.pts = st.h.filter(x => x.ok).length;
            st.logs = st.logs.filter(l => !(l.r === st.rd && l.t === st.trn)); st.logs.push({ r: st.rd, t: st.trn, s: st.pts });

            // Save used words
            if (!st.usedWords[st.cat.n]) st.usedWords[st.cat.n] = [];
            st.h.forEach(item => {
                if (item.ok && !st.usedWords[st.cat.n].includes(item.w)) {
                    st.usedWords[st.cat.n].push(item.w);
                }
            });

            // TTS: FIM RODADA COM PLURAL CORRIGIDO
            if (st.cfg.tts) {
                setTimeout(() => {
                    const pontosLabel = st.pts === 1 ? "ponto" : "pontos";
                    tts.speak(`Tempo esgotado! Pontuação na rodada: ${st.pts} ${pontosLabel}.`);
                }, 500);
            }

            st.t[st.trn].s += st.pts; app.to('res'); game.renderRes();
        } catch (e) { console.error("Game End Error:", e); app.to('home'); }
    },
    renderRes: () => {
        // CORREÇÃO VISUAL DE PLURAL
        const scoreEl = document.getElementById('res-score');
        if (scoreEl) {
            const suffix = st.pts === 1 ? " PONTO" : " PONTOS";
            scoreEl.innerText = st.pts + suffix;
        }

        const l = document.getElementById('res-list'); if (l) { l.innerHTML = ""; if (st.h && st.h.length > 0) { st.h.forEach(x => { const d = document.createElement('div'); d.style.padding = "10px"; d.style.borderBottom = "1px solid rgba(255,255,255,0.1)"; d.style.display = "flex"; d.style.justifyContent = "space-between"; d.style.alignItems = "center"; const color = x.ok ? '#22c55e' : '#ef4444'; const icon = x.ok ? '✓' : '✗'; d.innerHTML = `<span style="flex:1; text-align:left;">${x.w}</span><b style="color:${color}; font-size:1.2rem;">${icon}</b>`; l.appendChild(d); }); } else { l.innerHTML = "<div style='padding:20px;opacity:0.5;text-align:center;'>Nenhuma palavra jogada.</div>"; } }
    },
    openEdit: () => {
        game.editList = st.h && st.h.length ? JSON.parse(JSON.stringify(st.h)) : [];
        if (game.editList.length === 0) { ui.alert("Nada para editar."); return; }
        const html = '<div class="edit-list-container">' + game.editList.map((item, i) => ` <div class="edit-item" onclick="game.toggleEditItem(${i}, this)"> <span class="edit-word">${item.w}</span> <span class="edit-status" style="color:${item.ok ? 'var(--success)' : 'var(--danger)'}"> ${item.ok ? 'ACERTOU' : 'PULOU'} </span> </div> `).join('') + '</div>';
        ui.modal("EDITAR RESULTADO", html, [{ txt: "SALVAR", fn: game.saveEdit, style: "background:var(--success); flex:1;" }, { txt: "CANCELAR", style: "background:var(--danger); flex:1;" }]);
    },
    toggleEditItem: (i, el) => {
        game.editList[i].ok = !game.editList[i].ok; const span = el.querySelector('.edit-status');
        span.innerText = game.editList[i].ok ? 'ACERTOU' : 'PULOU'; span.style.color = game.editList[i].ok ? 'var(--success)' : 'var(--danger)';
    },
    saveEdit: () => {
        st.t[st.trn].s -= st.pts; const newPts = game.editList.filter(x => x.ok).length; st.pts = newPts; st.t[st.trn].s += st.pts; st.h = game.editList;
        st.logs = st.logs.filter(l => !(l.r === st.rd && l.t === st.trn)); st.logs.push({ r: st.rd, t: st.trn, s: st.pts });
        game.renderRes();
        document.getElementById('modal-overlay').style.display = 'none';
        a11y.trapModal(false);
    }
};

const paywall = {
    isPro: false,
    init: async () => {
        if (!window.Capacitor) { console.log('Paywall: Non-Capacitor env'); return; }
        const { Purchases } = Capacitor.Plugins;

        // TODO: SUBSTITUA ESTAS CHAVES PELAS REAIS DO REVENUECAT
        const API_KEYS = {
            ios: 'appl_PLACEHOLDER_KEY',
            android: 'goog_HsNdwovArTjAZJSyFtdYmWhpprs'
        };

        const platform = Capacitor.getPlatform();
        const key = platform === 'ios' ? API_KEYS.ios : API_KEYS.android;

        if (key.includes('PLACEHOLDER')) {
            console.warn('Paywall: Keys not configured.');
            // BYPASS TEMPORÁRIO PARA NÃO TRAVAR O APP ENQUANTO VOCÊ NÃO CONFIGURA
            paywall.isPro = true;
            return;
        }

        try {
            await Purchases.configure({ apiKey: key });
            const info = await Purchases.getCustomerInfo();
            paywall.check(info);

            // LISTENER PARA MUDANÇAS (Ex: renovação, cancelamento)
            Purchases.addCustomerInfoUpdateListener((info) => {
                paywall.check(info);
            });
        } catch (e) {
            console.error("Paywall Init Error", e);
            // Fallback ou retry poderia ser implementado aqui
        }
    },
    check: (info) => {
        if (info.entitlements.active['pro']) {
            paywall.isPro = true;
            console.log('Paywall: User is PRO');
        } else {
            paywall.isPro = false;
            console.log('Paywall: User is FREE');
        }
    },
    purchase: async () => {
        if (!window.Capacitor) return;
        const { Purchases } = Capacitor.Plugins;
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current && offerings.current.availablePackages.length > 0) {
                const pkg = offerings.current.availablePackages[0];
                const { customerInfo } = await Purchases.purchasePackage({ package: pkg });
                paywall.check(customerInfo);
                if (paywall.isPro) {
                    ui.alert("Compra realizada com sucesso!");
                    document.getElementById('modal-overlay').style.display = 'none';
                }
            } else {
                ui.alert("Nenhuma oferta disponível no momento.");
            }
        } catch (e) {
            if (e.code !== 1) ui.alert("Erro: " + e.message);
        }
    },
    restore: async () => {
        if (!window.Capacitor) return;
        const { Purchases } = Capacitor.Plugins;
        try {
            const info = await Purchases.restorePurchases();
            paywall.check(info);
            if (paywall.isPro) ui.alert("Compras restauradas!");
            else ui.alert("Nenhuma compra ativa encontrada.");
        } catch (e) { ui.alert("Erro ao restaurar."); }
    },
    show: () => {
        const html = `
            <div class="pay-container" style="display:flex; flex-direction:column; gap:10px;">
                <div class="pay-left" style="text-align:center;">
                    <p style="opacity:0.8; font-size:1.1rem; margin-top:5px;">Desbloqueie categorias ilimitadas e apoie o desenvolvimento!</p>
                </div>
                <div class="pay-right" style="display:flex; flex-direction:column; gap:10px; width:100%;">
                    <button class="btn" style="background:var(--success); width:100%;" onclick="paywall.purchase()">DESBLOQUEAR AGORA</button>
                    <button class="btn btn-outline" style="width:100%;" onclick="paywall.restore()">Restaurar Compra</button>
                </div>
            </div>
        `;
        ui.modal("💎 Versão PRO", html, [{ txt: "FECHAR", cls: "btn btn-outline" }]);
    }
};

// === MODAL ANIMATION FIX ===
const originalModal = ui.modal;
ui.modal = (title, html, actions) => {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('active');
    originalModal(title, html, actions);

    // Override close actions to remove class
    const closeBtns = document.querySelectorAll('#modal-actions button');
    closeBtns.forEach(btn => {
        const oldClick = btn.onclick;
        btn.onclick = () => {
            overlay.classList.remove('active');
            if (oldClick) oldClick();
        };
    });
};

window.onload = () => {
    // ATUALIZA A VERSÃO NA TELA AUTOMATICAMENTE
    const verTag = document.querySelector('.version-tag');
    if (verTag) verTag.innerText = APP_VERSION;

    storage.load();
    aud.init();
    musicMgr.init();
    themeMgr.init(); // Initialize themes
    sensor.init();

    // INIT PAYWALL
    paywall.init();

    // PAUSE MUSIC ON BACKGROUND
    if (window.Capacitor) {
        const { App } = Capacitor.Plugins;
        App.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
                if (musicMgr.ctx && musicMgr.ctx.state === 'running') musicMgr.ctx.suspend();
                sensor.pause(); // Also pause sensor
            } else {
                if (musicMgr.enabled && musicMgr.ctx && musicMgr.ctx.state === 'suspended') musicMgr.ctx.resume();
            }
        });

        // RESTORE BACK BUTTON LOGIC
        App.addListener('backButton', () => {
            const modal = document.getElementById('modal-overlay');
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
                a11y.trapModal(false);
                return;
            }

            const active = document.querySelector('.screen.active');
            if (active && active.id === 'screen-home') {
                App.exitApp();
            } else {
                // Uses app.tryHome() for safe exit (confirm if game running or data dirty)
                app.tryHome();
            }
        });
    }

    // REMOVE LOADING SCREEN
    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls) {
            ls.classList.add('fade-out');
            setTimeout(() => ls.remove(), 500);
        }
    }, 500); // Pequeno delay para garantir renderização

    // DICA IOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || (window.matchMedia('(display-mode: standalone)').matches);

    if (isIOS && !isStandalone) {
        // Cria um aviso discreto
        const div = document.createElement('div');
        div.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); padding:10px 20px; border-radius:20px; font-size:0.8rem; z-index:9999; text-align:center; width:90%; pointer-events:none; animation: fadeOut 5s forwards 5s; color: white; font-family: sans-serif;";
        div.innerHTML = "Dica: Para tela cheia, toque em <b>Compartilhar</b> <span style='font-size:1.2em'>⎋</span> e <b>Adicionar à Tela de Início</b>.";

        // CSS da animação
        const style = document.createElement('style');
        style.innerHTML = "@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; display: none;} }";
        document.head.appendChild(style);
        document.body.appendChild(div);
    }
};
