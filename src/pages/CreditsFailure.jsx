import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

export default function CreditsFailure() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: 20,
        }}>
            <div>
                <div style={{ fontSize: 64, marginBottom: 20, color: '#ef4444' }}>
                    <FontAwesomeIcon icon={faTimesCircle} />
                </div>
                <h1 style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#ef4444',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: 12,
                }}>
                    Pago rechazado
                </h1>
                <p style={{
                    fontSize: 16,
                    color: '#64748b',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: 24,
                }}>
                    No se pudo procesar tu pago.
                </p>
                <button
                    onClick={() => window.location.href = '/credits'}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 12,
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1e40af'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                >
                    Volver a intentar
                </button>
            </div>
        </div>
    );
}