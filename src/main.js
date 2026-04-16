import './style.css';
import { Game } from './game.js';
import { saveRecord, getAllRecords, clearRecords } from './storage.js';
import {
    showScreen,
    renderPorotos,
    animateLastPoroto,
    renderHistorialItem,
    renderHistorialSerie,
    buildEstadisticasData,
    renderMatchupCard,
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
    isVibrating,
    toggleVibrate,
} from './sounds.js';

// ── Helpers para confirmar salida de partida ─────────────────

/**
 * Muestra el modal de confirmación de salida.
 * @param {Function} onConfirm - Callback que se ejecuta si el usuario confirma.
 */
function confirmSalir(onConfirm) {
    const modal = document.getElementById('modal-salir');
    modal.classList.remove('hidden');
    modal._onConfirm = onConfirm;
}

// ── Estado global de la partida ──────────────────────────────
/** @type {Game|null} */
let game = null;

/** @type {object[]} Cache de datos de estadísticas por enfrentamiento */
let estadisticasData = [];

/** @type {{ callerIndex: number }|null} */
let pendingVale = null;

/**
 * Indica si el juego en curso fue lanzado desde el historial (revancha).
 * Permite que el gesto "volver atrás" regrese al historial en vez de inicio.
 */
let cameFromHistorial = false;

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
    cameFromHistorial = false;
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
 * Aplica el vale cuatro. En modo competitivo muestra confirmación; si no, suma directo.
 * @param {number} callerIndex - Índice del equipo que cantó el vale.
 */
