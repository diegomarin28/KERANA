/**
 * 💰 KERANA - SISTEMA DE PRECIOS
 * Helper para cálculo de precios por duración
 *
 * Precios base:
 * - Virtual: $430/hora ($7.17/min)
 * - Presencial: $630/hora ($10.5/min)
 */

/**
 * Precios base por hora
 */
const PRECIOS_POR_HORA = {
    virtual: 430,      // $430/hora
    presencial: 630    // $630/hora
};

/**
 * Calcular precio por duración en minutos
 * @param {number} duracionMin - Duración en minutos
 * @param {string} modalidad - 'virtual' o 'presencial'
 * @returns {number} Precio calculado
 */
export const calcularPrecioPorDuracion = (duracionMin, modalidad) => {
    if (!duracionMin || duracionMin < 0) return 0;
    if (!PRECIOS_POR_HORA[modalidad]) return 0;

    const precioPorMinuto = PRECIOS_POR_HORA[modalidad] / 60;
    return Math.round(precioPorMinuto * duracionMin);
};

/**
 * Formatear precio con símbolo $
 * @param {number} precio - Precio a formatear
 * @returns {string} Precio formateado (ej: "$430")
 */
export const formatearPrecio = (precio) => {
    if (precio === null || precio === undefined) return '$0';
    return `$${Math.round(precio)}`;
};

/**
 * Calcular rango de precios (mínimo-máximo) para preview
 * @param {number} duracionTotal - Duración total del slot en minutos
 * @param {string} modalidad - 'virtual' o 'presencial'
 * @returns {object} { min, max, minFormatted, maxFormatted }
 */
export const calcularRangoPrecios = (duracionTotal, modalidad) => {
    const precioMin = calcularPrecioPorDuracion(60, modalidad); // 1 hora mínimo
    const precioMax = calcularPrecioPorDuracion(duracionTotal, modalidad);

    return {
        min: precioMin,
        max: precioMax,
        minFormatted: formatearPrecio(precioMin),
        maxFormatted: formatearPrecio(precioMax)
    };
};

/**
 * Generar opciones de duración (60, 90, 120...)
 * @param {number} duracionMax - Duración máxima en minutos
 * @returns {number[]} Array de duraciones en incrementos de 30 min
 */
export const generarOpcionesDuracion = (duracionMax) => {
    const opciones = [];
    for (let min = 60; min <= duracionMax; min += 30) {
        opciones.push(min);
    }
    return opciones;
};

/**
 * Formatear duración en formato legible
 * @param {number} minutos - Duración en minutos
 * @returns {string} Formato legible (ej: "1h 30min" o "2h")
 */
export const formatearDuracion = (minutos) => {
    if (!minutos || minutos <= 0) return '0min';

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (mins === 0) {
        return `${horas}h`;
    }
    return `${horas}h ${mins}min`;
};

/**
 * Obtener precio por hora según modalidad
 * @param {string} modalidad - 'virtual' o 'presencial'
 * @returns {number} Precio por hora
 */
export const getPrecioPorHora = (modalidad) => {
    return PRECIOS_POR_HORA[modalidad] || 0;
};