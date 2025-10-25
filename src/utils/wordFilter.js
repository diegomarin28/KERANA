const PALABRAS_PROHIBIDAS = [
    // Insultos generales
    'mierda', 'cagada', 'verga', 'pija', 'concha', 'conchuda', 'conchudo',
    'puta', 'puto', 'hdp', 'hijo de puta', 'hija de puta',
    'pelotudo', 'pelotuda', 'boludo', 'boluda', 'forro', 'forra',
    'gil', 'gila', 'mogolico', 'mogolica', 'idiota', 'imbecil',
    'tarado', 'tarada', 'retrasado', 'retrasada', 'mogolico', 'trolo', 'fuck', 'shit', 'asshole', 'bitch', 'idiot, ' +
    'motherfucker',

    // Variantes con números/símbolos
    'mrd', 'h.d.p', 'put@', 'put4', 'c0ncha', 'p3lotudo',

    // Otras expresiones
    'chupame', 'la concha de tu madre', 'la re concha',
    'andate a la mierda', 'la concha de dios',

    // Discriminatorias
    'negro de mierda', 'judío', 'judio', 'facho', 'facha',
    'trosko', 'comunista de mierda', 'feminazi', 'nazi',

    // Sexuales explícitas
    'coje', 'cojer', 'garchar', 'culear', 'folla', 'follar'
];

/**
 * Normaliza texto para comparación (remueve tildes, convierte a minúsculas)
 */
const normalizarTexto = (texto) => {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remueve tildes
};

/**
 * Verifica si un texto contiene palabras prohibidas
 * @param {string} texto - Texto a verificar
 * @returns {Object} { contiene: boolean, palabrasEncontradas: string[] }
 */
export const contienePalabrasProhibidas = (texto) => {
    if (!texto || typeof texto !== 'string') {
        return { contiene: false, palabrasEncontradas: [] };
    }

    const textoNormalizado = normalizarTexto(texto);
    const palabrasEncontradas = [];

    for (const palabra of PALABRAS_PROHIBIDAS) {
        const palabraNormalizada = normalizarTexto(palabra);

        // Buscar palabra completa (con límites de palabra)
        const regex = new RegExp(`\\b${palabraNormalizada}\\b`, 'gi');

        if (regex.test(textoNormalizado)) {
            palabrasEncontradas.push(palabra);
        }
    }

    return {
        contiene: palabrasEncontradas.length > 0,
        palabrasEncontradas
    };
};

/**
 * Valida un comentario antes de enviarlo
 * @param {string} comentario - Comentario a validar
 * @returns {Object} { valido: boolean, error: string | null }
 */
export const validarComentario = (comentario) => {
    if (!comentario || comentario.trim().length === 0) {
        return { valido: true, error: null }; // Comentarios vacíos están OK
    }

    const resultado = contienePalabrasProhibidas(comentario);

    if (resultado.contiene) {
        return {
            valido: false,
            error: 'Tu reseña contiene lenguaje inapropiado. Por favor, mantené un tono respetuoso.'
        };
    }

    return { valido: true, error: null };
};