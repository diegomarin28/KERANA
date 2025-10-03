import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('apunte')
                .select(`
                    id_apunte,
                    titulo,
                    descripcion,
                    creditos,
                    estrellas,
                    created_at,
                    usuario:id_usuario(nombre),
                    materia:id_materia(nombre_materia)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotes(data || []);
        } catch (err) {
            console.error('Error cargando apuntes:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.materia?.nombre_materia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, textAlign: 'center' }}>
                <p>Cargando apuntes...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: '0 0 8px 0' }}>Apuntes</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>
                    Encuentra apuntes compartidos por otros estudiantes
                </p>
            </div>

            <input
                type="text"
                placeholder="Buscar por título, materia o autor..."
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

            {filteredNotes.length === 0 ? (
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                    <h3 style={{ margin: '0 0 12px 0' }}>No hay apuntes disponibles</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                        {searchTerm
                            ? 'No se encontraron apuntes con ese criterio'
                            : 'Sé el primero en compartir tus apuntes'}
                    </p>
                </Card>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 20
                }}>
                    {filteredNotes.map(note => (
                        <Card
                            key={note.id_apunte}
                            style={{
                                padding: 20,
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={() => navigate(`/apuntes/${note.id_apunte}`)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ marginBottom: 12 }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>
                                    {note.titulo}
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 8
                                }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        borderRadius: 12,
                                        fontSize: 12,
                                        fontWeight: 500
                                    }}>
                                        {note.materia?.nombre_materia || 'Sin materia'}
                                    </span>
                                    {note.estrellas > 0 && (
                                        <span style={{ color: '#f59e0b', fontSize: 14 }}>
                                            {'★'.repeat(note.estrellas)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {note.descripcion && (
                                <p style={{
                                    color: '#6b7280',
                                    fontSize: 14,
                                    marginBottom: 12,
                                    lineHeight: 1.4
                                }}>
                                    {note.descripcion.length > 100
                                        ? note.descripcion.substring(0, 100) + '...'
                                        : note.descripcion}
                                </p>
                            )}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: 12,
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <span style={{ fontSize: 13, color: '#6b7280' }}>
                                    Por {note.usuario?.nombre || 'Anónimo'}
                                </span>
                                <span style={{
                                    padding: '4px 10px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 600
                                }}>
                                    {note.creditos} créditos
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}