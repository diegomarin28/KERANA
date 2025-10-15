import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { MentorCard } from '../components/MentorCard';

export default function Mentors() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMentors();
    }, []);

    const loadMentors = async () => {
        try {
            // Obtener mentores
            const { data: mentorsData, error: mentorsError } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, descripcion, id_usuario')
                .limit(50);

            if (mentorsError) throw mentorsError;

            // Para cada mentor, obtener usuario y materias
            const mentorsWithDetails = await Promise.all(
                (mentorsData || []).map(async (m) => {
                    // Obtener usuario (CORREGIDO: ahora usa m.id_usuario)
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
                        mentor_nombre: usuario?.nombre || 'Mentor',
                        username: usuario?.username,
                        foto: usuario?.foto,
                        estrellas_mentor: m.estrellas_mentor || 0,
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
        m.mentor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                        <MentorCard key={mentor.id_mentor} mentor={mentor} />
                    ))}
                </div>
            )}
        </div>
    );
}