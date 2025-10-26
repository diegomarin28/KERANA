import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            countdown: 5
        };
        this.countdownInterval = null;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🚨 Error capturado por ErrorBoundary:', error);
        console.error('📍 Información del error:', errorInfo);

        this.setState({ errorInfo });

        // ✅ Iniciar countdown para recarga automática
        this.startCountdown();
    }

    startCountdown = () => {
        this.countdownInterval = setInterval(() => {
            this.setState((prevState) => {
                const newCountdown = prevState.countdown - 1;

                if (newCountdown <= 0) {
                    clearInterval(this.countdownInterval);
                    console.log('🔄 Recargando página automáticamente...');
                    window.location.reload();
                    return prevState;
                }

                return { countdown: newCountdown };
            });
        }, 1000);
    };

    handleManualReload = () => {
        window.location.reload();
    };

    componentWillUnmount() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: 40,
                        maxWidth: 500,
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: 40
                        }}>
                            🔄
                        </div>

                        <h1 style={{
                            margin: '0 0 12px 0',
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#0f172a'
                        }}>
                            Algo salió mal
                        </h1>

                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: 15,
                            color: '#64748b',
                            lineHeight: 1.6
                        }}>
                            No te preocupes, vamos a recargar la página automáticamente en{' '}
                            <strong style={{ color: '#2563eb' }}>
                                {this.state.countdown} segundo{this.state.countdown !== 1 ? 's' : ''}
                            </strong>
                        </p>

                        {/* Barra de progreso */}
                        <div style={{
                            width: '100%',
                            height: 8,
                            background: '#e5e7eb',
                            borderRadius: 4,
                            overflow: 'hidden',
                            marginBottom: 24
                        }}>
                            <div style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                                width: `${((5 - this.state.countdown) / 5) * 100}%`,
                                transition: 'width 1s linear'
                            }} />
                        </div>

                        <button
                            onClick={this.handleManualReload}
                            style={{
                                padding: '12px 32px',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                width: '100%'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                            onMouseLeave={(e) => e.target.style.background = '#2563eb'}
                        >
                            Recargar ahora
                        </button>

                        {/* Mostrar error en desarrollo */}
                        {import.meta.env.DEV && this.state.error && (
                            <details style={{
                                marginTop: 24,
                                textAlign: 'left',
                                padding: 16,
                                background: '#f9fafb',
                                borderRadius: 8,
                                fontSize: 12,
                                color: '#6b7280'
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
                                    Detalles del error (solo en desarrollo)
                                </summary>
                                <pre style={{
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    margin: 0
                                }}>
                                    {this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;