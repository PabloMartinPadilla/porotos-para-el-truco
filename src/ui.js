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

const NOMBRES_DEFAULT = new Set(['Nosotros', 'Ellos', 'Yo', 'Vos']);

/**
 * Renderiza el bloque de estadísticas generales del historial.
 * Excluye partidas donde ambos equipos tienen nombres predeterminados.
 * @param {object[]} records - Todos los registros guardados.
 * @returns {string} HTML del bloque, o '' si no hay datos.
 */
export function renderHistorialStats(records) {
    const validos = records.filter(function (r) {
        return !r.teamNames.every(function (n) { return NOMBRES_DEFAULT.has(n); });
    });

    if (validos.length === 0) return '';

    const partidas = validos.length;
    const puntos   = validos.reduce(function (sum, r) {
        return sum + r.scores[0] + r.scores[1];
    }, 0);
    const series   = new Set(validos.filter(function (r) { return r.serieId; }).map(function (r) { return r.serieId; })).size;

    return '<div class="historial-stats">' +
        '<div class="historial-stats-title">estadísticas</div>' +
        '<div class="historial-stats-grid">' +
            '<div class="stat-item">' +
                '<span class="stat-value">' + partidas + '</span>' +
                '<span class="stat-label">partidas</span>' +
            '</div>' +
            (series > 1 ? '<div class="stat-item">' +
                '<span class="stat-value">' + series + '</span>' +
                '<span class="stat-label">series</span>' +
            '</div>' : '') +
            '<div class="stat-item">' +
                '<span class="stat-value">' + puntos + '</span>' +
                '<span class="stat-label">puntos</span>' +
            '</div>' +
        '</div>' +
    '</div>';
}

/**
 * Genera el HTML de un ítem del historial de partidas.
 * @param {object} r - Registro de partida.
 * @param {number} idx - Índice en el array de registros (para la revancha).
 * @returns {string} HTML string del ítem.
 */
export function renderHistorialItem(r, idx) {
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
        (r.durmioAfuera ? '<div class="historial-durmio">' + r.teamNames[li] + ' durmió afuera</div>' : '') +
        '<button class="btn-hist-revancha" data-idx="' + idx + '">Revancha</button>' +
    '</div>';
}

/**
 * Genera el HTML de un bloque de serie (varias partidas ligadas por serieId).
 * @param {object[]} serieRecords - Partidas en orden cronológico (más antigua primero).
 * @param {number[]} indices - Posiciones correspondientes en getAllRecords().
 * @returns {string}
 */
export function renderHistorialSerie(serieRecords, indices) {
    const teams = serieRecords[0].teamNames;
    const wins  = [0, 0];
    serieRecords.forEach(function (r) { wins[r.winner]++; });
    const tally = teams[0] + ' ' + wins[0] + ' \u2014 ' + wins[1] + ' ' + teams[1];

    // El índice más bajo en el array de records = partida más reciente (data-idx para revancha)
    const newestIdx = indices[indices.length - 1];

    const gamesHtml = serieRecords.map(function (r, k) {
        const date     = new Date(r.date);
        const dateStr  = date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' });
        const timeStr  = date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
        const wi = r.winner;
        const li = 1 - wi;
        const num = r.isRevancha ? 'rev' : 'P' + (k + 1 - serieRecords.slice(0, k).filter(function(x){ return !x.isRevancha; }).length);
        return '<div class="historial-serie-game">' +
            '<span class="historial-serie-game-num">' + (k + 1) + '</span>' +
            '<span class="historial-serie-game-date">' + dateStr + ' ' + timeStr + '</span>' +
            '<span class="historial-serie-game-score">' + r.scores[wi] + ' \u2013 ' + r.scores[li] + '</span>' +
            '<span class="historial-serie-game-winner">' + r.teamNames[wi] + '</span>' +
        '</div>';
    }).join('');

    return '<div class="historial-serie">' +
        '<div class="historial-serie-header">' +
            '<span class="historial-serie-teams">' + teams[0] + ' vs ' + teams[1] + '</span>' +
            '<span class="historial-serie-tally">' + tally + '</span>' +
        '</div>' +
        '<div class="historial-serie-games">' + gamesHtml + '</div>' +
        '<div class="historial-serie-footer">' +
            '<button class="btn-hist-revancha" data-idx="' + newestIdx + '">Revancha</button>' +
        '</div>' +
    '</div>';
}

/**
 * Procesa todos los registros y devuelve datos de estadísticas por enfrentamiento.
 * Excluye partidas donde CUALQUIER equipo tiene nombre predeterminado.
 * Solo vs dupla se cuentan por separado.
 * @param {object[]} records - Todos los registros guardados.
 * @returns {object[]} Array de matchups con stats agregadas.
 */
