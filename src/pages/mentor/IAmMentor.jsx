import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function IAmMentor() {
    const navigate = useNavigate();
    const [materias, setMaterias] = useState([]);
    const [todasMaterias, setTodasMaterias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMaterias, setFilteredMaterias] = useState([]);
    const [selectedMateria, setSelectedMateria] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [materiaToRemove, setMateriaToRemove] = useState(null);

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalizeText = (text) =>
        text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    useEffect(() => {
        if (searchTerm.trim()) {
            const normalized = normalizeText(searchTerm);
            const filtered = todasMaterias.filter(m =>
                normalizeText(m.nombre_materia).includes(normalized) &&
                !materias.some(mm => mm.materia.id_materia === m.id_materia)
            );
            setFilteredMaterias(filtered);
            setShowDropdown(true);
        } else {
            setFilteredMaterias([]);
            setShowDropdown(false);
        }
    }, [searchTerm, todasMaterias, materias]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Debes iniciar sesión');
                return;
            }

            const { data: usuarioData, error: usuarioErr } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (usuarioErr || !usuarioData) {
                console.error('❌ Error usuario:', usuarioErr);
                setError('No se encontró tu perfil');
                return;
            }

            const { data: mentores, error: mentorErr } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario);

            if (mentorErr) {
                console.error('❌ Error al buscar mentores:', mentorErr);
                setError('Error al verificar tu estado de mentor');
                return;
            }

            if (!mentores || mentores.length === 0) {
                setMaterias([]);
                setError('');
                setLoading(false);
                return;
            }

            let todasMisMaterias = [];

            for (const mentor of mentores) {
                const { data: materiasDeEsteMentor, error: fetchError } = await supabase
                    .from('mentor_materia')
                    .select(`id, id_mentor, id_materia, materia (id_materia, nombre_materia, semestre)`)
                    .eq('id_mentor', mentor.id_mentor);

                if (fetchError) {
                    console.error(`❌ Error obteniendo materias del mentor ${mentor.id_mentor}:`, fetchError);
                    continue;
                }

                if (materiasDeEsteMentor) {
                    todasMisMaterias = [...todasMisMaterias, ...materiasDeEsteMentor];
                }
            }

            setMaterias(todasMisMaterias);
        } catch (err) {
            console.error('❌ Error general en fetchData:', err);
            setError('Error inesperado al cargar información');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMateria = async () => {
        if (!selectedMateria) { setError('Debes seleccionar una materia'); return; }
        try {
            setError(''); setSuccess('');
            const { data: { user } } = await supabase.auth.getUser();

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            const { data: mentores } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario);

            if (!mentores || mentores.length === 0) {
                setError('No estás registrado como mentor');
                return;
            }

            const idMentor = mentores[0].id_mentor;

            const { error: insertError } = await supabase
                .from('mentor_materia')
                .insert([{
                    id_mentor: idMentor,
                    id_materia: selectedMateria.id_materia
                }]);

            if (insertError) throw insertError;

            setSuccess('Materia agregada exitosamente');
            setShowAddModal(false);
            setSearchTerm('');
            setSelectedMateria(null);
            fetchData();
        } catch (err) {
            setError('Error al agregar materia: ' + err.message);
        }
    };

    const handleRemoveMateria = (mentorMateriaId, materiaNombre) => {
        setMateriaToRemove({ id: mentorMateriaId, nombre: materiaNombre });
        setShowConfirmModal(true);
    };

    const confirmRemoveMateria = async () => {
        try {
            console.log('🔍 ID a borrar:', materiaToRemove.id);

            // 1. Obtener id_mentor antes de borrar
            const { data: registroExistente } = await supabase
                .from('mentor_materia')
                .select('id_mentor')
                .eq('id', materiaToRemove.id)
                .single();

            if (!registroExistente) {
                setError('El registro no existe');
                setShowConfirmModal(false);
                return;
            }

            const idMentor = registroExistente.id_mentor;

            // 2. Borrar de mentor_materia
            const { error: deleteError } = await supabase
                .from('mentor_materia')
                .delete()
                .eq('id', materiaToRemove.id);

            if (deleteError) {
                console.error('❌ ERROR:', deleteError);
                setError(`Error: ${deleteError.message}`);
                setShowConfirmModal(false);
                return;
            }

            // 3. Verificar si el mentor tiene otras materias
            const { data: otrasMaterias } = await supabase
                .from('mentor_materia')
                .select('id')
                .eq('id_mentor', idMentor);

            // 4. Si no tiene más materias, borrar de la tabla mentor para que no aparezca más
            if (!otrasMaterias || otrasMaterias.length === 0) {
                console.log('🗑️ No tiene más materias, borrando de tabla mentor...');
                const { error: deleteMentorError } = await supabase
                    .from('mentor')
                    .delete()
                    .eq('id_mentor', idMentor);

                if (deleteMentorError) {
                    console.error('⚠️ Error al borrar mentor:', deleteMentorError);
                }
            }

            // 5. Actualizar estado local
            setMaterias(materias.filter(m => m.id !== materiaToRemove.id));
            setSuccess('Te diste de baja exitosamente');
            setTimeout(() => setSuccess(''), 3000);
            setShowConfirmModal(false);
            setMateriaToRemove(null);
        } catch (err) {
            console.error('💥 Error inesperado:', err);
            setError('Error al darte de baja: ' + err.message);
            setShowConfirmModal(false);
        }
    };

    if (loading) {
        return <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, textAlign: 'center' }}>
            <p>Cargando...</p>
        </div>;
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0' }}>Soy Mentor</h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>Gestiona las materias en las que sos mentor</p>
                </div>
                <Button
                    onClick={() => navigate('/mentores/postular')}
                    style={{
                        padding: '12px 24px',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    + Agregar Materia
                </Button>
            </div>
            {error && <Card style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, marginBottom: 20 }}>{error}</Card>}
            {success && <Card style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: 16, marginBottom: 20 }}>{success}</Card>}

            {materias.length === 0 ? (
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h3 style={{ margin: '0 0 12px 0' }}>No tenés materias asignadas</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>Agrega materias donde querés ser mentor</p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {materias.map(m => (
                        <Card key={m.id} style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{m.materia.nombre_materia}</h3>
                                    <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>Semestre {m.materia.semestre}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveMateria(m.id, m.materia.nombre_materia)} // 👈 Cambia a m.id
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#dc2626',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background 0.2s ease'
                                    }}
                                >
                                    Darme de baja
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal Agregar Materia */}
            {showAddModal && (
                <>
                    <div
                        onClick={() => setShowAddModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
                    />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: '#fff', borderRadius: 12, padding: 32, width: 'min(90vw, 500px)',
                        zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ margin: '0 0 24px 0' }}>Agregar Materia</h2>

                        <div style={{ marginBottom: 24, position: 'relative' }} ref={dropdownRef}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Buscar materia</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setSelectedMateria(null); }}
                                placeholder="Ej: Análisis Matemático"
                                style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                            />
                            {showDropdown && filteredMaterias.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                                    border: '1px solid #d1d5db', borderRadius: 8, marginTop: 4, maxHeight: 200,
                                    overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}>
                                    {filteredMaterias.map(materia => (
                                        <div
                                            key={materia.id_materia}
                                            onClick={() => { setSelectedMateria(materia); setSearchTerm(materia.nombre_materia); setShowDropdown(false); }}
                                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                        >
                                            <div style={{ fontWeight: 500 }}>{materia.nombre_materia}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>{materia.semestre}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="button" onClick={() => setShowAddModal(false)}
                                    style={{ flex: 1, padding: 12, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button type="button" onClick={handleAddMateria} disabled={!selectedMateria}
                                    style={{ flex: 1, padding: 12, background: selectedMateria ? '#2563eb' : '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: selectedMateria ? 'pointer' : 'not-allowed' }}>
                                Agregar
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Confirmación Eliminar */}
            {showConfirmModal && materiaToRemove && (
                <>
                    <div
                        onClick={() => setShowConfirmModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
                    />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: '#fff', borderRadius: 12, padding: 32, width: 'min(90vw, 450px)',
                        zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>⚠️</div>
                        <h2 style={{ margin: '0 0 12px 0', textAlign: 'center' }}>¿Confirmar baja?</h2>
                        <p style={{ color: '#6b7280', textAlign: 'center', margin: '0 0 24px 0' }}>
                            ¿Estás seguro de que querés dejar de ser mentor de <strong>{materiaToRemove.nombre}</strong>?
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    flex: 1, padding: 12, background: '#f3f4f6', color: '#374151',
                                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRemoveMateria}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                style={{
                                    flex: 1, padding: 12, background: '#dc2626', color: '#fff',
                                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                            >
                                Sí, darme de baja
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}