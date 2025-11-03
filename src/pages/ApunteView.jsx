import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart,
    faCoins,
    faFlag,
    faBookmark,
    faExclamationTriangle,
    faCheckCircle,
    faTrash,
    faDownload,
    faHandHoldingHeart
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabase';
import { notesAPI } from '../api/database';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import PDFThumbnail from '../components/PDFThumbnail';
import emailjs from '@emailjs/browser';

export const ApunteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [apunte, setApunte] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [signedUrl, setSignedUrl] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userCredits, setUserCredits] = useState(0);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [liked, setLiked] = useState(false);
    const [likingInProgress, setLikingInProgress] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportMotivo, setReportMotivo] = useState('');
    const [reportDescripcion, setReportDescripcion] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);

    useEffect(() => {
        loadApunteData();
    }, [id]);

    const loadApunteData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                setError("Debes iniciar sesión para ver este apunte");
                return;
            }

            const { data: usuarioData, error: usuarioError } = await supabase
                .from("usuario")
                .select("id_usuario, creditos")
                .eq("auth_id", user.id)
                .maybeSingle();

            if (usuarioError) throw usuarioError;
            if (!usuarioData) {
                setError("No se encontró tu perfil de usuario");
                return;
            }

            setCurrentUserId(usuarioData.id_usuario);
            setUserCredits(usuarioData.creditos);

            const { data: apunteData, error: apunteError } = await supabase
                .from('apunte')
                .select(`
                    id_apunte,
                    titulo,
                    descripcion,
                    creditos,
                    file_path,
                    file_name,
                    id_usuario,
                    created_at,
                    materia:id_materia(nombre_materia),
                    usuario:id_usuario(nombre, foto),
                    thumbnail_path
                `)
                .eq('id_apunte', id)
                .single();

            if (apunteError) throw apunteError;
            if (!apunteData) {
                setError("Apunte no encontrado");
                return;
            }

            setApunte(apunteData);

            if (apunteData.file_path) {
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('apuntes')
                    .createSignedUrl(apunteData.file_path, 3600);

                if (!signedError && signedData) {
                    setSignedUrl(signedData.signedUrl);
                }
            }

            if (apunteData.id_usuario === usuarioData.id_usuario) {
                setHasPurchased(true);
            } else {
                const { data: compraData, error: compraError } = await supabase
                    .from('compra_apunte')
                    .select('id')
                    .eq('apunte_id', id)
                    .eq('comprador_id', usuarioData.id_usuario)
                    .maybeSingle();

                if (!compraError && compraData) {
                    setHasPurchased(true);
                }
            }

            // Verificar si está en favoritos
            const { data: favoriteData, error: favoriteError } = await supabase
                .from('apunte_fav')
                .select('id_apunte')
                .eq('id_usuario', usuarioData.id_usuario)
                .eq('id_apunte', id);
            if (favoriteError) throw favoriteError;
            setIsFavorite(favoriteData.length > 0);

            // Verificar si ya dio like
            const { data: likeCheck } = await notesAPI.checkIfLiked(id);
            setLiked(likeCheck);

            // Cargar conteo de likes
            const { data: likeCount } = await notesAPI.getLikesCount(id);
            setLikesCount(likeCount);

        } catch (err) {
            console.error('Error cargando apunte:', err);
            setError(err.message || "Error cargando el apunte");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!apunte || !currentUserId) return;

        if (userCredits < apunte.creditos) {
            setErrorMessage(`No tenés suficientes créditos. Necesitás ${apunte.creditos} pero tenés ${userCredits}`);
            setShowErrorModal(true);
            return;
        }

        try {
            setPurchasing(true);

            const { data: gastadoOk, error: gastarError } = await supabase.rpc('gastar_moneda', {
                p_id_usuario: currentUserId,
                p_cantidad: apunte.creditos
            });

            if (gastarError) throw gastarError;
            if (!gastadoOk) {
                alert("Error al procesar el pago. Intentá de nuevo.");
                return;
            }

            const { error: compraError } = await supabase
                .from('compra_apunte')
                .insert({
                    apunte_id: apunte.id_apunte,
                    comprador_id: currentUserId
                });

            if (compraError) throw compraError;

            const creditosVendedor = 5;

            const { error: agregarError } = await supabase.rpc('agregar_creditos', {
                uid: apunte.id_usuario,
                cantidad: creditosVendedor
            });

            if (agregarError) {
                console.error('Error agregando créditos al vendedor:', agregarError);
            }

            setHasPurchased(true);
            setUserCredits(prev => prev - apunte.creditos);
            setShowSuccessModal(true);

        } catch (err) {
            console.error('Error en la compra:', err);
            alert("Error al procesar la compra: " + (err.message || err));
        } finally {
            setPurchasing(false);
        }
    };

    const handleDownload = async () => {
        if (!apunte?.file_path) {
            alert("No hay archivo disponible para descargar");
            return;
        }

        try {
            const { data: signedData, error: signedError } = await supabase.storage
                .from('apuntes')
                .createSignedUrl(apunte.file_path, 60);

            if (signedError || !signedData) {
                alert("Error al obtener el archivo");
                return;
            }

            const response = await fetch(signedData.signedUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = apunte.file_name || apunte.titulo + '.pdf';
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error descargando archivo:', error);
            alert("Error al descargar el archivo");
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);

            if (apunte?.file_path) {
                const { error: storageError } = await supabase.storage
                    .from('apuntes')
                    .remove([apunte.file_path]);

                if (storageError) {
                    console.error('Error eliminando archivo del storage:', storageError);
                }
            }

            const { error: dbError } = await supabase
                .from("apunte")
                .delete()
                .eq("id_apunte", apunte.id_apunte);

            if (dbError) throw dbError;

            setDeleteConfirm(false);
            setShowDeleteSuccessModal(true);

        } catch (err) {
            alert("Error eliminando apunte: " + (err.message || err));
        } finally {
            setDeleting(false);
        }
    };

    const handleFavoriteToggle = async () => {
        if (!apunte || !currentUserId) return;

        try {
            if (isFavorite) {
                const { error } = await supabase
                    .from('apunte_fav')
                    .delete()
                    .match({ id_usuario: currentUserId, id_apunte: apunte.id_apunte });
                if (error) throw error;
                setIsFavorite(false);
            } else {
                const { error } = await supabase
                    .from('apunte_fav')
                    .insert({ id_usuario: currentUserId, id_apunte: apunte.id_apunte });
                if (error) throw error;
                setIsFavorite(true);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        } catch (error) {
            console.error('Error al manejar favorito:', error);
            alert("Error al guardar/quitar favorito: " + (error.message || ""));
        }
    };

    const handleLike = async () => {
        if (!apunte || !currentUserId || likingInProgress) return;

        setLikingInProgress(true);

        try {
            const { data, error } = await notesAPI.toggleLike(apunte.id_apunte);

            if (error) {
                console.error('Error al dar like:', error);
                return;
            }

            setLiked(data.liked);
            setLikesCount(data.count);

        } catch (error) {
            console.error('Error en handleLike:', error);
        } finally {
            setLikingInProgress(false);
        }
    };

    const handleReport = async () => {
        if (!reportMotivo) {
            alert("Por favor seleccioná un motivo para el reporte");
            return;
        }

        if (reportMotivo === 'otro' && !reportDescripcion.trim()) {
            alert("Por favor describí el motivo del reporte");
            return;
        }

        try {
            setSubmittingReport(true);

            const { error } = await supabase
                .from('reportes')
                .insert({
                    id_usuario: currentUserId,
                    id_apunte: apunte.id_apunte,
                    motivo: reportMotivo,
                    descripcion: reportDescripcion.trim() || null
                });

            if (error) {
                if (error.code === '23505') {
                    alert("Ya reportaste este apunte anteriormente");
                } else {
                    throw error;
                }
            } else {
                const { data: usuarioData } = await supabase
                    .from('usuario')
                    .select('nombre, correo')
                    .eq('id_usuario', currentUserId)
                    .single();

                const motivosMap = {
                    'contenido_inapropiado': 'Contenido inapropiado',
                    'spam': 'Spam o publicidad',
                    'plagio': 'Plagio o violación de derechos',
                    'informacion_incorrecta': 'Información incorrecta',
                    'otro': 'Otro motivo'
                };

                try {
                    await emailjs.send(
                        "service_fbf675u",
                        "template_sn2a1ih",
                        {
                            titulo_apunte: apunte.titulo,
                            id_apunte: apunte.id_apunte,
                            usuario_nombre: usuarioData?.nombre || 'Anónimo',
                            usuario_email: usuarioData?.correo || 'No disponible',
                            fecha: new Date().toLocaleString('es-UY'),
                            motivo: motivosMap[reportMotivo] || reportMotivo,
                            descripcion: reportDescripcion.trim()
                                ? `\n📝 Descripción adicional:\n${reportDescripcion.trim()}`
                                : '\n(Sin descripción adicional)',
                            link_apunte: `${window.location.origin}/apuntes/${apunte.id_apunte}`,
                            to_email: "kerana.soporte@gmail.com"
                        },
                        "JA_sGzk8UJMPOtSmE"
                    );
                    console.log('✅ Email de reporte enviado');
                } catch (emailError) {
                    console.error('❌ Error enviando email:', emailError);
                }

                setShowReportModal(false);
                setReportMotivo('');
                setReportDescripcion('');
                setShowReportSuccessModal(true);
            }
        } catch (error) {
            console.error('Error al enviar reporte:', error);
            alert("Error al enviar el reporte: " + (error.message || ""));
        } finally {
            setSubmittingReport(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid #f3f4f6',
                        borderTop: '3px solid #2563eb',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{
                        color: '#6b7280',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500
                    }}>Cargando apunte...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
                <Card style={{
                    padding: 40,
                    textAlign: 'center',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            style={{
                                fontSize: 48,
                                color: '#991b1b'
                            }}
                        />
                    </div>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        color: '#991b1b',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700
                    }}>Error</h3>
                    <p style={{
                        color: '#991b1b',
                        margin: '0 0 24px 0',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500
                    }}>{error}</p>
                    <Button onClick={() => navigate('/apuntes')}>Volver a Apuntes</Button>
                </Card>
            </div>
        );
    }

    if (!apunte) return null;

    const isOwner = apunte.id_usuario === currentUserId;
    const canLike = hasPurchased && !isOwner;

    return (
        <div style={{
            maxWidth: 900,
            margin: '40px auto',
            padding: '0 20px',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Modal de confirmación - Eliminar */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <Card style={{
                        maxWidth: 450,
                        padding: 32,
                        background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        border: '2px solid #ef4444'
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            background: '#fee2e2',
                            borderRadius: '50%',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                style={{
                                    fontSize: 28,
                                    color: '#dc2626'
                                }}
                            />
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#991b1b',
                            textAlign: 'center',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            ¿Eliminar apunte?
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 15,
                            lineHeight: 1.6,
                            marginBottom: 24,
                            textAlign: 'center',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            Esta acción no se puede deshacer. El archivo se eliminará permanentemente del sistema.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                onClick={() => setDeleteConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    background: '#fff',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    opacity: deleting ? 0.6 : 1,
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de éxito - Eliminado */}
            {showDeleteSuccessModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <Card style={{
                        maxWidth: 450,
                        padding: 40,
                        textAlign: 'center',
                        background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FontAwesomeIcon
                                icon={faCheckCircle}
                                style={{
                                    fontSize: 36,
                                    color: '#fff'
                                }}
                            />
                        </div>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: 28,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Apunte eliminado
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 32,
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            El apunte se ha eliminado permanentemente.
                        </p>
                        <Button
                            onClick={() => navigate(-1)}
                            style={{
                                padding: '14px 32px',
                                background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 16,
                                width: '100%',
                                transition: 'transform 0.2s',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Volver
                        </Button>
                    </Card>
                </div>
            )}

            <h1 style={{
                textAlign: 'center',
                margin: '0 0 32px 0',
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                color: '#0f172a'
            }}>
                {apunte.titulo}
            </h1>

            <Card style={{ padding: 32, position: 'relative' }}>
                {/* Bookmark - Solo visible si NO es owner */}
                {!isOwner && (
                    <button
                        onClick={handleFavoriteToggle}
                        style={{
                            position: 'absolute',
                            top: 24,
                            right: 24,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 8,
                            zIndex: 10,
                            transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <FontAwesomeIcon
                            icon={faBookmark}
                            style={{
                                fontSize: 24,
                                color: isFavorite ? '#1e293b' : '#cbd5e1',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </button>
                )}

                <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                    <div style={{ flexShrink: 0 }}>
                        <PDFThumbnail
                            url={signedUrl}
                            thumbnailPath={apunte?.thumbnail_path}
                            width={250}
                            height={350}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            marginBottom: 16,
                            flexWrap: 'wrap'
                        }}>
                            {apunte.materia?.nombre_materia && (
                                <span style={{
                                    padding: '6px 14px',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    borderRadius: 20,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {apunte.materia.nombre_materia}
                                </span>
                            )}
                            <span style={{
                                fontSize: 14,
                                color: '#6b7280',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 500
                            }}>
                                {isOwner ? (
                                    <strong style={{ fontWeight: 600 }}>Por Ti</strong>
                                ) : (
                                    <>Por <strong style={{ fontWeight: 600 }}>{apunte.usuario?.nombre || 'Anónimo'}</strong></>
                                )}
                            </span>
                        </div>

                        {apunte.descripcion && (
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    fontFamily: 'Inter, sans-serif',
                                    color: '#0f172a'
                                }}>Descripción</h3>
                                <p style={{
                                    color: '#374151',
                                    lineHeight: 1.6,
                                    margin: 0,
                                    fontSize: 15,
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500
                                }}>
                                    {apunte.descripcion}
                                </p>
                            </div>
                        )}

                        {/* Botón de like con contador */}
                        <div style={{
                            marginBottom: 24,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => canLike && handleLike()}
                                    disabled={likingInProgress}
                                    onMouseEnter={(e) => {
                                        if (!canLike) {
                                            const button = e.currentTarget;
                                            button.dataset.hovering = 'true';
                                            setTimeout(() => {
                                                if (button && button.dataset && button.dataset.hovering === 'true') {
                                                    const tooltip = button.parentElement?.children[1];
                                                    if (tooltip) {
                                                        tooltip.style.opacity = '1';
                                                        tooltip.style.visibility = 'visible';
                                                    }
                                                }
                                            }, 500);
                                        } else {
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const button = e.currentTarget;
                                        if (button && button.dataset) {
                                            button.dataset.hovering = 'false';
                                        }
                                        const tooltip = button.parentElement?.children[1];
                                        if (tooltip) {
                                            tooltip.style.opacity = '0';
                                            tooltip.style.visibility = 'hidden';
                                        }
                                        if (canLike) {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: liked ? '#fef3c7' : '#fff',
                                        cursor: canLike ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        opacity: likingInProgress ? 0.6 : 1,
                                        position: 'relative'
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faHeart}
                                        style={{
                                            fontSize: 20,
                                            color: liked ? '#f59e0b' : '#cbd5e1',
                                            transition: 'all 0.2s ease'
                                        }}
                                    />
                                </button>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-45px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#374151',
                                    color: '#fff',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    whiteSpace: 'nowrap',
                                    opacity: 0,
                                    visibility: 'hidden',
                                    transition: 'opacity 0.2s ease',
                                    zIndex: 10,
                                    pointerEvents: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500
                                }}>
                                    {isOwner ? 'No podés votar tu propio apunte' : 'Para dar like tenés que comprar el apunte'}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: '4px solid transparent',
                                        borderRight: '4px solid transparent',
                                        borderBottom: '4px solid #374151'
                                    }} />
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-24px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#64748b',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {likesCount}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            padding: '8px 14px',
                            background: '#f8fafc',
                            borderRadius: 8,
                            marginTop: 28,
                            marginBottom: 20,
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <FontAwesomeIcon
                                icon={faCoins}
                                style={{
                                    fontSize: 16,
                                    color: '#f59e0b'
                                }}
                            />
                            <span style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                {apunte.creditos}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {!hasPurchased ? (
                                <Button
                                    variant="primary"
                                    onClick={handlePurchase}
                                    disabled={purchasing || isOwner}
                                    style={{
                                        padding: '14px 28px',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        width: '100%',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    {purchasing ? 'Procesando compra...' :
                                        isOwner ? 'Es tu apunte' :
                                            `Comprar por ${apunte.creditos} créditos`}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="primary"
                                        onClick={handleDownload}
                                        style={{
                                            padding: '14px 28px',
                                            fontSize: 16,
                                            fontWeight: 600,
                                            width: '100%',
                                            fontFamily: 'Inter, sans-serif',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faDownload}
                                            style={{
                                                fontSize: 16
                                            }}
                                        />
                                        Descargar apunte
                                    </Button>
                                    {!isOwner && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                                            <button
                                                onClick={() => setShowReportModal(true)}
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: '50%',
                                                    border: '2px solid #f59e0b',
                                                    background: '#fff',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                    e.currentTarget.style.background = '#fef3c7';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.background = '#fff';
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faFlag}
                                                    style={{
                                                        fontSize: 20,
                                                        color: '#f59e0b'
                                                    }}
                                                />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {isOwner && (
                            <button
                                onClick={() => setDeleteConfirm(true)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ef4444';
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.color = '#ef4444';
                                }}
                                style={{
                                    marginTop: 12,
                                    padding: '12px 20px',
                                    background: '#fff',
                                    color: '#ef4444',
                                    border: '1.5px solid #ef4444',
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    width: '100%',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faTrash}
                                    style={{
                                        fontSize: 14,
                                        marginRight: 6
                                    }}
                                />
                                Eliminar apunte
                            </button>
                        )}

                        <div style={{
                            marginTop: 16,
                            padding: 12,
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 14,
                            color: '#6b7280',
                            textAlign: 'center',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            Tenés <strong style={{ color: '#374151', fontWeight: 700 }}>{userCredits}</strong>
                            <FontAwesomeIcon
                                icon={faCoins}
                                style={{
                                    fontSize: 14,
                                    color: '#f59e0b',
                                    marginLeft: 4
                                }}
                            /> disponibles
                        </div>
                    </div>
                </div>
            </Card>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    ← Volver
                </Button>
            </div>

            {/* Modal de éxito - Compra */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <Card style={{
                        maxWidth: 450,
                        padding: 40,
                        textAlign: 'center',
                        background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FontAwesomeIcon
                                icon={faCheckCircle}
                                style={{
                                    fontSize: 36,
                                    color: '#fff'
                                }}
                            />
                        </div>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: 28,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            ¡Compra exitosa!
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 32,
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            Ya podés descargar el apunte. También aparece en tu sección de <strong style={{ color: '#374151' }}>Mis compras</strong>. 📥
                        </p>
                        <Button
                            onClick={() => setShowSuccessModal(false)}
                            style={{
                                padding: '14px 32px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 16,
                                width: '100%',
                                transition: 'transform 0.2s',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Continuar
                        </Button>
                    </Card>
                </div>
            )}

            {/* Modal de error - Créditos insuficientes */}
            {showErrorModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <Card style={{
                        maxWidth: 450,
                        padding: 40,
                        textAlign: 'center',
                        background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                style={{
                                    fontSize: 36,
                                    color: '#fff'
                                }}
                            />
                        </div>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: 28,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Créditos insuficientes
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 32,
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            {errorMessage}
                        </p>
                        <Button
                            onClick={() => setShowErrorModal(false)}
                            style={{
                                padding: '14px 32px',
                                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 16,
                                width: '100%',
                                transition: 'transform 0.2s',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Entendido
                        </Button>
                    </Card>
                </div>
            )}

            {/* Toast de confirmación */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    bottom: 40,
                    right: 40,
                    background: '#1e293b',
                    color: '#fff',
                    padding: '16px 24px',
                    borderRadius: 12,
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    animation: 'slideInUp 0.3s ease-out',
                    maxWidth: 400,
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <div style={{
                        fontSize: 24,
                        flexShrink: 0
                    }}>
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{
                                fontSize: 24,
                                color: '#10b981'
                            }}
                        />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                            Apunte guardado con éxito
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>
                            Podés encontrarlo en la sección <strong>Favoritos</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de reporte */}
            {showReportModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <Card style={{
                        maxWidth: 500,
                        width: '90%',
                        padding: 32,
                        background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            background: '#fef3c7',
                            borderRadius: '50%',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <FontAwesomeIcon
                                icon={faFlag}
                                style={{
                                    fontSize: 28,
                                    color: '#f59e0b'
                                }}
                            />
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#1f2937',
                            textAlign: 'center',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Reportar apunte
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 14,
                            lineHeight: 1.6,
                            marginBottom: 24,
                            textAlign: 'center',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            Ayudanos a mantener la calidad del contenido. Seleccioná el motivo del reporte:
                        </p>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 12,
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#374151',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                Motivo del reporte *
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
                                    { value: 'spam', label: 'Spam o publicidad' },
                                    { value: 'plagio', label: 'Plagio o violación de derechos' },
                                    { value: 'informacion_incorrecta', label: 'Información incorrecta' },
                                    { value: 'otro', label: 'Otro motivo' }
                                ].map((opcion) => (
                                    <button
                                        key={opcion.value}
                                        type="button"
                                        onClick={() => setReportMotivo(opcion.value)}
                                        style={{
                                            padding: '14px 16px',
                                            border: `2px solid ${reportMotivo === opcion.value ? '#f59e0b' : '#e5e7eb'}`,
                                            borderRadius: 10,
                                            background: reportMotivo === opcion.value ? '#fef3c7' : '#fff',
                                            color: reportMotivo === opcion.value ? '#92400e' : '#374151',
                                            fontSize: 15,
                                            fontWeight: reportMotivo === opcion.value ? 600 : 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                            fontFamily: 'Inter, sans-serif'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (reportMotivo !== opcion.value) {
                                                e.currentTarget.style.borderColor = '#fbbf24';
                                                e.currentTarget.style.background = '#fffbeb';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (reportMotivo !== opcion.value) {
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.background = '#fff';
                                            }
                                        }}
                                    >
                                        {opcion.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {reportMotivo && (
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#374151',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    Descripción {reportMotivo === 'otro' && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                <textarea
                                    value={reportDescripcion}
                                    onChange={(e) => setReportDescripcion(e.target.value)}
                                    placeholder={reportMotivo === 'otro' ? 'Describí el motivo del reporte...' : 'Información adicional (opcional)...'}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        color: '#1f2937',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                onClick={() => {
                                    setShowReportModal(false);
                                    setReportMotivo('');
                                    setReportDescripcion('');
                                }}
                                disabled={submittingReport}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    background: '#fff',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: submittingReport ? 'not-allowed' : 'pointer',
                                    opacity: submittingReport ? 0.5 : 1,
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleReport}
                                disabled={submittingReport || !reportMotivo}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    background: reportMotivo ? '#f59e0b' : '#d1d5db',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: (submittingReport || !reportMotivo) ? 'not-allowed' : 'pointer',
                                    opacity: (submittingReport || !reportMotivo) ? 0.6 : 1,
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                {submittingReport ? 'Enviando...' : 'Enviar reporte'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de éxito - Reporte enviado */}
            {showReportSuccessModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001,
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <Card style={{
                        maxWidth: 500,
                        padding: 48,
                        textAlign: 'center',
                        background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            width: 100,
                            height: 100,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)'
                        }}>
                            <FontAwesomeIcon
                                icon={faHandHoldingHeart}
                                style={{
                                    fontSize: 44,
                                    color: '#fff'
                                }}
                            />
                        </div>
                        <h2 style={{
                            margin: '0 0 16px 0',
                            fontSize: 32,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Kerana te agradece
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 17,
                            lineHeight: 1.7,
                            marginBottom: 36,
                            padding: '0 20px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            Tu reporte nos ayuda a mantener la calidad del contenido. Lo revisaremos a la brevedad.
                        </p>
                        <Button
                            onClick={() => setShowReportSuccessModal(false)}
                            style={{
                                padding: '16px 40px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 16,
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                                transition: 'all 0.2s',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.4)';
                            }}
                        >
                            Continuar
                        </Button>
                    </Card>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideInUp {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};