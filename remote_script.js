// remote_script.js
// Remote-plate: conecta un ordenador (host) con un smartphone mediante un código de 4 dígitos.
// NOTA: para conexión real entre dispositivos necesitas un backend (ej. Firebase Realtime DB).
// Este archivo implementa:
//  - UI de Start / Connect / Stop
//  - Generación del código de 4 dígitos
//  - Envío/recepción de "selección de key" (dos modos):
//      a) Si configuras Firebase (ver firebaseConfig abajo) -> se usa Firebase Realtime DB para señalización.
//      b) Si no configuras Firebase -> modo demo con BroadcastChannel (solo pruebas locales en mismo navegador).
//  - Copiar al portapapeles en el host y reproducir voz (solo en host) usando Web Speech API.
//  - Guardado de títulos/descripciones en localStorage (como tu app original).
//
// Librerías / referencias TTS: Web Speech API (nativa) - MDN: https://developer.mozilla.org/docs/Web/API/SpeechSynthesis
// También puedes usar ResponsiveVoice (servicio externo): https://responsivevoice.org/
// (ver README en el encabezado de tu proyecto).
//



// --- CONFIG: para modo real pega aquí tu firebase config (opcional) ---
//const firebaseConfig = null;
/*
Ejemplo (reemplaza por tu config):
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://<tu-project>.firebaseio.com",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
*/
// --------------------------------------------------------------------



const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXX",
    authDomain: "remote-plate.firebaseapp.com",
    projectId: "remote-plate",
    storageBucket: "remote-plate.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    databaseURL: "https://remote-plate-default-rtdb.firebaseio.com"
};


/* ===========================
   Variables y elementos UI
   =========================== */
const startBtn = document.getElementById('start-btn');
const connectBtn = document.getElementById('connect-btn');
const stopBtn = document.getElementById('stop-btn');
const pairCodeEl = document.getElementById('pair-code');
const connStatusEl = document.getElementById('connection-status');
const keys = Array.from(document.querySelectorAll('.key'));
const soundToggle = document.getElementById('sound-toggle');
const speakerIcon = document.getElementById('speaker-icon');

const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
const modalInput = document.getElementById('modal-input');
const modalDescription = document.getElementById('modal-description');
const saveBtn = document.getElementById('save-title');
const copySound = document.getElementById('copy-sound');

let keyData = {};
const STORAGE_KEY = 'remoteplateKeyData';

// connection state
let isHost = false; // true en la PC que presiona Start
let connected = false;
let currentPairCode = null;
let lastCopiedKey = null;
let lastCopyTime = 0;
const COPY_COOLDOWN = 2000;
const COPY_DELAY = 300;

// signaling channels
let bc = null; // BroadcastChannel fallback
let firebaseApp = null;
let firebaseDBRef = null;
let firebaseListener = null;

/* ===========================
   Utilidades
   =========================== */
function genCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function now() { return Date.now(); }

/* ===========================
   LocalStorage (guardar/cargar)
   =========================== */
function guardarConfiguracion() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keyData));
}
function cargarConfiguracion() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            keyData = JSON.parse(raw);
            Object.keys(keyData).forEach(num => {
                const el = document.querySelector(`.key[data-key="${num}"] .key-title`);
                if (el) el.textContent = keyData[num].title || el.textContent;
            });
        } catch (e) { console.warn('Error parsing config', e); }
    } else {
        // inicializar con títulos por defecto
        document.querySelectorAll('.key').forEach(k => {
            const n = k.getAttribute('data-key');
            const title = k.querySelector('.key-title')?.textContent || `Name ${n}`;
            keyData[n] = { title, description: "" };
        });
        guardarConfiguracion();
    }
}

/* ===========================
   Modal edición (como en tu app)
   =========================== */
let currentTitleElement = null;
document.querySelectorAll('.key').forEach(key => {
    const title = key.querySelector('.key-title');
    const number = key.getAttribute('data-key');
    if (!title) return;
    title.addEventListener('click', (e) => {
        e.stopPropagation();
        currentTitleElement = title;
        modalInput.value = title.textContent;
        modalDescription.value = keyData[number]?.description || "";
        modal.style.display = 'block';
        modalInput.focus();
    });
});
closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
saveBtn.addEventListener('click', () => {
    if (currentTitleElement && modalInput.value.trim() !== '') {
        const parentKey = currentTitleElement.closest('.key');
        const keyNumber = parentKey.getAttribute('data-key');
        currentTitleElement.textContent = modalInput.value.trim();
        keyData[keyNumber] = { title: modalInput.value.trim(), description: modalDescription.value.trim() };
        guardarConfiguracion();
    }
    modal.style.display = 'none';
});
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

/* ===========================
   TTS: Web Speech API (voz femenina en inglés si está disponible)
   =========================== */
