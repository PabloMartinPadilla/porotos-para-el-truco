import './style.css';
import { Game } from './game.js';
import { saveRecord, getAllRecords } from './storage.js';
import {
    showScreen,
    renderPorotos,
    animateLastPoroto,
    renderHistorialItem,
    renderHistorialSerie,
    renderHistorialStats,
    updateLimitDisplay,
} from './ui.js';
import {
    saveCustomRules,
    renderCustomRulesSaved,
    cerrarFormRegla,
    agregarReglaDinamica,
    collectReglas,
    showReglasPanel,
} from './rules.js';
import {
    playTap,
    playToggle,
    playPunto,
    playRestar,
    playVale,
    playGanador,
    isMuted,
    toggleMute,
} from './sounds.js';

// ── Estado global de la partida ──────────────────────────────
/** @type {Game|null} */
let game = null;

/** @type {{ callerIndex: number }|null} */
let pendingVale = null;

// ── Handlers ─────────────────────────────────────────────────

/**
 * Arranca el flujo de inicio: si está en modo competitivo muestra el modal
 * de reglas, si no lanza la partida directamente.
 */
function startGame() {
    const competitivo = document.getElementById('modo-competitivo').checked;
    if (competitivo) {
        renderCustomRulesSaved();
        document.getElementById('modal-reglas').classList.remove('hidden');
        return;
    }
    launchGame(null);
}

/**
 * Crea una nueva instancia de Game y navega a la pantalla de juego.
 * @param {object|null} reglas - Reglas competitivas acordadas, o null.
 */
function launchGame(reglas) {
    const name0   = document.getElementById('input-team0').value.trim() || 'Nosotros';
    const name1   = document.getElementById('input-team1').value.trim() || 'Ellos';
    const tipo0   = getTipo();
    const tipo1   = getTipo();
    const limitEl = document.querySelector('input[name="limit"]:checked');
    const limit   = limitEl ? +limitEl.value : 30;

    game = new Game({
        teamNames: [name0, name1],
        isDupla:   [tipo0 === 'dupla', tipo1 === 'dupla'],
        limit,
        reglas,
        serieId:   newSerieId(),
    });

    document.querySelectorAll('.team-name').forEach((el, i) => {
        el.textContent = game.teamNames[i];
    });
    updateLimitDisplay(game);

    renderPorotos(game, 0);
    renderPorotos(game, 1);

    const badge = document.getElementById('reglas-badge');
    if (reglas) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    showScreen('screen-juego');
}

/**
 * Suma un punto al equipo y actualiza el marcador. Termina la partida si hay ganador.
 * @param {number} teamIndex - Índice del equipo (0 o 1).
 */
function handlePunto(teamIndex) {
    const winner = game.addPoint(teamIndex);
    renderPorotos(game, teamIndex);
    animateLastPoroto(teamIndex);
    updateLimitDisplay(game);
    if (winner !== null) endGame(winner);
    else playPunto();
}

/**
 * Muestra el modal de confirmación del vale cuatro.
 * @param {number} callerIndex - Índice del equipo que cantó el vale.
 */
function handleVale(callerIndex) {
    pendingVale = { callerIndex };
    const callerName = game.teamNames[callerIndex];
    const rivalName  = game.teamNames[1 - callerIndex];
    document.getElementById('modal-caller-name').textContent = callerName;
    document.getElementById('modal-verb').textContent = game.isDupla[callerIndex] ? 'cantaron' : 'cantó';
    document.getElementById('modal-rival-name').textContent = rivalName;
    document.getElementById('modal-vale').classList.remove('hidden');
    playToggle();
}

/**
 * Confirma el vale cuatro: aplica los 4 puntos y cierra el modal.
 */
function acceptVale() {
    if (!pendingVale) return;
    const callerIndex = pendingVale.callerIndex;
    pendingVale = null;
    document.getElementById('modal-vale').classList.add('hidden');

    const winner = game.addVale(callerIndex);
    renderPorotos(game, callerIndex);
    setTimeout(() => animateLastPoroto(callerIndex), 30);
    updateLimitDisplay(game);
    if (winner !== null) endGame(winner);
    else playVale();
}

/**
 * Rechaza el vale cuatro y cierra el modal sin modificar el puntaje.
 */
function rejectVale() {
    pendingVale = null;
    document.getElementById('modal-vale').classList.add('hidden');
    playRestar();
}

