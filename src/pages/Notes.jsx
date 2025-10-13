import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import PDFThumbnail from '../components/PDFThumbnail';
import ApunteCard from "../components/ApunteCard";

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [signedUrls, setSignedUrls] = useState({});
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
                    file_path,
                    usuario:id_usuario(nombre),
                    materia:id_materia(nombre_materia)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotes(data || []);

            // 🆕 Generar signed URLs para todos los apuntes
            if (data && data.length > 0) {
                const urls = {};
                for (const note of data) {
                    if (note.file_path) {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(note.file_path, 3600); // Válida por 1 hora

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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}