import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthModal_SignIn from "../components/AuthModal_SignIn.jsx";
import AuthModal_HacerReseña from "../components/AuthModal_HacerReseña.jsx";
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

    const openAuthModal = () => setAuthOpen(true);
    const closeAuthModal = () => setAuthOpen(false);

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

    useEffect(() => {
        const computeDisplayName = () => {
            const n = (userProfile?.nombre || "").trim();
            if (n) return n;
            const u = (userProfile?.username || "").trim();
            if (u) return u;
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

        if (data.username && data.username !== usernameCache) {
            localStorage.setItem("kerana_username_cache", data.username);
            setUsernameCache(data.username);
        }
        if (data.nombre && data.nombre !== nameCache) {
            localStorage.setItem("kerana_name_cache", data.nombre);
            setNameCache(data.nombre);
        }
    };

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
            setUser(null);
            setUserProfile(null);
            setDisplayName('');
            setMenuOpen(false);
            navigate('/');
        }
    };

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
        height: 40,
        padding: "0 20px",
        borderRadius: 9999,
        background: TOKENS.signBg,
        color: TOKENS.signText,
        border: `1px solid ${TOKENS.signBorder}`,
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: "translateY(0px)",
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
        const isHttp = /^https?:\/\//.test(url);
        const isSupabasePublic = isHttp && url.includes("/storage/v1/object/public/");
        return isSupabasePublic ? url : "";
    }

    // ✅ BOTÓN UNIFICADO (40x40px)
    const iconButtonStyle = {
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: TOKENS.headerText,
        cursor: "pointer",
        padding: 0,
        outline: "none",
        transition: "all 0.2s ease",
    };

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
                        gap: 16,
                        height: 64,
                        padding: "0 20px",
                        maxWidth: 1400,
                        margin: "0 auto",
                    }}
                >
                    {/* Izquierda: menú + logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
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
                                letterSpacing: "0.5px",
                            }}
                            aria-label="Ir al inicio"
                        >
                            KERANA
                        </button>
                    </div>

                    {/* Centro: acciones */}
                    <nav style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}>
                        <PillLink to="/upload">Subir Apuntes</PillLink>
                        <PillButton onClick={() => navigate("/mentores/postular")}>
                            ¡Quiero ser Mentor!
                        </PillButton>
                        <PillButton onClick={handleReseniaClick}>
                            ¡Hacé tu reseña!
                        </PillButton>
                    </nav>

                    {/* Derecha - REDISEÑADO */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {!user ? (
                            <HeaderAuthButtons />
                        ) : (
                            <>
                                {/* Favoritos */}
                                <button
                                    onClick={() => navigate("/favorites")}
                                    aria-label="Favoritos"
                                    style={iconButtonStyle}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                                        e.currentTarget.style.transform = "scale(1.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                                        e.currentTarget.style.transform = "scale(1)";
                                    }}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                    </svg>
                                </button>

                                {/* Notificaciones */}
                                <NotificationBadge />

                                {/* Avatar */}
                                <div style={{ position: "relative" }}>
                                    <button
                                        ref={avatarBtnRef}
                                        onClick={() => setAvatarMenuOpen((o) => !o)}
                                        style={{
                                            ...iconButtonStyle,
                                            padding: 0,
                                            overflow: "hidden",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "scale(1.05)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "scale(1)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                                        }}
                                        aria-haspopup="menu"
                                        aria-expanded={avatarMenuOpen ? "true" : "false"}
                                        aria-label="Abrir menú de usuario"
                                    >
                                        {(() => {
                                            const avatarSrc = getAppAvatarSrc(userProfile?.foto);
                                            return avatarSrc && avatarOk ? (
                                                <img
                                                    src={avatarSrc}
                                                    alt={displayName}
                                                    onError={() => setAvatarOk(false)}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                                                        color: "#fff",
                                                        display: "grid",
                                                        placeItems: "center",
                                                        fontWeight: 800,
                                                        fontSize: 16,
                                                    }}
                                                >
                                                    {(displayName?.[0] || "U").toUpperCase()}
                                                </div>
                                            );
                                        })()}
                                    </button>

                                    {/* Dropdown menu */}
                                    {avatarMenuOpen && (
                                        <div
                                            ref={avatarMenuRef}
                                            role="menu"
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 10px)",
                                                width: 280,
                                                background: "#ffffff",
                                                color: "#0b1e3a",
                                                border: "1px solid #e6eaf2",
                                                borderRadius: 12,
                                                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                                                padding: 10,
                                                zIndex: 1100,
                                                animation: "menuIn 150ms ease forwards",
                                            }}
                                        >
                                            {/* Triangulito */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: 14,
                                                    top: -6,
                                                    width: 12,
                                                    height: 12,
                                                    background: "#fff",
                                                    borderLeft: "1px solid #e6eaf2",
                                                    borderTop: "1px solid #e6eaf2",
                                                    transform: "rotate(45deg)",
                                                }}
                                            />

                                            {/* Header con info del usuario */}
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                padding: "10px 8px",
                                                marginBottom: 8,
                                            }}>
                                                {(() => {
                                                    const avatarSrc = getAppAvatarSrc(userProfile?.foto);
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
                                                                border: "2px solid #e5e7eb",
                                                            }}
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
                                                            }}
                                                        >
                                                            {(displayName?.[0] || "U").toUpperCase()}
                                                        </div>
                                                    );
                                                })()}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontWeight: 700,
                                                        fontSize: 14,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}>
                                                        {displayName}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 12,
                                                        color: "#64748b",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}>
                                                        {userProfile?.username ? `@${userProfile.username}` : user?.email}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={dividerStyle} />

                                            {/* Menu items */}
                                            <button
                                                type="button"
                                                onClick={() => go("/profile")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f4f6fb"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <span style={menuItemTextLeft}>Mi perfil</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => go("/favorites")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f4f6fb"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <span style={menuItemTextLeft}>Favoritos</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => go("/purchased")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f4f6fb"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <span style={menuItemTextLeft}>Descargas</span>
                                            </button>

                                            <div style={dividerStyle} />

                                            <button
                                                type="button"
                                                onClick={() => go("/credits")}
                                                style={menuItemStyle}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f4f6fb"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                                                    height: 38,
                                                    borderRadius: 8,
                                                    cursor: "pointer",
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    color: "#b91c1c",
                                                    background: "rgba(239,68,68,.06)",
                                                    border: "1px solid rgba(185,28,28,.2)",
                                                    transition: "all .15s ease",
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,.12)"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,.06)"}
                                            >
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
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
            <AuthModal_HacerReseña
                open={reseniaOpen}
                onClose={() => setReseniaOpen(false)}
                onSave={() => {}}
            />

            {/* Animación para dropdown */}
            <style>{`
                @keyframes menuIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
}