/**
 * Guarda el registro de la partida y navega a la pantalla de resultado.
 * @param {number} winnerIndex - Índice del equipo ganador.
 */
function endGame(winnerIndex) {
    playGanador();
    const record = game.toRecord(winnerIndex);
    saveRecord(record);

    const loserIndex = 1 - winnerIndex;
    document.getElementById('resultado-winner-name').textContent  = game.teamNames[winnerIndex];
    document.getElementById('resultado-loser-name').textContent   = game.teamNames[loserIndex];
    document.getElementById('resultado-winner-score').textContent = game.scores[winnerIndex];
    document.getElementById('resultado-loser-score').textContent  = game.scores[loserIndex];

    const durmioEl = document.getElementById('resultado-durmio');
    if (record.durmioAfuera) {
        document.getElementById('resultado-durmio-name').textContent = game.teamNames[loserIndex];
        durmioEl.classList.remove('hidden');
    } else {
        durmioEl.classList.add('hidden');
    }

    // Score de serie
    const serieEl = document.getElementById('resultado-serie');
    if (game.serieId) {
        const serieRecords = getAllRecords().filter(function (r) { return r.serieId === game.serieId; });
        if (serieRecords.length > 1) {
            const wins = [0, 0];
            serieRecords.forEach(function (r) { wins[r.winner]++; });
            document.getElementById('resultado-serie-score').textContent =
                game.teamNames[0] + ' ' + wins[0] + ' \u2014 ' + wins[1] + ' ' + game.teamNames[1];
            serieEl.classList.remove('hidden');
        } else {
            serieEl.classList.add('hidden');
        }
    } else {
        serieEl.classList.add('hidden');
    }

    showScreen('screen-resultado');
}

/**
 * Carga y muestra la pantalla del historial de partidas.
 */
function showHistorial() {
    const records = getAllRecords();
    const lista   = document.getElementById('historial-lista');

    document.getElementById('historial-stats').innerHTML = renderHistorialStats(records);

    if (records.length === 0) {
        lista.innerHTML = '<p class="empty-msg">Todavía no hay partidas guardadas.</p>';
        showScreen('screen-historial');
        return;
    }

    // Agrupar por serieId; records sin serieId van solos
    const groups = [];
    const seen   = new Set();

    records.forEach(function (r, i) {
        if (seen.has(i)) return;
        if (!r.serieId) {
            groups.push({ records: [r], indices: [i] });
            seen.add(i);
            return;
        }
        const group = { records: [], indices: [] };
        records.forEach(function (r2, j) {
            if (r2.serieId === r.serieId) {
                group.records.push(r2);
                group.indices.push(j);
                seen.add(j);
            }
        });
        // Ordenar cronológicamente (índice más alto = más antigua en el array newest-first)
        const pairs = group.indices.map(function (idx, k) { return { r: group.records[k], idx: idx }; });
        pairs.sort(function (a, b) { return b.idx - a.idx; });
        group.records = pairs.map(function (p) { return p.r; });
        group.indices = pairs.map(function (p) { return p.idx; });
        groups.push(group);
    });

    lista.innerHTML = groups.map(function (g) {
        return g.records.length === 1
            ? renderHistorialItem(g.records[0], g.indices[0])
            : renderHistorialSerie(g.records, g.indices);
    }).join('');

    showScreen('screen-historial');
}

function launchRevanchaDesdeHistorial(record) {
    game = new Game({
        teamNames:  record.teamNames,
        isDupla:    record.isDupla   || [false, false],
        limit:      record.limit,
        reglas:     record.reglas    || null,
        isRevancha: true,
        serieId:    record.serieId   || newSerieId(),
    });

    document.querySelectorAll('.team-name').forEach(function (el, i) {
        el.textContent = game.teamNames[i];
    });
    updateLimitDisplay(game);
    renderPorotos(game, 0);
    renderPorotos(game, 1);

    document.getElementById('reglas-badge').classList.toggle('hidden', !game.reglas);

    showScreen('screen-juego');
}

const PLACEHOLDERS = {
    0: { solo: 'Yo',       dupla: 'Nosotros' },
    1: { solo: 'Vos',      dupla: 'Ellos'    },
};

function getTipo() {
    return document.querySelector('input[name="tipo"]:checked').value;
}

