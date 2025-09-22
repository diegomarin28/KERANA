import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import Sidebar from "./Sidebar";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [user, setUser] = useState(null); // { name, avatarUrl?, followers?, uploads?, upvotes? }
    const navigate = useNavigate();

    const pill = {
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "10px 18px", borderRadius: 9999, background: "#2f6cab",
        color: "#fff", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap"
    };

    return (
        <>
            <header
                style={{
                    width: "100%", background: "#f3f9d7", padding: "10px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                    boxShadow: "0 2px 4px rgba(0,0,0,.1)", position: "fixed", top: 0, left: 0, zIndex: 1000
                }}
            >
                {/* Izquierda: Hamburguesa + Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button
                        onClick={() => setMenuOpen(true)} aria-label="Abrir menú"
                        style={{ fontSize: 26, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
                    >☰</button>

                    <button
                        onClick={() => navigate("/")}
                        style={{ background: "transparent", border: "none", cursor: "pointer",
                            fontWeight: 800, fontSize: 22, letterSpacing: ".3px" }}
                        aria-label="Ir al inicio"
                    >LOGO</button>
                </div>

                {/* Centro: 3 “burbujas” */}
                <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link to="/upload" style={{ ...pill }}>Subir Apuntes</Link>
                    <Link to="/about"  style={{ ...pill }}>¡Quiero ser mentor!</Link>
                    <Link to="/review" style={{ ...pill }}>¡Hacé tu reseña!</Link>
                </nav>

                {/* Derecha: Sign in (modal) o usuario */}
                <div>
                    {!user ? (
                        <button
                            onClick={() => setAuthOpen(true)}
                            style={{ ...pill, padding: "12px 22px", fontSize: 16, background: "#2563eb",
                                boxShadow: "0 6px 16px rgba(37,99,235,.35)" }}
                        >
                            Sign in
                        </button>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 600 }}>{user.name}</span>
                            <div title={user.name}
                                 style={{ width: 38, height: 38, borderRadius: "50%",
                                     background: "#2f6cab", color: "#fff", display: "flex",
                                     alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                                {user.name[0].toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div style={{ height: 68 }} />

            {/* Sidebar mejorado */}
            <Sidebar
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                user={user}
                onLogout={() => setUser(null)}
            />

            {/* Modal de auth (usa tu AuthModal actual) */}
            <AuthModal
                open={authOpen}
                onClose={() => setAuthOpen(false)}
                onSignedIn={(username) => setUser({ name: username, followers: 0, uploads: 0, upvotes: 0 })}
            />
        </>
    );
}
