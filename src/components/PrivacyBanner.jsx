import { useState, useEffect } from 'react';

export default function PrivacyBanner() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Solo mostrar si no aceptó antes
        const accepted = localStorage.getItem('kerana_privacy_accepted');
        if (!accepted) {
            setShowBanner(true);
        }
    }, []);

    const acceptPrivacy = () => {
        localStorage.setItem('kerana_privacy_accepted', 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#1e40af',
            color: 'white',
            padding: '16px',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #3b82f6'
        }}>
            <div style={{ flex: 1 }}>
                <strong>🔒 Protección de datos personales</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                    Usamos tus datos según la Ley N° 18.331 de Uruguay. Podés acceder, rectificar o eliminar tus datos cuando quieras.
                </p>
            </div>
            <button
                onClick={acceptPrivacy}
                style={{
                    background: 'white',
                    color: '#1e40af',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginLeft: '16px'
                }}
            >
                Entendido
            </button>
        </div>
    );
}