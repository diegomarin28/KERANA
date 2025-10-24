export default function CreditsSuccess() {
    useEffect(() => {
        // Recargar créditos del usuario
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('payment_id');

        if (paymentId) {
            // Opcional: verificar estado del pago
            console.log('Pago exitoso:', paymentId);
        }

        // Redirigir después de 3 segundos
        setTimeout(() => {
            window.location.href = '/credits';
        }, 3000);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: 20,
        }}>
            <div>
                <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
                <h1 style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#10b981',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: 12,
                }}>
                    ¡Pago exitoso!
                </h1>
                <p style={{
                    fontSize: 16,
                    color: '#64748b',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    Tus créditos se acreditaron correctamente.
                    <br />
                    Redirigiendo...
                </p>
            </div>
        </div>
    );
}