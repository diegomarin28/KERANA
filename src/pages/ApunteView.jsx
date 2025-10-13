import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import PDFThumbnail from '../components/PDFThumbnail';

export default function ApunteView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [apunte, setApunte] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [signedUrl, setSignedUrl] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userCredits, setUserCredits] = useState(0);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [averageStars, setAverageStars] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [purchasing, setPurchasing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

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
                    usuario:id_usuario(nombre, foto)
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

            await calculateAverageStars(id);

        } catch (err) {
            console.error('Error cargando apunte:', err);
            setError(err.message || "Error cargando el apunte");
        } finally {
            setLoading(false);
        }
    };

    const calculateAverageStars = async (apunteId) => {
        try {
            const { data: reviews, error: reviewsError } = await supabase
                .from('puntua')
                .select(`
                    numero_estrellas,
                    id_usuario
                `)
                .eq('id_apunte', apunteId);

            if (reviewsError) throw reviewsError;
            if (!reviews || reviews.length === 0) {
                setAverageStars(0);
                setTotalReviews(0);
                return;
            }

            setTotalReviews(reviews.length);

            if (reviews.length < 10) {
                const simpleAvg = reviews.reduce((sum, r) => sum + r.numero_estrellas, 0) / reviews.length;
                setAverageStars(simpleAvg);
                return;
            }

            const userIds = [...new Set(reviews.map(r => r.id_usuario))];

            const { data: userPurchases, error: purchasesError } = await supabase
                .from('compra_apunte')
                .select('comprador_id')
                .in('comprador_id', userIds);

            if (purchasesError) throw purchasesError;

            const purchaseCount = {};
            userPurchases?.forEach(p => {
                purchaseCount[p.comprador_id] = (purchaseCount[p.comprador_id] || 0) + 1;
            });

            let weightedSum = 0;
            let totalWeight = 0;

            reviews.forEach(review => {
                const userTotalPurchases = purchaseCount[review.id_usuario] || 0;
                const weight = userTotalPurchases < 5 ? 0.5 : 1.0;

                weightedSum += review.numero_estrellas * weight;
                totalWeight += weight;
            });

            const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
            setAverageStars(weightedAvg);

        } catch (err) {
            console.error('Error calculando promedio de estrellas:', err);
            setAverageStars(0);
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

            let creditosVendedor = 5;

            if (totalReviews >= 10) {
                if (averageStars >= 4.5) creditosVendedor = 100;
                else if (averageStars >= 3.5) creditosVendedor = 60;
                else if (averageStars >= 2.5) creditosVendedor = 30;
                else creditosVendedor = 10;
            }

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

    if (loading) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <p style={{ color: '#6b7280', margin: 0 }}>Cargando apunte...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
                <Card style={{ padding: 40, textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h3 style={{ margin: '0 0 12px 0', color: '#991b1b' }}>Error</h3>
                    <p style={{ color: '#991b1b', margin: '0 0 24px 0' }}>{error}</p>
                    <Button onClick={() => navigate('/apuntes')}>Volver a Apuntes</Button>
                </Card>
            </div>
        );
    }

    if (!apunte) return null;

    const isOwner = apunte.id_usuario === currentUserId;

    return (
        <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
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
                    backdropFilter: 'blur(4px)'
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
                            fontSize: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            ⚠️
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#991b1b',
                            textAlign: 'center'
                        }}>
                            ¿Eliminar apunte?
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 15,
                            lineHeight: 1.6,
                            marginBottom: 24,
                            textAlign: 'center'
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
                                    cursor: 'pointer'
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
                                    opacity: deleting ? 0.6 : 1
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
                    backdropFilter: 'blur(4px)'
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
                            margin: '0 auto 24px',
                            fontSize: 40
                        }}>
                            ✅
                        </div>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: 28,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Apunte eliminado
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 32
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
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Volver
                        </Button>
                    </Card>
                </div>
            )}

            <h1 style={{ textAlign: 'center', margin: '0 0 32px 0', fontSize: 32, fontWeight: 700 }}>
                {apunte.titulo}
            </h1>

            <Card style={{ padding: 32 }}>
                <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                    <div style={{ flexShrink: 0 }}>
                        <PDFThumbnail
                            url={signedUrl}
                            width={250}
                            height={350}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                            {apunte.materia?.nombre_materia && (
                                <span style={{
                                    padding: '6px 14px',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    borderRadius: 20,
                                    fontSize: 14,
                                    fontWeight: 600
                                }}>
                                    {apunte.materia.nombre_materia}
                                </span>
                            )}
                            <span style={{ fontSize: 14, color: '#6b7280' }}>
                                Por <strong>{apunte.usuario?.nombre || 'Anónimo'}</strong>
                            </span>
                        </div>

                        {apunte.descripcion && (
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Descripción</h3>
                                <p style={{ color: '#374151', lineHeight: 1.6, margin: 0, fontSize: 15 }}>
                                    {apunte.descripcion}
                                </p>
                            </div>
                        )}

                        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 18, color: '#f59e0b', fontWeight: 700 }}>
                                    {totalReviews > 0 ? averageStars.toFixed(1) : '--'} ★
                                </span>
                                <span style={{ fontSize: 13, color: '#1e40af' }}>
                                    {totalReviews > 0
                                        ? `(${totalReviews} reseña${totalReviews !== 1 ? 's' : ''})`
                                        : '(Sin calificaciones)'}
                                </span>
                                {totalReviews > 0 && totalReviews < 10 && (
                                    <span style={{ fontSize: 12, color: '#1e40af', marginLeft: 'auto', fontStyle: 'italic' }}>
                                        +{10 - totalReviews} para bonificación
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{
                            padding: '10px 16px',
                            background: '#eff6ff',
                            borderRadius: 12,
                            marginBottom: 24,
                            border: '2px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                        }}>
                            <div>
                                <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>
                                    Precio
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>
                                    {apunte.creditos} 💰
                                </div>
                            </div>
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
                                        width: '100%'
                                    }}
                                >
                                    {purchasing ? 'Procesando compra...' :
                                        isOwner ? 'Es tu apunte' :
                                            `Comprar por ${apunte.creditos} 💰`}
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
                                            width: '100%'
                                        }}
                                    >
                                        📥 Descargar apunte
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => alert('Función de calificación próximamente...')}
                                        style={{
                                            padding: '14px 28px',
                                            fontSize: 16,
                                            fontWeight: 600,
                                            width: '100%',
                                            border: '2px solid #f59e0b',
                                            color: '#f59e0b'
                                        }}
                                    >
                                        ⭐ Calificá este apunte
                                    </Button>
                                </>
                            )}
                        </div>

                        {isOwner && (
                            <Button
                                onClick={() => setDeleteConfirm(true)}
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
                                    width: '100%'
                                }}
                            >
                                🗑️ Eliminar apunte
                            </Button>
                        )}

                        <div style={{
                            marginTop: 16,
                            padding: 12,
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 14,
                            color: '#6b7280',
                            textAlign: 'center'
                        }}>
                            Tenés <strong style={{ color: '#374151' }}>{userCredits} 💰</strong> disponibles
                        </div>
                    </div>
                </div>
            </Card>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button variant="ghost" onClick={() => navigate('/apuntes')}>
                    ← Volver a Apuntes
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
                    backdropFilter: 'blur(4px)'
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
                            margin: '0 auto 24px',
                            fontSize: 40
                        }}>
                            ✅
                        </div>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: 28,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            ¡Compra exitosa!
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 32
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
                                transition: 'transform 0.2s'
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
                    backdropFilter: 'blur(4px)'
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
                            margin: '0 auto 24px',
                            fontSize: 40
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: 28,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Créditos insuficientes
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 32
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
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Entendido
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}