import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getOrCreateUserProfile } from "../api/userService";
import { foldersAPI } from "../api/database";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useNavigate, useLocation } from "react-router-dom";
import ApunteCard from "../components/ApunteCard";
import { FolderCard } from "../components/FolderCard";

export default function Purchased() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const initialTab = params.get('tab') || 'purchases';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [purchases, setPurchases] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [organizing, setOrganizing] = useState(false);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showAddNotesModal, setShowAddNotesModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [targetFolder, setTargetFolder] = useState(null);

    useEffect(() => {
        loadPurchases();
        loadFolders();
    }, []);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            const profile = await getOrCreateUserProfile();
            if (!profile?.id_usuario) {
                setErrorMsg("No se encontró tu perfil de usuario.");
                return;
            }

            const { data: compras, error: comprasError } = await supabase
                .from("compra_apunte")
                .select(`id, apunte_id, comprador_id, creado_en`)
                .eq("comprador_id", profile.id_usuario)
                .order("creado_en", { ascending: false });

            if (comprasError) throw comprasError;
            if (!compras?.length) {
                setPurchases([]);
                return;
            }

            const apIds = compras.map(c => c.apunte_id).filter(Boolean);
            let apuntes = [];

            if (apIds.length) {
                const { data: apData, error: apErr } = await supabase
                    .from("apunte")
                    .select(`
                        id_apunte, titulo, descripcion, creditos, estrellas, file_path, file_name,
                        materia:id_materia(id_materia, nombre_materia),
                        usuario:id_usuario(nombre)
                    `)
                    .in("id_apunte", apIds);

                if (apErr) throw apErr;
                apuntes = apData || [];
            }

            const urls = {};
            if (apuntes.length > 0) {
                for (const apunte of apuntes) {
                    if (apunte.file_path) {
                        const { data: signedData } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(apunte.file_path, 3600);
                        if (signedData) urls[apunte.id_apunte] = signedData.signedUrl;
                    }
                }
            }

            const mapApunte = new Map(apuntes.map(a => [a.id_apunte, a]));
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

    const loadFolders = async () => {
        try {
            const { data, error } = await foldersAPI.getMyFolders();
            if (error) throw error;

            const foldersWithCount = await Promise.all(
                (data || []).map(async (folder) => {
                    const { data: notes } = await foldersAPI.getNotesInFolder(folder.id_carpeta);
                    const subfolders = (data || []).filter(f => f.parent_id === folder.id_carpeta);

                    // ✅ Calcular semestres SIEMPRE
                    let semestres = [];
                    if (notes?.length > 0) {
                        const compraIds = notes.map(n => n.compra_id);
                        const { data: compras } = await supabase
                            .from('compra_apunte')
                            .select(`apunte_id, apunte:apunte(materia:id_materia(semestre))`)
                            .in('id', compraIds);

                        const semSet = new Set();
                        compras?.forEach(c => {
                            const sem = c.apunte?.materia?.semestre;
                            if (sem) semSet.add(sem);
                        });
                        semestres = Array.from(semSet);
                    }

                    return {
                        ...folder,
                        item_count: (notes?.length || 0) + subfolders.length,
                        semestres // ← Esto es lo importante
                    };
                })
            );

            setFolders(foldersWithCount.filter(f => !f.parent_id));
        } catch (err) {
            console.error('Error cargando carpetas:', err);
        }
    };

    const handleOrganize = async () => {
        try {
            setOrganizing(true);
            setShowOrgModal(false);
            setErrorMsg("");

            const { error } = await foldersAPI.autoOrganize();
            if (error) throw error;
            await loadFolders();
        } catch (err) {
            console.error('Error organizando:', err);
            setErrorMsg(err?.message || "Error al organizar automáticamente");
        } finally {
            setOrganizing(false);
        }
    };

    const handleDeleteAllFolders = async () => {
        try {
            setOrganizing(true);
            setErrorMsg("");

            const { data: allFolders } = await foldersAPI.getMyFolders();
            for (const folder of allFolders || []) {
                await foldersAPI.deleteFolder(folder.id_carpeta);
            }
            await loadFolders();
        } catch (err) {
            console.error('Error eliminando carpetas:', err);
            setErrorMsg("Error al eliminar carpetas");
        } finally {
            setOrganizing(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            setErrorMsg("");
            const { error } = await foldersAPI.createFolder(newFolderName.trim(), 'personalizada', null, 0);
            if (error) throw error;
            setShowCreateFolderModal(false);
            setNewFolderName("");
            await loadFolders();
        } catch (err) {
            console.error('Error creando carpeta:', err);
            setErrorMsg("Error al crear carpeta");
        }
    };

    const handleAddNotesToFolder = async () => {
        if (!targetFolder || selectedNotes.length === 0) return;
        try {
            setErrorMsg("");
            for (const compraId of selectedNotes) {
                await foldersAPI.addNoteToFolder(targetFolder.id_carpeta, compraId);
            }
            setShowAddNotesModal(false);
            setTargetFolder(null);
            setSelectedNotes([]);
            await loadFolders();
        } catch (err) {
            console.error('Error añadiendo apuntes:', err);
            setErrorMsg("Error al añadir apuntes a la carpeta");
        }
    };

    const toggleNoteSelection = (compraId) => {
        setSelectedNotes(prev =>
            prev.includes(compraId) ? prev.filter(id => id !== compraId) : [...prev, compraId]
        );
    };

    const handleDeleteFolder = async (carpetaId) => {
        try {
            setErrorMsg("");
            const { error } = await foldersAPI.deleteFolder(carpetaId);
            if (error) throw error;
            await loadFolders();
        } catch (err) {
            console.error('Error eliminando carpeta:', err);
            setErrorMsg("Error al eliminar carpeta");
        }
    };

    const handleRenameFolder = async (carpetaId, nuevoNombre) => {
        try {
            setErrorMsg("");
            const { error } = await foldersAPI.updateFolder(carpetaId, nuevoNombre);
            if (error) throw error;
            await loadFolders();
        } catch (err) {
            console.error('Error renombrando carpeta:', err);
            setErrorMsg("Error al renombrar carpeta");
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
                <div style={{ width: 40, height: 40, border: "3px solid #f3f4f6", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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

            <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
                {['purchases', 'folders'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                            color: activeTab === tab ? '#2563eb' : '#6b7280',
                            fontWeight: activeTab === tab ? 600 : 400,
                            cursor: 'pointer',
                            fontSize: 15,
                            marginBottom: -2,
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'purchases' ? 'Todas las compras' : 'Mis carpetas'}
                    </button>
                ))}
            </div>

            {errorMsg && (
                <Card style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "16px 20px", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span>{errorMsg}</span>
                        <Button variant="ghost" onClick={() => { loadPurchases(); loadFolders(); }}>Reintentar</Button>
                    </div>
                </Card>
            )}

            {activeTab === "purchases" ? (
                purchases.length === 0 ? (
                    <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
                        <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>Todavía no compraste nada</h3>
                        <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>Explorá apuntes y materiales creados por otros estudiantes.</p>
                        <Button variant="primary" onClick={() => navigate('/notes')}>Ir a explorar apuntes</Button>
                    </Card>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {purchases.map((purchase) => <ApunteCard key={purchase.id} note={purchase} />)}
                    </div>
                )
            ) : (
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowCreateFolderModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 18px',
                                borderRadius: 8,
                                fontWeight: 500,
                                fontSize: 14,
                                background: 'white',
                                border: '2px solid #e5e7eb',
                                color: '#374151',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Crear carpeta
                        </button>

                        {folders.length === 0 && purchases.length > 0 && (
                            <button
                                onClick={() => setShowOrgModal(true)}
                                disabled={organizing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: organizing ? '#9ca3af' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 18px',
                                    borderRadius: 8,
                                    fontWeight: 500,
                                    fontSize: 14,
                                    cursor: organizing ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!organizing) e.target.style.background = '#1d4ed8';
                                }}
                                onMouseLeave={(e) => {
                                    if (!organizing) e.target.style.background = '#2563eb';
                                }}
                            >
                                {organizing ? (
                                    <>
                                        <div style={{
                                            width: 14,
                                            height: 14,
                                            border: '2px solid white',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        Organizando...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <circle cx="12" cy="12" r="3"/>
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                        </svg>
                                        Organizar automáticamente
                                    </>
                                )}
                            </button>
                        )}

                        {folders.length > 0 && (
                            <button
                                onClick={handleDeleteAllFolders}
                                disabled={organizing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 18px',
                                    borderRadius: 8,
                                    fontWeight: 500,
                                    fontSize: 14,
                                    background: 'white',
                                    border: '2px solid #fecaca',
                                    color: '#dc2626',
                                    cursor: organizing ? 'not-allowed' : 'pointer',
                                    opacity: organizing ? 0.6 : 1,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!organizing) {
                                        e.target.style.background = '#fef2f2';
                                        e.target.style.borderColor = '#fca5a5';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!organizing) {
                                        e.target.style.background = 'white';
                                        e.target.style.borderColor = '#fecaca';
                                    }
                                }}
                            >
                                {organizing ? (
                                    <>
                                        <div style={{
                                            width: 14,
                                            height: 14,
                                            border: '2px solid #dc2626',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        Borrando...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                        </svg>
                                        Borrar todas las carpetas
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {folders.length === 0 ? (
                        <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                            <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>No tenés carpetas todavía</h3>
                            <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>Organizá tus compras automáticamente o creá carpetas personalizadas.
                            </p>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                            {folders.map((folder) => (
                                <FolderCard key={folder.id_carpeta} folder={folder} semestres={folder.semestres} onDelete={handleDeleteFolder} onRename={handleRenameFolder} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showOrgModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
                     onClick={() => setShowOrgModal(false)}>
                    <Card style={{ maxWidth: 480, width: '100%', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🤖</div>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: 22, fontWeight: 700 }}>Organizar automáticamente</h2>
                        <p style={{ color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.6, fontSize: 15 }}>
                            Voy a crear carpetas por semestre y materia automáticamente, organizando todos tus apuntes.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowOrgModal(false)} style={{ flex: 1, padding: '12px 20px', background: 'white', border: '2px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#6b7280', transition: 'all 0.2s' }}>Cancelar</button>
                            <button onClick={handleOrganize} style={{ flex: 1, padding: '12px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600, transition: 'all 0.2s' }}>Organizar</button>
                        </div>
                    </Card>
                </div>
            )}

            {showCreateFolderModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
                     onClick={() => { setShowCreateFolderModal(false); setNewFolderName(""); }}>
                    <Card style={{ maxWidth: 420, width: '100%', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📁</div>
                            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Nueva carpeta</h2>
                        </div>
                        <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14, lineHeight: 1.5 }}>Organizá tus apuntes creando carpetas personalizadas</p>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Nombre de la carpeta</label>
                            <input type="text" placeholder="Ej: Mis favoritos, Exámenes finales..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                                   onFocus={(e) => e.target.select()} onKeyPress={(e) => { if (e.key === 'Enter' && newFolderName.trim()) handleCreateFolder(); }}
                                   style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} autoFocus />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => { setShowCreateFolderModal(false); setNewFolderName(""); }} style={{ flex: 1, padding: '12px 20px', background: 'white', border: '2px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#6b7280', transition: 'all 0.2s' }}>Cancelar</button>
                            <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} style={{ flex: 1, padding: '12px 20px', background: !newFolderName.trim() ? '#d1d5db' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, cursor: !newFolderName.trim() ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, transition: 'all 0.2s' }}>Crear carpeta</button>
                        </div>
                    </Card>
                </div>
            )}

            {showAddNotesModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflow: 'auto' }}
                     onClick={() => setShowAddNotesModal(false)}>
                    <Card style={{ maxWidth: 600, width: '100%', padding: 24, maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>Añadir apuntes a "{targetFolder?.nombre}"</h2>
                        <div style={{ marginBottom: 20 }}>
                            {purchases.map((purchase) => (
                                <label key={purchase.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: selectedNotes.includes(purchase.id) ? '#eff6ff' : 'white', transition: 'all 0.2s' }}>
                                    <input type="checkbox" checked={selectedNotes.includes(purchase.id)} onChange={() => toggleNoteSelection(purchase.id)} style={{ marginRight: 12 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{purchase.titulo}</div>
                                        <div style={{ fontSize: 13, color: '#6b7280' }}>{purchase.materia?.nombre_materia || 'Sin materia'}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, color: '#6b7280' }}>{selectedNotes.length} seleccionado{selectedNotes.length !== 1 ? 's' : ''}</span>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button variant="ghost" onClick={() => { setShowAddNotesModal(false); setSelectedNotes([]); }}>Cancelar</Button>
                                <Button variant="primary" onClick={handleAddNotesToFolder} disabled={selectedNotes.length === 0}>Añadir ({selectedNotes.length})</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}