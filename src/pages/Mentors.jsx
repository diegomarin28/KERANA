import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';

export default function Mentors() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadMentors();
    }, []);

    const loadMentors = async () => {
        try {
            // Primero obtener mentores
            const { data: mentorsData, error: mentorsError } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, descripcion')
                .limit(50);

            if (mentorsError) throw mentorsError;

            // Para cada mentor, obtener usuario y materias
            const mentorsWithDetails = await Promise.all(
                (mentorsData || []).map(async (m) => {
                    // Obtener usuario
                    const { data: usuario } = await supabase
                        .from('usuario')
                        .select('nombre, correo')
                        .eq('id_usuario', m.id_mentor)
                        .single();

                    // Obtener materias
                    const { data: materias } = await supabase
                        .from('mentor_materia')
                        .select('materia(nombre_materia)')
                        .eq('id_mentor', m.id_mentor);

                    return {
                        id_mentor: m.id_mentor,
                        nombre: usuario?.nombre || 'Mentor',
                        estrellas: m.estrellas_mentor || 0,
                        descripcion: m.descripcion,
                        materias: materias?.map(mm => mm.materia.nombre_materia) || []
                    };
                })
            );

            setMentors(mentorsWithDetails);
        } catch (err) {
            console.error('Error cargando mentores:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMentors = mentors.filter(m =>
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.materias.some(mat => mat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, textAlign: 'center' }}>
                <p>Cargando mentores...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: '0 0 8px 0' }}>Mentores</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>
                    Conecta con mentores que pueden ayudarte en tus materias
                </p>
            </div>

            <input
                type="text"
                placeholder="Buscar por nombre o materia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    marginBottom: 24,
                    fontSize: 14
                }}
            />

            {filteredMentors.length === 0 ? (
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
                    <h3 style={{ margin: '0 0 12px 0' }}>No hay mentores disponibles aún</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                        {searchTerm
                            ? 'No se encontraron mentores con ese criterio'
                            : 'Sé el primero en postularte como mentor'}
                    </p>
                </Card>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 20
                }}>
                    {filteredMentors.map(mentor => (
                        <Card
                            key={mentor.id_mentor}
                            style={{
                                padding: 24,
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={() => navigate(`/mentores/${mentor.id_mentor}`)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: '#fff',
                                    marginBottom: 12
                                }}>
                                    {mentor.nombre[0]}
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>
                                    {mentor.nombre}
                                </h3>
                                <div style={{ color: '#f59e0b', marginBottom: 8 }}>
                                    {'★'.repeat(Math.round(mentor.estrellas))}
                                    {'☆'.repeat(5 - Math.round(mentor.estrellas))}
                                    <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 14 }}>
                                        ({mentor.estrellas})
                                    </span>
                                </div>
                            </div>

                            {mentor.descripcion && (
                                <p style={{
                                    color: '#4b5563',
                                    fontSize: 14,
                                    marginBottom: 12,
                                    lineHeight: 1.5
                                }}>
                                    {mentor.descripcion.length > 100
                                        ? mentor.descripcion.substring(0, 100) + '...'
                                        : mentor.descripcion}
                                </p>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {mentor.materias.slice(0, 3).map((materia, idx) => (
                                    <span
                                        key={idx}
                                        style={{
                                            padding: '4px 10px',
                                            background: '#dcfce7',
                                            color: '#166534',
                                            borderRadius: 16,
                                            fontSize: 12,
                                            fontWeight: 500
                                        }}
                                    >
                                        {materia}
                                    </span>
                                ))}
                                {mentor.materias.length > 3 && (
                                    <span style={{
                                        padding: '4px 10px',
                                        background: '#f3f4f6',
                                        color: '#6b7280',
                                        borderRadius: 16,
                                        fontSize: 12
                                    }}>
                                        +{mentor.materias.length - 3} más
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}