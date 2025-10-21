import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import PDFThumbnail from '../components/PDFThumbnail';
import ApunteCard from "../components/ApunteCard";

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [signedUrls, setSignedUrls] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        loadUserAndNotes();
    }, []);

    const loadUserAndNotes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: usuarioData } = await supabase
                    .from("usuario")
                    .select("id_usuario")
                    .eq("auth_id", user.id)
                    .maybeSingle();



                if (usuarioData) {
                    setCurrentUserId(usuarioData.id_usuario);

                }
            }
        } catch (err) {
            console.error('Error cargando usuario:', err);
        }

        await loadNotes();
    };

    const loadNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('apunte')
                .select(`
                id_apunte,
                id_usuario,
                titulo,
                descripcion,
                creditos,
                created_at,
                file_path,
                usuario:id_usuario(nombre),
                materia:id_materia(nombre_materia)
            `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Contar likes por apunte
            const apIds = (data || []).map(n => n.id_apunte);
            const { data: likesData, error: likesError } = await supabase
                .from('likes')
                .select('id_apunte')
                .eq('tipo', 'like')
                .in('id_apunte', apIds);

            if (likesError) {
                console.error('Error cargando likes:', likesError);
            }

            // Crear un mapa de conteo de likes
            const likesCountMap = {};
            likesData?.forEach(like => {
                likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
            });

            // Agregar likes_count a cada apunte
            const notesWithLikes = (data || []).map(note => ({
                ...note,
                likes_count: likesCountMap[note.id_apunte] || 0
            }));

            setNotes(notesWithLikes);

            // Generar signed URLs para todos los apuntes
            if (data && data.length > 0) {
                const urls = {};
                for (const note of data) {
                    if (note.file_path) {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(note.file_path, 3600);

                        if (!signedError && signedData) {
                            urls[note.id_apunte] = signedData.signedUrl;
                        }
                    }
                }
                setSignedUrls(urls);
            }
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
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20
                }}>
                    {filteredNotes.map(note => (
                        <ApunteCard
                            key={note.id_apunte}
                            note={{
                                ...note,
                                signedUrl: signedUrls[note.id_apunte] || null
                            }}
                            currentUserId={currentUserId}

                        />
                    ))}
                </div>
            )}
        </div>
    );
}