export function buildEstadisticasData(records) {
    const validos = records.filter(function (r) {
        return !r.teamNames.some(function (n) { return NOMBRES_DEFAULT.has(n.trim()); });
    });

    const matchupMap = new Map();

    validos.forEach(function (r) {
        const names      = r.teamNames.map(function (n) { return n.trim(); });
        const namesLower = names.map(function (n) { return n.toLowerCase(); });
        const tipo       = (r.isDupla && r.isDupla[0]) ? 'dupla' : 'solo';

        // Clave canónica: nombres ordenados alfabéticamente + tipo
        const sortedLower = namesLower.slice().sort();
        const key = sortedLower[0] + '\x00' + sortedLower[1] + '\x00' + tipo;

        // ¿Están invertidos respecto al orden canónico?
        const isSwapped = namesLower[0] !== sortedLower[0];

        if (!matchupMap.has(key)) {
            matchupMap.set(key, {
                teamNames: isSwapped ? [names[1], names[0]] : [names[0], names[1]],
                tipo: tipo,
                games: [],
            });
        }

        const m = matchupMap.get(key);
        m.games.push({
            date:            r.date,
            winnerCanonical: isSwapped ? 1 - r.winner : r.winner,
            scores:          isSwapped ? [r.scores[1], r.scores[0]] : [r.scores[0], r.scores[1]],
        });
    });

    const result = [];

    matchupMap.forEach(function (m) {
        m.games.sort(function (a, b) { return a.date - b.date; }); // más antigua primero

        const wins   = [0, 0];
        const points = [0, 0];
        m.games.forEach(function (g) {
            wins[g.winnerCanonical]++;
            points[0] += g.scores[0];
            points[1] += g.scores[1];
        });

        // Racha actual: victorias consecutivas del mismo equipo desde el final
        var streak = 0;
        var streakTeam = -1;
        for (var i = m.games.length - 1; i >= 0; i--) {
            if (streakTeam === -1) {
                streakTeam = m.games[i].winnerCanonical;
                streak = 1;
            } else if (m.games[i].winnerCanonical === streakTeam) {
                streak++;
            } else {
                break;
            }
        }

        result.push({
            teamNames:  m.teamNames,
            tipo:       m.tipo,
            total:      m.games.length,
            wins:       wins,
            points:     points,
            streak:     streak,
            streakTeam: streakTeam,
            lastDate:   new Date(m.games[m.games.length - 1].date),
        });
    });

    // Ordenar: más partidas primero, desempate por más reciente
    result.sort(function (a, b) {
        return b.total - a.total || b.lastDate - a.lastDate;
    });

    return result;
}

/**
 * Genera el HTML de una tarjeta de enfrentamiento para la pantalla de estadísticas.
 * @param {object} m - Matchup procesado por buildEstadisticasData.
 * @returns {string} HTML string.
 */
export function renderMatchupCard(m) {
    const dateStr   = m.lastDate.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rachaHtml = m.streak >= 2
        ? '<div class="matchup-racha">racha: <strong>' + m.teamNames[m.streakTeam] + '</strong> \xd7' + m.streak + '</div>'
        : '';

    const pct0 = m.total > 0 ? Math.round(m.wins[0] / m.total * 100) : 0;
    const pct1 = 100 - pct0;
    const pctHtml = '<div class="matchup-pct-bar">' +
        '<div class="matchup-pct-fill" style="width:' + pct0 + '%"></div>' +
    '</div>' +
    '<div class="matchup-pct-labels">' +
        '<span>' + pct0 + '%</span>' +
        '<span>' + pct1 + '%</span>' +
    '</div>';

    return '<div class="matchup-card">' +
        '<div class="matchup-header">' +
            '<span class="matchup-teams">' + m.teamNames[0] + ' vs ' + m.teamNames[1] + '</span>' +
            '<span class="matchup-tipo">' + m.tipo + '</span>' +
        '</div>' +
        '<div class="matchup-stats">' +
            '<span class="matchup-score">' + m.wins[0] + '\u2013' + m.wins[1] + '</span>' +
            '<span class="matchup-stat-label">partidas</span>' +
            '<span class="matchup-sep">\xb7</span>' +
            '<span class="matchup-score">' + m.points[0] + '\u2013' + m.points[1] + '</span>' +
            '<span class="matchup-stat-label">puntos</span>' +
        '</div>' +
        pctHtml +
        rachaHtml +
        '<div class="matchup-last">última: ' + dateStr + '</div>' +
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