function updatePlaceholders() {
    const tipo = getTipo();
    [0, 1].forEach(function (i) {
        document.getElementById('input-team' + i).placeholder = PLACEHOLDERS[i][tipo];
    });
}

// ── Helpers ───────────────────────────────────────────────────
function newSerieId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Tema ──────────────────────────────────────────────────────
const THEME_KEY = 'truco-theme';

function isLight() {
    return localStorage.getItem(THEME_KEY) === 'light';
}

function applyTheme() {
    document.documentElement.dataset.theme = isLight() ? 'light' : '';
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // ── Botones de tema (inicio + juego, sincronizados) ──────
    const themeBtns = document.querySelectorAll('.btn-theme');
    function updateThemeBtns() {
        themeBtns.forEach(function (btn) {
            btn.title = isLight() ? 'Tema oscuro' : 'Tema claro';
        });
    }
    themeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            localStorage.setItem(THEME_KEY, isLight() ? 'dark' : 'light');
            applyTheme();
            updateThemeBtns();
            playTap();
        });
    });
    updateThemeBtns();

    // ── Botones de silencio (inicio + juego, sincronizados) ──
    const soundBtns = document.querySelectorAll('.btn-sound');
    function updateSoundBtns() {
        const muted = isMuted();
        soundBtns.forEach(function (btn) {
            btn.classList.toggle('muted', muted);
            btn.title = muted ? 'Activar sonido' : 'Silenciar';
        });
    }
    soundBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            toggleMute();
            updateSoundBtns();
        });
    });
    updateSoundBtns();

    // Toggle solo/dupla global
    document.querySelectorAll('input[name="tipo"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            playToggle();
            updatePlaceholders();
        });
    });
    updatePlaceholders();

    // Selección de límite en inicio
    document.querySelectorAll('input[name="limit"]').forEach(function (radio) {
        radio.addEventListener('change', function () { playToggle(); });
    });

    // Modo competitivo
    document.getElementById('modo-competitivo').addEventListener('change', function () {
        playToggle();
    });

    document.getElementById('btn-empezar').addEventListener('click', function () {
        playTap();
        startGame();
    });

    document.getElementById('btn-confirmar-reglas').addEventListener('click', function () {
        // En modo vista (showReglasPanel) el modal tiene data-vista-activa: lo cierra el onclick del botón
        if (document.getElementById('modal-reglas').dataset.vistaActiva) return;
        playTap();
        document.getElementById('modal-reglas').classList.add('hidden');
        const reglas = collectReglas();
        launchGame(reglas);
    });

    // × en reglas estáticas — oculta la fila por sesión
    document.querySelectorAll('.btn-regla-delete-static').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            playTap();
            btn.closest('.regla-item').remove();
        });
    });

    // Botón agregar regla
    document.getElementById('btn-agregar-regla').addEventListener('click', function () {
        playTap();
        document.getElementById('regla-add-form').classList.remove('hidden');
        document.getElementById('btn-agregar-regla').classList.add('hidden');
        document.getElementById('regla-add-titulo').focus();
    });

    document.getElementById('btn-regla-add-cancel').addEventListener('click', function () {
        playTap();
        cerrarFormRegla();
    });

    document.getElementById('btn-regla-add-confirm').addEventListener('click', function () {
        const titulo = document.getElementById('regla-add-titulo').value.trim();
        if (!titulo) { document.getElementById('regla-add-titulo').focus(); return; }
        playTap();
        const desc = document.getElementById('regla-add-desc').value.trim();
        agregarReglaDinamica(titulo, desc);
        saveCustomRules();
        cerrarFormRegla();
    });

    document.getElementById('reglas-badge').addEventListener('click', function (e) {
        e.stopPropagation();
        if (!game || !game.reglas) return;
        playTap();
        showReglasPanel(game);
    });

    document.querySelectorAll('.btn-punto').forEach(function (btn) {
        btn.addEventListener('click', function () { handlePunto(+btn.dataset.team); });
    });

    document.querySelectorAll('.btn-vale').forEach(function (btn) {
        btn.addEventListener('click', function () { handleVale(+btn.dataset.team); });
    });

    document.querySelectorAll('.btn-restar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const teamIndex = +btn.dataset.team;
            game.removePoint(teamIndex);
            renderPorotos(game, teamIndex);
            updateLimitDisplay(game);
            playRestar();
        });
    });

    document.getElementById('btn-ir-historial').addEventListener('click', function () {
        playTap();
        showHistorial();
    });
    document.getElementById('btn-ir-historial-juego').addEventListener('click', function () {
        playTap();
        showHistorial();
    });

    // Picker de límite en pantalla de juego
    document.getElementById('game-limit-display').addEventListener('click', function (e) {
        e.stopPropagation();
        playTap();
        document.getElementById('limit-picker').classList.toggle('hidden');
    });
    document.querySelectorAll('.limit-pick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            playToggle();
            game.limit = +btn.dataset.val;
            updateLimitDisplay(game);
            document.getElementById('limit-picker').classList.add('hidden');
            renderPorotos(game, 0);
            renderPorotos(game, 1);
            const winner = game.getWinner();
            if (winner !== null) endGame(winner);
        });
    });
    document.addEventListener('click', function () {
        document.getElementById('limit-picker').classList.add('hidden');
    });

    document.getElementById('btn-acepto-vale').addEventListener('click', acceptVale);
    document.getElementById('btn-rechazo-vale').addEventListener('click', rejectVale);

    document.getElementById('btn-revancha').addEventListener('click', function () {
        playTap();
        game = new Game({
            teamNames:  game.teamNames,
            isDupla:    game.isDupla,
            limit:      game.limit,
            reglas:     game.reglas,
            isRevancha: true,
            serieId:    game.serieId,
        });

        document.querySelectorAll('.team-name').forEach(function (el, i) {
            el.textContent = game.teamNames[i];
        });
        updateLimitDisplay(game);
        renderPorotos(game, 0);
        renderPorotos(game, 1);

        const badge = document.getElementById('reglas-badge');
        badge.classList.toggle('hidden', !game.reglas);

        showScreen('screen-juego');
    });

    document.getElementById('btn-nueva-partida').addEventListener('click', function () {
        playTap();
        game = null;
        showScreen('screen-inicio');
    });

    document.getElementById('btn-resultado-historial').addEventListener('click', function () {
        playTap();
        showHistorial();
    });

    document.getElementById('historial-lista').addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-hist-revancha');
        if (!btn) return;
        const records = getAllRecords();
        const record  = records[+btn.dataset.idx];
        if (!record) return;
        playTap();
        launchRevanchaDesdeHistorial(record);
    });

    document.getElementById('btn-historial-volver').addEventListener('click', function () {
        playTap();
        if (game && game.getWinner() === null) {
            showScreen('screen-juego');
        } else {
            showScreen('screen-inicio');
        }
    });

    // Botones "volver al inicio" desde cualquier pantalla
    ['btn-inicio-desde-juego', 'btn-inicio-desde-resultado', 'btn-inicio-desde-historial'].forEach(function (id) {
        document.getElementById(id).addEventListener('click', function () {
            playTap();
            game = null;
            showScreen('screen-inicio');
        });
    });

    document.getElementById('app-version').textContent = 'v' + __APP_VERSION__;

    showScreen('screen-inicio');

    // ── PWA: instalación ─────────────────────────────────────
    initPWAInstall();
});

/**
 * Muestra el banner de instalación según la plataforma:
 * - Android/Chrome: captura beforeinstallprompt y ofrece instalar con un botón
 * - iOS/Safari: muestra instrucciones de "Agregar a inicio"
 * - Ya instalada o escritorio: no muestra nada
 */
function initPWAInstall() {
    const banner   = document.getElementById('pwa-banner');
    const android  = document.getElementById('pwa-android');
    const dismiss  = document.getElementById('pwa-dismiss');
    const btnInst  = document.getElementById('btn-instalar');

    /** @type {BeforeInstallPromptEvent|null} */
    let deferredPrompt = null;

    const isStandalone = window.navigator.standalone === true
        || window.matchMedia('(display-mode: standalone)').matches;

    // Ya está instalada — no mostrar nada
    if (isStandalone) return;

    // Android/Chrome — esperar el evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        banner.classList.remove('hidden');
        android.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', function () {
        banner.classList.add('hidden');
        deferredPrompt = null;
    });

    btnInst.addEventListener('click', async function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            banner.classList.add('hidden');
        }
        deferredPrompt = null;
    });

    dismiss.addEventListener('click', function () {
        banner.classList.add('hidden');
    });
}
