// ── Storage ──────────────────────────────────────────────────
const STORAGE_KEY = 'truco_historial';

function saveRecord(record) {
    const list = getAllRecords();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getAllRecords() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

// ── Game ──────────────────────────────────────────────────────
class Game {
    constructor({ teamNames, isDupla, limit, reglas }) {
        this.teamNames = teamNames;
        this.isDupla   = isDupla || [false, false];
        this.limit = limit;
        this.reglas = reglas || null;
        this.scores = [0, 0];
        this.valeIndices = [new Set(), new Set()];
    }

    addPoint(teamIndex) {
        this.scores[teamIndex]++;
        return this.getWinner();
    }

    addVale(callerIndex) {
        const start = this.scores[callerIndex];
        for (let i = start; i < start + 4; i++) {
            this.valeIndices[callerIndex].add(i);
        }
        this.scores[callerIndex] += 4;
        return this.getWinner();
    }

    getWinner() {
        for (let i = 0; i < 2; i++) {
            if (this.scores[i] >= this.limit) return i;
        }
        return null;
    }

    isVale(teamIndex, poroIndex) {
        return this.valeIndices[teamIndex].has(poroIndex);
    }

    loserDurmioAfuera(winnerIndex) {
        return this.scores[1 - winnerIndex] < this.limit / 2;
    }

    toRecord(winnerIndex) {
        return {
            date: new Date().toISOString(),
            teamNames: [...this.teamNames],
            scores: [...this.scores],
            winner: winnerIndex,
            limit: this.limit,
            durmioAfuera: this.loserDurmioAfuera(winnerIndex),
            reglas: this.reglas || null,
        };
    }
}

// ── App ───────────────────────────────────────────────────────
let game = null;
let pendingVale = null;

function updateLimitDisplay() {
    const btn = $('game-limit-display');
    btn.textContent = 'hasta ' + game.limit + ' ▾';
    // Marcar activo en el picker
    document.querySelectorAll('.limit-pick-btn').forEach(function (b) {
        b.classList.toggle('active', +b.dataset.val === game.limit);
    });
}

const $ = id => document.getElementById(id);

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
}

// --- Inicio ---
function startGame() {
    const competitivo = $('modo-competitivo').checked;
    if (competitivo) {
        renderCustomRulesSaved();
        $('modal-reglas').classList.remove('hidden');
        return;
    }
    launchGame(null);
}

function launchGame(reglas) {
    const name0  = $('input-team0').value.trim() || 'Nosotros';
    const name1  = $('input-team1').value.trim() || 'Ellos';
    const tipo0  = document.querySelector('input[name="tipo0"]:checked').value;
    const tipo1  = document.querySelector('input[name="tipo1"]:checked').value;
    const limitEl = document.querySelector('input[name="limit"]:checked');
    const limit  = limitEl ? +limitEl.value : 30;

    game = new Game({ teamNames: [name0, name1], isDupla: [tipo0 === 'dupla', tipo1 === 'dupla'], limit, reglas });

    document.querySelectorAll('.team-name').forEach((el, i) => {
        el.textContent = game.teamNames[i];
    });
    updateLimitDisplay();

    renderPorotos(0);
    renderPorotos(1);

    // Mostrar badge de reglas si hay modo competitivo
    const badge = $('reglas-badge');
    if (reglas) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    showScreen('screen-juego');
}

// --- Porotos ---
function renderGrupos(container, teamIndex, fromIdx, count) {
    const completos = Math.floor(count / 5);
    const resto     = count % 5;

    for (let g = 0; g < completos; g++) {
        const group = document.createElement('div');
        group.className = 'poroto-group grupo-completo';
        for (let i = 0; i < 5; i++) {
            const idx = fromIdx + g * 5 + i;
            const p = document.createElement('div');
            p.className = 'poroto' + (game.isVale(teamIndex, idx) ? ' vale' : '');
            group.appendChild(p);
        }
        container.appendChild(group);
    }

    if (resto > 0) {
        const group = document.createElement('div');
        group.className = 'poroto-group grupo-fila';
        for (let i = 0; i < resto; i++) {
            const idx = fromIdx + completos * 5 + i;
            const p = document.createElement('div');
            p.className = 'poroto' + (game.isVale(teamIndex, idx) ? ' vale' : '');
            group.appendChild(p);
        }
        container.appendChild(group);
    }
}

