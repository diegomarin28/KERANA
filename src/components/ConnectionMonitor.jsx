import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function ConnectionMonitor() {
    const { isOnline, hasConnectionError, errorType } = useNetworkStatus();

    // No mostrar nada si todo está bien
    if (!hasConnectionError) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,  // ✅ Ahora abajo
            left: 0,
            right: 0,
            zIndex: 99999,
            animation: 'slideUp 0.3s ease-out'  // ✅ Animación desde abajo
        }}>
            {errorType === 'offline' && (
                <div style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    padding: '16px 24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    fontWeight: 600,
                    fontSize: 15
                }}>
                    <span style={{ fontSize: 20 }}>📡</span>
                    <span>No tenés conexión a internet</span>
                </div>
            )}

            {errorType === 'expired' && (
                <div style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    padding: '16px 24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    fontWeight: 600,
                    fontSize: 15
                }}>
                    <div style={{
                        width: 20,
                        height: 20,
                        border: '3px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>Perdiste la conexión. Reconectando...</span>
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}