let synth = window.speechSynthesis;
let voicesList = [];
let preferredVoice = null;
function loadVoices() {
    voicesList = synth.getVoices();
    // prefer english female voice
    preferredVoice = voicesList.find(v => /en(-|_)?/i.test(v.lang) && /female|F|Woman/i.test((v.name + ' ' + (v.voiceURI || '')))) ||
        voicesList.find(v => /en(-|_)?/i.test(v.lang)) ||
        voicesList[0] || null;
}
if (synth) {
    loadVoices();
    // voices may load asynchronously
    if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
}

let soundEnabled = (localStorage.getItem('remoteplate_sound') !== 'false');
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('remoteplate_sound', soundEnabled);
    speakerIcon.style.filter = soundEnabled ? '' : 'grayscale(1) brightness(0.8)';
}
soundToggle.addEventListener('click', toggleSound);
if (!soundEnabled) speakerIcon.style.filter = 'grayscale(1) brightness(0.8)';

function speakText(text) {
    if (!soundEnabled) return;
    if (!synth) return;
    const utt = new SpeechSynthesisUtterance(text);
    if (preferredVoice) utt.voice = preferredVoice;
    utt.lang = 'en-US';
    // volume/pitch/rate defaults are fine
    synth.cancel(); // avoid overlapping
    synth.speak(utt);
}

/* ===========================
   Copiar descripción (host) y reproducir TTS
   =========================== */
function copiarDescripcionKey(numeroKey) {
    const nowTime = now();
    if (numeroKey === lastCopiedKey && (nowTime - lastCopyTime) < COPY_COOLDOWN) return;
    const keyElem = document.querySelector(`.key[data-key="${numeroKey}"]`);
    if (!keyElem) return;
    const descripcion = keyData[numeroKey]?.description || "";
    setTimeout(() => {
        document.querySelectorAll('.key').forEach(k => k.classList.remove('active'));
        keyElem.classList.add('active');
        if (descripcion.trim() !== "") {
            navigator.clipboard.writeText(descripcion).then(() => {
                lastCopiedKey = numeroKey;
                lastCopyTime = now();
                // reproduce sonido/voz SOLO si somos host (la PC que inició la sesión)
                if (isHost) {
                    // prefer TTS (voice)
                    speakText(`${numeroKey}`);
                    // optional short beep (if user provides an audio src in #copy-sound)
                    if (copySound && copySound.src) { try { copySound.currentTime = 0; copySound.play().catch(() => { }); } catch (e) { } }
                }
            }).catch(err => console.warn('No se pudo copiar al portapapeles', err));
        } else {
            lastCopiedKey = numeroKey;
            lastCopyTime = now();
        }
        setTimeout(() => keyElem.classList.remove('active'), 1800);
    }, COPY_DELAY);
}

/* ===========================
   UI interactions: click en keypad (desde smartphone) -> enviar mensaje al host
   =========================== */
keys.forEach(k => {
    k.addEventListener('click', () => {
        const num = k.getAttribute('data-key');
        // si somos host, simplemente simular selección local:
        if (isHost && connected) {
            // host tocó su propia UI
            enviarSeleccion(num);
            copiarDescripcionKey(num);
            return;
        }
        // si no somos host (es smartphone), enviamos seleccion al host
        enviarSeleccion(num);
    });
});

/* ===========================
   Conexión & señalización
   - Modo Firebase (si firebaseConfig != null)
   - Fallback: BroadcastChannel (solo demo mismo navegador)
   =========================== */
async function setupFirebase() {
    if (!firebaseConfig) return false;
    // lazy-load firebase scripts
    try {
        await loadScript('https://www.gstatic.com/firebasejs/9.24.0/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/9.24.0/firebase-database-compat.js');
        // initialize
        firebaseApp = firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        firebaseDBRef = database.ref('remoteplate_sessions');
        console.log('Firebase inicializado (Realtime DB).');
        return true;
    } catch (err) {
        console.warn('No se pudo cargar Firebase', err);
        return false;
    }
}

function loadScript(src) {
    return new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => res();
        s.onerror = (e) => rej(e);
        document.head.appendChild(s);
    });
}