function renderPorotos(teamIndex) {
    const container = document.querySelector('.team[data-team="' + teamIndex + '"] .porotos-container');
    const score = game.scores[teamIndex];

    container.innerHTML = '';

    const showBuenas = game.limit > 15;
    const buenasThreshold = Math.ceil(game.limit / 2);

    if (showBuenas && score >= buenasThreshold) {
        // Malas arriba
        renderGrupos(container, teamIndex, 0, buenasThreshold);

        // Divider
        const divider = document.createElement('div');
        divider.className = 'buenas-divider';
        divider.textContent = 'buenas';
        container.appendChild(divider);

        // Buenas abajo
        const buenasCount = score - buenasThreshold;
        if (buenasCount > 0) {
            renderGrupos(container, teamIndex, buenasThreshold, buenasCount);
        }
    } else {
        renderGrupos(container, teamIndex, 0, score);
    }

    document.querySelector('.team[data-team="' + teamIndex + '"] .score-number').textContent = score;
}

function animateLastPoroto(teamIndex) {
    const container = document.querySelector('.team[data-team="' + teamIndex + '"] .porotos-container');
    const groups = container.querySelectorAll('.poroto-group');
    if (!groups.length) return;
    const lastGroup = groups[groups.length - 1];
    const porotos = lastGroup.querySelectorAll('.poroto');
    if (!porotos.length) return;
    const last = porotos[porotos.length - 1];
    last.classList.add('poroto-new');
    setTimeout(() => last.classList.remove('poroto-new'), 500);
}

// --- Punto ---
function handlePunto(teamIndex) {
    const winner = game.addPoint(teamIndex);
    renderPorotos(teamIndex);
    animateLastPoroto(teamIndex);
    if (winner !== null) endGame(winner);
}

// --- Vale cuatro ---
function handleVale(callerIndex) {
    pendingVale = { callerIndex };
    const callerName = game.teamNames[callerIndex];
    const rivalName  = game.teamNames[1 - callerIndex];
    $('modal-caller-name').textContent = callerName;
    $('modal-verb').textContent = game.isDupla[callerIndex] ? 'cantaron' : 'cantó';
    $('modal-rival-name').textContent = rivalName;
    $('modal-vale').classList.remove('hidden');
}

function acceptVale() {
    if (!pendingVale) return;
    const callerIndex = pendingVale.callerIndex;
    pendingVale = null;
    $('modal-vale').classList.add('hidden');

    const winner = game.addVale(callerIndex);
    renderPorotos(callerIndex);
    setTimeout(() => animateLastPoroto(callerIndex), 30);
    if (winner !== null) endGame(winner);
}

function rejectVale() {
    pendingVale = null;
    $('modal-vale').classList.add('hidden');
}

// --- Fin de partida ---
function endGame(winnerIndex) {
    const record = game.toRecord(winnerIndex);
    saveRecord(record);

    const loserIndex = 1 - winnerIndex;
    $('resultado-winner-name').textContent = game.teamNames[winnerIndex];
    $('resultado-loser-name').textContent = game.teamNames[loserIndex];
    $('resultado-winner-score').textContent = game.scores[winnerIndex];
    $('resultado-loser-score').textContent = game.scores[loserIndex];

    const durmioEl = $('resultado-durmio');
    if (record.durmioAfuera) {
        $('resultado-durmio-name').textContent = game.teamNames[loserIndex];
        durmioEl.classList.remove('hidden');
    } else {
        durmioEl.classList.add('hidden');
    }

    showScreen('screen-resultado');
}

// --- Reglas dinámicas persistentes ---
const REGLAS_CUSTOM_KEY = 'truco_reglas_custom';
let reglaIdCounter = 0;