function handleVale(callerIndex) {
    if (!game.reglas) {
        // Marcar los 4 índices como vale antes de animar
        const start = game.scores[callerIndex];
        for (let i = start; i < start + 4; i++) {
            game.valeIndices[callerIndex].add(i);
        }
        let step = 0;
        const interval = setInterval(function () {
            game.scores[callerIndex]++;
            renderPorotos(game, callerIndex);
            animateLastPoroto(callerIndex);
            updateLimitDisplay(game);
            step++;
            if (step === 4 || game.getWinner() !== null) {
                clearInterval(interval);
                const winner = game.getWinner();
                if (winner !== null) endGame(winner);
                else playVale();
            }
        }, 125);
        return;
    }
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

    const apuestaEl = document.getElementById('resultado-apuesta');
    const apuesta   = game.reglas && game.reglas.apuesta;
    if (apuesta) {
        document.getElementById('resultado-apuesta-texto').textContent = apuesta;
        apuestaEl.classList.remove('hidden');
    } else {
        apuestaEl.classList.add('hidden');
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

    celebrarGanador();
    showScreen('screen-resultado');
}

/**
 * Lanza mates desde todos los bordes y confeti en colores del tema.
 */
function celebrarGanador() {
    for (let i = 0; i < 15; i++) spawnMate();
    for (let i = 0; i < 55; i++) spawnConfetti();
}

function spawnMate() {
    const el = document.createElement('div');
    el.className = 'mate-particle';
    el.textContent = '🧉';

    const side = Math.floor(Math.random() * 3); // 0=abajo, 1=izquierda, 2=derecha
    if (side === 0) {
        el.style.left   = (5  + Math.random() * 90) + '%';
        el.style.bottom = (Math.random() * 15) + '%';
        el.style.setProperty('--tx', (Math.random() * 30 - 15) + 'vw');
        el.style.setProperty('--ty', -(45 + Math.random() * 30) + 'vh');
    } else if (side === 1) {
        el.style.left   = (-4 + Math.random() * 8) + '%';
        el.style.bottom = (10 + Math.random() * 65) + '%';
        el.style.setProperty('--tx', (25 + Math.random() * 35) + 'vw');
        el.style.setProperty('--ty', -(15 + Math.random() * 40) + 'vh');
    } else {
        el.style.left   = (92 + Math.random() * 8) + '%';
        el.style.bottom = (10 + Math.random() * 65) + '%';
        el.style.setProperty('--tx', -(25 + Math.random() * 35) + 'vw');
        el.style.setProperty('--ty', -(15 + Math.random() * 40) + 'vh');
    }

    el.style.fontSize          = (1.3 + Math.random() * 1.2) + 'rem';
    el.style.animationDelay    = (Math.random() * 0.3) + 's';
    el.style.animationDuration = (1.8 + Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', function () { el.remove(); });
}

function spawnConfetti() {
    const colors = ['#d4a017', '#8b2500', '#c04010', '#3d5120', '#e8d5b0', '#a07810'];
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.left       = (15 + Math.random() * 70) + '%';
    el.style.top        = (20 + Math.random() * 50) + '%';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.width      = (5  + Math.random() * 6)  + 'px';
    el.style.height     = (8  + Math.random() * 8)  + 'px';
    el.style.setProperty('--tx',  (Math.random() * 240 - 120) + 'px');
    el.style.setProperty('--ty',  (Math.random() * 240 - 120) + 'px');
    el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    el.style.animationDelay    = (Math.random() * 0.3) + 's';
    el.style.animationDuration = (1.8 + Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', function () { el.remove(); });
}

/**
 * Carga y muestra la pantalla del historial de partidas.
 */
function showHistorial() {
    const records = getAllRecords();
    const lista   = document.getElementById('historial-lista');

    const footer = document.getElementById('historial-footer');

    if (records.length === 0) {
        lista.innerHTML = '<p class="empty-msg">Todavía no hay partidas guardadas.</p>';
        footer.classList.add('hidden');
        showScreen('screen-historial');
        return;
    }

    footer.classList.remove('hidden');

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
    cameFromHistorial = true;
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

/**
 * Carga y muestra la pantalla de estadísticas por enfrentamiento.
 */
function showEstadisticas() {
    estadisticasData = buildEstadisticasData(getAllRecords());
    document.getElementById('estadisticas-buscar').value = '';
    renderEstadisticasLista('');
    showScreen('screen-estadisticas');
}

/**
 * Renderiza (o filtra) la lista de tarjetas de enfrentamiento.
 * @param {string} query - Texto de búsqueda (vacío = mostrar todo).
 */
function renderEstadisticasLista(query) {
    const lista = document.getElementById('estadisticas-lista');
    const q = query.trim().toLowerCase();
    const filtered = q
        ? estadisticasData.filter(function (m) {
            return m.teamNames.some(function (n) { return n.toLowerCase().includes(q); });
          })
        : estadisticasData;

    if (estadisticasData.length === 0) {
        lista.innerHTML = '<p class="empty-msg">Todavía no hay partidas con nombres personalizados.</p>';
        return;
    }
    if (filtered.length === 0) {
        lista.innerHTML = '<p class="empty-msg">No se encontraron resultados.</p>';
        return;
    }
    lista.innerHTML = filtered.map(renderMatchupCard).join('');
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

    // ── Botones de vibración (inicio + juego, sincronizados) ──
    const vibrateBtns = document.querySelectorAll('.btn-vibrate');
    function updateVibrateBtns() {
        const off = !isVibrating();
        vibrateBtns.forEach(function (btn) {
            btn.classList.toggle('muted', off);
            btn.title = off ? 'Activar vibración' : 'Apagar vibración';
        });
    }
    vibrateBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            toggleVibrate();
            updateVibrateBtns();
            playTap();
        });
    });
    updateVibrateBtns();

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

    document.getElementById('btn-reglas-cerrar').addEventListener('click', function () {
        playTap();
        const modal = document.getElementById('modal-reglas');
        delete modal.dataset.vistaActiva;
        modal.classList.add('hidden');
        document.getElementById('btn-confirmar-reglas').textContent = 'Listo, empezar';
        document.getElementById('btn-confirmar-reglas').onclick = null;
        modal.querySelectorAll('.regla-check').forEach(function (el) { el.disabled = false; });
        document.getElementById('input-apuesta').disabled = false;
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
        cameFromHistorial = false;
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

    document.getElementById('btn-ir-estadisticas').addEventListener('click', function () {
        playTap();
        showEstadisticas();
    });

    document.getElementById('btn-estadisticas-volver').addEventListener('click', function () {
        playTap();
        showHistorial();
    });

    document.getElementById('estadisticas-buscar').addEventListener('input', function () {
        renderEstadisticasLista(this.value);
    });

    // Modal confirmar borrar historial
    document.getElementById('btn-borrar-historial').addEventListener('click', function () {
        playTap();
        document.getElementById('modal-borrar-historial').classList.remove('hidden');
    });
    document.getElementById('btn-borrar-confirmar').addEventListener('click', function () {
        document.getElementById('modal-borrar-historial').classList.add('hidden');
        clearRecords();
        showHistorial();
    });
    document.getElementById('btn-borrar-cancelar').addEventListener('click', function () {
        playTap();
        document.getElementById('modal-borrar-historial').classList.add('hidden');
    });

    // Modal confirmar salir
    document.getElementById('btn-salir-confirmar').addEventListener('click', function () {
        const modal = document.getElementById('modal-salir');
        modal.classList.add('hidden');
        const cb = modal._onConfirm;
        modal._onConfirm = null;
        if (cb) cb();
    });
    document.getElementById('btn-salir-cancelar').addEventListener('click', function () {
        playTap();
        document.getElementById('modal-salir').classList.add('hidden');
        document.getElementById('modal-salir')._onConfirm = null;
    });

    // Botón ⌂ desde pantalla de juego — pide confirmación si hay partida activa
    document.getElementById('btn-inicio-desde-juego').addEventListener('click', function () {
        playTap();
        if (game && game.getWinner() === null) {
            confirmSalir(function () { game = null; showScreen('screen-inicio'); });
        } else {
            game = null;
            showScreen('screen-inicio');
        }
    });

    // Botones "volver al inicio" desde resultado, historial y estadísticas (sin partida activa)
    ['btn-inicio-desde-resultado', 'btn-inicio-desde-historial', 'btn-inicio-desde-estadisticas'].forEach(function (id) {
        document.getElementById(id).addEventListener('click', function () {
            playTap();
            game = null;
            showScreen('screen-inicio');
        });
    });

    document.getElementById('app-version').textContent = 'v' + __APP_VERSION__;

    showScreen('screen-inicio');

    // ── Navegación con gesto "volver" (Android / PWA) ────────
    // Pushea un estado centinela para que el primer gesto de volver no cierre la app.
    history.pushState(null, '');

    window.addEventListener('popstate', function () {
        var current = (document.querySelector('.screen.active') || {}).id || 'screen-inicio';

        switch (current) {
            case 'screen-estadisticas':
                // Volver desde estadísticas → historial
                showHistorial();
                history.pushState(null, '');
                break;

            case 'screen-juego':
                if (cameFromHistorial && game && game.getWinner() === null) {
                    // Revancha lanzada desde historial: volver al historial con la partida activa
                    cameFromHistorial = false;
                    showHistorial();
                    history.pushState(null, '');
                } else if (game && game.getWinner() === null) {
                    // Partida en curso: pedir confirmación antes de descartar
                    history.pushState(null, '');
                    confirmSalir(function () { game = null; showScreen('screen-inicio'); });
                } else {
                    cameFromHistorial = false;
                    game = null;
                    showScreen('screen-inicio');
                }
                break;

            default:
                // historial, resultado, o inicio → ir al inicio
                cameFromHistorial = false;
                if (current !== 'screen-inicio') { game = null; }
                showScreen('screen-inicio');
                break;
        }
    });

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
