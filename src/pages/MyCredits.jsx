import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { creditsAPI } from '../api/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCoins,
    faArrowUp,
    faArrowDown,
    faGift,
    faTrophy,
    faShoppingCart,
    faFileAlt,
    faStar,
    faChartLine,
    faCalendar,
    faCheckCircle,
    faCircle,
    faTimes,
    faCreditCard,
    faHistory,
    faShieldAlt,
    faBullseye,
    faMoneyBill
} from '@fortawesome/free-solid-svg-icons';

export default function MyCredits() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [bonuses, setBonuses] = useState([]);
    const [stats, setStats] = useState({
        totalGanado: 0,
        totalGastado: 0,
        apuntesSubidos: 0,
        apuntesComprados: 0,
        resenasEscritas: 0
    });
    const [milestones, setMilestones] = useState({
        upload: { current: 0, next: null, nextBonus: 0, progress: 0 },
        purchase: { current: 0, next: null, nextBonus: 0, progress: 0 }
    });

    // Modales
    const [showGanadoModal, setShowGanadoModal] = useState(false);
    const [showGastadoModal, setShowGastadoModal] = useState(false);

    // Tabs
    const activeTab = searchParams.get('tab') || 'historial';

    // Paquetes de créditos
    const [paquetes, setPaquetes] = useState([]);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        loadData();
        loadPaquetes();

        // Suscribirse a cambios en tiempo real
        const setupRealtimeSubscriptions = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (!userData) return;

            // Suscribirse a cambios en historial_creditos
            const creditosChannel = supabase
                .channel('my-credits-updates')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'historial_creditos',
                        filter: `id_usuario=eq.${userData.id_usuario}`
                    },
                    () => {
                        console.log('🔄 Actualizando créditos...');
                        loadData();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'bonos_otorgados',
                        filter: `id_usuario=eq.${userData.id_usuario}`
                    },
                    () => {
                        console.log('🎁 Actualizando bonos...');
                        loadData();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'apunte',
                        filter: `id_usuario=eq.${userData.id_usuario}`
                    },
                    () => {
                        console.log('📤 Nuevo apunte detectado...');
                        loadData();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'compra_apunte',
                        filter: `comprador_id=eq.${userData.id_usuario}`
                    },
                    () => {
                        console.log('🛒 Nueva compra detectada...');
                        loadData();
                    }
                )
                .subscribe();

            return creditosChannel;
        };

        let channelCleanup;
        setupRealtimeSubscriptions().then(channel => {
            channelCleanup = channel;
        });

        return () => {
            if (channelCleanup) {
                supabase.removeChannel(channelCleanup);
            }
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Balance actual
            const { data: creditsData } = await creditsAPI.getUserCredits();
            setCurrentBalance(creditsData || 0);

            // 2. Historial de transacciones
            await loadTransactionHistory();

            // 3. Bonos otorgados
            await loadBonuses();

            // 4. Estadísticas
            await loadStats();

            // 5. Próximos hitos
            await loadMilestones();

        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTransactionHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!userData) return;

        const { data, error } = await supabase
            .from('historial_creditos')
            .select('*')
            .eq('id_usuario', userData.id_usuario)
            .order('creado_en', { ascending: false })
            .limit(50);

        if (!error && data) {
            setTransactions(data);
        }
    };

    const loadBonuses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!userData) return;

        const { data, error } = await supabase
            .from('bonos_otorgados')
            .select('*')
            .eq('id_usuario', userData.id_usuario)
            .order('otorgado_en', { ascending: false });

        if (!error && data) {
            setBonuses(data);
        }
    };

    const loadStats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!userData) return;

        // Consultar transacciones directamente para calcular totales
        const { data: allTransactions } = await supabase
            .from('historial_creditos')
            .select('cantidad_creditos')
            .eq('id_usuario', userData.id_usuario);

        const totalGanado = (allTransactions || [])
            .filter(t => t.cantidad_creditos > 0)
            .reduce((sum, t) => sum + t.cantidad_creditos, 0);

        const totalGastado = Math.abs((allTransactions || [])
            .filter(t => t.cantidad_creditos < 0)
            .reduce((sum, t) => sum + t.cantidad_creditos, 0));

        // Contar apuntes subidos
        const { count: apuntesCount } = await supabase
            .from('apunte')
            .select('id_apunte', { count: 'exact', head: true })
            .eq('id_usuario', userData.id_usuario);

        // Contar apuntes comprados
        const { count: comprasCount } = await supabase
            .from('compra_apunte')
            .select('id', { count: 'exact', head: true })
            .eq('comprador_id', userData.id_usuario);

        // Contar reseñas
        const { count: resenasCount } = await supabase
            .from('rating')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userData.id_usuario);

        setStats({
            totalGanado,
            totalGastado,
            apuntesSubidos: apuntesCount || 0,
            apuntesComprados: comprasCount || 0,
            resenasEscritas: resenasCount || 0
        });
    };

    const loadMilestones = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!userData) return;

        // Consultar apuntes subidos
        const { count: apuntesCount } = await supabase
            .from('apunte')
            .select('id_apunte', { count: 'exact', head: true })
            .eq('id_usuario', userData.id_usuario);

        // Consultar apuntes comprados
        const { count: comprasCount } = await supabase
            .from('compra_apunte')
            .select('id', { count: 'exact', head: true })
            .eq('comprador_id', userData.id_usuario);

        const apuntesSubidos = apuntesCount || 0;
        const apuntesComprados = comprasCount || 0;

        // Hitos de subida
        const uploadMilestones = [10, 25, 50, 100, 250, 500, 1000];
        const uploadBonuses = { 10: 100, 25: 250, 50: 500, 100: 1000, 250: 2500, 500: 5000, 1000: 10000 };

        const nextUpload = uploadMilestones.find(m => m > apuntesSubidos) || null;
        const uploadProgress = nextUpload
            ? (apuntesSubidos / nextUpload) * 100
            : 100;

        // Hitos de compra
        const purchaseMilestones = [10, 25, 50, 100];
        const purchaseBonuses = { 10: 50, 25: 100, 50: 200, 100: 350 };

        const nextPurchase = purchaseMilestones.find(m => m > apuntesComprados) || null;
        const purchaseProgress = nextPurchase
            ? (apuntesComprados / nextPurchase) * 100
            : 100;

        setMilestones({
            upload: {
                current: apuntesSubidos,
                next: nextUpload,
                nextBonus: nextUpload ? uploadBonuses[nextUpload] : 0,
                progress: uploadProgress
            },
            purchase: {
                current: apuntesComprados,
                next: nextPurchase,
                nextBonus: nextPurchase ? purchaseBonuses[nextPurchase] : 0,
                progress: purchaseProgress
            }
        });
    };

    const loadPaquetes = async () => {
        try {
            const { data, error } = await supabase
                .from('paquete_creditos')
                .select('*')
                .eq('activo', true)
                .order('cantidad_creditos', { ascending: true });

            if (!error && data) {
                setPaquetes(data);
            }
        } catch (error) {
            console.error('Error cargando paquetes:', error);
        }
    };

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    const handleComprarPaquete = async (paquete) => {
        setProcessingPayment(true);

        try {
            const { data, error} = await supabase.functions.invoke('crear_preferencia_mp', {
                body: { id_paquete: paquete.id_paquete }
            });

            if (error) throw error;

            window.location.href = data.sandbox_init_point;
        } catch (error) {
            console.error('Error al procesar pago:', error);
            alert('Error al procesar el pago. Intenta nuevamente.');
            setProcessingPayment(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' });
    };

    const getTransactionIcon = (tipo) => {
        if (tipo.includes('apunte_subido') || tipo.includes('venta')) return faFileAlt;
        if (tipo.includes('compra')) return faMoneyBill;
        if (tipo.includes('resena')) return faStar;
        if (tipo.includes('bono') || tipo.includes('hito')) return faGift;
        return faCoins;
    };

    const getTransactionColor = (tipo) => {
        if (tipo.includes('bono') || tipo.includes('hito')) return '#10b981';
        if (tipo.includes('compra')) return '#ef4444';
        return '#2563eb';
    };

    const getBonusLabel = (tipo) => {
        if (tipo === 'bienvenida') {
            return { icon: faGift, text: 'Bono de bienvenida' };
        }
        if (tipo === 'primer_apunte') {
            return { icon: faBullseye, text: 'Primer apunte' };
        }
        if (tipo.startsWith('hito_')) {
            const num = tipo.replace('hito_', '');
            return { icon: faTrophy, text: `${num} apuntes subidos` };
        }
        if (tipo.startsWith('compras_')) {
            const num = tipo.replace('compras_', '');
            return { icon: faTrophy, text: `${num} apuntes comprados` };
        }
        return { icon: faGift, text: tipo };
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faCoins} spin style={{ fontSize: 48, color: '#2563eb', marginBottom: 16 }} />
                    <div style={{ color: '#64748b', fontSize: 16 }}>Cargando créditos...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            padding: '32px 20px'
        }}>
            <div style={{
                maxWidth: 1200,
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    marginBottom: 32
                }}>
                    <h1 style={{
                        margin: '0 0 8px',
                        fontSize: 36,
                        fontWeight: 800,
                        color: '#0f172a',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        Mis Créditos
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: 16,
                        color: '#64748b'
                    }}>
                        Historial de transacciones, bonos y próximos hitos
                    </p>
                </div>

                {/* Balance y estadísticas principales */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 20,
                    marginBottom: 32
                }}>
                    {/* Balance actual */}
                    <div style={{
                        background: '#2563eb',
                        borderRadius: 16,
                        padding: 32,
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 16
                        }}>
                            <FontAwesomeIcon icon={faCoins} style={{ fontSize: 28 }} />
                            <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.9 }}>Balance Actual</div>
                        </div>
                        <div style={{
                            fontSize: 48,
                            fontWeight: 800,
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {currentBalance}
                        </div>
                        <div style={{
                            fontSize: 13,
                            opacity: 0.8,
                            marginTop: 8
                        }}>
                            créditos disponibles
                        </div>

                        {/* Botón Comprar Créditos */}
                        <button
                            onClick={() => navigate('/credits')}
                            style={{
                                marginTop: 20,
                                width: '100%',
                                padding: '14px 24px',
                                background: '#fff',
                                color: '#2563eb',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderRadius: 10,
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <FontAwesomeIcon icon={faCreditCard} />
                            Comprar Créditos
                        </button>
                    </div>

                    {/* Total ganado - Clickeable */}
                    <div
                        onClick={() => setShowGanadoModal(true)}
                        style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 32,
                            border: '2px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15)';
                            e.currentTarget.style.borderColor = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                            e.currentTarget.style.borderColor = '#f1f5f9';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 16
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: '#d1fae5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 18, color: '#10b981' }} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Total Ganado</div>
                        </div>
                        <div style={{
                            fontSize: 36,
                            fontWeight: 800,
                            color: '#10b981',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            +{stats.totalGanado}
                        </div>
                    </div>

                    {/* Total gastado - Clickeable */}
                    <div
                        onClick={() => setShowGastadoModal(true)}
                        style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 32,
                            border: '2px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                            e.currentTarget.style.borderColor = '#f1f5f9';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 16
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: 18, color: '#ef4444' }} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Total Gastado</div>
                        </div>
                        <div style={{
                            fontSize: 36,
                            fontWeight: 800,
                            color: '#ef4444',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            -{stats.totalGastado}
                        </div>
                    </div>
                </div>

                {/* Próximos hitos */}
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 32,
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    marginBottom: 32
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 24
                    }}>
                        <FontAwesomeIcon icon={faTrophy} style={{ fontSize: 24, color: '#2563eb' }} />
                        <h2 style={{
                            margin: 0,
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#0f172a',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Próximos Hitos
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 24
                    }}>
                        {/* Hito de subida */}
                        {milestones.upload.next && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 12
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <FontAwesomeIcon icon={faFileAlt} style={{ color: '#2563eb' }} />
                                        <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                                            Subir {milestones.upload.next} apuntes
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#2563eb'
                                    }}>
                                        +{milestones.upload.nextBonus} créditos
                                    </div>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: 8,
                                    background: '#f1f5f9',
                                    borderRadius: 999,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${milestones.upload.progress}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <div style={{
                                    marginTop: 8,
                                    fontSize: 13,
                                    color: '#64748b',
                                    textAlign: 'center'
                                }}>
                                    {milestones.upload.current} / {milestones.upload.next} apuntes
                                </div>
                            </div>
                        )}

                        {/* Hito de compra */}
                        {milestones.purchase.next && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 12
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <FontAwesomeIcon icon={faTrophy} style={{ color: '#10b981' }} />
                                        <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                                            Comprar {milestones.purchase.next} apuntes
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#10b981'
                                    }}>
                                        +{milestones.purchase.nextBonus} créditos
                                    </div>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: 8,
                                    background: '#f1f5f9',
                                    borderRadius: 999,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${milestones.purchase.progress}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <div style={{
                                    marginTop: 8,
                                    fontSize: 13,
                                    color: '#64748b',
                                    textAlign: 'center'
                                }}>
                                    {milestones.purchase.current} / {milestones.purchase.next} apuntes
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid de transacciones y bonos */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: 24
                }}>
                    {/* Historial de transacciones */}
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 20
                        }}>
                            <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 20, color: '#2563eb' }} />
                            <h3 style={{
                                margin: 0,
                                fontSize: 20,
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                Transacciones Recientes
                            </h3>
                        </div>

                        <div style={{
                            maxHeight: 500,
                            overflowY: 'auto'
                        }}>
                            {transactions.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#94a3b8'
                                }}>
                                    <FontAwesomeIcon icon={faCoins} style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
                                    <div style={{ fontSize: 14 }}>No hay transacciones todavía</div>
                                </div>
                            ) : (
                                transactions.map((tx, index) => (
                                    <div
                                        key={tx.id_transaccion}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px 0',
                                            borderBottom: index < transactions.length - 1 ? '1px solid #f1f5f9' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 8,
                                            background: `${getTransactionColor(tx.tipo_transaccion)}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <FontAwesomeIcon
                                                icon={getTransactionIcon(tx.tipo_transaccion)}
                                                style={{
                                                    fontSize: 14,
                                                    color: getTransactionColor(tx.tipo_transaccion)
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: '#0f172a',
                                                marginBottom: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {tx.descripcion || tx.tipo_transaccion}
                                            </div>
                                            <div style={{
                                                fontSize: 12,
                                                color: '#94a3b8'
                                            }}>
                                                {formatDate(tx.creado_en)}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: tx.cantidad_creditos > 0 ? '#10b981' : '#ef4444',
                                            fontFamily: 'Inter, sans-serif',
                                            flexShrink: 0
                                        }}>
                                            {tx.cantidad_creditos > 0 ? '+' : ''}{tx.cantidad_creditos}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Bonos otorgados */}
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 20
                        }}>
                            <FontAwesomeIcon icon={faGift} style={{ fontSize: 20, color: '#10b981' }} />
                            <h3 style={{
                                margin: 0,
                                fontSize: 20,
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                Bonos Recibidos
                            </h3>
                        </div>

                        <div style={{
                            maxHeight: 500,
                            overflowY: 'auto'
                        }}>
                            {bonuses.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#94a3b8'
                                }}>
                                    <FontAwesomeIcon icon={faGift} style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
                                    <div style={{ fontSize: 14 }}>No hay bonos todavía</div>
                                </div>
                            ) : (
                                 bonuses.map((bonus, index) => {
                                        const bonusInfo = getBonusLabel(bonus.tipo_bono);
                                        return (
                                            <div
                                                key={bonus.id_bono}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '12px 0',
                                                    borderBottom: index < bonuses.length - 1 ? '1px solid #f1f5f9' : 'none'
                                                }}
                                            >
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 8,
                                                    background: '#d1fae5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <FontAwesomeIcon
                                                        icon={bonusInfo.icon}
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#10b981'
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#0f172a',
                                                        marginBottom: 2
                                                    }}>
                                                        {bonusInfo.text}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 12,
                                                        color: '#94a3b8'
                                                    }}>
                                                        {formatDate(bonus.otorgado_en)}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    color: '#10b981',
                                                    fontFamily: 'Inter, sans-serif',
                                                    flexShrink: 0
                                                }}>
                                                    +{bonus.cantidad_creditos}
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Total Ganado */}
                {showGanadoModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }} onClick={() => setShowGanadoModal(false)}>
                        <div style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 32,
                            maxWidth: 600,
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 24
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: '#d1fae5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 20, color: '#10b981' }} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
                                            Total Ganado
                                        </h2>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981', fontFamily: 'Inter, sans-serif' }}>
                                            +{stats.totalGanado}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGanadoModal(false)}
                                    style={{
                                        background: '#f1f5f9',
                                        border: 'none',
                                        borderRadius: 8,
                                        width: 36,
                                        height: 36,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ color: '#64748b' }} />
                                </button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                                {transactions.filter(t => t.cantidad_creditos > 0).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                        <FontAwesomeIcon icon={faCoins} style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
                                        <div style={{ fontSize: 14 }}>No hay transacciones positivas todavía</div>
                                    </div>
                                ) : (
                                    transactions.filter(t => t.cantidad_creditos > 0).map((tx) => (
                                        <div key={tx.id_transaccion} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FontAwesomeIcon icon={getTransactionIcon(tx.tipo_transaccion)} style={{ fontSize: 14, color: '#10b981' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                                                    {tx.descripcion || tx.tipo_transaccion}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                                    {formatDate(tx.creado_en)}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                                                +{tx.cantidad_creditos}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Total Gastado */}
                {showGastadoModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }} onClick={() => setShowGastadoModal(false)}>
                        <div style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 32,
                            maxWidth: 600,
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 24
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: '#fee2e2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: 20, color: '#ef4444' }} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
                                            Total Gastado
                                        </h2>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>
                                            -{stats.totalGastado}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGastadoModal(false)}
                                    style={{
                                        background: '#f1f5f9',
                                        border: 'none',
                                        borderRadius: 8,
                                        width: 36,
                                        height: 36,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ color: '#64748b' }} />
                                </button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                                {transactions.filter(t => t.cantidad_creditos < 0).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                        <FontAwesomeIcon icon={faShoppingCart} style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
                                        <div style={{ fontSize: 14 }}>No has gastado créditos todavía</div>
                                    </div>
                                ) : (
                                    transactions.filter(t => t.cantidad_creditos < 0).map((tx) => (
                                        <div key={tx.id_transaccion} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FontAwesomeIcon icon={getTransactionIcon(tx.tipo_transaccion)} style={{ fontSize: 14, color: '#ef4444' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                                                    {tx.descripcion || tx.tipo_transaccion}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                                    {formatDate(tx.creado_en)}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                                                {tx.cantidad_creditos}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}