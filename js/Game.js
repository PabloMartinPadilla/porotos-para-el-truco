export class Game {
    constructor({ teamNames, limit }) {
        this.teamNames = teamNames;
        this.limit = limit;
        this.scores = [0, 0];
        this.valeIndices = [new Set(), new Set()];
        this.startedAt = new Date().toISOString();
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
        const loserIndex = 1 - winnerIndex;
        return this.scores[loserIndex] < this.limit / 2;
    }

    toRecord(winnerIndex) {
        return {
            date: new Date().toISOString(),
            teamNames: [...this.teamNames],
            scores: [...this.scores],
            winner: winnerIndex,
            limit: this.limit,
            durmioAfuera: this.loserDurmioAfuera(winnerIndex),
        };
    }
}
