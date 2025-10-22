import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../supabase';
import { getOrCreateUserProfile } from '../api/userService';
import ApunteCard from '../components/ApunteCard';

export default function Favorites() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            // Perfil (bigint)
            const userProfile = await getOrCreateUserProfile();
            const userId = userProfile.id_usuario;

            let allFavorites = [];

            // === APUNTES FAVORITOS ===
            // === APUNTES FAVORITOS ===
            const { data: notesFav, error: notesFavError } = await supabase
                .from('apunte_fav')
                .select('id_usuario, id_apunte')
                .eq('id_usuario', userId);

            console.log('Favoritos encontrados:', notesFav);
            console.log('Error favoritos:', notesFavError);

            let noteItems = [];
            if (notesFav?.length) {
                const apIds = notesFav.map(r => r.id_apunte);

                const { data: apuntes, error: apuntesError } = await supabase
                    .from('apunte')
                    .select(`
                               id_apunte,
                                titulo,
                                descripcion,
                                creditos,
                                estrellas,
                                id_materia,
                                id_usuario,
                                file_path,
                                materia:id_materia(nombre_materia),
                                thumbnail_path
                            `)
                    .in('id_apunte', apIds);

                if (apuntesError) {
                    console.error('Error cargando apuntes:', apuntesError);
                    throw apuntesError;
                }
                console.log('Apuntes cargados:', apuntes);

                // Contar likes por apunte
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

                // autor (opcional)
                let userMap = {};
                const uIds = [...new Set((apuntes || []).map(a => a.id_usuario).filter(Boolean))];
                if (uIds.length) {
                    const { data: users } = await supabase
                        .from('usuario')
                        .select('id_usuario, nombre')
                        .in('id_usuario', uIds);
                    userMap = (users || []).reduce((acc, u) => {
                        acc[u.id_usuario] = u.nombre;
                        return acc;
                    }, {});
                }

                const apuntesWithSignedUrls = await Promise.all((apuntes || []).map(async (apunte) => {
                    if (apunte.file_path) {
                        const { data: signedData } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(apunte.file_path, 3600);
                        return { ...apunte, signedUrl: signedData?.signedUrl || null };
                    }
                    return apunte;
                }));

                noteItems = (notesFav || [])
                    .map(r => {
                        const a = apuntesWithSignedUrls.find(x => x.id_apunte === r.id_apunte);
                        return a ? {
                            favId: `${userId}-${a.id_apunte}`,
                            type: 'note',
                            note: {
                                id_apunte: a.id_apunte,
                                titulo: a.titulo,
                                descripcion: a.descripcion,
                                creditos: a.creditos,
                                signedUrl: a.signedUrl,
                                thumbnail_path: a.thumbnail_path,
                                materia: a.materia,
                                usuario: { nombre: userMap[a.id_usuario] || 'Anónimo' },
                                id_usuario: a.id_usuario,
                                likes_count: likesCountMap[a.id_apunte] || 0  // ← NUEVO
                            }
                        } : null;
                    })
                    .filter(Boolean);
            }
            allFavorites = [...allFavorites, ...noteItems];

            // === MENTORES FAVORITOS ===
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth?.user?.id; // uuid requerido por RLS
            let mentorItems = [];
            if (uid) {
                const { data: mentorsFav } = await supabase
                    .from('usuario_fav_mentores')
                    .select('id, id_mentor')
                    .eq('usuario_id', uid);

                if (mentorsFav?.length) {
                    const mIds = mentorsFav.map(r => r.id_mentor);
                    const { data: mentors } = await supabase
                        .from('mentor')
                        .select('id_mentor, estrellas_mentor, contacto, descripcion')
                        .in('id_mentor', mIds);

                    mentorItems = mentorsFav
                        .map(r => {
                            const m = (mentors || []).find(x => x.id_mentor === r.id_mentor);
                            return m ? {
                                favId: r.id,
                                id: m.id_mentor,
                                type: 'mentor',
                                title: m.descripcion || 'Mentor',
                                subtitle: String(m.contacto || '').trim() || 'Contacto',
                                details: 'Mentoría personalizada',
                                price: 0,
                                rating: m.estrellas_mentor || '0',
                                link: `/mentores/${m.id_mentor}`
                            } : null;
                        })
                        .filter(Boolean);
                }
            }
            allFavorites = [...allFavorites, ...mentorItems];

            // (OPCIONAL) Cursos favoritos → hoy tu tabla usuario_fav apunta a usuario,
            // no a profesor_curso. Si querés cursos, mejor crear curso_fav(id_usuario, id_profesor).

            setItems(allFavorites);
        } catch (error) {
            setErrorMsg('Error cargando favoritos: ' + (error.message || 'verifica tu conexión'));
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (favId, type) => {
        try {
            let tableName;
            let field;
            if (type === 'note') {
                // favId lo generamos como `${id_usuario}-${id_apunte}`
                const [u, a] = String(favId).split('-').map(x => Number(x));
                tableName = 'apunte_fav';
                field = { id_usuario: u, id_apunte: a };
                const { error } = await supabase.from(tableName).delete().match(field);
                if (error) throw error;
            } else if (type === 'mentor') {
                tableName = 'usuario_fav_mentores';
                const { error } = await supabase.from(tableName).delete().eq('id', favId);
                if (error) throw error;
            } else {
                // otro tipo → usuario_fav (estructura actual apunta a usuario)
                tableName = 'usuario_fav';
                const { error } = await supabase.from(tableName).delete().eq('id_favorito', favId);
                if (error) throw error;
            }

            load();
        } catch (error) {
            setErrorMsg('Error eliminando favorito: ' + (error.message || ''));
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'course': return '📚';
            case 'note': return '📝';
            case 'mentor': return '💡';
            default: return '⭐';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'course': return 'Curso';
            case 'note': return 'Apunte';
            case 'mentor': return 'Mentor';
            default: return 'Item';
        }
    };

    const filteredItems = activeFilter === 'all'
        ? items
        : items.filter(item => item.type === activeFilter);

    if (loading) {
        return (
            <div style={{
                minHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #f3f4f6",
                    borderTop: "3px solid #2563eb",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#6b7280", margin: 0 }}>Cargando favoritos…</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
            <header style={{ marginBottom: 30 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0', color: '#0b1e3a' }}>
                    Mis Favoritos
                </h1>
                <p style={{ color: '#64748b', margin: 0 }}>
                    Todos tus cursos, apuntes y mentores favoritos en un solo lugar
                </p>
            </header>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'Todos', count: items.length },
                    { key: 'course', label: 'Cursos', count: items.filter(i => i.type === 'course').length },
                    { key: 'note', label: 'Apuntes', count: items.filter(i => i.type === 'note').length },
                    { key: 'mentor', label: 'Mentores', count: items.filter(i => i.type === 'mentor').length }
                ].map(filter => (
                    <Button
                        key={filter.key}
                        variant={activeFilter === filter.key ? 'primary' : 'secondary'}
                        onClick={() => setActiveFilter(filter.key)}
                        style={{ fontSize: 14 }}
                    >
                        {filter.label} ({filter.count})
                    </Button>
                ))}
            </div>

            {errorMsg && (
                <Card style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: 16,
                    marginBottom: 20
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{errorMsg}</span>
                        <Button variant="ghost" onClick={load} style={{ marginLeft: 10 }}>
                            Reintentar
                        </Button>
                    </div>
                </Card>
            )}

            {filteredItems.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: 60, background: '#f8fafc' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                    <h3 style={{ margin: '0 0 12px 0', color: '#334155' }}>
                        {activeFilter === 'all' ? 'No tenés favoritos' : `No tenés ${getTypeLabel(activeFilter).toLowerCase()}s favoritos`}
                    </h3>
                    <p style={{
                        color: '#64748b',
                        margin: '0 0 20px 0',
                        maxWidth: 400,
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        {activeFilter === 'all'
                            ? 'Guardá cursos, apuntes y mentores que te interesen para encontrarlos fácilmente después.'
                            : `Explorá ${getTypeLabel(activeFilter).toLowerCase()}s y agregalos a favoritos.`}
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => window.location.href = `/${activeFilter === 'all' ? 'cursos' : activeFilter + 's'}`}
                    >
                        Explorar {activeFilter === 'all' ? 'Contenido' : getTypeLabel(activeFilter) + 's'}
                    </Button>
                </Card>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                        gap: 16
                    }}
                >
                    {filteredItems.map(item => (
                        item.type === 'note' ? (
                            <ApunteCard
                                key={`${item.type}-${item.favId}`}
                                note={item.note}
                            />
                        ) : (
                            <Card
                                key={`${item.type}-${item.favId}`}
                                style={{
                                    padding: 20,
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    border: '1px solid #e5e7eb'
                                }}
                            >
                                {/* contenido del card de curso o mentor */}
                            </Card>
                        )
                    ))}
                </div>

            )}
        </div>
    );
}
