import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function MyMentorships() {
    const [mentorships, setMentorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyMentorships();
    }, []);

    const fetchMyMentorships = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Debes iniciar sesión');
                return;
            }

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (!usuarioData) {
                setError('No se encontró tu perfil');
                return;
            }

            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('contacto', usuarioData.id_usuario)
                .single();

            if (!mentorData) {
                setMentorships([]);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('mentor_materia')
                .select(`
                    id,
                    id_materia,
                    materia(nombre_materia, semestre)
                `)
                .eq('id_mentor', mentorData.id_mentor);

            if (fetchError) throw fetchError;
            setMentorships(data || []);

        } catch (err) {
            console.error('Error cargando mentorías:', err);
            setError('Error al cargar tus mentorías');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMentorship = async (mentorshipId, materiaName) => {
        if (!confirm(`¿Estás seguro que querés dejar de ser mentor de ${materiaName}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('mentor_materia')
                .delete()
                .eq('id', mentorshipId);

            if (error) throw error;

            setMentorships(prev => prev.filter(m => m.id !== mentorshipId));
            alert('Te diste de baja exitosamente');

        } catch (err) {
            console.error('Error eliminando mentoría:', err);
            alert('Error al darte de baja');
        }
    };

    if (loading) {
        return (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, textAlign: 'center' }}>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
            <h1 style={{ marginBottom: 12 }}>Mis Mentorías</h1>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>
                Materias en las que sos mentor actualmente
            </p>

            {error && (
                <Card style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: 16,
                    marginBottom: 20
                }}>
                    {error}
                </Card>
            )}

            {mentorships.length === 0 ? (
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h3 style={{ margin: '0 0 12px 0' }}>No sos mentor aún</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                        Postulate para ser mentor de alguna materia
                    </p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {mentorships.map(mentorship => (
                        <Card key={mentorship.id} style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 6px 0' }}>
                                        {mentorship.materia.nombre_materia}
                                    </h3>
                                    <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
                                        {mentorship.materia.semestre}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handleRemoveMentorship(
                                        mentorship.id,
                                        mentorship.materia.nombre_materia
                                    )}
                                    style={{
                                        background: '#dc2626',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Darme de baja
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}