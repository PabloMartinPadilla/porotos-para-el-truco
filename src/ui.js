/**
 * Muestra la pantalla con el ID indicado y oculta las demás.
 * @param {string} id - ID del elemento `.screen` a mostrar.
 */
export function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/**
 * Renderiza grupos de porotos (montones de 5 o fila suelta) en el contenedor dado.
 * @param {import('./game.js').Game} game - Instancia de la partida actual.
 * @param {HTMLElement} container - Contenedor donde se insertan los grupos.
 * @param {number} teamIndex - Índice del equipo (0 o 1).
 * @param {number} fromIdx - Índice de poroto desde el que se empieza a contar.
 * @param {number} count - Cantidad de porotos a renderizar.
 */
export function renderGrupos(game, container, teamIndex, fromIdx, count) {
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

/**
 * Re-renderiza el marcador de porotos completo para un equipo.
 * Incluye el divisor "buenas" cuando corresponde.
 * @param {import('./game.js').Game} game - Instancia de la partida actual.
 * @param {number} teamIndex - Índice del equipo (0 o 1).
 */
export function renderPorotos(game, teamIndex) {
    const container = document.querySelector('.team[data-team="' + teamIndex + '"] .porotos-container');
    const score = game.scores[teamIndex];

    container.innerHTML = '';

    const showBuenas      = game.limit > 15;
    const buenasThreshold = Math.ceil(game.limit / 2);

    if (showBuenas && score >= buenasThreshold) {
        // Malas arriba
        renderGrupos(game, container, teamIndex, 0, buenasThreshold);

        // Divider
        const divider = document.createElement('div');
        divider.className = 'buenas-divider';
        divider.textContent = 'buenas';
        container.appendChild(divider);

        // Buenas abajo
        const buenasCount = score - buenasThreshold;
        if (buenasCount > 0) {
            renderGrupos(game, container, teamIndex, buenasThreshold, buenasCount);
        }
    } else {
        renderGrupos(game, container, teamIndex, 0, score);
    }

    document.querySelector('.team[data-team="' + teamIndex + '"] .score-number').textContent = score;
}

/**
 * Dispara la animación de aparición en el último poroto del equipo.
 * @param {number} teamIndex - Índice del equipo (0 o 1).
 */
export function animateLastPoroto(teamIndex) {
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

/**
 * Genera el HTML de un ítem del historial de partidas.
 * @param {object} r - Registro de partida.
 * @returns {string} HTML string del ítem.
 */
export function renderHistorialItem(r) {
    const date    = new Date(r.date);
    const dateStr = date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    const wi = r.winner;
    const li = 1 - wi;

    return '<div class="historial-item' + (r.isRevancha ? ' historial-item-revancha' : '') + '">' +
        '<div class="historial-meta">' +
            '<span class="historial-date">' + dateStr + ' ' + timeStr + '</span>' +
            '<div class="historial-meta-right">' +
                (r.isRevancha ? '<span class="historial-revancha-badge">revancha</span>' : '') +
                '<span class="historial-limit">a ' + r.limit + '</span>' +
            '</div>' +
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

/**
 * Actualiza el botón que muestra el límite actual y marca el botón activo en el picker.
 * @param {import('./game.js').Game} game - Instancia de la partida actual.
 */
export function updateLimitDisplay(game) {
    const btn     = document.getElementById('game-limit-display');
    btn.textContent = 'hasta ' + game.limit + ' ▾';

    const maxScore = Math.max(game.scores[0], game.scores[1]);

    document.querySelectorAll('.limit-pick-btn').forEach(function (b) {
        const val      = +b.dataset.val;
        const exceeded = maxScore >= val;
        b.classList.toggle('active',    val === game.limit);
        b.classList.toggle('disabled',  exceeded);
        b.disabled = exceeded;
    });
}
