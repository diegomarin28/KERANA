import { useEffect } from 'react';

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: 32,
                    maxWidth: 420,
                    width: '90%',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Icono de advertencia */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(220, 38, 38, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                }}>
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </div>

                {/* Título */}
                <h2 style={{
                    margin: '0 0 12px 0',
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#0f172a',
                }}>
                    ¿Cerrar sesión?
                </h2>

                {/* Mensaje */}
                <p style={{
                    margin: '0 0 28px 0',
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: '#64748b',
                }}>
                    Vas a cerrar tu sesión actual. Tendrás que volver a iniciar sesión para acceder a tu cuenta.
                </p>

                {/* Botones */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#334155',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#b91c1c';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}