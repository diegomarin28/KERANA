import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getOrCreateUserProfile } from "../api/userService";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useNavigate } from "react-router-dom";
import ApunteCard from "../components/ApunteCard";

export default function Purchased() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

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

            // Consultar compra_apunte
            const { data: compras, error: comprasError } = await supabase
                .from("compra_apunte")
                .select(`
                    id,
                    apunte_id,
                    comprador_id,
                    creado_en
                `)
                .eq("comprador_id", profile.id_usuario)
                .order("creado_en", { ascending: false });

            if (comprasError) throw comprasError;

            if (!compras?.length) {
                setPurchases([]);
                return;
            }

            // Obtener los IDs de apuntes
            const apIds = compras.map(c => c.apunte_id).filter(Boolean);

            let apuntes = [];
            if (apIds.length) {
                const { data: apData, error: apErr } = await supabase
                    .from("apunte")
                    .select(`
                        id_apunte,
                        titulo,
                        descripcion,
                        creditos,
                        estrellas,
                        file_path,
                        file_name,
                        materia:id_materia(
                            id_materia,
                            nombre_materia
                        ),
                        usuario:id_usuario(nombre)
                    `)
                    .in("id_apunte", apIds);

                if (apErr) throw apErr;
                apuntes = apData || [];
            }

            // Generar signed URLs para todos los apuntes
            const urls = {};
            if (apuntes.length > 0) {
                for (const apunte of apuntes) {
                    if (apunte.file_path) {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(apunte.file_path, 3600);

                        if (!signedError && signedData) {
                            urls[apunte.id_apunte] = signedData.signedUrl;
                        }
                    }
                }
            }

            // Mapear apuntes por ID
            const mapApunte = new Map(apuntes.map(a => [a.id_apunte, a]));

            // Enriquecer con datos de apuntes y signed URLs
            const enriched = compras.map(c => {
                const apunte = mapApunte.get(c.apunte_id);
                return {
                    ...c,
                    id_apunte: c.apunte_id,
                    titulo: apunte?.titulo || "Apunte adquirido",
                    descripcion: apunte?.descripcion || "",
                    creditos: apunte?.creditos || 0,
                    estrellas: apunte?.estrellas || 0,
                    usuario: apunte?.usuario || { nombre: "Anónimo" },
                    materia: apunte?.materia || { nombre_materia: "Sin materia" },
                    signedUrl: urls[c.apunte_id] || null,
                    file_path: apunte?.file_path
                };
            });

            setPurchases(enriched);
        } catch (err) {
            console.error('Error cargando compras:', err);
            setErrorMsg(err?.message || "Error cargando tus compras.");
        } finally {
            setLoading(false);
        }
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
        <div style={{ width: "min(1200px, 92vw)", margin: "0 auto", padding: "32px 0" }}>
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
                    <Button variant="primary" onClick={() => navigate('/notes')}>Ir a explorar apuntes</Button>
                </Card>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20
                }}>
                    {purchases.map((purchase) => (
                        <ApunteCard
                            key={purchase.id}
                            note={purchase}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}