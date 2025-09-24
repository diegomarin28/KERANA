import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import AuthModal_SignIn from "./AuthModal_SignIn.jsx";
import AuthModal_HacerReseA from "components/AuthModal_HacerReseña.jsx"; // respeta tu nombre de archivo

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [user, setUser] = useState(null); // { name }

    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const pill = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 28px",
        borderRadius: 9999,
        background: "var(--accent, #2563eb)",
        color: "#fff",
        fontWeight: 600,
        fontSize: "16px",
        textDecoration: "none",
        whiteSpace: "nowrap",
        minWidth: "180px",        // ← iguales de ancho
        textAlign: "center",
        boxShadow: "0 6px 16px rgba(37,99,235,.18)"
    };

    const handleReviewClick = () => {
        if (!user) setAuthOpen(true);
        else setReviewOpen(true);
    };

    const handleReviewSave = (data) => {
        console.log("Nueva reseña:", data);
        // TODO: enviar a tu API / supabase
    };

    return (
        <>
            <header
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1000,
                    background: "#fff",
                    borderBottom: scrolled ? "1px solid #e9eef7" : "1px solid transparent",
                    boxShadow: scrolled ? "0 6px 18px rgba(17,24,39,.06)" : "none",
                    backdropFilter: scrolled ? "saturate(120%) blur(4px)" : "none",
                }}
            >
                <div
                    className="header-container"
                    style={{
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "0 16px",
                        maxWidth: 1200,
                        margin: "0 auto"
                    }}
                >
                    {/* Izquierda: hamburguesa + logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <button
                            onClick={() => setMenuOpen(true)}
                            aria-label="Abrir menú"
                            style={{ fontSize: 26, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
                        >
                            ☰
                        </button>

                        <button
                            onClick={() => navigate("/")}
                            aria-label="Ir al inicio"
                            style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 800,
                                fontSize: 20,
                                color: "var(--accent, #2563eb)",
                                letterSpacing: ".2px"
                            }}
                        >
                            KERANA
                        </button>
                    </div>

                    {/* Centro: píldoras */}
                    <nav
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                            flex: "1 1 auto",
                            justifyContent: "center"
                        }}
                    >
                        <Link to="/upload" style={pill}>Subir Apuntes</Link>
                        <Link to="/about" style={pill}>¡Quiero ser mentor!</Link>
                        <button onClick={handleReviewClick} style={{ ...pill, border: "none", cursor: "pointer" }}>
                            ¡Hacé tu reseña!
                        </button>
                    </nav>

                    {/* Derecha: auth */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {!user ? (
                            <button
                                onClick={() => setAuthOpen(true)}
                                style={{
                                    ...pill,
                                    minWidth: "auto",
                                    padding: "10px 20px",
                                    fontSize: 16
                                }}
                            >
                                Sign in
                            </button>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 160 }}>
                <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </span>
                                <div
                                    title={user.name}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: "var(--accent, #2563eb)",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800
                                    }}
                                >
                                    {user.name[0].toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* separador para contenidos (si alguna página tiene margen 0) */}
            <div style={{ height: 16 }} />

            {/* Sidebar + Modales */}
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

            <AuthModal_HacerReseA
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                onSave={handleReviewSave}
            />
        </>
    );
}
