import { useState, useEffect } from 'react';
import { mentorshipAPI } from '../../api/database';

export default function MyCalendar() {
    const [disponibilidad, setDisponibilidad] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newSlot, setNewSlot] = useState({ dia_semana: 1, hora_inicio: '09:00', hora_fin: '10:00' });

    const diasSemana = [
        { num: 1, nombre: 'Lunes', emoji: '📅' },
        { num: 2, nombre: 'Martes', emoji: '📅' },
        { num: 3, nombre: 'Miércoles', emoji: '📅' },
        { num: 4, nombre: 'Jueves', emoji: '📅' },
        { num: 5, nombre: 'Viernes', emoji: '📅' },
        { num: 6, nombre: 'Sábado', emoji: '🎯' },
        { num: 0, nombre: 'Domingo', emoji: '☀️' }
    ];

    useEffect(() => { fetchDisponibilidad(); }, []);

    const fetchDisponibilidad = async () => {
        setLoading(true);
        const { data, error } = await mentorshipAPI.getMyDisponibilidad();
        if (error) setError('Error cargando disponibilidad: ' + (error.message || JSON.stringify(error)));
        else setDisponibilidad(data || []);
        setLoading(false);
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (newSlot.hora_inicio >= newSlot.hora_fin) {
            setError('La hora de fin debe ser mayor a la de inicio');
            return;
        }
        const { error } = await mentorshipAPI.addDisponibilidad(
            newSlot.dia_semana, newSlot.hora_inicio, newSlot.hora_fin
        );
        if (error) {
            setError('Error agregando horario: ' + (error.message || JSON.stringify(error)));
        } else {
            await fetchDisponibilidad();
            setShowAddModal(false);
            setNewSlot({ dia_semana: 1, hora_inicio: '09:00', hora_fin: '10:00' });
            setSuccess('Horario agregado exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const confirmDelete = (slot) => {
        setSlotToDelete(slot);
        setShowConfirmDelete(true);
    };

    const handleDelete = async () => {
        const { error } = await mentorshipAPI.deleteDisponibilidad(slotToDelete.id_disponibilidad);
        if (error) {
            setError('Error eliminando horario: ' + (error.message || JSON.stringify(error)));
        } else {
            setDisponibilidad(disponibilidad.filter(d => d.id_disponibilidad !== slotToDelete.id_disponibilidad));
            setSuccess('Horario eliminado');
            setTimeout(() => setSuccess(''), 3000);
        }
        setShowConfirmDelete(false);
        setSlotToDelete(null);
    };

    const handleToggle = async (id, activo) => {
        const { error } = await mentorshipAPI.toggleDisponibilidad(id, !activo);
        if (error) {
            setError('Error actualizando horario: ' + (error.message || JSON.stringify(error)));
        } else {
            setDisponibilidad(disponibilidad.map(d =>
                d.id_disponibilidad === id ? { ...d, activo: !activo } : d
            ));
            setSuccess(!activo ? 'Horario activado' : 'Horario desactivado');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const groupedByDay = disponibilidad.reduce((acc, slot) => {
        if (!acc[slot.dia_semana]) acc[slot.dia_semana] = [];
        acc[slot.dia_semana].push(slot);
        return acc;
    }, {});

    if (loading) return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, color: '#6b7280' }}>Cargando calendario...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Mi Calendario</h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '12px 24px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                    >
                        <span style={{ fontSize: 18 }}>+</span> Agregar Horario
                    </button>
                </div>
                <p style={{ color: '#6b7280', margin: 0 }}>Configura tus horarios disponibles para sesiones de mentoría</p>
            </div>

            {/* Alerts */}
            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    background: '#d1fae5',
                    border: '1px solid #6ee7b7',
                    color: '#065f46',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <span style={{ fontSize: 20 }}>✓</span>
                    {success}
                </div>
            )}

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {diasSemana.map(({ num, nombre, emoji }) => {
                    const slots = groupedByDay[num] || [];
                    const hasSlots = slots.length > 0;

                    return (
                        <div
                            key={num}
                            style={{
                                background: '#fff',
                                borderRadius: 12,
                                border: hasSlots ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                padding: 20,
                                minHeight: 200,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Day Header */}
                            <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 24 }}>{emoji}</span>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>
                                        {nombre}
                                    </h3>
                                </div>
                                <p style={{ margin: '4px 0 0 32px', fontSize: 12, color: hasSlots ? '#3b82f6' : '#9ca3af' }}>
                                    {hasSlots ? `${slots.length} horario${slots.length > 1 ? 's' : ''}` : 'Sin horarios'}
                                </p>
                            </div>

                            {/* Slots */}
                            {hasSlots ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {slots.map(slot => (
                                        <div
                                            key={slot.id_disponibilidad}
                                            style={{
                                                padding: 16,
                                                background: slot.activo ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : '#f9fafb',
                                                border: `1px solid ${slot.activo ? '#bfdbfe' : '#e5e7eb'}`,
                                                borderRadius: 8,
                                                opacity: slot.activo ? 1 : 0.7
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 20 }}>🕐</span>
                                                    <span style={{ fontWeight: 600, color: slot.activo ? '#1e40af' : '#4b5563', fontSize: 15 }}>
                                                        {slot.hora_inicio} - {slot.hora_fin}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    padding: '4px 8px',
                                                    borderRadius: 12,
                                                    background: slot.activo ? '#10b981' : '#9ca3af',
                                                    color: '#fff'
                                                }}>
                                                    {slot.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => handleToggle(slot.id_disponibilidad, slot.activo)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 12px',
                                                        background: slot.activo ? '#fbbf24' : '#10b981',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    {slot.activo ? '⏸️ Pausar' : '▶️ Activar'}
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(slot)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: '#dc2626',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📭</div>
                                    <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic' }}>
                                        Sin horarios configurados
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal Agregar */}
            {showAddModal && (
                <>
                    <div
                        onClick={() => setShowAddModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#fff',
                        borderRadius: 16,
                        padding: 32,
                        width: 'min(90vw, 500px)',
                        zIndex: 1001,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700 }}>Agregar Horario</h2>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                                Día de la semana
                            </label>
                            <select
                                value={newSlot.dia_semana}
                                onChange={(e) => setNewSlot({ ...newSlot, dia_semana: parseInt(e.target.value, 10) })}
                                style={{
                                    width: '100%',
                                    padding: 12,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    cursor: 'pointer'
                                }}
                            >
                                {diasSemana.map(({ num, nombre, emoji }) => (
                                    <option key={num} value={num}>{emoji} {nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                                    Hora de inicio
                                </label>
                                <input
                                    type="time"
                                    value={newSlot.hora_inicio}
                                    onChange={(e) => setNewSlot({ ...newSlot, hora_inicio: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: 12,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        fontSize: 14
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                                    Hora de fin
                                </label>
                                <input
                                    type="time"
                                    value={newSlot.hora_fin}
                                    onChange={(e) => setNewSlot({ ...newSlot, hora_fin: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: 12,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        fontSize: 14
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: 15
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAddSlot}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: 15
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Confirmar Eliminación */}
            {showConfirmDelete && slotToDelete && (
                <>
                    <div
                        onClick={() => setShowConfirmDelete(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#fff',
                        borderRadius: 16,
                        padding: 32,
                        width: 'min(90vw, 450px)',
                        zIndex: 1001,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: 22 }}>¿Eliminar horario?</h2>
                        <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
                            ¿Estás seguro de eliminar el horario de <strong>{slotToDelete.hora_inicio} - {slotToDelete.hora_fin}</strong>?
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowConfirmDelete(false)}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    background: '#dc2626',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}