// Sidebar.jsx
import { useEffect, useRef } from "react";

export default function Sidebar({
                                    open,
                                    onClose,
                                    user,
                                    onLogout,
                                    onGo,
                                }) {
    const panelRef = useRef(null);

    useEffect(() => {
        const prev = document.body.style.overflow;
        if (open) document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        const onClickOutside = (e) => {
            if (!panelRef.current) return;
            if (!panelRef.current.contains(e.target)) onClose?.();
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClickOutside);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, [open, onClose]);

    const username = user?.name || user?.username || "Invitado";
    const letter = (username[0] || "U").toUpperCase();
    const credits = user?.credits ?? 0;
    const followers = user?.followers ?? 0;
    const following = user?.following ?? 0;

    const go = (path) => {
        onGo?.(path);
        onClose?.();
    };

    return (
        <>
            <div
                aria-hidden
                style={{
                    position: "fixed",
                    inset: 0,
                    background: open ? "rgba(0,0,0,.35)" : "transparent",
                    backdropFilter: open ? "saturate(120%) blur(6px)" : "none",
                    transition: "background .25s ease, backdrop-filter .25s ease",
                    pointerEvents: open ? "auto" : "none",
                    zIndex: 999,
                }}
            />

            <aside
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menú principal"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    height: "100dvh",
                    width: "min(88vw, 360px)",
                    background: "#13346b",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
                    transform: open ? "translateX(0)" : "translateX(-110%)",
                    transition: "transform .28s ease",
                    zIndex: 1000,
                    display: "grid",
                    gridTemplateRows: "auto auto 1fr auto",
                }}
            >
                <div style={headerStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 800, letterSpacing: .5 }}>KERANA</div>
                        <span style={{ fontSize: 12, opacity: .75 }}>beta</span>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        style={closeButtonStyle}
                    >
                        ✕
                    </button>
                </div>

                {/* Sección de Perfil arriba del todo */}
                <div style={profileSectionStyle}>
                    <div
                        onClick={() => go("/profile")}
                        style={profileContainerStyle}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && go("/profile")}
                    >
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={username}
                                style={avatarImageStyle}
                            />
                        ) : (
                            <div style={avatarFallbackStyle}>
                                {letter}
                            </div>
                        )}

                        <div style={{ overflow: "hidden" }}>
                            <div style={usernameStyle}>
                                {username}
                            </div>
                            <div style={statsContainerStyle}>
                                <StatLink onClick={() => go("/profile/credits")} label="Créditos" value={credits} />
                                <StatLink onClick={() => go("/profile/followers")} label="Seguidores" value={followers} />
                                <StatLink onClick={() => go("/profile/following")} label="Seguidos" value={following} />
                            </div>
                        </div>
                    </div>
                </div>

                <nav style={navStyle}>
                    <Group title="Mis Recursos" />
                    <MenuLink icon="📚" label="Comprados" onClick={() => go("/purchased")} />
                    <MenuLink icon="⭐" label="Favoritos" onClick={() => go("/favorites")} />
                    <MenuLink icon="📝" label="Mis Apuntes" onClick={() => go("/my_papers")} />

                    <Group title="Explorar" />
                    <MenuLink icon="📖" label="Asignaturas" onClick={() => go("/subjects")} />
                    <MenuLink icon="👨‍🏫" label="Profesores" onClick={() => go("/professors")} />
                    <MenuLink icon="💡" label="Mentores" onClick={() => go("/mentors")} />
                    <MenuLink icon="📄" label="Apuntes" onClick={() => go("/notes")} />

                    <Group title="Cuenta" />
                    {user ? (
                        <>
                            <MenuLink icon="👤" label="Mi Perfil" onClick={() => go("/profile")} />
                            <MenuLink icon="⚙️" label="Ajustes" onClick={() => go("/settings")} />
                        </>
                    ) : (
                        <>
                            <PrimaryButton label="Iniciar sesión" onClick={() => go("/signin")} />
                            <SecondaryButton label="Crear cuenta" onClick={() => go("/signup")} />
                        </>
                    )}

                    <Group title="Ayuda" />
                    <MenuLink icon="📞" label="Contacto" onClick={() => go("/contact")} />
                    <MenuLink icon="❓" label="Centro de ayuda" onClick={() => go("/help")} />
                    <MenuLink icon="📄" label="Términos y condiciones" onClick={() => go("/terms")} />
                    <MenuLink icon="🔒" label="Política de privacidad" onClick={() => go("/privacy")} />

                    {/* Cerrar sesión al final - MÁS ANGOSTO Y SIN EMOJI */}
                    {user && (
                        <>
                            <div style={{ marginTop: 20 }} />
                            <SmallDangerButton label="Cerrar sesión" onClick={() => { onLogout?.(); onClose?.(); }} />
                        </>
                    )}
                </nav>

                <div style={footerStyle}>
                    <Badge>ES</Badge>
                    <span style={{ marginLeft: "auto", opacity: .6, fontSize: 12 }}>v0.1</span>
                </div>
            </aside>
        </>
    );
}

