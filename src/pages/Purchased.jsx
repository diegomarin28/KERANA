// src/pages/Purchased.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { getOrCreateUserProfile } from '../api/userService';

export default function Purchased() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtiene o crea el perfil del usuario
            const userProfile = await getOrCreateUserProfile();
            const userId = userProfile.id_usuario;

            console.log("Buscando compras para usuario ID:", userId);

            // Cargar compras con relación a apuntes
            const { data, error: purchasesError } = await supabase
                .from('comprar')
                .select(`
                    *,
                    apunte (
                        id_apunte,
                        titulo,
                        descripcion,
                        creditos,
                        tipo_archivo,
                        url_archivo,
                        tamaño_archivo,
                        created_at,
                        materia!inner(nombre_materia)
                    )
                `)
                .eq('id_usuario', userId)
                .order('fecha_compra', { ascending: false });

            if (purchasesError) {
                console.error("Error en consulta de compras:", purchasesError);

                // Si hay error con la relación, intentamos carga simple
                const { data: simpleData, error: simpleError } = await supabase
                    .from('comprar')
                    .select('*')
                    .eq('id_usuario', userId)
                    .order('fecha_compra', { ascending: false });

                if (simpleError && simpleError.code !== 'PGRST116') {
                    throw simpleError;
                }

                if (simpleData && simpleData.length > 0) {
                    const purchasesWithApuntes = await Promise.all(
                        simpleData.map(async (compra) => {
                            if (compra.id_apunte) {
                                const { data: apunteData } = await supabase
                                    .from('apunte')
                                    .select(`
                                        *,
                                        materia!inner(nombre_materia)
                                    `)
                                    .eq('id_apunte', compra.id_apunte)
                                    .single();

                                return {
                                    ...compra,
                                    apunte: apunteData
                                };
                            }
                            return compra;
                        })
                    );

                    setPurchases(purchasesWithApuntes);
                } else {
                    setPurchases(simpleData || []);
                }
                return;
            }

            setPurchases(data || []);

        } catch (err) {
            console.error("Error al cargar compras:", err);
            setError(err.message || "Error cargando tus compras");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPurchases();
    }, []);

    const handleDownload = (apunte) => {
        if (apunte?.url_archivo) {
            window.open(apunte.url_archivo, '_blank');
        } else {
            alert("No hay archivo disponible para descargar");
        }
    };

    const getApunteInfo = (purchase) => {
        return purchase.apunte || {
            titulo: purchase.id_apunte ? `Apunte #${purchase.id_apunte}` : 'Apunte no disponible',
            descripcion: "Información del apunte no disponible",
            creditos: purchase.cantidad_creditos || 0,
            materia: { nombre_materia: null }
        };
    };

    if (loading) {
        return (
            <div style={{
                minHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #f3f4f6",
                    borderTop: "3px solid #2563eb",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#6b7280", margin: 0 }}>Cargando tus compras…</p>
            </div>
        );
    }

    return (
        <div style={{
            width: "min(800px, 92vw)",
            margin: "0 auto",
            padding: "32px 0"
        }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: "0 0 8px 0" }}>Mis Compras</h1>
                <p style={{ color: "#6b7280", margin: 0 }}>
                    {purchases.length} compra{purchases.length !== 1 ? 's' : ''} realizada{purchases.length !== 1 ? 's' : ''}
                </p>
            </div>

            {error && (
                <Card style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "16px 20px",
                    marginBottom: 24
                }}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Error al cargar compras</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
                    <Button
                        variant="ghost"
                        onClick={loadPurchases}
                        style={{ marginTop: 12 }}
                    >
                        Reintentar
                    </Button>
                </Card>
            )}

            {purchases.length === 0 && !error ? (
                <Card style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "#fafafa"
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>
                        No tenés compras todavía
                    </h3>
                    <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                        Cuando compres apuntes, aparecerán aquí para que puedas descargarlos
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => window.location.href = "/apuntes"}
                    >
                        Explorar apuntes
                    </Button>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {purchases.map((purchase) => {
                        const apunte = getApunteInfo(purchase);
                        return (
                            <Card
                                key={purchase.id_compra}
                                style={{
                                    padding: 20,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    background: "#fff",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,.08)";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = "none";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: 16
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            margin: "0 0 8px 0",
                                            color: "#111827",
                                            fontSize: 18
                                        }}>
                                            {apunte.titulo}
                                        </h3>

                                        <div style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                            marginBottom: 12,
                                            flexWrap: "wrap"
                                        }}>
                                            {apunte.materia?.nombre_materia && (
                                                <span style={{
                                                    background: "#dbeafe",
                                                    color: "#2563eb",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: "600"
                                                }}>
                                                    {apunte.materia.nombre_materia}
                                                </span>
                                            )}
                                            <span style={{
                                                background: "#dcfce7",
                                                color: "#059669",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}>
                                                {apunte.creditos || purchase.cantidad_creditos || 0} créditos
                                            </span>
                                            {apunte.tipo_archivo && (
                                                <span style={{
                                                    background: "#f3f4f6",
                                                    color: "#4b5563",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    fontSize: "12px"
                                                }}>
                                                    {apunte.tipo_archivo}
                                                </span>
                                            )}
                                        </div>

                                        {apunte.descripcion && apunte.descripcion !== "Información del apunte no disponible" && (
                                            <p style={{
                                                color: "#6b7280",
                                                margin: "0 0 12px 0",
                                                fontSize: 14,
                                                lineHeight: 1.5
                                            }}>
                                                {apunte.descripcion}
                                            </p>
                                        )}

                                        <div style={{
                                            display: "flex",
                                            gap: 12,
                                            fontSize: 12,
                                            color: "#9ca3af",
                                            flexWrap: "wrap"
                                        }}>
                                            <span>
                                                Comprado: {new Date(purchase.fecha_compra).toLocaleDateString()}
                                            </span>
                                            <span>• {purchase.cantidad_creditos} créditos</span>
                                            {apunte.tamaño_archivo && (
                                                <span>• {apunte.tamaño_archivo}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: "flex",
                                        gap: 8,
                                        flexShrink: 0
                                    }}>
                                        <Button
                                            variant="primary"
                                            onClick={() => handleDownload(apunte)}
                                            disabled={!apunte.url_archivo}
                                        >
                                            {apunte.url_archivo ? "Descargar" : "No disponible"}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}