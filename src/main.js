import './style.css';
import { Game } from './game.js';
import { saveRecord, getAllRecords } from './storage.js';
import {
    showScreen,
    renderPorotos,
    animateLastPoroto,
    renderHistorialItem,
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
}

/**
 * Rechaza el vale cuatro y cierra el modal sin modificar el puntaje.
 */
function rejectVale() {
    pendingVale = null;
    document.getElementById('modal-vale').classList.add('hidden');
}

/**
 * Guarda el registro de la partida y navega a la pantalla de resultado.
 * @param {number} winnerIndex - Índice del equipo ganador.
 */
function endGame(winnerIndex) {
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

    showScreen('screen-resultado');
}

/**
 * Carga y muestra la pantalla del historial de partidas.
 */
function showHistorial() {
    const records = getAllRecords();
    const lista   = document.getElementById('historial-lista');

    if (records.length === 0) {
        lista.innerHTML = '<p class="empty-msg">Todavía no hay partidas guardadas.</p>';
    } else {
        lista.innerHTML = records.map(renderHistorialItem).join('');
    }

    showScreen('screen-historial');
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

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // Toggle solo/dupla global
    document.querySelectorAll('input[name="tipo"]').forEach(function (radio) {
        radio.addEventListener('change', updatePlaceholders);
    });
    updatePlaceholders();

    document.getElementById('btn-empezar').addEventListener('click', startGame);

    document.getElementById('btn-confirmar-reglas').addEventListener('click', function () {
        document.getElementById('modal-reglas').classList.add('hidden');
        const reglas = collectReglas();
        launchGame(reglas);
    });

    // × en reglas estáticas — oculta la fila por sesión
    document.querySelectorAll('.btn-regla-delete-static').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            btn.closest('.regla-item').remove();
        });
    });

    // Botón agregar regla
    document.getElementById('btn-agregar-regla').addEventListener('click', function () {
        document.getElementById('regla-add-form').classList.remove('hidden');
        document.getElementById('btn-agregar-regla').classList.add('hidden');
        document.getElementById('regla-add-titulo').focus();
    });

    document.getElementById('btn-regla-add-cancel').addEventListener('click', function () {
        cerrarFormRegla();
    });

    document.getElementById('btn-regla-add-confirm').addEventListener('click', function () {
        const titulo = document.getElementById('regla-add-titulo').value.trim();
        if (!titulo) { document.getElementById('regla-add-titulo').focus(); return; }
        const desc = document.getElementById('regla-add-desc').value.trim();
        agregarReglaDinamica(titulo, desc);
        saveCustomRules();
        cerrarFormRegla();
    });

    document.getElementById('reglas-badge').addEventListener('click', function (e) {
        e.stopPropagation();
        if (!game || !game.reglas) return;
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
        });
    });

    document.getElementById('btn-ir-historial').addEventListener('click', showHistorial);
    document.getElementById('btn-ir-historial-juego').addEventListener('click', showHistorial);

    // Picker de límite en pantalla de juego
    document.getElementById('game-limit-display').addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('limit-picker').classList.toggle('hidden');
    });
    document.querySelectorAll('.limit-pick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
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
        game = new Game({
            teamNames:  game.teamNames,
            isDupla:    game.isDupla,
            limit:      game.limit,
            reglas:     game.reglas,
            isRevancha: true,
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
        game = null;
        showScreen('screen-inicio');
    });

    document.getElementById('btn-resultado-historial').addEventListener('click', showHistorial);

    document.getElementById('btn-historial-volver').addEventListener('click', function () {
        if (game && game.getWinner() === null) {
            showScreen('screen-juego');
        } else {
            showScreen('screen-inicio');
        }
    });

    // Botones "volver al inicio" desde cualquier pantalla
    ['btn-inicio-desde-juego', 'btn-inicio-desde-resultado', 'btn-inicio-desde-historial'].forEach(function (id) {
        document.getElementById(id).addEventListener('click', function () {
            game = null;
            showScreen('screen-inicio');
        });
    });

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
