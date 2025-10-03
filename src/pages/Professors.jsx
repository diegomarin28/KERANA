import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';

export default function Professors() {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadProfessors();
    }, []);

    const loadProfessors = async () => {
        try {
            // Cargar profesores únicos
            const { data: profsData, error: profsError } = await supabase
                .from('profesor_curso')
                .select('id_profesor, profesor_nombre, foto');

            if (profsError) throw profsError;

            // Remover duplicados
            const uniqueProfs = [];
            const seen = new Set();

            profsData?.forEach(prof => {
                if (!seen.has(prof.id_profesor)) {
                    seen.add(prof.id_profesor);
                    uniqueProfs.push(prof);
                }
            });

            // Para cada profesor, obtener sus materias
            const professorsWithMaterias = await Promise.all(
                uniqueProfs.map(async (prof) => {
                    const { data: materiasData } = await supabase
                        .from('imparte')
                        .select('materia(nombre_materia)')
                        .eq('id_profesor', prof.id_profesor);

                    return {
                        ...prof,
                        materias: materiasData?.map(m => m.materia.nombre_materia) || []
                    };
                })
            );

            setProfessors(professorsWithMaterias);
        } catch (err) {
            console.error('Error cargando profesores:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfessors = professors.filter(prof =>
        prof.profesor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.materias.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, textAlign: 'center' }}>
                <p>Cargando profesores...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            <h1 style={{ marginBottom: 8 }}>Profesores</h1>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Encuentra y califica a tus profesores
            </p>

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

            {filteredProfessors.length === 0 ? (
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                    <h3>No se encontraron profesores</h3>
                    <p style={{ color: '#6b7280' }}>
                        Intenta con otro término de búsqueda
                    </p>
                </Card>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 20
                }}>
                    {filteredProfessors.map(prof => (
                        <Card
                            key={prof.id_profesor}
                            style={{
                                padding: 20,
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={() => navigate(`/profesores/${prof.id_profesor}`)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 12
                            }}>
                                {prof.foto ? (
                                    <img
                                        src={prof.foto}
                                        alt={prof.profesor_nombre}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: '50%',
                                        background: '#e5e7eb',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: '#6b7280'
                                    }}>
                                        {prof.profesor_nombre[0]}
                                    </div>
                                )}
                                <h3 style={{ margin: 0, fontSize: 18 }}>{prof.profesor_nombre}</h3>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 6
                            }}>
                                {prof.materias.slice(0, 3).map((materia, idx) => (
                                    <span
                                        key={idx}
                                        style={{
                                            padding: '4px 10px',
                                            background: '#dbeafe',
                                            color: '#1e40af',
                                            borderRadius: 16,
                                            fontSize: 12,
                                            fontWeight: 500
                                        }}
                                    >
                                        {materia}
                                    </span>
                                ))}
                                {prof.materias.length > 3 && (
                                    <span style={{
                                        padding: '4px 10px',
                                        background: '#f3f4f6',
                                        color: '#6b7280',
                                        borderRadius: 16,
                                        fontSize: 12
                                    }}>
                                        +{prof.materias.length - 3} más
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