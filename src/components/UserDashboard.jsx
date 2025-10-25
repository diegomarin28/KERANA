import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { userAPI } from "../api/database"
import { Link } from "react-router-dom"
import { Button } from "../components/UI/Button"
import { Card } from "../components/UI/Card"
import { Chip } from "../components/UI/Chip"

function TabButton({ active, onClick, children }) {
    return (
        <Button
            variant={active ? "secondary" : "ghost"}
            onClick={onClick}
            style={{ borderRadius: 10 }}
        >
            {children}
        </Button>
    )
}

export default function UserDashboard() {
    const [active, setActive] = useState("overview")
    const [authUser, setAuthUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")
    const [favCourses, setFavCourses] = useState([])
    const [favNotes, setFavNotes] = useState([])
    const [myCourses, setMyCourses] = useState([])
    const [myNotes, setMyNotes] = useState([])
    const [purchases, setPurchases] = useState([])
    const [nameDraft, setNameDraft] = useState("")

    useEffect(() => { /* carga datos igual que tu versión */ }, [])

    const saveSettings = async () => {
        try {
            const { error } = await userAPI.updateProfile({ nombre: nameDraft })
            if (error) throw error
            setProfile(p => ({ ...(p||{}), nombre: nameDraft }))
            alert("Perfil actualizado")
        } catch (e) { alert(e.message || "No se pudo guardar") }
    }

    if (loading) return <div style={{ padding: 24 }}>Cargando...</div>

    if (!authUser) {
        return (
            <Card style={{ textAlign: "center" }}>
                <h2>Necesitás iniciar sesión</h2>
                <p>Entrá para ver tu panel de usuario.</p>
                <Link to="/signin">
                    <Button variant="secondary">Iniciar sesión</Button>
                </Link>
            </Card>
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
                    {["overview","favorites","notes","purchases","settings"].map(tab => (
                        <TabButton key={tab} active={active===tab} onClick={()=>setActive(tab)}>
                            {tab === "overview" ? "Resumen" :
                                tab === "favorites" ? "Favoritos" :
                                    tab === "notes" ? "Mis subidas" :
                                        tab === "purchases" ? "Compras" : "Ajustes"}
                        </TabButton>
                    ))}
                </div>
            </div>

            {err && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</div>}

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
                <Card>
                    <h2>Favoritos</h2>
                    <p>Cursos <Chip tone="blue">{favCourses.length}</Chip></p>
                    {/* cursos favoritos → igual que antes, pero dentro de Cards */}
                </Card>
            )}

            {active === "notes" && (
                <Card>
                    <h2>Mis subidas</h2>
                    {/* notas y cursos publicados → mismo código, pero dentro de Cards */}
                </Card>
            )}

            {active === "purchases" && (
                <Card>
                    <h2>Compras</h2>
                    {/* listado de compras → igual que antes, dentro de Card */}
                </Card>
            )}

            {active === "settings" && (
                <Card style={{ maxWidth: 520 }}>
                    <h2>Ajustes</h2>
                    <label>Nombre</label>
                    <input value={nameDraft} onChange={e=>setNameDraft(e.target.value)} placeholder="Tu nombre" />
                    <Button onClick={saveSettings} variant="primary">Guardar cambios</Button>
                </Card>
            )}
        </div>
    )
}

function StatRow({ label, value, to }) {
    return (
        <Link to={to} style={{ textDecoration: "none" }}>
            <Card style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{label}</strong>
                <span>{value}</span>
            </Card>
        </Link>
    )
}
