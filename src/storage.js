import { STORAGE_KEY } from './constants.js';

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