async function startSession() {
    // Start = generar código y esperar que smartphone se conecte
    currentPairCode = genCode();
    isHost = true;
    connected = false;
    pairCodeEl.textContent = currentPairCode;
    connStatusEl.textContent = 'Waiting for device...';
    pairCodeEl.style.color = '#9aa';
    const hasFirebase = await setupFirebase();
    if (hasFirebase) {
        // create session node (overwrite)
        await firebaseDBRef.child(currentPairCode).set({ hostOnline: true, timestamp: Date.now() });
        // listen for incoming selections
        firebaseListener = firebaseDBRef.child(currentPairCode + '/events');
        firebaseListener.on('child_added', snap => {
            const val = snap.val();
            if (val && val.type === 'select' && val.key != null) {
                // host receives selection: copy + voice
                copiarDescripcionKey(val.key);
            }
        });
        connected = true;
        connStatusEl.textContent = 'Connected (via Firebase)';
    } else {
        // fallback: BroadcastChannel demo
        try {
            bc = new BroadcastChannel('remoteplate_channel_' + currentPairCode);
            bc.onmessage = (ev) => {
                const data = ev.data;
                if (data && data.type === 'select' && data.key != null) {
                    copiarDescripcionKey(data.key);
                }
            };
            // show hint to user: to connect from phone open page and click Connect + enter code
            connStatusEl.textContent = 'Ready (demo mode). Use same browser to test.';
            connected = true;
        } catch (e) {
            console.warn('BroadcastChannel no disponible', e);
            connStatusEl.textContent = 'No signaling available. Configure Firebase for real connections.';
            connected = false;
        }
    }
}

async function connectDevice() {
    // Connect: used by smartphone: solicita el código y se "conecta"
    // Pedimos código al usuario (simple prompt para no bloquear la UI)
    const code = prompt('Enter the 4-digit code shown in the PC (e.g. 1234):');
    if (!code) return;
    currentPairCode = code.trim();
    isHost = false;
    // try firebase
    if (firebaseConfig) {
        const ok = await setupFirebase();
        if (ok) {
            // mark connected in DB (simple)
            firebaseDBRef.child(currentPairCode).update({ clientOnline: true, clientTimestamp: Date.now() });
            // set listener for host state (optional)
            connStatusEl.textContent = 'Connected (via Firebase)';
            connected = true;
            return;
        }
    }
    // fallback: try opening BroadcastChannel with that code (only works in same browser)
    try {
        bc = new BroadcastChannel('remoteplate_channel_' + currentPairCode);
        bc.onmessage = (ev) => {
            // smartphone may also show received messages if needed
            // no-op
        };
        connStatusEl.textContent = 'Connected (demo mode)';
        connected = true;
    } catch (e) {
        connStatusEl.textContent = 'Cannot connect (no signaling).';
        connected = false;
    }
}

async function stopSession() {
    // stop any listeners / cleanup
    if (firebaseListener && firebaseListener.off) firebaseListener.off();
    if (firebaseConfig && firebaseDBRef && currentPairCode) {
        try { await firebaseDBRef.child(currentPairCode).remove(); } catch (e) { }
    }
    if (bc) { try { bc.close(); } catch (e) { } bc = null; }
    currentPairCode = null;
    isHost = false;
    connected = false;
    pairCodeEl.textContent = '—';
    connStatusEl.textContent = 'Not connected';
}

/* Enviar selección (desde smartphone) */
async function enviarSeleccion(keyNumber) {
    if (!currentPairCode) {
        // no paired -> show quick message
        console.warn('No paired session');
        return;
    }
    const payload = { type: 'select', key: keyNumber, ts: Date.now() };

    if (firebaseConfig && firebaseDBRef) {
        // push event to DB
        try {
            await firebaseDBRef.child(currentPairCode + '/events').push(payload);
        } catch (e) {
            console.warn('Error writing to Firebase', e);
        }
    } else if (bc) {
        try { bc.postMessage(payload); } catch (e) { console.warn('BroadcastChannel post failed', e); }
    } else {
        console.warn('No signaling available. Configure Firebase for cross-device use.');
    }
}

/* ===========================
   Botones UI
   =========================== */
startBtn.addEventListener('click', async () => {
    await stopSession(); // reset any previous
    await startSession();
});

connectBtn.addEventListener('click', async () => {
    await connectDevice();
});

stopBtn.addEventListener('click', async () => {
    await stopSession();
});

/* ===========================
   Inicialización
   =========================== */
cargarConfiguracion();

// Display initial titles in DOM (in case loaded changed)
Object.keys(keyData).forEach(num => {
    const k = document.querySelector(`.key[data-key="${num}"] .key-title`);
    if (k) k.textContent = keyData[num].title || k.textContent;
});

// simple UI: click en header sound toggle toggled earlier
// prefetch voices (already done at top)
setTimeout(() => { if (speechSynthesis) speechSynthesis.getVoices(); }, 200);

// helper: restore pair code if present in URL (optional)
(function checkUrlForCode() {
    const u = new URL(location.href);
    const codeParam = u.searchParams.get('code');
    if (codeParam) {
        // if user opens page with ?code=1234, prefill pair UI
        currentPairCode = codeParam;
        pairCodeEl.textContent = currentPairCode;
        connStatusEl.textContent = 'Open with code in URL';
    }
})();
