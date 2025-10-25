import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { MentorCard } from '../components/MentorCard';

export default function Mentors() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [filterMateria, setFilterMateria] = useState('all');
    const [allMaterias, setAllMaterias] = useState([]);

    useEffect(() => {
        getCurrentUserId();
        loadMentors();
    }, []);

    const getCurrentUserId = async () => {
        try {
            const { data } = await supabase.rpc('obtener_usuario_actual_id');
            setCurrentUserId(data);
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
        }
    };

    const loadMentors = async () => {
        try {
            setLoading(true);

            // Obtener usuario actual para excluirlo
            const { data: currentUserData } = await supabase.rpc('obtener_usuario_actual_id');

            // Obtener mentores (excluyendo al usuario actual)
            const { data: mentorsData, error: mentorsError } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, descripcion, id_usuario')
                .neq('id_usuario', currentUserData || 0) // Excluir al usuario actual
                .limit(50);

            if (mentorsError) throw mentorsError;

            // Obtener info de seguimiento para cada mentor
            const { data: seguimientosData } = currentUserData ? await supabase
                .from('seguidores')
                .select('seguido_id')
                .eq('seguidor_id', currentUserData)
                .eq('estado', 'activo') : { data: [] };

            const siguiendoIds = new Set(seguimientosData?.map(s => s.seguido_id) || []);

            // Para cada mentor, obtener usuario y materias
            const mentorsWithDetails = await Promise.all(
                (mentorsData || []).map(async (m) => {
                    // Obtener usuario
                    const { data: usuario } = await supabase
                        .from('usuario')
                        .select('nombre, username, foto')
                        .eq('id_usuario', m.id_usuario)
                        .maybeSingle();

                    // Obtener materias
                    const { data: materias } = await supabase
                        .from('mentor_materia')
                        .select('materia(nombre_materia)')
                        .eq('id_mentor', m.id_mentor);

                    return {
                        id_mentor: m.id_mentor,
                        id_usuario: m.id_usuario,
                        mentor_nombre: usuario?.nombre || 'Mentor',
                        username: usuario?.username,
                        foto: usuario?.foto,
                        estrellas_mentor: m.estrellas_mentor || 0,
                        descripcion: m.descripcion,
                        materias: materias?.map(mm => mm.materia.nombre_materia) || [],
                        siguiendo: siguiendoIds.has(m.id_usuario)
                    };
                })
            );

            // Extraer todas las materias únicas
            const materiasUnicas = [...new Set(
                mentorsWithDetails.flatMap(m => m.materias)
            )].sort();

            setAllMaterias(materiasUnicas);
            setMentors(mentorsWithDetails);
        } catch (err) {
            console.error('Error cargando mentores:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMentors = mentors.filter(m => {
        const matchesSearch = m.mentor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.materias.some(mat => mat.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesMateria = filterMateria === 'all' || m.materias.includes(filterMateria);

        return matchesSearch && matchesMateria;
    });

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ margin: '0 0 8px 0' }}>Mentores</h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                        Conecta con mentores que pueden ayudarte en tus materias
                    </p>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 20
                }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} style={{ padding: 20, height: 200, animation: 'pulse 1.5s ease-in-out infinite' }}>
                            <div style={{ background: '#f3f4f6', height: 60, borderRadius: '50%', width: 60, marginBottom: 12 }} />
                            <div style={{ background: '#f3f4f6', height: 20, borderRadius: 4, marginBottom: 8 }} />
                            <div style={{ background: '#f3f4f6', height: 16, borderRadius: 4, width: '60%' }} />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            {/* Header con stats */}
            <div style={{
                marginBottom: 32,
                padding: 24,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: 16,
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 800 }}>
                            🎓 Mentores
                        </h1>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>
                            Conecta con {mentors.length} mentores que pueden ayudarte
                        </p>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '12px 20px',
                        borderRadius: 12,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{mentors.length}</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>Mentores activos</div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 12,
                marginBottom: 24
            }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o materia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                        transition: 'border 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10B981'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />

                <select
                    value={filterMateria}
                    onChange={(e) => setFilterMateria(e.target.value)}
                    style={{
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        cursor: 'pointer',
                        outline: 'none',
                        background: 'white'
                    }}
                >
                    <option value="all">📚 Todas las materias</option>
                    {allMaterias.map(mat => (
                        <option key={mat} value={mat}>{mat}</option>
                    ))}
                </select>
            </div>

            {/* Resultados */}
            {filteredMentors.length === 0 ? (
                <Card style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 24 }}>No se encontraron mentores</h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: 16 }}>
                        {searchTerm || filterMateria !== 'all'
                            ? 'Intenta con otros criterios de búsqueda'
                            : 'Sé el primero en postularte como mentor'}
                    </p>
                    {(searchTerm || filterMateria !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterMateria('all');
                            }}
                            style={{
                                marginTop: 20,
                                padding: '10px 20px',
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </Card>
            ) : (
                <>
                    <div style={{
                        marginBottom: 16,
                        fontSize: 14,
                        color: '#6b7280',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>
                            Mostrando {filteredMentors.length} {filteredMentors.length === 1 ? 'mentor' : 'mentores'}
                        </span>
                        {(searchTerm || filterMateria !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterMateria('all');
                                }}
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    color: '#10B981',
                                    border: '1px solid #10B981',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 20
                    }}>
                        {filteredMentors.map(mentor => (
                            <MentorCard key={mentor.id_mentor} mentor={mentor} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}