import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCreditCard,
    faCheck,
    faStar,
    faShieldAlt,
    faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

export default function Credits() {
    const [paquetes, setPaquetes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userCredits, setUserCredits] = useState(0);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        cargarPaquetes();
        cargarCreditosUsuario();
    }, []);

    const cargarPaquetes = async () => {
        try {
            const { data, error } = await supabase.rpc('obtener_paquetes_creditos');
            if (error) throw error;
            setPaquetes(data || []);
        } catch (error) {
            console.error('Error cargando paquetes:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarCreditosUsuario = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('usuario')
                .select('creditos')
                .eq('auth_id', user.id)
                .single();

            if (error) throw error;
            setUserCredits(data?.creditos || 0);
        } catch (error) {
            console.error('Error cargando créditos:', error);
        }
    };

    const handleComprar = async (paquete) => {
        setProcessingPayment(true);

        try {
            // Llamar a Edge Function para crear preferencia
            const { data, error } = await supabase.functions.invoke('crear_preferencia_mp', {
                body: { id_paquete: paquete.id_paquete }
            });

            if (error) throw error;

            // Redirigir a MercadoPago (en producción usar init_point)
            window.location.href = data.sandbox_init_point; // Para pruebas
            // window.location.href = data.init_point; // Para producción

        } catch (error) {
            console.error('Error al procesar pago:', error);
            alert('Error al procesar el pago. Intenta nuevamente.');
            setProcessingPayment(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            paddingTop: 80,
        }}>
            <div style={{
                width: 'min(1200px, 92vw)',
                margin: '0 auto',
                padding: '40px 20px',
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: 48,
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 24px',
                        background: '#fff',
                        borderRadius: 50,
                        border: '2px solid #e2e8f0',
                        marginBottom: 20,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}>
                        <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: 24, color: '#2563eb' }} />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{
                                fontSize: 12,
                                color: '#64748b',
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                Balance actual
                            </div>
                            <div style={{
                                fontSize: 28,
                                fontWeight: 800,
                                color: '#0f172a',
                                fontFamily: 'Inter, sans-serif',
                                letterSpacing: '-0.02em',
                            }}>
                                {userCredits} créditos
                            </div>
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(32px, 5vw, 48px)',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 12px',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.02em',
                    }}>
                        Comprá Créditos
                    </h1>
                    <p style={{
                        fontSize: 'clamp(16px, 2vw, 18px)',
                        color: '#64748b',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        Elegí el paquete que mejor se adapte a tus necesidades
                    </p>
                </div>

                {/* Paquetes */}
                {loading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 24,
                    }}>
                        {[1, 2, 3, 4].map(i => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 24,
                        marginBottom: 48,
                    }}>
                        {paquetes.map(paquete => (
                            <PaqueteCard
                                key={paquete.id_paquete}
                                paquete={paquete}
                                onComprar={() => handleComprar(paquete)}
                                disabled={processingPayment}
                            />
                        ))}
                    </div>
                )}

                {/* Info adicional */}
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 32,
                    border: '2px solid #e2e8f0',
                    marginTop: 48,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 20,
                    }}>
                        <FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: 24, color: '#10b981' }} />
                        <h3 style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                            fontFamily: 'Inter, sans-serif',
                        }}>
                            Pago seguro con MercadoPago
                        </h3>
                    </div>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'grid',
                        gap: 12,
                    }}>
                        {[
                            'Tus créditos se acreditan automáticamente',
                            'Aceptamos todas las tarjetas de crédito y débito',
                            'Los créditos no expiran',
                            'Soporte 24/7 para cualquier problema',
                        ].map((text, i) => (
                            <li key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                fontSize: 14,
                                color: '#64748b',
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981', fontSize: 16 }} />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* FAQ */}
                <div style={{
                    marginTop: 48,
                    textAlign: 'center',
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 20px',
                        background: '#eff6ff',
                        borderRadius: 12,
                        border: '1px solid #bfdbfe',
                    }}>
                        <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#2563eb' }} />
                        <span style={{
                            fontSize: 14,
                            color: '#1e40af',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                        }}>
                            ¿Tenés dudas? <a href="/help-center" style={{ color: '#2563eb', fontWeight: 600 }}>Visitá nuestro centro de ayuda</a>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PaqueteCard({ paquete, onComprar, disabled }) {
    const precioOriginal = paquete.descuento_porcentaje > 0
        ? (paquete.precio_uyu / (1 - paquete.descuento_porcentaje / 100)).toFixed(2)
        : null;

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 20,
                padding: 28,
                border: paquete.popular ? '3px solid #2563eb' : '2px solid #e2e8f0',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Badge Popular */}
            {paquete.popular && (
                <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    color: '#fff',
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>
                    <FontAwesomeIcon icon={faStar} style={{ fontSize: 12 }} />
                    MÁS POPULAR
                </div>
            )}

            {/* Descuento */}
            {paquete.descuento_porcentaje > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: '#10b981',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                }}>
                    -{paquete.descuento_porcentaje}%
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: paquete.popular ? 12 : 0 }}>
                {/* Nombre */}
                <h3 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    {paquete.nombre}
                </h3>

                {/* Descripción */}
                {paquete.descripcion && (
                    <p style={{
                        fontSize: 14,
                        color: '#64748b',
                        margin: '0 0 20px',
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        {paquete.descripcion}
                    </p>
                )}

                {/* Créditos */}
                <div style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: '16px',
                    marginBottom: 20,
                }}>
                    <div style={{
                        fontSize: 48,
                        fontWeight: 800,
                        color: '#2563eb',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.02em',
                    }}>
                        {paquete.cantidad_creditos}
                    </div>
                    <div style={{
                        fontSize: 14,
                        color: '#64748b',
                        fontWeight: 500,
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        créditos
                    </div>
                </div>

                {/* Precio */}
                <div style={{ marginBottom: 24 }}>
                    {precioOriginal && (
                        <div style={{
                            fontSize: 16,
                            color: '#94a3b8',
                            textDecoration: 'line-through',
                            fontFamily: 'Inter, sans-serif',
                            marginBottom: 4,
                        }}>
                            ${precioOriginal} UYU
                        </div>
                    )}
                    <div style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: '#0f172a',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.02em',
                    }}>
                        ${paquete.precio_uyu} <span style={{ fontSize: 18, fontWeight: 600, color: '#64748b' }}>UYU</span>
                    </div>
                </div>

                {/* Botón */}
                <button
                    onClick={onComprar}
                    disabled={disabled}
                    style={{
                        width: '100%',
                        height: 48,
                        borderRadius: 12,
                        background: paquete.popular
                            ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                            : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        fontSize: 16,
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: disabled ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!disabled) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!disabled) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }
                    }}
                >
                    {disabled ? 'Procesando...' : 'Comprar ahora'}
                </button>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 28,
            border: '2px solid #e2e8f0',
        }}>
            <div style={{
                background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                height: 200,
                borderRadius: 12,
            }} />
        </div>
    );
}