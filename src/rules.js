import { REGLAS_CUSTOM_KEY } from './constants.js';

/** Contador interno para generar IDs únicos de reglas dinámicas. */
let reglaIdCounter = 0;

/**
 * Persiste en localStorage las reglas dinámicas actualmente en el DOM.
 */
export function saveCustomRules() {
    const items = [];
    document.querySelectorAll('.regla-dinamica').forEach(function (item) {
        items.push({ nombre: item.dataset.nombre, desc: item.dataset.desc });
    });
    localStorage.setItem(REGLAS_CUSTOM_KEY, JSON.stringify(items));
}

/**
 * Lee las reglas dinámicas guardadas en localStorage.
 * @returns {{ nombre: string, desc: string }[]} Lista de reglas personalizadas.
 */
export function loadCustomRules() {
    try { return JSON.parse(localStorage.getItem(REGLAS_CUSTOM_KEY)) || []; }
    catch { return []; }
}

/**
 * Elimina las reglas dinámicas del DOM y las recrea desde localStorage.
 */
export function renderCustomRulesSaved() {
    document.querySelectorAll('.regla-dinamica').forEach(function (el) { el.remove(); });
    reglaIdCounter = 0;
    loadCustomRules().forEach(function (r) { agregarReglaDinamica(r.nombre, r.desc); });
}

/**
 * Oculta el formulario de agregar regla y limpia sus campos.
 */
export function cerrarFormRegla() {
    document.getElementById('regla-add-form').classList.add('hidden');
    document.getElementById('btn-agregar-regla').classList.remove('hidden');
    document.getElementById('regla-add-titulo').value = '';
    document.getElementById('regla-add-desc').value   = '';
}

/**
 * Crea y agrega una regla dinámica al listado del modal de reglas.
 * @param {string} nombre - Nombre de la regla.
 * @param {string} desc - Descripción opcional de la regla.
 */
export function agregarReglaDinamica(nombre, desc) {
    const id    = 'regla-din-' + (++reglaIdCounter);
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

/**
 * Lee el formulario del modal de reglas y retorna el objeto reglas.
 * @returns {object} Objeto con las reglas seleccionadas.
 */
export function collectReglas() {
    const customItems = [];
    document.querySelectorAll('.regla-dinamica').forEach(function (item) {
        customItems.push({
            nombre: item.dataset.nombre,
            desc:   item.dataset.desc,
            activa: item.querySelector('.regla-check').checked,
        });
    });
    return {
        contraAchique: document.getElementById('regla-contra-achique').checked,
        perros:        document.getElementById('regla-perros').checked,
        dichoDicho:    document.getElementById('regla-dicho-dicho').checked,
        extras:        customItems.length ? customItems : null,
    };
}

/**
 * Abre el modal de reglas en modo solo lectura mostrando las reglas de la partida activa.
 * @param {import('./game.js').Game} game - Instancia de la partida actual.
 */
export function showReglasPanel(game) {
    const r = game.reglas;

    document.getElementById('regla-contra-achique').checked = !!r.contraAchique;
    document.getElementById('regla-perros').checked         = !!r.perros;
    document.getElementById('regla-dicho-dicho').checked    = !!r.dichoDicho;

    // Modo solo lectura: deshabilitar todos los toggles
    document.getElementById('modal-reglas').querySelectorAll('.regla-check').forEach(function (el) {
        el.disabled = true;
    });

    const btnConfirmar = document.getElementById('btn-confirmar-reglas');
    btnConfirmar.textContent = 'Cerrar';
    btnConfirmar.onclick = function () {
        document.getElementById('modal-reglas').classList.add('hidden');
        btnConfirmar.textContent = 'Listo, empezar';
        btnConfirmar.onclick = null;
        document.getElementById('modal-reglas').querySelectorAll('.regla-check').forEach(function (el) {
            el.disabled = false;
        });
    };

    document.getElementById('modal-reglas').classList.remove('hidden');
}
