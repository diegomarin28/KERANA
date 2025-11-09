import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faClock, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { calcularRangoPrecios, formatearDuracion } from '../utils/preciosHelper';

/**
 * TimeRangePicker - Componente para que el mentor seleccione rango horario
 * con flechitas ▲▼ en incrementos de 30 minutos
 */
export function TimeRangePicker({
                                    startTime,
                                    endTime,
                                    onStartChange,
                                    onEndChange,
                                    modalidad = 'virtual',
                                    minDuration = 60,
                                    disabled = false
                                }) {


    const MIN_HOUR = '06:00';
    const MAX_HOUR = '23:30'; // Medianoche

    /**
     * Convierte string "HH:MM" a minutos desde medianoche
     */
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    /**
     * Convierte minutos desde medianoche a string "HH:MM"
     */
    const minutesToTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    /**
     * Incrementa/Decrementa tiempo en 30 minutos
     */
    const adjustTime = (timeStr, increment) => {
        const currentMinutes = timeToMinutes(timeStr);
        const newMinutes = currentMinutes + (increment ? 30 : -30);
        return minutesToTime(newMinutes);
    };

    /**
     * Maneja cambio de hora de inicio
     */
    const handleStartChange = (increment) => {
        if (disabled) return;

        const newStart = adjustTime(startTime, increment);
        const newStartMin = timeToMinutes(newStart);
        const minLimit = timeToMinutes(MIN_HOUR);
        const endMin = timeToMinutes(endTime);

        // Validar límite inferior
        if (newStartMin < minLimit) return;

        // Validar que no supere fin - minDuration
        if (newStartMin > endMin - minDuration) return;

        onStartChange(newStart);
    };

    /**
     * Maneja cambio de hora de fin
     */
    const handleEndChange = (increment) => {
        if (disabled) return;

        const newEnd = adjustTime(endTime, increment);
        const newEndMin = timeToMinutes(newEnd);
        const maxLimit = timeToMinutes(MAX_HOUR);
        const startMin = timeToMinutes(startTime);

        // Validar límite superior
        if (newEndMin > maxLimit) return;

        // Validar duración mínima
        if (newEndMin < startMin + minDuration) return;

        onEndChange(newEnd);
    };

    // Calcular duración total
    const duracionTotal = timeToMinutes(endTime) - timeToMinutes(startTime);

    // Calcular rango de precios
    const rangoPrecio = calcularRangoPrecios(duracionTotal, modalidad);

    // Verificar si los botones están en el límite
    const startAtMin = timeToMinutes(startTime) <= timeToMinutes(MIN_HOUR);
    const startAtMax = timeToMinutes(startTime) >= timeToMinutes(endTime) - minDuration;
    const endAtMin = timeToMinutes(endTime) <= timeToMinutes(startTime) + minDuration;
    const endAtMax = timeToMinutes(endTime) >= timeToMinutes(MAX_HOUR);

    return (
        <div style={{
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '2px solid #e2e8f0'
            }}>
                <FontAwesomeIcon
                    icon={faClock}
                    style={{ color: '#0d9488', fontSize: '16px' }}
                />
                <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0f172a',
                    fontFamily: 'Inter, -apple-system, sans-serif'
                }}>
                    Rango de Disponibilidad
                </h4>
            </div>

            {/* Selectores de hora */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px'
            }}>
                {/* Hora de inicio */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '6px',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                    }}>
                        Hora de Inicio
                    </label>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                    }}>
                        <button
                            type="button"
                            onClick={() => handleStartChange(false)}
                            disabled={disabled || startAtMin}
                            style={{
                                background: (disabled || startAtMin) ? '#e2e8f0' : '#0d9488',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px 6px 0 0',
                                padding: '4px',
                                cursor: (disabled || startAtMin) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: (disabled || startAtMin) ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!disabled && !startAtMin) {
                                    e.currentTarget.style.background = '#0f766e';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!disabled && !startAtMin) {
                                    e.currentTarget.style.background = '#0d9488';
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronUp} style={{ fontSize: '10px' }} />
                        </button>

                        <div style={{
                            background: '#fff',
                            border: '2px solid #0d9488',
                            borderRadius: '0',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#0d9488',
                            fontFamily: 'Inter, monospace'
                        }}>
                            {startTime}
                        </div>

                        <button
                            type="button"
                            onClick={() => handleStartChange(true)}
                            disabled={disabled || startAtMax}
                            style={{
                                background: (disabled || startAtMax) ? '#e2e8f0' : '#0d9488',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0 0 6px 6px',
                                padding: '4px',
                                cursor: (disabled || startAtMax) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: (disabled || startAtMax) ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!disabled && !startAtMax) {
                                    e.currentTarget.style.background = '#0f766e';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!disabled && !startAtMax) {
                                    e.currentTarget.style.background = '#0d9488';
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '10px' }} />
                        </button>
                    </div>
                </div>

                {/* Hora de fin */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '6px',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                    }}>
                        Hora de Fin
                    </label>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                    }}>
                        <button
                            type="button"
                            onClick={() => handleEndChange(false)}
                            disabled={disabled || endAtMin}
                            style={{
                                background: (disabled || endAtMin) ? '#e2e8f0' : '#0d9488',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px 6px 0 0',
                                padding: '4px',
                                cursor: (disabled || endAtMin) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: (disabled || endAtMin) ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!disabled && !endAtMin) {
                                    e.currentTarget.style.background = '#0f766e';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!disabled && !endAtMin) {
                                    e.currentTarget.style.background = '#0d9488';
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronUp} style={{ fontSize: '10px' }} />
                        </button>

                        <div style={{
                            background: '#fff',
                            border: '2px solid #0d9488',
                            borderRadius: '0',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#0d9488',
                            fontFamily: 'Inter, monospace'
                        }}>
                            {endTime}
                        </div>

                        <button
                            type="button"
                            onClick={() => handleEndChange(true)}
                            disabled={disabled || endAtMax}
                            style={{
                                background: (disabled || endAtMax) ? '#e2e8f0' : '#0d9488',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0 0 6px 6px',
                                padding: '4px',
                                cursor: (disabled || endAtMax) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: (disabled || endAtMax) ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!disabled && !endAtMax) {
                                    e.currentTarget.style.background = '#0f766e';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!disabled && !endAtMax) {
                                    e.currentTarget.style.background = '#0d9488';
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '10px' }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Info de duración y precios */}
            <div style={{
                background: '#ecfdf5',
                border: '2px solid #a7f3d0',
                borderRadius: '8px',
                padding: '10px',
                marginTop: '12px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px'
                }}>
                    <FontAwesomeIcon
                        icon={faInfoCircle}
                        style={{ color: '#0d9488', fontSize: '12px' }}
                    />
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#0d9488',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                    }}>
                        Información del Slot
                    </span>
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#065f46',
                    lineHeight: 1.5,
                    fontFamily: 'Inter, -apple-system, sans-serif'
                }}>
                    <div style={{ marginBottom: '3px' }}>
                        <strong>Duración total:</strong> {formatearDuracion(duracionTotal)}
                    </div>
                    <div>
                        <strong>Los estudiantes pagarán:</strong> {rangoPrecio.minFormatted} - {rangoPrecio.maxFormatted}
                    </div>
                </div>
            </div>
        </div>
    );
}