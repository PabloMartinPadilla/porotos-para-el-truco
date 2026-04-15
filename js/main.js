import { Game } from './Game.js';
import { saveRecord, getAll } from './Storage.js';

let game = null;
let pendingVale = null;

const $ = id => document.getElementById(id);

// --- Navegación ---

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
}

// --- Inicio ---

function startGame() {
    const name0 = $('input-team0').value.trim() || 'Nosotros';
    const name1 = $('input-team1').value.trim() || 'Ellos';
    const limitEl = document.querySelector('input[name="limit"]:checked');
    const limit = limitEl ? +limitEl.value : 30;

    game = new Game({ teamNames: [name0, name1], limit });

    document.querySelectorAll('.team-name').forEach((el, i) => {
        el.textContent = game.teamNames[i];
    });
    $('game-limit-display').textContent = `hasta ${limit}`;

    renderPorotos(0);
    renderPorotos(1);

    showScreen('screen-juego');
}

// --- Renderizado de porotos ---

function renderPorotos(teamIndex) {
    const container = document.querySelector(`.team[data-team="${teamIndex}"] .porotos-container`);
    const score = game.scores[teamIndex];

    container.innerHTML = '';

    let idx = 0;
    while (idx < score) {
        const groupSize = Math.min(5, score - idx);
        const group = document.createElement('div');
        group.className = 'poroto-group';

        for (let i = 0; i < groupSize; i++) {
            const isVale = game.isVale(teamIndex, idx);
            const p = document.createElement('div');
            p.className = 'poroto' + (isVale ? ' vale' : '');
            group.appendChild(p);
            idx++;
        }

        container.appendChild(group);
    }

    document.querySelector(`.team[data-team="${teamIndex}"] .score-number`).textContent = score;
}

function animateLastPoroto(teamIndex) {
    const container = document.querySelector(`.team[data-team="${teamIndex}"] .porotos-container`);
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
    const rivalName = game.teamNames[1 - callerIndex];
    const callerName = game.teamNames[callerIndex];
    $('modal-caller-name').textContent = callerName;
    $('modal-rival-name').textContent = rivalName;
    $('modal-vale').classList.remove('hidden');
}

function acceptVale() {
    if (!pendingVale) return;
    const { callerIndex } = pendingVale;
    pendingVale = null;
    $('modal-vale').classList.add('hidden');

    const winner = game.addVale(callerIndex);
    renderPorotos(callerIndex);
    // Animate the 4 golden porotos
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

// --- Historial ---

function showHistorial() {
    const records = getAll();
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
    const dateStr = date.toLocaleDateString('es-UY', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    const wi = r.winner;
    const li = 1 - wi;

    return `
        <div class="historial-item">
            <div class="historial-meta">
                <span class="historial-date">${dateStr} ${timeStr}</span>
                <span class="historial-limit">a ${r.limit}</span>
            </div>
            <div class="historial-score">
                <span class="historial-winner-name">${r.teamNames[wi]}</span>
                <span class="historial-pts winner-pts">${r.scores[wi]}</span>
                <span class="historial-dash">–</span>
                <span class="historial-pts loser-pts">${r.scores[li]}</span>
                <span class="historial-loser-name">${r.teamNames[li]}</span>
            </div>
            ${r.durmioAfuera ? `<div class="historial-durmio">${r.teamNames[li]} durmió afuera</div>` : ''}
        </div>
    `;
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
    $('btn-empezar').addEventListener('click', startGame);

    document.querySelectorAll('.btn-punto').forEach(btn => {
        btn.addEventListener('click', () => handlePunto(+btn.dataset.team));
    });

    document.querySelectorAll('.btn-vale').forEach(btn => {
        btn.addEventListener('click', () => handleVale(+btn.dataset.team));
    });

    $('btn-ir-historial').addEventListener('click', showHistorial);
    $('btn-ir-historial-juego').addEventListener('click', showHistorial);

    $('btn-acepto-vale').addEventListener('click', acceptVale);
    $('btn-rechazo-vale').addEventListener('click', rejectVale);

    $('btn-nueva-partida').addEventListener('click', () => {
        game = null;
        showScreen('screen-inicio');
    });

    $('btn-resultado-historial').addEventListener('click', showHistorial);

    $('btn-historial-volver').addEventListener('click', () => {
        if (game && game.getWinner() === null) {
            showScreen('screen-juego');
        } else {
            showScreen('screen-inicio');
        }
    });

    showScreen('screen-inicio');
});
