// src/pages/Purchased.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getOrCreateUserProfile } from "../api/userService";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";

export default function Purchased() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => { loadPurchases(); }, []);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            const profile = await getOrCreateUserProfile();
            if (!profile?.id_usuario) {
                setErrorMsg("No se encontró tu perfil de usuario.");
                return;
            }

            // ⚠️ No conocemos nombres exactos de columnas: usamos '*'
            const { data: compras, error: comprasError } = await supabase
                .from("comprar")
                .select("*")
                .eq("id_usuario", profile.id_usuario)
                .order("fecha_compra", { ascending: false });
            if (comprasError) throw comprasError;

            if (!compras?.length) { setPurchases([]); return; }

            // Adivinamos nombres comunes
            const safe = (c) => ({
                id_compra: c.id_compra ?? c.id ?? null,
                id_apunte: c.id_apunte ?? c.apunte_id ?? null,
                cantidad_creditos: c.cantidad_creditos ?? c.creditos ?? c.monto ?? null,
                fecha_compra: c.fecha_compra ?? c.fecha ?? c.created_at ?? null,
            });

            const norm = compras.map(safe);
            const apIds = [...new Set(norm.map(c => c.id_apunte).filter(Boolean))];

            let apuntes = [];
            if (apIds.length) {
                const { data: apData, error: apErr } = await supabase
                    .from("apunte")
                    .select(`
            id_apunte,
            titulo,
            creditos,
            estrellas,
            id_materia,
            file_path,
            file_name,
            mime_type,
            file_size,
            materia:id_materia!Apunte_id_materia_fkey (
              id_materia,
              nombre_materia
            )
          `)
                    .in("id_apunte", apIds);
                if (apErr) throw apErr;
                apuntes = apData || [];
            }

            const mapApunte = new Map(apuntes.map(a => [a.id_apunte, a]));
            const enriched = norm.map(c => ({ ...c, apunte: mapApunte.get(c.id_apunte) || null }));

            setPurchases(enriched);
        } catch (err) {
            setErrorMsg(err?.message || "Error cargando tus compras.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (purchase) => {
        const url = purchase?.apunte?.file_path;
        if (url) window.open(url, "_blank");
    };

    if (loading) {
        return (
            <div style={{
                minHeight: "60vh", display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column", gap: 16
            }}>
                <div style={{
                    width: 40, height: 40, border: "3px solid #f3f4f6",
                    borderTop: "3px solid #2563eb", borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#6b7280", margin: 0 }}>Cargando tus compras…</p>
            </div>
        );
    }

    return (
        <div style={{ width: "min(900px, 92vw)", margin: "0 auto", padding: "32px 0" }}>
            <header style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 8px 0" }}>Mis compras</h1>
                <p style={{ color: "#6b7280", margin: 0 }}>
                    {purchases.length} compra{purchases.length !== 1 ? "s" : ""} realizada{purchases.length !== 1 ? "s" : ""}
                </p>
            </header>

            {errorMsg && (
                <Card style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "16px 20px", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span>{errorMsg}</span>
                        <Button variant="ghost" onClick={loadPurchases}>Reintentar</Button>
                    </div>
                </Card>
            )}

            {purchases.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>Todavía no compraste nada</h3>
                    <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                        Explorá apuntes y materiales creados por otros estudiantes.
                    </p>
                    <Button variant="primary" onClick={() => (window.location.href = "/")}>Ir a explorar</Button>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {purchases.map((p) => {
                        const a = p.apunte;
                        return (
                            <Card key={p.id_compra ?? `${p.id_apunte}-${p.fecha_compra}`} style={{
                                padding: 20, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: 18 }}>
                                            {a?.titulo || "Apunte adquirido"}
                                        </h3>

                                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                                            {a?.materia?.nombre_materia && <Chip tone="blue">{a.materia.nombre_materia}</Chip>}
                                            <Chip tone="green">{a?.creditos ?? p.cantidad_creditos ?? 0} créditos</Chip>
                                            {a?.mime_type && <Chip tone="gray">{a.mime_type}</Chip>}
                                        </div>

                                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#9ca3af" }}>
                                            {p.fecha_compra && <span>Fecha: {new Date(p.fecha_compra).toLocaleDateString()}</span>}
                                            {a?.file_size && <span>• {Math.round(a.file_size / 1024)} KB</span>}
                                            {typeof a?.estrellas === "number" && <span>• ⭐ {a.estrellas}</span>}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Button variant="primary" onClick={() => handleDownload(p)} disabled={!a?.file_path}>
                                            Descargar
                                        </Button>
                                        <Button variant="secondary" onClick={() => (window.location.href = `/apuntes/${p.id_apunte}`)}>
                                            Ver detalle
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