function saveCustomRules() {
    const items = [];
    document.querySelectorAll('.regla-dinamica').forEach(function (item) {
        items.push({ nombre: item.dataset.nombre, desc: item.dataset.desc });
    });
    localStorage.setItem(REGLAS_CUSTOM_KEY, JSON.stringify(items));
}

function loadCustomRules() {
    try { return JSON.parse(localStorage.getItem(REGLAS_CUSTOM_KEY)) || []; }
    catch { return []; }
}

function renderCustomRulesSaved() {
    // Limpiar dinámicas anteriores del DOM
    document.querySelectorAll('.regla-dinamica').forEach(function (el) { el.remove(); });
    reglaIdCounter = 0;
    loadCustomRules().forEach(function (r) { agregarReglaDinamica(r.nombre, r.desc); });
}

function cerrarFormRegla() {
    $('regla-add-form').classList.add('hidden');
    $('btn-agregar-regla').classList.remove('hidden');
    $('regla-add-titulo').value = '';
    $('regla-add-desc').value   = '';
}

function agregarReglaDinamica(nombre, desc) {
    const id  = 'regla-din-' + (++reglaIdCounter);
    const lista = document.querySelector('#modal-reglas .reglas-lista');

    const item = document.createElement('label');
    item.className = 'regla-item regla-dinamica';
    item.htmlFor   = id;
    item.dataset.nombre = nombre;
    item.dataset.desc   = desc;

    item.innerHTML =
        '<button class="btn-regla-delete" title="Eliminar regla">&#x2715;</button>' +
        '<div class="regla-texto">' +
            '<span class="regla-nombre">' + nombre + '</span>' +
            (desc ? '<span class="regla-desc">' + desc + '</span>' : '') +
        '</div>' +
        '<div class="regla-toggle-wrap">' +
            '<input type="checkbox" id="' + id + '" class="regla-check" checked>' +
            '<span class="regla-toggle"></span>' +
        '</div>';

    item.querySelector('.btn-regla-delete').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        item.remove();
        saveCustomRules();
    });

    lista.appendChild(item);
}

// --- Panel de reglas acordadas ---
const REGLAS_LABELS = {
    contraAchique: 'Contraflor con achique',
    perros:        'Echar los perros',
    dichoDicho:    'Lo dicho dicho está',
};

function showReglasPanel() {
    const r = game.reglas;

    // Sincronizar checkboxes del modal con los valores guardados
    $('regla-contra-achique').checked = !!r.contraAchique;
    $('regla-perros').checked         = !!r.perros;
    $('regla-dicho-dicho').checked    = !!r.dichoDicho;

    // Reutilizo el modal de reglas como panel de solo lectura
    $('modal-reglas').querySelectorAll('.regla-check').forEach(function (el) {
        el.disabled = true;
    });
    $('btn-confirmar-reglas').textContent = 'Cerrar';
    $('btn-confirmar-reglas').onclick = function () {
        $('modal-reglas').classList.add('hidden');
        $('btn-confirmar-reglas').textContent = 'Listo, empezar';
        $('btn-confirmar-reglas').onclick = null;
        $('modal-reglas').querySelectorAll('.regla-check').forEach(function (el) {
            el.disabled = false;
        });
    };
    $('modal-reglas').classList.remove('hidden');
}

// --- Historial ---
function showHistorial() {
    const records = getAllRecords();
    const lista = $('historial-lista');

    if (records.length === 0) {
        lista.innerHTML = '<p class="empty-msg">Todavía no hay partidas guardadas.</p>';
    } else {
        lista.innerHTML = records.map(renderHistorialItem).join('');
    }

    showScreen('screen-historial');
}

function renderHistorialItem(r) {
    const date = new Date(r.date);
    const dateStr = date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    const wi = r.winner;
    const li = 1 - wi;

    return '<div class="historial-item">' +
        '<div class="historial-meta">' +
            '<span class="historial-date">' + dateStr + ' ' + timeStr + '</span>' +
            '<span class="historial-limit">a ' + r.limit + '</span>' +
        '</div>' +
        '<div class="historial-score">' +
            '<span class="historial-winner-name">' + r.teamNames[wi] + '</span>' +
            '<span class="historial-pts winner-pts">' + r.scores[wi] + '</span>' +
            '<span class="historial-dash">&#8211;</span>' +
            '<span class="historial-pts loser-pts">' + r.scores[li] + '</span>' +
            '<span class="historial-loser-name">' + r.teamNames[li] + '</span>' +
        '</div>' +
        (r.durmioAfuera ? '<div class="historial-durmio">' + r.teamNames[li] + ' durmio afuera</div>' : '') +
    '</div>';
}

