import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthModal_SignIn from "../components/AuthModal_SignIn.jsx";
import AuthModal_HacerResenia from "../components/AuthModal_HacerReseña.jsx";
import Sidebar from "../components/Sidebar.jsx";
import HamburgerButton from "../components/HamburgerButton.jsx";
import { supabase } from "../supabase";
import { fetchUserProfile, cleanLogout } from "../utils/authHelpers";
import NotificationBadge from "../components/NotificationBadge";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [reseniaOpen, setReseniaOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [inHero, setInHero] = useState(true);
    const navigate = useNavigate();
    const headerRef = useRef(null);
    const location = useLocation();
    const [usernameCache, setUsernameCache] = useState(() => localStorage.getItem('kerana_username_cache') || '');
    const [nameCache, setNameCache] = useState(() => localStorage.getItem('kerana_name_cache') || '');
    const [displayName, setDisplayName] = useState('');
    const [avatarOk, setAvatarOk] = useState(true);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const avatarBtnRef = useRef(null);
    const avatarMenuRef = useRef(null);


    // Función unificada para abrir login
    const openAuthModal = () => {
        setAuthOpen(true);
    };

    // Función unificada para cerrar login
    const closeAuthModal = () => {
        setAuthOpen(false);
    };

    useEffect(() => {
        if (user?.id) loadUserProfile();
    }, [location.pathname]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'kerana_profile_updated' && user?.id) {
                loadUserProfile();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [user?.id]);

    useEffect(() => {
        setAvatarOk(true);
    }, [userProfile?.foto]);


    // Calcular displayName cuando cambien los datos
    useEffect(() => {
        const computeDisplayName = () => {
            // Prioridad: DB.nombre > DB.username > email local-part > cache
            const n = (userProfile?.nombre || "").trim();
            if (n) return n;

            const u = (userProfile?.username || "").trim();
            if (u) return u;

            // Si no hay userProfile aún, usar cache
            if (!userProfile && nameCache) return nameCache;
            if (!userProfile && usernameCache) return usernameCache;

            return user?.email ? user.email.split("@")[0] : "";
        };

        setDisplayName(computeDisplayName());
    }, [userProfile, user, nameCache, usernameCache]);

    useEffect(() => {
        if (!avatarMenuOpen) return;
        const onKey = (e) => e.key === "Escape" && setAvatarMenuOpen(false);
        const onClick = (e) => {
            const m = avatarMenuRef.current, b = avatarBtnRef.current;
            if (m && !m.contains(e.target) && b && !b.contains(e.target)) setAvatarMenuOpen(false);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [avatarMenuOpen]);

    const go = (path) => {
        navigate(path);
        setAvatarMenuOpen(false);
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn("[auth] getSession error:", error);
                    return;
                }

                if (mounted && session?.user) {
                    setUser(session.user);
                    await loadUserProfile();
                }
            } catch (err) {
                console.warn("[auth] initializeAuth error:", err);
            }
        };

        initializeAuth();

        // Listener de cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            if (session?.user) {
                setUser(session.user);
                await loadUserProfile();
                closeAuthModal();
                setMenuOpen(false);
            } else {
                setUser(null);
                setUserProfile(null);
                setDisplayName('');
                setMenuOpen(false);
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    // Cargar perfil desde la DB (única fuente de verdad)
    const loadUserProfile = async () => {
        if (!user) {
            setUserProfile(null);
            setDisplayName('');
            return;
        }

        const { data, error } = await fetchUserProfile();
        if (error) {
            console.warn("[Header] Error cargando perfil:", error);
            return;
        }
        if (!data) return;

        setUserProfile(data);

        // Actualizar caches (solo si hay valores nuevos)
        if (data.username && data.username !== usernameCache) {
            localStorage.setItem("kerana_username_cache", data.username);
            setUsernameCache(data.username);
        }
        if (data.nombre && data.nombre !== nameCache) {
            localStorage.setItem("kerana_name_cache", data.nombre);
            setNameCache(data.nombre);
        }

        // El displayName se actualizará automáticamente por el useEffect
    };

    // Detectar si estamos en el hero
    useEffect(() => {
        const update = () => {
            const headerH = headerRef.current?.offsetHeight ?? 64;
            const sentinel = document.getElementById("after-hero");
            const top = sentinel ? sentinel.getBoundingClientRect().top : Infinity;
            setInHero(top > headerH);
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
        if (!user) {
            openAuthModal();
        } else {
            setReseniaOpen(true);
        }
    };

    const handleSignedIn = (u) => {
        closeAuthModal();
        setMenuOpen(false);
        if (u) {
            setUser(u);
            loadUserProfile();
        }
    };

    // Logout con limpieza completa
    const handleLogout = async () => {
        const { success } = await cleanLogout();

        if (success) {
            setUser(null);
            setUserProfile(null);
            setDisplayName('');
            setMenuOpen(false);
            closeAuthModal();
            setReseniaOpen(false);
            navigate('/');
        } else {
            // Fallback: limpiar estado de todas formas
            setUser(null);
            setUserProfile(null);
            setDisplayName('');
            setMenuOpen(false);
            navigate('/');
        }
    };

    // Colores del header
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

    function HeaderAuthButtons() {
        return (
            <button
                type="button"
                onClick={openAuthModal}
                style={signBtn}
                onMouseEnter={handleSignInMouseEnter}
                onMouseLeave={handleSignInMouseLeave}
            >
                Iniciar sesión
            </button>
        );
    }

    const signBtn = {
        height: 40, padding: "0 16px", borderRadius: 9999,
        background: TOKENS.signBg, color: TOKENS.signText, border: `1px solid ${TOKENS.signBorder}`,
        fontWeight: 700, cursor: "pointer", transition: "all 0.3s ease", transform: "translateY(0px)",
    };

    const menuItemStyle = {
        all: "unset",
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        height: 44,
        padding: "0 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 600,
        color: "#0b1e3a",
        transition: "background .15s ease, transform .06s ease",
        willChange: "background, transform",
    };
    const menuItemTextLeft = {
        flex: 1,
        textAlign: "left",
        letterSpacing: ".1px",
    };
    const dividerStyle = {
        height: 1,
        background: "#eef2f7",
        margin: "8px 6px",
        borderRadius: 1,
    };



    const handleSignInMouseEnter = (e) => {
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

    const handleSignInMouseLeave = (e) => {
        e.target.style.background = TOKENS.signBg;
        e.target.style.color = TOKENS.signText;
        e.target.style.borderColor = TOKENS.signBorder;
        e.target.style.transform = "translateY(0px)";
        e.target.style.boxShadow = "none";
    };

    function getAppAvatarSrc(raw) {
        const url = (raw || "").trim();
        // aceptar solo URLs de tu storage público de Supabase
        const isHttp = /^https?:\/\//.test(url);
        const isSupabasePublic = isHttp && url.includes("/storage/v1/object/public/");
        return isSupabasePublic ? url : ""; // si no es válido, forzá placeholder
    }


    return (
        <>
            <header
                ref={headerRef}
                style={{
                    width: "100%",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 1000,
                    background: TOKENS.headerBg,
                    color: TOKENS.headerText,
                    borderBottom: `1px solid ${TOKENS.border}`,
                    transition: "background .25s ease, color .25s ease, border-color .25s ease",
                }}
            >
                <div
                    className="header-container"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        height: 64,
                    }}
                >
                    {/* Izquierda: menú + logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <HamburgerButton open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
                        <button
                            onClick={() => navigate("/")}
                            style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 800,
                                fontSize: 20,
                                color: TOKENS.headerText,
                            }}
                            aria-label="Ir al inicio"
                        >
                            KERANA
                        </button>
                    </div>

                    {/* Centro: acciones */}
                    <nav style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                        <PillLink to="/upload">Subir Apuntes</PillLink>
                        <PillButton onClick={() => navigate("/mentores/postular")}>¡Quiero ser Mentor!</PillButton>
                        <PillButton onClick={handleReseniaClick}>¡Hacé tu reseña!</PillButton>
                    </nav>

                    {/* Derecha */}
                    {/* Derecha */}
                    <div>
                        {!user ? (
                            <HeaderAuthButtons />
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", columnGap: 20 }}>


                                {user && (
                                    <button
                                        onClick={() => navigate("/favorites")}
                                        aria-label="Favoritos"
                                        style={{
                                            width: 36,
                                            height: 36,
                                            display: "grid",
                                            placeItems: "center",
                                            borderRadius: "50%",
                                            background: "transparent",
                                            border: "1px solid rgba(255,255,255,0.25)",
                                            color: TOKENS.headerText,
                                            cursor: "pointer",
                                            padding: 0,
                                            outline: "none",
                                            transition: "background .2s ease, border-color .2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                                        }}
                                    >
                                        <svg
                                            width="22"
                                            height="22"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M6 4.5a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 18 4.5V21l-6-3-6 3V4.5z" />
                                        </svg>
                                    </button>
                                )}



                                {/* 🔔 BADGE DE NOTIFICACIONES */}
                                <NotificationBadge />


                                {/* Avatar clickeable */}
                                <div style={{ position: "relative" }}>
                                    <button
                                        ref={avatarBtnRef}
                                        onClick={() => setAvatarMenuOpen((o) => !o)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            borderRadius: "50%",
                                            transition: "transform 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                                        aria-haspopup="menu"
                                        aria-expanded={avatarMenuOpen ? "true" : "false"}
                                        aria-label="Abrir menú de usuario"
                                    >
                                        {(() => {
                                            const avatarSrc = (typeof getAppAvatarSrc === "function")
                                                ? getAppAvatarSrc(userProfile?.foto)
                                                : (userProfile?.foto || "").trim(); // fallback si no tenés helper
                                            return avatarSrc && avatarOk ? (
                                                <img
                                                    src={avatarSrc}
                                                    alt={displayName}
                                                    onError={() => setAvatarOk(false)}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        border: "2px solid #fff",
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                                    }}
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: "50%",
                                                        background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                                                        color: "#fff",
                                                        display: "grid",
                                                        placeItems: "center",
                                                        fontWeight: 800,
                                                        fontSize: 16,
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                                    }}
                                                >
                                                    {(displayName?.[0] || "U").toUpperCase()}
                                                </div>
                                            );
                                        })()}
                                    </button>

                                    {avatarMenuOpen && (
                                        <div
                                            ref={avatarMenuRef}
                                            role="menu"
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 10px)",
                                                width: 300,
                                                background: "#ffffff",
                                                color: "#0b1e3a",
                                                border: "1px solid #e6eaf2",
                                                borderRadius: 14,
                                                boxShadow:
                                                    "0 24px 60px rgba(2, 6, 23, .18), 0 4px 10px rgba(2, 6, 23, .08)",
                                                padding: 12,
                                                zIndex: 1100,
                                                transformOrigin: "top right",
                                                transform: "scale(0.98)",
                                                opacity: 0.98,
                                                animation: "menuIn 120ms ease forwards",
                                                backdropFilter: "saturate(1.2) blur(2px)",
                                            }}
                                        >
                                            {/* triangulito */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: 16,
                                                    top: -6,
                                                    width: 12,
                                                    height: 12,
                                                    background: "#fff",
                                                    borderLeft: "1px solid #e6eaf2",
                                                    borderTop: "1px solid #e6eaf2",
                                                    transform: "rotate(45deg)",
                                                }}
                                            />

                                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px" }}>
                                                {(() => {
                                                    const avatarSrc = (typeof getAppAvatarSrc === "function")
                                                        ? getAppAvatarSrc(userProfile?.foto)
                                                        : (userProfile?.foto || "").trim();
                                                    return avatarSrc && avatarOk ? (
                                                        <img
                                                            src={avatarSrc}
                                                            alt={displayName}
                                                            onError={() => setAvatarOk(false)}
                                                            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: 44,
                                                                height: 44,
                                                                borderRadius: "50%",
                                                                background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                                                                color: "#fff",
                                                                display: "grid",
                                                                placeItems: "center",
                                                                fontWeight: 800,
                                                                fontSize: 18,
                                                            }}
                                                        >
                                                            {(displayName?.[0] || "U").toUpperCase()}
                                                        </div>
                                                    );
                                                })()}
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{displayName}</div>
                                                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                                                        {userProfile?.username ? `@${userProfile.username}` : ""}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ height: 1, background: "#e6eaf2", margin: "8px 0" }} />


                                            {/* Mi perfil */}
                                            <button
                                                type="button"
                                                onClick={() => go("/profile")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background = "#f4f6fb")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background = "transparent")
                                                }
                                                onMouseDown={(e) =>
                                                    (e.currentTarget.style.transform = "scale(0.995)")
                                                }
                                                onMouseUp={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1)")
                                                }
                                            >
                                                <span style={menuItemTextLeft}>Mi perfil</span>
                                            </button>


                                            {/* Favoritos */}
                                            <button
                                                type="button"
                                                onClick={() => go("/favorites")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background = "#f4f6fb")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background = "transparent")
                                                }
                                                onMouseDown={(e) =>
                                                    (e.currentTarget.style.transform = "scale(0.995)")
                                                }
                                                onMouseUp={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1)")
                                                }
                                            >
                                                <span style={menuItemTextLeft}>Favoritos</span>
                                            </button>

                                            {/* Compras */}
                                            <button
                                                type="button"
                                                onClick={() => go("/purchased")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f6fb")}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.995)")}
                                                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                            >
                                                <span style={menuItemTextLeft}>Descargas</span>
                                            </button>


                                            <div style={dividerStyle} />

                                            {/* Comprar créditos */}
                                            <button
                                                type="button"
                                                onClick={() => go("/credits")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f6fb")}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.995)")}
                                                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                            >
                                                <span style={menuItemTextLeft}>Mis créditos</span>
                                            </button>


                                            <div style={dividerStyle} />

                                            {/* Cerrar sesión */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleLogout?.();
                                                    setAvatarMenuOpen(false);
                                                }}
                                                style={{
                                                    all: "unset",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "100%",
                                                    height: 40,
                                                    borderRadius: 10,
                                                    cursor: "pointer",
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    letterSpacing: ".15px",
                                                    color: "#b91c1c",
                                                    background: "rgba(239,68,68,.06)",
                                                    border: "1px solid rgba(185,28,28,.25)",
                                                    transition:
                                                        "background .15s ease, border-color .15s ease, transform .06s ease",
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background = "rgba(239,68,68,.12)")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background = "rgba(239,68,68,.06)")
                                                }
                                                onMouseDown={(e) =>
                                                    (e.currentTarget.style.transform = "scale(0.995)")
                                                }
                                                onMouseUp={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1)")
                                                }
                                            >
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    )}

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
                isAuthenticated={!!user}
                user={
                    user
                        ? {
                            name: displayName,
                            email: user.email,
                            avatarUrl: userProfile?.foto,
                            credits: userProfile?.creditos || 0,
                            followers: 0,
                            following: 0,
                        }
                        : null
                }
                onLogout={handleLogout}
                onGo={(path) => navigate(path)}
                onOpenAuth={openAuthModal}
            />
            <AuthModal_SignIn open={authOpen} onClose={closeAuthModal} onSignedIn={handleSignedIn} />
            <AuthModal_HacerResenia
                open={reseniaOpen}
                onClose={() => setReseniaOpen(false)}
                onSave={() => {}}
            />
        </>
    );
    }
