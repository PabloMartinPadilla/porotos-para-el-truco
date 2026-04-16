/** Clave de localStorage para el historial de partidas. */
export const STORAGE_KEY = 'truco_historial';

/** Clave de localStorage para las reglas competitivas personalizadas. */
export const REGLAS_CUSTOM_KEY = 'truco_reglas_custom';

/** Clave de localStorage para los enfrentamientos ocultos en estadísticas. */
export const HIDDEN_MATCHUPS_KEY = 'truco_hidden_matchups';

/**
 * Labels legibles para las reglas competitivas predefinidas.
 * @type {{ contraAchique: string, perros: string, dichoDicho: string }}
 */
export const REGLAS_LABELS = {
    contraAchique: 'Contraflor con achique',
    perros:        'Echar los perros',
    dichoDicho:    'Lo dicho dicho está',
};
