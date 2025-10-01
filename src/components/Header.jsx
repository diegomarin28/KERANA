// Header.jsx (versión robusta)
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal_SignIn from "../components/AuthModal_SignIn.jsx";
import AuthModal_HacerResenia from "../components/AuthModal_HacerReseña.jsx";
import Sidebar from "../components/Sidebar.jsx";
import HamburgerButton from "../components/HamburgerButton.jsx";
import { supabase } from "../supabase";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [reseniaOpen, setReseniaOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [inHero, setInHero] = useState(true);
    const navigate = useNavigate();
    const headerRef = useRef(null);

    // ---- AUTH SEGURA (no rompe la app si falla) ----
    useEffect(() => {
        let mounted = true;

        const safe = (fn) => (...args) => {
            try { return fn?.(...args); } catch { /* no-op */ }
        };

        const initializeAuth = safe(async () => {
            if (!supabase?.auth?.getSession) return; // guard si el cliente no está
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.warn("[auth] getSession error:", error);
                return;
            }
            if (mounted && session?.user) {
                setUser(session.user);
                fetchUserProfile(session.user.id); // no esperes, no bloquees
            }
        });

        initializeAuth();

        if (!supabase?.auth?.onAuthStateChange) return;

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            if (session?.user) {
                setUser(session.user);
                fetchUserProfile(session.user.id);
                setAuthOpen(false);
            } else {
                setUser(null);
                setUserProfile(null);
                setMenuOpen(false);
            }
        });

        return () => {
            mounted = false;
            try { sub?.subscription?.unsubscribe?.(); } catch {}
        };
    }, []);


    useEffect(() => {

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('supabase') || key.includes('auth')) {
            }
        }
    }, [user]);

    const fetchUserProfile = async (userId) => {
        try {
            if (!supabase?.auth?.getUser) return;
            const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
            if (authErr || !authUser) return;

            const { data, error } = await supabase
                .from("usuario")
                .select("*")
                .eq("correo", authUser.email)
                .maybeSingle();

            if (error) {
                // PGRST116 = no rows; igual intentamos crear
                if (error.code === "PGRST116" || error.message?.includes("No rows")) {
                    await createUserProfile(userId);
                } else {
                    console.warn("[perfil] select error:", error);
                }
                return;
            }

            if (data) setUserProfile(data);
        } catch (e) {
            console.warn("[perfil] fetchUserProfile error:", e);
        }
    };

    const createUserProfile = async (userId) => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const username = (authUser.user_metadata?.name || authUser.email?.split("@")?.[0] || "usuario").slice(0, 32);
            const { error } = await supabase
                .from("usuario")
                .insert([{
                    correo: authUser.email,
                    nombre: authUser.user_metadata?.name || username,
                    username,
                    fecha_creado: new Date().toISOString(),
                    creditos: 0,
                }]);

            if (error) {
                console.warn("[perfil] insert error:", error);
                return;
            }
            // recarga el perfil en memoria, sin bloquear UI
            fetchUserProfile(userId);
        } catch (e) {
            console.warn("[perfil] createUserProfile error:", e);
        }
    };

    // ---- Trigger de color del header (usa #after-hero con offset) ----
    useEffect(() => {
        const update = () => {
            const headerH = headerRef.current?.offsetHeight ?? 64;
            const sentinel = document.getElementById("after-hero");
            const top = sentinel ? sentinel.getBoundingClientRect().top : Infinity;
            const offset = 0; // ajustá para cambiar “antes”
            setInHero(top > headerH + offset);
        };
        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        window.addEventListener("load", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            window.removeEventListener("load", update);
        };
    }, []);

    const handleReseniaClick = () => {
        if (!user) setAuthOpen(true);
        else setReseniaOpen(true);
    };

    function handleSignedIn(u) {
        setAuthOpen(false);
        if (u) {
            setUser(u);
            fetchUserProfile(u.id);
        }
    }

    const handleLogout = async () => {
        try {
            // 1. Limpiar TODO el localStorage relacionado con auth
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.includes('supabase') ||
                    key.includes('auth') ||
                    key.includes('sb-') ||
                    key.includes('user')
                )) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('🗑️ Removed:', key);
            });

            // 2. Sign out de Supabase
            await supabase.auth.signOut();

            // 3. Limpiar estado local
            setUser(null);
            setUserProfile(null);
            setMenuOpen(false);
            setAuthOpen(false);
            setReseniaOpen(false);

            // 4. Redirigir y forzar recarga limpia
            window.location.href = "/";

        } catch (error) {
            console.warn("[auth] signOut error:", error);
            // Fallback: recarga forzada
            window.location.href = "/";
        }
    };

    const displayName =
        userProfile?.nombre ||
        userProfile?.username ||
        user?.email?.split("@")?.[0] ||
        "Usuario";

    // Colores
    const TOKENS = inHero
        ? {
            headerBg: "#13346b",
            headerText: "#ffffff",
            border: "transparent",
            pillBg: "#ffffff",
            pillText: "#2563eb",
            pillBorder: "#e5e7eb",
            signBg: "#ffffff",
            signText: "#2563eb",
            signBorder: "#e5e7eb",
        }
        : {
            headerBg: "#1b2e3a",
            headerText: "#ffffff",
            border: "transparent",
            pillBg: "#ffffff",
            pillText: "#1e40af",
            pillBorder: "#1e40af",
            signBg: "#ffffff",
            signText: "#1e40af",
            signBorder: "#1e40af",
        };

    const pillReset = { all: "unset", display: "inline-block", cursor: "pointer" };
    const pillBox = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 18px",
        borderRadius: 9999,
        background: TOKENS.pillBg,
        border: `1px solid ${TOKENS.pillBorder}`,
        color: TOKENS.pillText,
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap",
        minWidth: 125,
        height: 23,
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        lineHeight: 1,
        transition: "all 0.3s ease",
        transform: "translateY(0px)",
    };

    const handleMouseEnter = (e) => {
        if (inHero) {
            e.target.style.background = "#2563eb";
            e.target.style.color = "#ffffff";
            e.target.style.borderColor = "#1e40af";
        } else {
            e.target.style.background = "#ffffff";
            e.target.style.color = "#2563eb";
            e.target.style.borderColor = "#e5e7eb";
        }
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.2)";
    };
    const handleMouseLeave = (e) => {
        e.target.style.background = TOKENS.pillBg;
        e.target.style.color = TOKENS.pillText;
        e.target.style.borderColor = TOKENS.pillBorder;
        e.target.style.transform = "translateY(0px)";
        e.target.style.boxShadow = "none";
    };

    function PillLink({ to, children }) {
        return (
            <Link to={to} style={pillReset}>
        <span style={pillBox} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {children}
        </span>
            </Link>
        );
    }
    function PillButton({ onClick, children }) {
        return (
            <button type="button" onClick={onClick} style={pillReset}>
        <span style={pillBox} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {children}
        </span>
            </button>
        );
    }

    const signBtn = {
        height: 40, padding: "0 16px", borderRadius: 9999,
        background: TOKENS.signBg, color: TOKENS.signText, border: `1px solid ${TOKENS.signBorder}`,
        fontWeight: 700, cursor: "pointer", transition: "all 0.3s ease", transform: "translateY(0px)",
    };
    const handleSignInMouseEnter = (e) => {
        if (inHero) {
            e.target.style.background = "#2563eb"; e.target.style.color = "#ffffff"; e.target.style.borderColor = "#1e40af";
        } else {
            e.target.style.background = "#ffffff"; e.target.style.color = "#2563eb"; e.target.style.borderColor = "#e5e7eb";
        }
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.2)";
    };
    const handleSignInMouseLeave = (e) => {
        e.target.style.background = TOKENS.signBg; e.target.style.color = TOKENS.signText; e.target.style.borderColor = TOKENS.signBorder;
        e.target.style.transform = "translateY(0px)"; e.target.style.boxShadow = "none";
    };

    return (
        <>
            <header
                ref={headerRef}
                style={{
                    width: "100%", position: "fixed", top: 0, left: 0, zIndex: 1000,
                    background: TOKENS.headerBg, color: TOKENS.headerText,
                    borderBottom: `1px solid ${TOKENS.border}`,
                    transition: "background .25s ease, color .25s ease, border-color .25s ease",
                }}
            >
                <div className="header-container" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, height: 64,
                }}>
                    {/* Izquierda: menú + logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <HamburgerButton open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
                        <button
                            onClick={() => navigate("/")}
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 20, color: TOKENS.headerText }}
                            aria-label="Ir al inicio"
                        >
                            KERANA
                        </button>
                    </div>

                    {/* Centro: acciones */}
                    <nav style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                        <PillLink to="/upload">Subir Apuntes</PillLink>
                        <PillLink to="/about">¡Quiero ser mentor!</PillLink>
                        <PillButton onClick={handleReseniaClick}>¡Hacé tu reseña!</PillButton>
                    </nav>

                    {/* Derecha */}
                    <div>
                        {!user ? (
                            <button
                                onClick={() => setAuthOpen(true)}
                                style={signBtn}
                                onMouseEnter={handleSignInMouseEnter}
                                onMouseLeave={handleSignInMouseLeave}
                            >
                                Iniciar sesión
                            </button>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontWeight: 700 }}>{displayName}</span>
                                <div style={{
                                    width: 36, height: 36, borderRadius: "50%",
                                    background: "#fff", color: "#0b1e3a",
                                    display: "grid", placeItems: "center", fontWeight: 800,
                                }}>
                                    {(displayName?.[0] || "U").toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Spacer */}
            <div style={{ height: 64 }} />

            {/* Sidebar + Modales */}
            <Sidebar
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                user={{
                    name: displayName,
                    email: user?.email ?? null,
                    credits: userProfile?.creditos || 0,
                    followers: 0,
                    following: 0,
                }}
                onLogout={handleLogout}
                onGo={(path) => navigate(path)}
            />
            <AuthModal_SignIn open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={handleSignedIn} />
            <AuthModal_HacerResenia open={reseniaOpen} onClose={() => setReseniaOpen(false)} onSave={() => {}} />
        </>
    );
}