// --- Init ---
document.addEventListener('DOMContentLoaded', function () {
    $('btn-empezar').addEventListener('click', startGame);

    $('btn-confirmar-reglas').addEventListener('click', function () {
        $('modal-reglas').classList.add('hidden');
        // Recolectar reglas custom dinámicas
        const customItems = [];
        document.querySelectorAll('.regla-dinamica').forEach(function (item) {
            customItems.push({
                nombre: item.dataset.nombre,
                desc:   item.dataset.desc,
                activa: item.querySelector('.regla-check').checked,
            });
        });
        const reglas = {
            contraAchique: $('regla-contra-achique').checked,
            perros:        $('regla-perros').checked,
            dichoDicho:    $('regla-dicho-dicho').checked,
            extras:        customItems.length ? customItems : null,
        };
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
    $('btn-agregar-regla').addEventListener('click', function () {
        $('regla-add-form').classList.remove('hidden');
        $('btn-agregar-regla').classList.add('hidden');
        $('regla-add-titulo').focus();
    });

    $('btn-regla-add-cancel').addEventListener('click', function () {
        cerrarFormRegla();
    });

    $('btn-regla-add-confirm').addEventListener('click', function () {
        const titulo = $('regla-add-titulo').value.trim();
        if (!titulo) { $('regla-add-titulo').focus(); return; }
        const desc = $('regla-add-desc').value.trim();
        agregarReglaDinamica(titulo, desc);
        saveCustomRules();
        cerrarFormRegla();
    });

    $('reglas-badge').addEventListener('click', function (e) {
        e.stopPropagation();
        if (!game || !game.reglas) return;
        showReglasPanel();
    });

    document.querySelectorAll('.btn-punto').forEach(function (btn) {
        btn.addEventListener('click', function () { handlePunto(+btn.dataset.team); });
    });

    document.querySelectorAll('.btn-vale').forEach(function (btn) {
        btn.addEventListener('click', function () { handleVale(+btn.dataset.team); });
    });

    $('btn-ir-historial').addEventListener('click', showHistorial);
    $('btn-ir-historial-juego').addEventListener('click', showHistorial);

    // Picker de límite en pantalla de juego
    $('game-limit-display').addEventListener('click', function (e) {
        e.stopPropagation();
        $('limit-picker').classList.toggle('hidden');
    });
    document.querySelectorAll('.limit-pick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            game.limit = +btn.dataset.val;
            updateLimitDisplay();
            $('limit-picker').classList.add('hidden');
            // Si alguien ya superó el nuevo límite, terminar la partida
            const winner = game.getWinner();
            if (winner !== null) endGame(winner);
        });
    });
    document.addEventListener('click', function () {
        $('limit-picker').classList.add('hidden');
    });

    $('btn-acepto-vale').addEventListener('click', acceptVale);
    $('btn-rechazo-vale').addEventListener('click', rejectVale);

    $('btn-nueva-partida').addEventListener('click', function () {
        game = null;
        showScreen('screen-inicio');
    });

    $('btn-resultado-historial').addEventListener('click', showHistorial);

    $('btn-historial-volver').addEventListener('click', function () {
        if (game && game.getWinner() === null) {
            showScreen('screen-juego');
        } else {
            showScreen('screen-inicio');
        }
    });

    // Botones "volver al inicio" desde cualquier pantalla
    ['btn-inicio-desde-juego', 'btn-inicio-desde-resultado', 'btn-inicio-desde-historial'].forEach(function (id) {
        $(id).addEventListener('click', function () {
            game = null;
            showScreen('screen-inicio');
        });
    });

    showScreen('screen-inicio');
});
