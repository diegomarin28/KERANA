import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronUp,
    faChevronDown,
    faClock,
    faDollarSign,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import {
    calcularPrecioPorDuracion,
    formatearPrecio,
    formatearDuracion
} from '../utils/preciosHelper';

/**
 * SlotSelector COMPACTO - Sin botón de reservar
 * Para usar dentro del modal con formulario completo
 */
export function SlotSelector({
                                 slot,
                                 onSelectionChange,
                                 disabled = false
                             }) {

    // Validación y cálculo de hora_fin si no existe
    if (!slot) {
        console.error('❌ SlotSelector: slot es undefined');
        return null;
    }

    if (!slot.hora_fin && slot.duracion) {
        const horaMinutos = parseInt(slot.hora.split(':')[0]) * 60 + parseInt(slot.hora.split(':')[1]);
        const finMinutos = horaMinutos + slot.duracion;
        const finHora = Math.floor(finMinutos / 60);
        const finMin = finMinutos % 60;
        slot.hora_fin = `${String(finHora).padStart(2, '0')}:${String(finMin).padStart(2, '0')}`;
    }

    const [horaInicio, setHoraInicio] = useState(slot.hora);
    const [duracion, setDuracion] = useState(60);
    const [error, setError] = useState('');

    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const minutesToTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const adjustTime = (timeStr, increment) => {
        const currentMinutes = timeToMinutes(timeStr);
        const newMinutes = currentMinutes + (increment ? 30 : -30);
        return minutesToTime(newMinutes);
    };

    const calcularHoraFin = (inicio, duracionMin) => {
        const inicioMin = timeToMinutes(inicio);
        return minutesToTime(inicioMin + duracionMin);
    };

    const calcularDuracionMaxima = (inicioElegido) => {
        const inicioMin = timeToMinutes(inicioElegido);
        const finSlotMin = timeToMinutes(slot.hora_fin);
        return finSlotMin - inicioMin;
    };

    const handleInicioChange = (increment) => {
        if (disabled) return;

        const nuevoInicio = adjustTime(horaInicio, increment);
        const nuevoInicioMin = timeToMinutes(nuevoInicio);
        const slotInicioMin = timeToMinutes(slot.hora);
        const slotFinMin = timeToMinutes(slot.hora_fin);

        if (nuevoInicioMin < slotInicioMin || nuevoInicioMin >= slotFinMin - 60) {
            setError('No puedes salir del horario disponible');
            setTimeout(() => setError(''), 2000);
            return;
        }

        setError('');
        setHoraInicio(nuevoInicio);

        const duracionDisponible = slotFinMin - nuevoInicioMin;
        if (duracion > duracionDisponible) {
            setDuracion(duracionDisponible);
        }
    };

    const handleDuracionChange = (increment) => {
        if (disabled) return;

        const nuevaDuracion = increment ? duracion + 30 : duracion - 30;

        if (nuevaDuracion < 60) {
            setError('La duración mínima es 60 minutos');
            setTimeout(() => setError(''), 2000);
            return;
        }

        const duracionMaxima = calcularDuracionMaxima(horaInicio);
        if (nuevaDuracion > duracionMaxima) {
            setError('No puedes exceder el horario disponible');
            setTimeout(() => setError(''), 2000);
            return;
        }

        setError('');
        setDuracion(nuevaDuracion);
    };

    // Notificar cambios al padre
    useEffect(() => {
        if (onSelectionChange) {
            const horaFin = calcularHoraFin(horaInicio, duracion);
            const precio = calcularPrecioPorDuracion(duracion, slot.modalidad);
            onSelectionChange({
                horaInicio,
                horaFin,
                duracion,
                precio
            });
        }
    }, [horaInicio, duracion]);

    const precioActual = calcularPrecioPorDuracion(duracion, slot.modalidad);
    const horaFin = calcularHoraFin(horaInicio, duracion);
    const inicioAtMin = timeToMinutes(horaInicio) <= timeToMinutes(slot.hora);
    const inicioAtMax = timeToMinutes(horaInicio) >= timeToMinutes(slot.hora_fin) - 60;
    const duracionAtMin = duracion <= 60;
    const duracionAtMax = duracion >= calcularDuracionMaxima(horaInicio);

    return (
        <div style={{
            background: '#ecfdf5',
            border: '2px solid #a7f3d0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
        }}>
            {/* Rango disponible */}
            <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#065f46',
                marginBottom: '12px',
                textAlign: 'center',
                fontFamily: 'Inter, -apple-system, sans-serif'
            }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px' }} />
                Disponible: {slot.hora.slice(0, 5)} - {slot.hora_fin.slice(0, 5)}
            </div>

            {/* Controles compactos */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px'
            }}>
                {/* Hora inicio */}
                <div>
                    <label style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#065f46',
                        display: 'block',
                        marginBottom: '6px',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                    }}>
                        HORA INICIO
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                            onClick={() => handleInicioChange(false)}
                            disabled={disabled || inicioAtMin}
                            style={{
                                background: (disabled || inicioAtMin) ? '#dbeafe' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                cursor: (disabled || inicioAtMin) ? 'not-allowed' : 'pointer',
                                opacity: (disabled || inicioAtMin) ? 0.5 : 1,
                                fontSize: '12px'
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronDown} />
                        </button>
                        <div style={{
                            flex: 1,
                            background: '#fff',
                            border: '2px solid #2563eb',
                            borderRadius: '8px',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#065f46',
                            fontFamily: 'Inter, -apple-system, sans-serif'
                        }}>
                            {horaInicio.slice(0, 5)}
                        </div>
                        <button
                            onClick={() => handleInicioChange(true)}
                            disabled={disabled || inicioAtMax}
                            style={{
                                background: (disabled || inicioAtMax) ? '#dbeafe' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                cursor: (disabled || inicioAtMax) ? 'not-allowed' : 'pointer',
                                opacity: (disabled || inicioAtMax) ? 0.5 : 1,
                                fontSize: '12px'
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronUp} />
                        </button>
                    </div>
                </div>

                {/* Duración */}
                <div>
                    <label style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#065f46',
                        display: 'block',
                        marginBottom: '6px',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                    }}>
                        DURACIÓN
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                            onClick={() => handleDuracionChange(false)}
                            disabled={disabled || duracionAtMin}
                            style={{
                                background: (disabled || duracionAtMin) ? '#dbeafe' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                cursor: (disabled || duracionAtMin) ? 'not-allowed' : 'pointer',
                                opacity: (disabled || duracionAtMin) ? 0.5 : 1,
                                fontSize: '12px'
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronDown} />
                        </button>
                        <div style={{
                            flex: 1,
                            background: '#fff',
                            border: '2px solid #2563eb',
                            borderRadius: '8px',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#065f46',
                            fontFamily: 'Inter, -apple-system, sans-serif'
                        }}>
                            {formatearDuracion(duracion)}
                        </div>
                        <button
                            onClick={() => handleDuracionChange(true)}
                            disabled={disabled || duracionAtMax}
                            style={{
                                background: (disabled || duracionAtMax) ? '#dbeafe' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                cursor: (disabled || duracionAtMax) ? 'not-allowed' : 'pointer',
                                opacity: (disabled || duracionAtMax) ? 0.5 : 1,
                                fontSize: '12px'
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronUp} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '10px',
                border: '2px solid #2563eb'
            }}>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#065f46',
                    marginBottom: '4px',
                    fontFamily: 'Inter, -apple-system, sans-serif'
                }}>
                    Tu Sesión:
                </div>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#065f46',
                    marginBottom: '6px',
                    fontFamily: 'Inter, -apple-system, sans-serif'
                }}>
                    {horaInicio.slice(0, 5)} - {horaFin.slice(0, 5)}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <FontAwesomeIcon icon={faDollarSign} style={{ color: '#2563eb', fontSize: '14px' }} />
                    <span style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#2563eb',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                    }}>
                        {formatearPrecio(precioActual)}
                    </span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    marginTop: '10px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: '12px' }} />
                    <span style={{
                        fontSize: '12px',
                        color: '#dc2626',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                    }}>
                        {error}
                    </span>
                </div>
            )}
        </div>
    );
}