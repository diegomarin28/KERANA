import { Link } from "react-router-dom";
import {useState} from "react";

export default function Sidebar({ open, onClose, user, onLogout }) {
    if (!open) return null;

    const username = user?.name || "Invitado";
    const letter = username[0]?.toUpperCase() || "U";

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 3000 }}
                aria-hidden="true"
            />
            {/* Panel */}
            <aside
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "min(340px, 92vw)",       // ← AQUÍ va el ancho del panel
                    height: "100vh",
                    background: "#fff",
                    zIndex: 3010,
                    boxShadow: "2px 0 14px rgba(0,0,0,.25)",
                    display: "grid",
                    gridTemplateRows: "auto 1fr auto",
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Menú lateral"
            >
                {/* Header del panel */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottom: "1px solid #eee" }}>
                    <strong style={{ fontSize: 16 }}>Menú</strong>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}
                    >
                        ✖
                    </button>
                </div>

                {/* Contenido scrolleable */}
                <div style={{ overflowY: "auto", padding: 16, display: "grid", gap: 16 }}>
                    {/* Tarjeta de perfil */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "56px 1fr",
                            gap: 12,
                            padding: 12,
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            background: "#f9fafb",
                        }}
                    >
                        {/* Avatar */}
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={username}
                                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: "50%",
                                    background: "#2f6cab",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    fontSize: 22,
                                }}
                            >
                                {letter}
                            </div>
                        )}

                        {/* Nombre + acciones rápidas */}
                        <div style={{ display: "grid", alignContent: "center" }}>
                            <div style={{ fontWeight: 700 }}>{username}</div>
                            <div style={{ color: "#6b7280", fontSize: 12 }}>
                                {user ? "Bienvenido/a 👋" : "Entrá para guardar tu biblioteca"}
                            </div>
                        </div>

                        {/* Stats simples */}
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 8 }}>
                            <Stat label="Seguidores" value={user?.followers ?? 0} />
                            <Stat label="Subidos" value={user?.uploads ?? 0} />
                            <Stat label="Upvotes" value={user?.upvotes ?? 0} />
                        </div>

                        {/* Botón nuevo */}
                        <Link
                            to="/upload"
                            onClick={onClose}
                            style={{
                                gridColumn: "1 / -1",
                                marginTop: 8,
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: "10px 12px",
                                background: "#2563eb",
                                color: "#fff",
                                borderRadius: 10,
                                fontWeight: 700,
                                textDecoration: "none",
                            }}
                        >
                            + Nuevo
                        </Link>
                    </div>

                    {/* Menú principal */}
                    <NavGroup title="Mi Biblioteca">
                        <NavItem to="/favorites" onClick={onClose} label="Favoritos" />
                        <NavItem to="/my-papers" onClick={onClose} label="Mis apuntes" />
                        <NavItem to="/purchased" onClick={onClose} label="Comprados" />
                    </NavGroup>

                    <NavGroup title="Explorar">
                        <NavItem to="/subjects" onClick={onClose} label="Asignaturas" />
                        <NavItem to="/tutors" onClick={onClose} label="Mentores" />
                        <NavItem to="/top-uploaders" onClick={onClose} label="Ranking" />
                        <NavItem to="/contact" onClick={onClose} label="Contacto" /> {/* ← agregado */}
                    </NavGroup>

                    <NavGroup title="Cuenta">
                        <NavItem to="/profile" onClick={onClose} label="Perfil" />
                        <NavItem to="/settings" onClick={onClose} label="Ajustes" />
                        {user ? (
                            <button onClick={() => { onClose(); onLogout?.(); }} style={dangerBtn}>
                                Cerrar sesión
                            </button>
                        ) : null}
                    </NavGroup>
                </div>

                {/* Footer pequeño */}
                <div style={{ padding: 12, borderTop: "1px solid #eee", color: "#6b7280", fontSize: 12 }}>
                    © {new Date().getFullYear()} KERANA — v0.1
                </div>
            </aside>
        </>
    );
}

function Stat({ label, value }) {
    return (
        <div
            style={{
                flex: 1,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "8px 10px",
                textAlign: "center",
            }}
        >
            <div style={{ fontWeight: 800 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
        </div>
    );
}

function NavGroup({ title, children }) {
    return (
        <div>
            <div
                style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                }}
            >
                {title}
            </div>
            <div style={{ display: "grid", gap: 8 }}>{children}</div>
        </div>
    );
}

function NavItem({ to, label, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                textDecoration: "none",
                color: "#111827",
                background: "#fff",
            }}
        >
            <span>{label}</span>
        </Link>
    );
}

const dangerBtn = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ef4444",
    background: "#fff5f5",
    color: "#b91c1c",
    fontWeight: 700,
    cursor: "pointer",
};
