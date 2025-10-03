import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../supabase';
import { getOrCreateUserProfile } from '../api/userService';

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
            const { data: notesFav } = await supabase
                .from('apunte_fav')
                .select('id_usuario, id_apunte')
                .eq('id_usuario', userId);

            let noteItems = [];
            if (notesFav?.length) {
                const apIds = notesFav.map(r => r.id_apunte);
                const { data: apuntes } = await supabase
                    .from('apunte')
                    .select(`
            id_apunte,
            titulo,
            creditos,
            estrellas,
            id_materia,
            id_usuario,
            materia:id_materia!Apunte_id_materia_fkey(
              id_materia,
              nombre_materia
            )
          `)
                    .in('id_apunte', apIds);

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

                noteItems = (notesFav || [])
                    .map(r => {
                        const a = (apuntes || []).find(x => x.id_apunte === r.id_apunte);
                        return a ? {
                            favId: `${userId}-${a.id_apunte}`,
                            id: a.id_apunte,
                            type: 'note',
                            title: a.titulo || 'Apunte',
                            subtitle: userMap[a.id_usuario] || 'Autor',
                            details: a.materia?.nombre_materia || 'Materia',
                            price: a.creditos ?? 0,
                            rating: a.estrellas || '0.0',
                            link: `/apuntes/${a.id_apunte}`
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
                <div style={{ display: 'grid', gap: 16 }}>
                    {filteredItems.map(item => (
                        <Card key={`${item.type}-${item.favId}`} style={{
                            padding: 20,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                                <div style={{ flex: 1 }}>
                                    <Link to={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <span style={{ fontSize: 18 }}>{getTypeIcon(item.type)}</span>
                                            <span style={{
                                                background: "#dbeafe",
                                                color: "#2563eb",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}>
                        {getTypeLabel(item.type)}
                      </span>
                                        </div>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, color: '#0b1e3a' }}>
                                            {item.title}
                                        </h3>
                                        <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: 14 }}>
                                            {item.subtitle} {item.details && `· ${item.details}`}
                                        </p>
                                    </Link>

                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{
                        background: "#fef3c7",
                        color: "#d97706",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600"
                    }}>
                      ⭐ {item.rating}
                    </span>
                                        {item.price > 0 && (
                                            <div style={{ fontWeight: 700, color: '#059669', fontSize: 14 }}>
                                                {item.type === 'note' ? `${item.price} créditos` : `$${item.price}`}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <Button variant="primary" onClick={() => (window.location.href = item.link)}>
                                        Ver
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => removeFavorite(item.favId, item.type)}
                                        style={{ color: '#ef4444' }}
                                    >
                                        Quitar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
