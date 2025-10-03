import { useState, useEffect } from 'react';
import { mentorshipAPI } from '../../api/database';

export default function MyCalendar() {
    const [disponibilidad, setDisponibilidad] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newSlot, setNewSlot] = useState({ dia_semana: 1, hora_inicio: '09:00', hora_fin: '10:00' });

    const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    useEffect(() => { fetchDisponibilidad(); }, []);

    const fetchDisponibilidad = async () => {
        setLoading(true);
        const { data, error } = await mentorshipAPI.getMyDisponibilidad();
        if (error) setError('Error cargando disponibilidad: ' + error);
        else setDisponibilidad(data || []);
        setLoading(false);
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (newSlot.hora_inicio >= newSlot.hora_fin) {
            setError('La hora de fin debe ser mayor a la de inicio'); return;
        }
        const { data, error } = await mentorshipAPI.addDisponibilidad(
            newSlot.dia_semana, newSlot.hora_inicio, newSlot.hora_fin
        );
        if (error) setError('Error agregando horario: ' + error);
        else {
            setDisponibilidad([...disponibilidad, data[0]]);
            setShowAddModal(false);
            setNewSlot({ dia_semana: 1, hora_inicio: '09:00', hora_fin: '10:00' });
            setSuccess('Horario agregado exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este horario?')) return;
        const { error } = await mentorshipAPI.deleteDisponibilidad(id);
        if (error) setError('Error eliminando horario: ' + error);
        else {
            setDisponibilidad(disponibilidad.filter(d => d.id_disponibilidad !== id));
            setSuccess('Horario eliminado'); setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleToggle = async (id, activo) => {
        const { error } = await mentorshipAPI.toggleDisponibilidad(id, !activo);
        if (error) setError('Error actualizando horario: ' + error);
        else {
            setDisponibilidad(disponibilidad.map(d => d.id_disponibilidad === id ? { ...d, activo: !activo } : d));
            setSuccess(!activo ? 'Horario activado' : 'Horario desactivado'); setTimeout(() => setSuccess(''), 3000);
        }
    };

    const groupedByDay = disponibilidad.reduce((acc, slot) => {
        if (!acc[slot.dia_semana]) acc[slot.dia_semana] = [];
        acc[slot.dia_semana].push(slot);
        return acc;
    }, {});

    if (loading) return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, textAlign: 'center' }}>
            <p>Cargando calendario...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0' }}>Mi Calendario</h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>Configura tus horarios disponibles para sesiones de mentoría</p>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{
                    padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none',
                    borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
                }}>
                    + Agregar Horario
                </button>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 20 }}>{error}</div>}
            {success && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: 16, borderRadius: 8, marginBottom: 20 }}>{success}</div>}

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {[1,2,3,4,5,6,0].map(dia => (
                    <div key={dia} style={{ padding: 20, borderBottom: dia !== 0 ? '1px solid #e5e7eb' : 'none' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>{diasSemana[dia]}</h3>

                        {groupedByDay[dia]?.length ? (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {groupedByDay[dia].map(slot => (
                                    <div key={slot.id_disponibilidad} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: 16, background: slot.activo ? '#f0f9ff' : '#f9fafb',
                                        border: `1px solid ${slot.activo ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: 8, opacity: slot.activo ? 1 : 0.6
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ fontSize: 24, filter: slot.activo ? 'none' : 'grayscale(1)' }}>🕐</div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: slot.activo ? '#1e40af' : '#4b5563' }}>
                                                    {slot.hora_inicio} - {slot.hora_fin}
                                                </div>
                                                <div style={{ fontSize: 14, color: slot.activo ? '#3b82f6' : '#6b7280' }}>
                                                    {slot.activo ? 'Disponible' : 'Inactivo'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleToggle(slot.id_disponibilidad, slot.activo)} style={{
                                                padding: '8px 16px', background: slot.activo ? '#fbbf24' : '#10b981',
                                                color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600
                                            }}>
                                                {slot.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                            <button onClick={() => handleDelete(slot.id_disponibilidad)} style={{
                                                padding: '8px 16px', background: '#dc2626', color: '#fff',
                                                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600
                                            }}>
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0, fontStyle: 'italic' }}>
                                No tienes horarios configurados para este día
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal para agregar horario */}
            {showAddModal && (
                <>
                    <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: '#fff', borderRadius: 12, padding: 32, width: 'min(90vw, 500px)',
                        zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ margin: '0 0 24px 0' }}>Agregar Horario</h2>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Día de la semana</label>
                            <select
                                value={newSlot.dia_semana}
                                onChange={(e) => setNewSlot({ ...newSlot, dia_semana: parseInt(e.target.value, 10) })}
                                style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                            >
                                {diasSemana.map((dia, idx) => (<option key={idx} value={idx}>{dia}</option>))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Hora de inicio</label>
                            <input
                                type="time"
                                value={newSlot.hora_inicio}
                                onChange={(e) => setNewSlot({ ...newSlot, hora_inicio: e.target.value })}
                                style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Hora de fin</label>
                            <input
                                type="time"
                                value={newSlot.hora_fin}
                                onChange={(e) => setNewSlot({ ...newSlot, hora_fin: e.target.value })}
                                style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="button" onClick={() => setShowAddModal(false)} style={{
                                flex: 1, padding: 12, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                            }}>
                                Cancelar
                            </button>
                            <button type="button" onClick={handleAddSlot} style={{
                                flex: 1, padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                            }}>
                                Agregar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
