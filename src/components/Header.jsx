
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal_SignIn from "../components/AuthModal_SignIn.jsx";
import AuthModal_HacerResenia from "../components/AuthModal_HacerReseña.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [reseniaOpen, setReseniaOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const handleReseniaClick = () => {
        if (!user) {
            // Si no está logueado, mostrar modal de login
            setAuthOpen(true);
        } else {
            // Si está logueado, mostrar modal de reseña
            setReseniaOpen(true);
        }
    };

    const handleReseniaSubmit = (reseniaData) => {
        console.log("Nueva reseña desde header:", reseniaData);
        // Aquí puedes implementar la lógica para guardar la reseña
        // Por ejemplo, enviarla a tu API
    };

    const pill = {
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "10px 18px", borderRadius: 9999, background: "#2563eb",
        color: "#fff", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap"
    };

    return (
        <>
            <header style={{
                width: "100%", position: "fixed", top: 0, left: 0, zIndex: 1000,
                background: "#ffffff", borderBottom: "1px solid var(--border)"
            }}>
                <div className="header-container" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, height:64 }}>
                    {/* Izquierda: hamburguesa + logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <button
                            onClick={() => setMenuOpen(true)} aria-label="Abrir menú"
                            style={{ fontSize: 26, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
                        >☰</button>

                        <button
                            onClick={() => navigate("/")}
                            style={{ background: "transparent", border: "none", cursor: "pointer",
                                fontWeight: 800, fontSize: 20, color: "var(--accent)" }}
                            aria-label="Ir al inicio"
                        >
                            LOGO
                        </button>
                    </div>

                    {/* Centro: 3 "píldoras" azules */}
                    <nav style={{
                        display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 auto", justifyContent: "center"
                    }}>
                        <Link to="/upload" style={{ ...pill, background: "var(--accent)" }}>Subir Apuntes</Link>
                        <Link to="/about" style={{ ...pill, background: "var(--accent)" }}>¡Quiero ser mentor!</Link>
                        <button
                            onClick={handleReseniaClick}
                            style={{ ...pill, background: "var(--accent)", border: "none", cursor: "pointer" }}
                        >
                            ¡Hacé tu reseña!
                        </button>
                    </nav>

                    {/* Derecha: Sign in (modal) o usuario */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {!user ? (
                            <button
                                onClick={() => setAuthOpen(true)}
                                className="btn-primary"
                                style={{ padding: "10px 20px", fontSize: 16 }}
                            >
                                Sign in
                            </button>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </span>
                                <div title={user.name}
                                     style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "#fff",
                                         display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                                    {user.name[0].toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* separador para que el contenido no quede tapado */}
            <div style={{ height: 64 }} />

            <Sidebar
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                user={user}
                onLogout={() => setUser(null)}
            />
            <AuthModal_SignIn
                open={authOpen}
                onClose={() => setAuthOpen(false)}
                onSignedIn={(username) => setUser({ name: username })}
            />
            <AuthModal_HacerResenia
                open={reseniaOpen}
                onClose={() => setReseniaOpen(false)}
                onSave={handleReseniaSubmit}
            />
        </>
    );
}
