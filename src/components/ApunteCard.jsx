import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faCoins } from '@fortawesome/free-solid-svg-icons';
import { supabase } from "../supabase";
import { notesAPI } from "../api/database";
import { Card } from "../components/UI/Card";
import PDFThumbnail from "../components/PDFThumbnail";

export default function ApunteCard({ note, currentUserId }) {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(note.likes_count || 0);
    const [loading, setLoading] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);

    useEffect(() => {
        const checkLikedAndPurchased = async () => {
            // Verificar si el usuario actual ya dio like
            const { data: likeData } = await notesAPI.checkIfLiked(note.id_apunte);
            setLiked(likeData);

            // Verificar si puede dar like (compró el apunte o es el dueño)
            if (note.id_usuario === currentUserId) {
                // Es el dueño - no puede dar like
                setHasPurchased(false);
                return;
            }

            // Verificar si lo compró
            const { data: compraData } = await supabase
                .from('compra_apunte')
                .select('id')
                .eq('apunte_id', note.id_apunte)
                .eq('comprador_id', currentUserId)
                .maybeSingle();


            setHasPurchased(!!compraData);
        };

        if (currentUserId) {
            checkLikedAndPurchased();
        }
    }, [note.id_apunte, currentUserId, note.id_usuario]);

    if (!note) return null;

    const handleClick = async (e) => {
        e.preventDefault();

        // Verificar si hay sesión activa
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // No hay sesión → abrir modal de login MANTENIENDO la ruta actual
            const currentPath = window.location.pathname;
            navigate(`${currentPath}?auth=signin&return=/apuntes/${note.id_apunte}`);
        } else {
            // Hay sesión → ir directo al apunte
            navigate(`/apuntes/${note.id_apunte}`);
        }
    };

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Verificar si hay sesión
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            const currentPath = window.location.pathname;
            navigate(`${currentPath}?auth=signin`);
            return;
        }

        // Verificar si puede dar like
        if (!hasPurchased) {
            return; // No hacer nada si no compró
        }

        setLoading(true);

        try {
            const { data, error } = await notesAPI.toggleLike(note.id_apunte);

            if (error) {
                console.error('Error al dar like:', error);
                return;
            }

            // Actualizar estado local
            setLiked(data.liked);
            setLikesCount(data.count);

        } catch (error) {
            console.error('Error en handleLike:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            style={{
                padding: 0,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                overflow: 'hidden',
                fontFamily: 'Inter, sans-serif'
            }}
            onClick={handleClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Vista previa del PDF */}
            <PDFThumbnail
                url={note.signedUrl || null}
                thumbnailPath={note.thumbnail_path}
                width={280}
                height={160}
            />

            {/* Contenido de la card */}
            <div style={{ padding: 16 }}>
                <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    color: '#0f172a'
                }}>
                    {note.titulo}
                </h3>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    alignItems: 'flex-start',
                    marginBottom: 8
                }}>
                    <span style={{
                        padding: '2px 8px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        {note.materia?.nombre_materia || 'Sin materia'}
                    </span>
                    {(likesCount !== undefined && likesCount !== null) && (
                        <button
                            onClick={handleLike}
                            disabled={loading || !hasPurchased}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: (loading || !hasPurchased) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                borderRadius: 8,
                                transition: 'all 0.2s ease',
                                opacity: (loading || !hasPurchased) ? 0.4 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && hasPurchased) {
                                    e.currentTarget.style.background = '#f8fafc';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading && hasPurchased) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faHeart}
                                style={{
                                    fontSize: 14,
                                    color: liked ? '#f59e0b' : '#cbd5e1',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                            <span style={{
                                color: liked ? '#f59e0b' : '#64748b',
                                fontSize: 14,
                                fontWeight: 600,
                                fontFamily: 'Inter, sans-serif',
                                transition: 'all 0.2s ease'
                            }}>
                                {likesCount}
                            </span>
                        </button>
                    )}
                </div>

                {note.descripcion && (
                    <p style={{
                        color: '#6b7280',
                        fontSize: 14,
                        marginBottom: 12,
                        lineHeight: 1.4,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500
                    }}>
                        {note.descripcion.length > 80
                            ? note.descripcion.substring(0, 80) + '...'
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
                    <span style={{
                        fontSize: 13,
                        color: '#6b7280',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500
                    }}>
                        {currentUserId && note.id_usuario === currentUserId
                            ? <strong style={{ fontWeight: 600 }}>Por Ti</strong>
                            : `Por ${note.usuario?.nombre || 'Anónimo'}`
                        }
                    </span>
                    <span style={{
                        padding: '4px 10px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        <FontAwesomeIcon
                            icon={faCoins}
                            style={{
                                fontSize: 12,
                                color: '#f59e0b'
                            }}
                        />
                        {note.creditos}
                    </span>
                </div>
            </div>
        </Card>
    );
}