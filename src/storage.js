import { STORAGE_KEY, HIDDEN_MATCHUPS_KEY } from './constants.js';

/**
 * Guarda un registro de partida al inicio de la lista en localStorage.
 * @param {object} record - Objeto de partida generado por Game.toRecord().
 */
export function saveRecord(record) {
    const list = getAllRecords();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * Obtiene todos los registros del historial almacenados en localStorage.
 * @returns {object[]} Lista de registros de partidas, o arreglo vacío si no hay ninguno.
 */
export function getAllRecords() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

/**
 * Elimina todos los registros del historial.
 */
export function clearRecords() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Devuelve el Set de claves de enfrentamientos ocultos en estadísticas.
 * @returns {Set<string>}
 */
export function getHiddenMatchups() {
    try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_MATCHUPS_KEY)) || []); }
    catch { return new Set(); }
}

/**
 * Oculta un enfrentamiento de la pantalla de estadísticas (sin borrar el historial).
 * @param {string} key - Clave canónica del enfrentamiento.
 */
export function hideMatchup(key) {
    const hidden = getHiddenMatchups();
    hidden.add(key);
    localStorage.setItem(HIDDEN_MATCHUPS_KEY, JSON.stringify([...hidden]));
}
