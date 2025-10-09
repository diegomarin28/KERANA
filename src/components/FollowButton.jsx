import { useState, useEffect } from 'react';
import { useSeguidores } from '../hooks/useSeguidores';

export default function FollowButton({
                                         usuarioId,
                                         initialFollowing = false,
                                         onFollowChange = null,
                                         size = 'medium' // 'small', 'medium', 'large'
                                     }) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [isLoading, setIsLoading] = useState(false);
    const { toggleSeguir, verificarSiSigue } = useSeguidores();

    // Verificar estado inicial
    useEffect(() => {
        async function checkStatus() {
            const result = await verificarSiSigue(usuarioId);
            setIsFollowing(result.sigue);
        }

        if (!initialFollowing) {
            checkStatus();
        }
    }, [usuarioId, initialFollowing, verificarSiSigue]);

    const handleClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setIsLoading(true);

        try {
            const result = await toggleSeguir(usuarioId, isFollowing);

            if (result.success) {
                const newState = !isFollowing;
                setIsFollowing(newState);

                // Callback opcional
                if (onFollowChange) {
                    onFollowChange(newState);
                }
            } else {
                alert(result.error || 'Error al procesar');
            }
        } catch (error) {
            console.error('[FollowButton] Error:', error);
            alert('Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    // Estilos según tamaño
    const sizeStyles = {
        small: {
            padding: '6px 16px',
            fontSize: '13px',
            height: '32px',
        },
        medium: {
            padding: '10px 20px',
            fontSize: '14px',
            height: '40px',
        },
        large: {
            padding: '12px 24px',
            fontSize: '16px',
            height: '48px',
        }
    };

    const buttonStyle = {
        ...sizeStyles[size],
        borderRadius: '8px',
        border: isFollowing ? '2px solid #e5e7eb' : '2px solid #2563eb',
        background: isFollowing ? '#ffffff' : '#2563eb',
        color: isFollowing ? '#64748b' : '#ffffff',
        fontWeight: '600',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        minWidth: '100px',
        opacity: isLoading ? 0.6 : 1,
    };

    const buttonHoverStyle = !isLoading ? {
        background: isFollowing ? '#f8fafc' : '#1d4ed8',
        borderColor: isFollowing ? '#cbd5e1' : '#1e40af',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
    } : {};

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            style={buttonStyle}
            onMouseEnter={(e) => {
                if (!isLoading) {
                    Object.assign(e.target.style, buttonHoverStyle);
                }
            }}
            onMouseLeave={(e) => {
                if (!isLoading) {
                    e.target.style.background = buttonStyle.background;
                    e.target.style.borderColor = buttonStyle.border.split(' ')[2];
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                }
            }}
            aria-label={isFollowing ? 'Dejar de seguir' : 'Seguir'}
        >
            {isLoading ? (
                <>
          <span style={{
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
          }} />
                    {isFollowing ? 'Dejando...' : 'Siguiendo...'}
                </>
            ) : (
                <>
                    {isFollowing ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            Siguiendo
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 4v16m8-8H4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            Seguir
                        </>
                    )}
                </>
            )}
        </button>
    );
}

// Agregar animación de spinner si no existe
if (typeof document !== 'undefined' && !document.getElementById('follow-button-animation')) {
    const style = document.createElement('style');
    style.id = 'follow-button-animation';
    style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(style);
}