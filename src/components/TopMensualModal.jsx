import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrophy,
    faTimes,
    faMedal,
    faAward,
    faCrown
} from '@fortawesome/free-solid-svg-icons';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function TopMensualModal({ topData, userPosition, onClose }) {
    if (!topData) return null;

    const { rankings, mes, año } = topData;
    const mesNombre = MESES[mes - 1];

    const getPosicionIcon = (posicion) => {
        if (posicion === 1) return faCrown;
        if (posicion === 2) return faMedal;
        if (posicion === 3) return faAward;
        return faTrophy;
    };

    const getPosicionColor = (posicion) => {
        if (posicion === 1) return '#f59e0b'; // Oro
        if (posicion === 2) return '#94a3b8'; // Plata
        if (posicion === 3) return '#c2410c'; // Bronce
        return '#2563eb'; // Azul Kerana
    };

    const getPosicionBg = (posicion) => {
        if (posicion === 1) return '#fef3c7';
        if (posicion === 2) return '#f1f5f9';
        if (posicion === 3) return '#fed7aa';
        return '#dbeafe';
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
            padding: 20
        }} onClick={onClose}>
            <div style={{
                background: '#fff',
                borderRadius: 20,
                padding: 40,
                maxWidth: 700,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
                position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: 8,
                        width: 40,
                        height: 40,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                    <FontAwesomeIcon icon={faTimes} style={{ color: '#64748b', fontSize: 18 }} />
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
                    }}>
                        <FontAwesomeIcon icon={faTrophy} style={{ fontSize: 40, color: '#fff' }} />
                    </div>
                    <h1 style={{
                        margin: '0 0 8px',
                        fontSize: 32,
                        fontWeight: 800,
                        color: '#0f172a',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        Top 10 del Mes
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: 18,
                        color: '#64748b',
                        fontWeight: 600
                    }}>
                        {mesNombre} {año}
                    </p>
                </div>

                {/* Mensaje de felicitación si el usuario está en el top */}
                {userPosition && (
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: 12,
                        padding: 20,
                        marginBottom: 24,
                        textAlign: 'center',
                        color: '#fff'
                    }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>
                            <FontAwesomeIcon icon={faTrophy} />
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                            ¡Felicitaciones!
                        </div>
                        <div style={{ fontSize: 15, opacity: 0.95 }}>
                            Quedaste en la posición #{userPosition.posicion} y ganaste{' '}
                            <strong>{userPosition.creditos_otorgados} créditos</strong>
                        </div>
                    </div>
                )}

                {/* Rankings */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: 8
                }}>
                    {rankings.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#94a3b8'
                        }}>
                            <FontAwesomeIcon icon={faTrophy} style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                            <div style={{ fontSize: 16 }}>
                                No hubo suficientes ventas este mes
                            </div>
                            <div style={{ fontSize: 14, marginTop: 8 }}>
                                (Se necesitan 10+ ventas por apunte)
                            </div>
                        </div>
                    ) : (
                        rankings.map((item) => (
                            <div
                                key={item.id_top}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: 16,
                                    borderRadius: 12,
                                    background: item.posicion <= 3 ? getPosicionBg(item.posicion) : '#f8fafc',
                                    marginBottom: 12,
                                    border: item.posicion <= 3 ? `2px solid ${getPosicionColor(item.posicion)}20` : '2px solid #f1f5f9',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Posición */}
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 10,
                                    background: getPosicionColor(item.posicion),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: `0 4px 12px ${getPosicionColor(item.posicion)}40`
                                }}>
                                    {item.posicion <= 3 ? (
                                        <FontAwesomeIcon
                                            icon={getPosicionIcon(item.posicion)}
                                            style={{ fontSize: 20, color: '#fff' }}
                                        />
                                    ) : (
                                        <span style={{
                                            fontSize: 18,
                                            fontWeight: 800,
                                            color: '#fff',
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            {item.posicion}
                                        </span>
                                    )}
                                </div>

                                {/* Avatar */}
                                {item.usuario?.foto ? (
                                    <img
                                        src={item.usuario.foto}
                                        alt={item.usuario.nombre}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 10,
                                            objectFit: 'cover',
                                            flexShrink: 0
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 10,
                                        background: '#2563eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        color: '#fff',
                                        fontSize: 18,
                                        fontWeight: 700
                                    }}>
                                        {item.usuario?.nombre?.charAt(0) || '?'}
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        marginBottom: 2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {item.usuario?.nombre || 'Usuario'}
                                    </div>
                                    <div style={{
                                        fontSize: 13,
                                        color: '#64748b',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {item.apunte?.titulo || 'Apunte'}
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        marginTop: 2
                                    }}>
                                        {item.ventas_mes} ventas
                                    </div>
                                </div>

                                {/* Créditos ganados */}
                                <div style={{
                                    textAlign: 'right',
                                    flexShrink: 0
                                }}>
                                    <div style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: getPosicionColor(item.posicion),
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        +{item.creditos_otorgados}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#94a3b8',
                                        fontWeight: 600
                                    }}>
                                        créditos
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: '2px solid #f1f5f9',
                    textAlign: 'center'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 32px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Inter, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1e40af';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}