const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottom: "1px solid rgba(255,255,255,.12)"
};

const closeButtonStyle = {
    all: "unset",
    padding: "8px 10px",
    cursor: "pointer",
    borderRadius: 8,
    background: "rgba(255,255,255,.08)",
};

const profileSectionStyle = {
    padding: "16px",
    borderBottom: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.03)"
};

const profileContainerStyle = {
    all: "unset",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "48px 1fr",
    gap: 12,
    alignItems: "center",
    cursor: "pointer",
};

const avatarImageStyle = {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
    background: "#fff"
};

const avatarFallbackStyle = {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#fff",
    color: "#0b1e3a",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 18
};

const usernameStyle = {
    fontWeight: 800,
    fontSize: 16,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    marginBottom: 4
};

const statsContainerStyle = {
    display: "flex",
    gap: 12,
    fontSize: 12,
    opacity: .9
};

const navStyle = {
    padding: 16,
    overflowY: "auto",
    display: "grid",
    gap: 4
};

const footerStyle = {
    padding: 16,
    borderTop: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
};

function Group({ title }) {
    return (
        <div style={{
            margin: "16px 0 8px 0",
            fontSize: 11,
            letterSpacing: .5,
            textTransform: "uppercase",
            opacity: .6,
            fontWeight: 600
        }}>
            {title}
        </div>
    );
}

function MenuLink({ icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={menuLinkStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
            <span style={{ fontWeight: 500, fontSize: 14, flex: 1, textAlign: 'left' }}>{label}</span>
        </button>
    );
}

const menuLinkStyle = {
    all: "unset",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 8px",
    borderRadius: 8,
    cursor: "pointer",
    color: "#fff",
    width: "100%",
    transition: "background 0.2s ease",
};

function PrimaryButton({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={primaryButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = "#1d4ed8"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#2563eb"}
        >
            {label}
        </button>
    );
}

const primaryButtonStyle = {
    width: "100%",
    height: 42,
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    margin: "8px 0",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: 14,
};

function SecondaryButton({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={secondaryButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
        >
            {label}
        </button>
    );
}

const secondaryButtonStyle = {
    width: "100%",
    height: 42,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.25)",
    background: "rgba(255,255,255,.08)",
    color: "#fff",
    fontWeight: 600,
    margin: "8px 0",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: 14,
};

// BOTÓN DE CERRAR SESIÓN MÁS ANGOSTO Y SIN EMOJI
function SmallDangerButton({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={smallDangerButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,.1)"}
        >
            <span style={{ fontWeight: 500, fontSize: 13, textAlign: 'center', width: '100%' }}>{label}</span>
        </button>
    );
}

const smallDangerButtonStyle = {
    all: "unset",
    display: "flex",
    alignItems: "center",
    justifyContent: "",
    width: "100%",
    height: 30, // Más angosto
    borderRadius: 6,
    border: "1px solid rgba(239,68,68,.3)",
    background: "rgba(239,68,68,.1)",
    color: "#fecaca",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: 13,
};

function StatLink({ label, value, onClick }) {
    return (
        <div
            onClick={onClick}
            style={statLinkStyle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
            <strong style={{ fontWeight: 800, fontSize: 12 }}>{value}</strong>
            <span style={{ opacity: .85, fontSize: 11 }}>{label}</span>
        </div>
    );
}

const statLinkStyle = {
    all: "unset",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    cursor: "pointer",
    padding: "6px 8px",
    borderRadius: 6,
    transition: "background 0.2s ease",
    minWidth: 50,
};

function Badge({ children }) {
    return (
        <span style={badgeStyle}>
            {children}
        </span>
    );
}

const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    height: 26,
    padding: "0 10px",
    borderRadius: 6,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.18)",
    fontSize: 11,
    color: "#fff",
};