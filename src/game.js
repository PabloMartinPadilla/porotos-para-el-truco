/**
 * Representa una partida de Truco en curso.
 */
export class Game {
    /**
     * @param {object} options
     * @param {string[]} options.teamNames - Nombres de los dos equipos.
     * @param {boolean[]} [options.isDupla] - Si cada equipo es dupla (true) o individual (false).
     * @param {number} options.limit - Puntaje límite para ganar la partida.
     * @param {object|null} [options.reglas] - Reglas competitivas acordadas, o null si no aplica.
     */
    constructor({ teamNames, isDupla, limit, reglas, isRevancha, serieId }) {
        this.teamNames  = teamNames;
        this.isDupla    = isDupla || [false, false];
        this.limit      = limit;
        this.reglas     = reglas || null;
        this.isRevancha = isRevancha || false;
        this.serieId    = serieId   || null;
        this.scores     = [0, 0];
        /** @type {Set<number>[]} Índices de porotos que corresponden a un vale cuatro. */
        this.valeIndices = [new Set(), new Set()];
    }

    /**
     * Suma un punto al equipo indicado y retorna el ganador si ya alcanzó el límite.
     * @param {number} teamIndex - Índice del equipo (0 o 1).
     * @returns {number|null} Índice del ganador, o null si la partida continúa.
     */
    addPoint(teamIndex) {
        this.scores[teamIndex]++;
        return this.getWinner();
    }

    /**
     * Resta un punto al equipo indicado. Mínimo 0.
     * Si el poroto que se elimina era de un vale, lo quita del registro.
     * @param {number} teamIndex
     */
    removePoint(teamIndex) {
        if (this.scores[teamIndex] <= 0) return;
        this.scores[teamIndex]--;
        this.valeIndices[teamIndex].delete(this.scores[teamIndex]);
    }

    /**
     * Aplica un vale cuatro al equipo indicado (suma 4 puntos, marca los índices como vale).
     * @param {number} callerIndex - Índice del equipo que cantó el vale.
     * @returns {number|null} Índice del ganador, o null si la partida continúa.
     */
    addVale(callerIndex) {
        const start = this.scores[callerIndex];
        for (let i = start; i < start + 4; i++) {
            this.valeIndices[callerIndex].add(i);
        }
        this.scores[callerIndex] += 4;
        return this.getWinner();
    }

    /**
     * Evalúa si algún equipo alcanzó el límite de puntos.
     * @returns {number|null} Índice del equipo ganador, o null si la partida continúa.
     */
    getWinner() {
        for (let i = 0; i < 2; i++) {
            if (this.scores[i] >= this.limit) return i;
        }
        return null;
    }

    /**
     * Indica si el poroto en la posición dada es producto de un vale cuatro.
     * @param {number} teamIndex - Índice del equipo.
     * @param {number} poroIndex - Posición del poroto (0-based).
     * @returns {boolean}
     */
    isVale(teamIndex, poroIndex) {
        return this.valeIndices[teamIndex].has(poroIndex);
    }

    /**
     * Determina si el equipo perdedor "durmió afuera" (no llegó a la mitad del límite).
     * @param {number} winnerIndex - Índice del equipo ganador.
     * @returns {boolean}
     */
    loserDurmioAfuera(winnerIndex) {
        return this.scores[1 - winnerIndex] < this.limit / 2;
    }

    /**
     * Genera el registro de la partida para guardar en el historial.
     * @param {number} winnerIndex - Índice del equipo ganador.
     * @returns {object} Registro serializable de la partida.
     */
    toRecord(winnerIndex) {
        return {
            date:        new Date().toISOString(),
            teamNames:   [...this.teamNames],
            isDupla:     [...this.isDupla],
            scores:      [...this.scores],
            winner:      winnerIndex,
            limit:       this.limit,
            durmioAfuera: this.loserDurmioAfuera(winnerIndex),
            reglas:      this.reglas || null,
            isRevancha:  this.isRevancha,
            serieId:     this.serieId,
        };
    }
}
