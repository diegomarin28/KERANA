import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart,
    faBook,
    faGraduationCap,
    faFilter,
    faRotateRight,
    faSpinner,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { supabase } from '../supabase';
import { getOrCreateUserProfile } from '../api/userService';
import ApunteCard from '../components/ApunteCard';
import { MentorCard } from '../components/MentorCard';

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
            const userProfile = await getOrCreateUserProfile();
            const userId = userProfile.id_usuario;

            let allFavorites = [];

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
                    .from('apuntes_completos')
                    .select('*')
                    .in('id_apunte', apIds);

                if (apuntesError) {
                    console.error('Error cargando apuntes:', apuntesError);
                    throw apuntesError;
                }
                console.log('Apuntes cargados:', apuntes);

                const { data: likesData, error: likesError } = await supabase
                    .from('likes')
                    .select('id_apunte')
                    .eq('tipo', 'like')
                    .in('id_apunte', apIds);

                if (likesError) {
                    console.error('Error cargando likes:', likesError);
                }

                const likesCountMap = {};
                likesData?.forEach(like => {
                    likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
                });

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
                                materia: { nombre_materia: a.materia_nombre },
                                usuario: { nombre: a.autor_nombre || 'Anónimo' },
                                id_usuario: a.id_usuario,
                                likes_count: likesCountMap[a.id_apunte] || 0
                            }
                        } : null;
                    })
                    .filter(Boolean);
            }
            allFavorites = [...allFavorites, ...noteItems];

            // === MENTORES FAVORITOS ===
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth?.user?.id;
            let mentorItems = [];
            if (uid) {
                const { data: usuarioData } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', uid)
                    .single();

                if (!usuarioData) {
                    console.warn('No se encontró usuario');
                } else {
                    const {data: mentorsFav, error: mentorsFavError} = await supabase
                        .from('mentor_fav')
                        .select('id_usuario, id_mentor')
                        .eq('id_usuario', usuarioData.id_usuario);

                    if (mentorsFavError) {
                        console.error('Error cargando mentores favoritos:', mentorsFavError);
                    }
                    if (mentorsFav?.length) {
                        const mIds = mentorsFav.map(r => r.id_mentor);
                        const {data: mentors} = await supabase
                            .from('mentor')
                            .select('id_mentor, id_usuario, estrellas_mentor, contacto, descripcion')
                            .in('id_mentor', mIds);

                        const userIds = (mentors || []).map(m => m.id_usuario).filter(Boolean);
                        let mentorUserData = {};
                        if (userIds.length > 0) {
                            const {data: userData} = await supabase
                                .from('usuario')
                                .select('id_usuario, nombre, username')
                                .in('id_usuario', userIds);

                            mentorUserData = (userData || []).reduce((acc, u) => {
                                acc[u.id_usuario] = u;
                                return acc;
                            }, {});
                        }

                        mentorItems = mentorsFav
                            .map(r => {
                                const m = (mentors || []).find(x => x.id_mentor === r.id_mentor);
                                if (!m) return null;

                                const userData = mentorUserData[m.id_usuario] || {};

                                return {
                                    favId: `${r.id_usuario}-${r.id_mentor}`,
                                    type: 'mentor',
                                    mentor: {
                                        id_mentor: m.id_mentor,
                                        id_usuario: m.id_usuario,
                                        mentor_nombre: userData.nombre || 'Mentor',
                                        username: userData.username || '',
                                        estrellas_mentor: m.estrellas_mentor || 0,
                                        descripcion: m.descripcion || '',
                                        foto: userData.foto || null,
                                        materias: [],
                                    }
                                };
                            })
                            .filter(Boolean);
                    }
                }
            }
            allFavorites = [...allFavorites, ...mentorItems];

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
                const [u, a] = String(favId).split('-').map(x => Number(x));
                tableName = 'apunte_fav';
                field = { id_usuario: u, id_apunte: a };
                const { error } = await supabase.from(tableName).delete().match(field);
                if (error) throw error;
            } else if (type === 'mentor') {
                const [u, m] = String(favId).split('-').map(x => Number(x));
                tableName = 'mentor_fav';
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .match({ id_usuario: u, id_mentor: m });
                if (error) throw error;
            } else {
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
            case 'course': return faBook;
            case 'note': return faBook;
            case 'mentor': return faGraduationCap;
            default: return faHeart;
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
                gap: 20,
                background: '#f8fafc'
            }}>
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    style={{
                        fontSize: 40,
                        color: '#2563eb'
                    }}
                />
                <p style={{
                    color: "#64748b",
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif'
                }}>
                    Cargando favoritos...
                </p>
            </div>
        );
    }

    return (
        <div style={{
            padding: '20px',
            maxWidth: 1200,
            margin: '0 auto',
            background: '#f8fafc',
            minHeight: '100vh',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                marginBottom: 20,
                background: '#ffffff',
                padding: '20px',
                borderRadius: 16,
                border: '2px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 6
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon
                            icon={faHeart}
                            style={{
                                fontSize: 18,
                                color: '#ffffff'
                            }}
                        />
                    </div>
                    <h1 style={{
                        fontSize: 26,
                        fontWeight: 700,
                        margin: 0,
                        color: '#13346b'
                    }}>
                        Mis Favoritos
                    </h1>
                </div>
                <p style={{
                    color: '#64748b',
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    paddingLeft: 56
                }}>
                    Todos tus apuntes y mentores favoritos en un solo lugar
                </p>
            </header>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                gap: 10,
                marginBottom: 20,
                flexWrap: 'wrap',
                background: '#ffffff',
                padding: '16px',
                borderRadius: 12,
                border: '2px solid #f1f5f9'
            }}>
                {[
                    { key: 'all', label: 'Todos', icon: faFilter, count: items.length },
                    { key: 'course', label: 'Materias', icon: faBook, count: items.filter(i => i.type === 'course').length },
                    { key: 'note', label: 'Apuntes', icon: faFileAlt, count: items.filter(i => i.type === 'note').length },
                    { key: 'mentor', label: 'Mentores', icon: faGraduationCap, count: items.filter(i => i.type === 'mentor').length }
                ].map(filter => (
                    <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key)}
                        style={{
                            background: activeFilter === filter.key ? '#2563eb' : '#ffffff',
                            color: activeFilter === filter.key ? '#ffffff' : '#64748b',
                            border: `2px solid ${activeFilter === filter.key ? '#2563eb' : '#e2e8f0'}`,
                            borderRadius: '10px',
                            padding: '10px 18px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: 'Inter, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            if (activeFilter !== filter.key) {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.borderColor = '#2563eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeFilter !== filter.key) {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={filter.icon} />
                        <span>{filter.label}</span>
                        <span style={{
                            background: activeFilter === filter.key ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                            color: activeFilter === filter.key ? '#ffffff' : '#64748b',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: 12,
                            fontWeight: 700
                        }}>
                            {filter.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Error */}
            {errorMsg && (
                <Card style={{
                    background: '#fef2f2',
                    border: '2px solid #fecaca',
                    padding: 20,
                    marginBottom: 24
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16
                    }}>
                        <span style={{
                            color: '#dc2626',
                            fontSize: 14,
                            fontWeight: 500
                        }}>
                            {errorMsg}
                        </span>
                        <button
                            onClick={load}
                            style={{
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            Reintentar
                        </button>
                    </div>
                </Card>
            )}

            {/* Empty State */}
            {filteredItems.length === 0 ? (
                <Card style={{
                    textAlign: 'center',
                    padding: '80px 40px',
                    background: '#ffffff',
                    border: '2px solid #f1f5f9'
                }}>
                    <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '24px',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <FontAwesomeIcon
                            icon={faHeart}
                            style={{
                                fontSize: 48,
                                color: '#fff'
                            }}
                        />
                    </div>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        color: '#13346b',
                        fontSize: 28,
                        fontWeight: 700
                    }}>
                        {activeFilter === 'all' ? 'No tenés favoritos' : `No tenés ${getTypeLabel(activeFilter).toLowerCase()}s favoritos`}
                    </h3>
                    <p style={{
                        color: '#64748b',
                        margin: '0 0 28px 0',
                        maxWidth: 420,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        fontSize: 16,
                        lineHeight: 1.6,
                        fontWeight: 500
                    }}>
                        {activeFilter === 'all'
                            ? 'Guardá apuntes y mentores que te interesen para encontrarlos fácilmente después.'
                            : `Explorá ${getTypeLabel(activeFilter).toLowerCase()}s y agregalos a favoritos.`}
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => window.location.href = `/${activeFilter === 'all' ? 'apuntes' : activeFilter + 's'}`}
                        style={{
                            padding: '12px 24px',
                            fontSize: 15,
                            fontWeight: 600
                        }}
                    >
                        Explorar {activeFilter === 'all' ? 'Contenido' : getTypeLabel(activeFilter) + 's'}
                    </Button>
                </Card>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 20
                    }}
                >
                    {filteredItems.map(item => (
                        item.type === 'note' ? (
                            <ApunteCard
                                key={`${item.type}-${item.favId}`}
                                note={item.note}
                            />
                        ) : item.type === 'mentor' ? (
                            <div
                                key={`${item.type}-${item.favId}`}
                                style={{ gridColumn: 'span 2' }}
                            >
                                <MentorCard
                                    key={`${item.type}-${item.favId}`}
                                    mentor={item.mentor}
                                />
                            </div>
                        ) : (
                            <Card
                                key={`${item.type}-${item.favId}`}
                                style={{
                                    padding: 20,
                                    border: '2px solid #f1f5f9',
                                    background: '#ffffff'
                                }}
                            >
                                {/* otros tipos, si los hubiera */}
                            </Card>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}