import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function IAmMentor() {
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
            setError(''); // Limpiar errores previos

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Debes iniciar sesión');
                return;
            }

            // 1. Obtener id_usuario
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

            console.log('👤 ID Usuario:', usuarioData.id_usuario);

            // 2️⃣ Obtener todos los mentores del usuario
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
                console.log('⚠️ No estás registrado como mentor');
                setMaterias([]);
                setError('');
                setLoading(false);
                return;
            }

            console.log('🎓 Mentores encontrados:', mentores);

            // 3️⃣ Obtener materias para *todos* los mentores
            let todasMisMaterias = [];

            for (const mentor of mentores) {
                const { data: materiasDeEsteMentor, error: fetchError } = await supabase
                    .from('mentor_materia')
                    .select(`
            id,
            id_materia,
            materia (id_materia, nombre_materia, semestre)`)
                    .eq('id_mentor', mentor.id_mentor);

                if (fetchError) {
                    console.error(`❌ Error obteniendo materias del mentor ${mentor.id_mentor}:`, fetchError);
                    continue; // seguimos con el resto
                }

                if (materiasDeEsteMentor) {
                    todasMisMaterias = [...todasMisMaterias, ...materiasDeEsteMentor];
                }
            }

            console.log('📚 Total materias encontradas:', todasMisMaterias?.length);
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

            // 1. Obtener id_usuario
            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            // 2️⃣ Obtener todos los mentores del usuario
            const { data: mentores } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario);

            if (!mentores || mentores.length === 0) {
                setError('No estás registrado como mentor');
                return;
            }

            // 🧩 Tomamos el primero por simplicidad
            const idMentor = mentores[0].id_mentor;

            // 3️⃣ Insertar en mentor_materia
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

    const handleRemoveMateria = async (mentorMateriaId, materiaNombre) => {
        if (!confirm(`¿Dejar de ser mentor de ${materiaNombre}?`)) return;
        try {
            const { error } = await supabase.from('mentor_materia').delete().eq('id', mentorMateriaId);
            if (error) throw error;
            setMaterias(materias.filter(m => m.id !== mentorMateriaId));
            setSuccess('Te diste de baja exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Error al darte de baja');
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
                <Button onClick={() => setShowAddModal(true)} style={{
                    padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
                    fontWeight: 600, cursor: 'pointer'
                }}>
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
                                <button //Personalizado para esta parte
                                    onClick={() => handleRemoveMateria(m.id, m.materia.nombre_materia)}
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
        </div>
    );
}
