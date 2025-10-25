export function SuccessModal({ open, onClose, message = "Operación exitosa" }) {
    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    maxWidth: 450,
                    padding: 40,
                    textAlign: 'center',
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        width: 80,
                        height: 80,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        fontSize: 40,
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    ✅
                </div>
                <h2
                    style={{
                        margin: '0 0 12px 0',
                        fontSize: 28,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    ¡Éxito!
                </h2>
                <p
                    style={{
                        color: '#6b7280',
                        fontSize: 16,
                        lineHeight: 1.6,
                        marginBottom: 32
                    }}
                >
                    {message}
                </p>
                <button
                    onClick={onClose}
                    style={{
                        padding: '14px 32px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 16,
                        width: '100%',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)';
                    }}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}