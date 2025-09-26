import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { userAPI, purchaseAPI } from "../api/database"
import { Link } from "react-router-dom"

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: active ? "2px solid var(--accent)" : "1px solid #e5e7eb",
                background: active ? "rgba(37,99,235,.07)" : "#fff",
                fontWeight: 700,
                cursor: "pointer"
            }}
        >
            {children}
        </button>
    )
}

export default function UserDashboard() {
    const [active, setActive] = useState("overview") // overview | favorites | notes | purchases | settings
    const [authUser, setAuthUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")

    // Datos por tab
    const [favCourses, setFavCourses] = useState([])
    const [favNotes, setFavNotes] = useState([])
    const [myCourses, setMyCourses] = useState([])
    const [myNotes, setMyNotes] = useState([])
    const [purchases, setPurchases] = useState([])

    // Settings (perfil)
    const [nameDraft, setNameDraft] = useState("")

    useEffect(() => {
        (async () => {
            setLoading(true)
            setErr("")
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setAuthUser(user || null)

                if (user) {
                    const { data: prof } = await userAPI.getCurrentProfile()
                    setProfile(prof || null)
                    setNameDraft(prof?.nombre || "")

                    // Favoritos de cursos (podrías usar userAPI.getUserFavorites)
                    const { data: favC } = await supabase
                        .from("usuario_fav")
                        .select(`
              id,
              profesor_curso(
                id, precio, modalidad,
                usuario(nombre),
                materia(nombre),
                califica(puntuacion)
              )
            `)
                        .eq("usuario_id", user.id)
                        .order("id", { ascending: false })
                    setFavCourses(
                        (favC || [])
                            .filter(r => r.profesor_curso)
                            .map(r => {
                                const c = r.profesor_curso
                                const ratings = c.califica?.map(x => x.puntuacion) || []
                                const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : "—"
                                return {
                                    id: c.id,
                                    materia: c.materia?.nombre || "Materia",
                                    docente: c.usuario?.nombre || "Docente",
                                    precio: c.precio ?? 0,
                                    modalidad: c.modalidad || "—",
                                    rating: avg
                                }
                            })
                    )

                    // Favoritos de apuntes
                    const { data: favN } = await supabase
                        .from("apunte_fav")
                        .select(`
              id,
              apunte(
                id, titulo, descripcion, file_url, file_name,
                profesor_curso(id, usuario(nombre), materia(nombre))
              )
            `)
                        .eq("usuario_id", user.id)
                        .order("id", { ascending: false })
                    setFavNotes(
                        (favN || [])
                            .filter(x => x.apunte)
                            .map(x => {
                                const a = x.apunte
                                return {
                                    id: a.id,
                                    titulo: a.titulo || a.file_name,
                                    descripcion: a.descripcion || "",
                                    fileUrl: a.file_url,
                                    materia: a.profesor_curso?.materia?.nombre || "Materia",
                                    autor: a.profesor_curso?.usuario?.nombre || "Autor"
                                }
                            })
                    )

                    // Mis cursos (yo soy el autor del curso)
                    const { data: myC } = await supabase
                        .from("profesor_curso")
                        .select(`id, precio, modalidad, materia(nombre)`)
                        .eq("usuario_id", user.id)
                        .order("id", { ascending: false })
                    setMyCourses(myC || [])

                    // Mis apuntes (apuntes de mis cursos)
                    const { data: myN } = await supabase
                        .from("apunte")
                        .select(`
              id, titulo, descripcion, file_url, file_name,
              profesor_curso(usuario_id, materia(nombre))
            `)
                        .order("id", { ascending: false })
                    setMyNotes(
                        (myN || [])
                            .filter(a => a.profesor_curso?.usuario_id === user.id)
                            .map(a => ({
                                id: a.id,
                                titulo: a.titulo || a.file_name,
                                materia: a.profesor_curso?.materia?.nombre || "Materia",
                                fileUrl: a.file_url,
                                descripcion: a.descripcion || ""
                            }))
                    )

                    // Compras
                    const { data: buys } = await purchaseAPI.getUserPurchases()
                    setPurchases(buys || [])
                }
            } catch (e) {
                setErr(e.message || "Error cargando panel")
            }
            setLoading(false)
        })()
    }, [])

    const saveSettings = async () => {
        try {
            const { error } = await userAPI.updateProfile({ nombre: nameDraft })
            if (error) throw error
            setProfile(p => ({ ...(p||{}), nombre: nameDraft }))
            alert("Perfil actualizado")
        } catch (e) {
            alert(e.message || "No se pudo guardar")
        }
    }

    if (loading) return <div style={{ padding: 24 }}>Cargando...</div>

    if (!authUser) {
        return (
            <div style={{ padding: 24, textAlign: "center" }}>
                <h2>Necesitás iniciar sesión</h2>
                <p>Entrá para ver tu panel de usuario.</p>
                <Link to="/signin" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none", fontWeight: 700 }}>
                    Iniciar sesión
                </Link>
            </div>
        )
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Mi Panel</h1>
                    <div style={{ color: "#64748b" }}>{profile?.nombre || authUser.email}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <TabButton active={active==="overview"} onClick={()=>setActive("overview")}>Resumen</TabButton>
                    <TabButton active={active==="favorites"} onClick={()=>setActive("favorites")}>Favoritos</TabButton>
                    <TabButton active={active==="notes"} onClick={()=>setActive("notes")}>Mis subidas</TabButton>
                    <TabButton active={active==="purchases"} onClick={()=>setActive("purchases")}>Compras</TabButton>
                    <TabButton active={active==="settings"} onClick={()=>setActive("settings")}>Ajustes</TabButton>
                </div>
            </div>

            {err && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</div>}

            {/* BODY */}
            {active === "overview" && (
                <div style={{ display: "grid", gap: 12 }}>
                    <StatRow label="Cursos favoritos" value={favCourses.length} to="/favorites" />
                    <StatRow label="Apuntes favoritos" value={favNotes.length} to="/my-papers" />
                    <StatRow label="Mis cursos publicados" value={myCourses.length} to="/upload" />
                    <StatRow label="Mis apuntes publicados" value={myNotes.length} to="/upload" />
                    <StatRow label="Compras realizadas" value={purchases.length} to="/purchased" />
                </div>
            )}

            {active === "favorites" && (
                <section style={{ display: "grid", gap: 16 }}>
                    <h2 style={{ margin: 0 }}>Favoritos</h2>
                    <h3 style={{ margin: 0 }}>Cursos ({favCourses.length})</h3>
                    {favCourses.length === 0 ? <Empty text="No tenés cursos favoritos" /> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {favCourses.map(c => (
                                <Link key={c.id} to={`/cursos/${c.id}`} style={cardLink}>
                                    <div style={{ fontWeight: 800 }}>{c.materia}</div>
                                    <div style={{ color: "#64748b" }}>{c.docente} · {c.modalidad}</div>
                                    <div style={{ marginLeft: "auto" }}>⭐ {c.rating} · ${c.precio}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <h3 style={{ margin: "12px 0 0" }}>Apuntes ({favNotes.length})</h3>
                    {favNotes.length === 0 ? <Empty text="No tenés apuntes favoritos" /> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {favNotes.map(n => (
                                <div key={n.id} style={noteCard}>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{n.titulo}</div>
                                        <div style={{ color: "#64748b" }}>{n.materia} · {n.autor}</div>
                                    </div>
                                    <button onClick={()=> window.open(n.fileUrl, "_blank")} style={btnPrimary}>⬇️ Descargar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {active === "notes" && (
                <section style={{ display: "grid", gap: 16 }}>
                    <h2 style={{ margin: 0 }}>Mis subidas</h2>

                    <h3 style={{ margin: 0 }}>Cursos ({myCourses.length})</h3>
                    {myCourses.length === 0 ? <Empty text="Todavía no publicaste cursos" /> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {myCourses.map(c => (
                                <Link key={c.id} to={`/cursos/${c.id}`} style={cardLink}>
                                    <div style={{ fontWeight: 800 }}>{c.materia?.nombre || "Materia"}</div>
                                    <div style={{ color: "#64748b" }}>{c.modalidad}</div>
                                    <div style={{ marginLeft: "auto" }}>${c.precio ?? 0}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <h3 style={{ margin: "12px 0 0" }}>Apuntes ({myNotes.length})</h3>
                    {myNotes.length === 0 ? <Empty text="Aún no subiste apuntes" /> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {myNotes.map(n => (
                                <div key={n.id} style={noteCard}>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{n.titulo}</div>
                                        <div style={{ color: "#64748b" }}>{n.materia}</div>
                                        {n.descripcion && <div style={{ fontSize: 12, color: "#6b7280" }}>{n.descripcion}</div>}
                                    </div>
                                    <button onClick={()=> window.open(n.fileUrl, "_blank")} style={btnPrimary}>⬇️ Descargar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {active === "purchases" && (
                <section style={{ display: "grid", gap: 16 }}>
                    <h2 style={{ margin: 0 }}>Compras</h2>
                    {purchases.length === 0 ? <Empty text="Aún no realizaste compras" /> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {purchases.map(p => (
                                <Link key={p.id} to={`/cursos/${p.profesor_curso?.id}`} style={cardLink}>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>
                                            {p.profesor_curso?.materia?.nombre || "Curso"}
                                        </div>
                                        <div style={{ color: "#64748b" }}>
                                            {p.profesor_curso?.usuario?.nombre || "Docente"}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: "auto" }}>
                                        <div style={{ textAlign: "right" }}>${p.monto ?? 0}</div>
                                        <small style={{ color: "#64748b" }}>{new Date(p.created_at).toLocaleString()}</small>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {active === "settings" && (
                <section style={{ display: "grid", gap: 12, maxWidth: 520 }}>
                    <h2 style={{ margin: 0 }}>Ajustes</h2>
                    <label>Nombre</label>
                    <input value={nameDraft} onChange={e=>setNameDraft(e.target.value)} placeholder="Tu nombre"
                           style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }} />
                    <button onClick={saveSettings} style={btnPrimary}>Guardar cambios</button>
                </section>
            )}
        </div>
    )
}

function StatRow({ label, value, to }) {
    return (
        <Link to={to} style={cardLink}>
            <div style={{ fontWeight: 800 }}>{label}</div>
            <div style={{ marginLeft: "auto" }}>{value}</div>
        </Link>
    )
}

const cardLink = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 14,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    textDecoration: "none",
    color: "inherit",
    background: "#fff"
}

const noteCard = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff"
}

const btnPrimary = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #1e40af",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer"
}

function Empty({ text }) {
    return (
        <div style={{ padding: 16, border: "1px dashed #e5e7eb", borderRadius: 12, color: "#64748b" }}>
            {text}
        </div>
    )
}
