import React from "react";
import EquipoImg from "../assets/equipo.png";
import truco2Img from "../assets/2truco.png";
import truco3Img from "../assets/3truco.png";
import truco4Img from "../assets/4truco.png";


const bluePalette = {
    bg: "#f0f5fa",
    primary: "#2563eb",
    secondary: "#1e40af",
    text: "#111827",
    card: "#e0ebff",
};

// Datos de los miembros
const skills = [
    {
        name: "Diego",
        programming: 4,
        databases: 3,
        truco: 3,
        description: `Principal ideador de KERANA el alma mater de este equipo.
Actor, Mentiroso, cuando su compañero le hace por señas que no tiene nada dice "estas bien eh"`,
    },
    {
        name: "Lucas",
        programming: 3.5,
        databases: 4,
        truco: 3,
        description: `Crack de las bases de datos. Jugador táctico y analítico.
Le encanta ir a pescar (no sabe lo que es una caña).`,
    },
    {
        name: "Tomi",
        programming: 3,
        databases: 4.5,
        truco: 2,
        description: `Se enfoca en bases de datos y sistemas eficientes.
Jugador que no arriesga. Cada vez que tiene el 4 dice "no te enamores si te tiro beso".`,
    },
    {
        name: 'Juan "Chino"',
        programming: 5,
        databases: 2,
        truco: 3,
        description: `Destacado en Front-End. Miente y mucho.
Pierde manos con 2 y 4, te pregunta que carta te queda (revelando que le queda la carta enseguida más chica).`,
    },
];

export default function Equipo() {
    return (
        <div style={{ background: bluePalette.bg, minHeight: "100vh", padding: 32 }}>
            {/* Sección principal */}
            <div
                style={{
                    display: "flex",
                    gap: 32,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                }}
            >
                {/* Imagen */}
                <div style={{ flex: "0 0 100%", maxWidth: 350 }}>
                    <img
                        src={EquipoImg}
                        alt="Equipo Kerana"
                        style={{ width: "100%", borderRadius: 12, objectFit: "contain" }}
                    />
                </div>

                {/* Columna derecha */}
                <div style={{ flex: "1 1 55%", display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Título y descripción */}
                    <div>
                        <h1 style={{ fontWeight: "bold", color: bluePalette.primary, fontSize: "2.5rem" }}>
                            ¿Quiénes somos?
                        </h1>
                        <p style={{ color: bluePalette.text, marginTop: 12, fontSize: 18, lineHeight: 1.6 }}>
                            Somos un equipo de estudiantes de <strong>Ingeniería en Telemática</strong>{" "}
                            de la UM apasionados por la educación digital. Nuestro objetivo es conectar
                            estudiantes con profesores, cursos y apuntes de manera sencilla y eficiente,
                            para el bienestar de cada uno de los usuarios.
                        </p>
                    </div>

                    {/* Integrantes 2x2 */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 24,
                            marginTop: 16,
                        }}
                    >
                        {skills.map((member) => (
                            <div
                                key={member.name}
                                style={{
                                    display: "grid",
                                    gridTemplateRows: "auto auto auto",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    background: bluePalette.card,
                                    borderRadius: 12,
                                    padding: 16,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    gap: 8,
                                    alignItems: "center",
                                }}
                            >
                                {/* Nombre arriba izquierda */}
                                <h2
                                    style={{
                                        gridRow: 1,
                                        gridColumn: 1,
                                        margin: 0,
                                        color: bluePalette.secondary,
                                    }}
                                >
                                    {member.name}
                                </h2>

                                {/* Programación arriba centro */}
                                <div style={{ gridRow: 1, gridColumn: 2, textAlign: "center" }}>
                                    <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>
                                        Programación:
                                    </div>
                                    <div>
                                        {"★".repeat(Math.floor(member.programming)) +
                                            "☆".repeat(5 - Math.floor(member.programming))}
                                    </div>
                                </div>

                                {/* Base de datos arriba derecha */}
                                <div style={{ gridRow: 1, gridColumn: 3, textAlign: "center" }}>
                                    <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>
                                        Base de datos:
                                    </div>
                                    <div>
                                        {"★".repeat(Math.floor(member.databases)) +
                                            "☆".repeat(5 - Math.floor(member.databases))}
                                    </div>
                                </div>

                                {/* Truco abajo izquierda */}
                                <div style={{ gridRow: 2, gridColumn: 1, textAlign: "center" }}>
                                    <p style={{ margin: 0, fontWeight: "bold" }}>Truco skills:</p>
                                    <img
                                        src={
                                            member.truco === 4
                                                ? truco4Img
                                                : member.truco === 3
                                                    ? truco3Img
                                                    : truco2Img
                                        }
                                        alt="Truco skills"
                                        style={{ width: "50px", height: "50px", marginTop: "4px" }}
                                    />
                                </div>

                                {/* Descripción centrada verticalmente a la derecha */}
                                <p
                                    style={{
                                        gridRow: 2 / 4,
                                        gridColumn: "2 / 4",
                                        margin: 0,
                                        color: bluePalette.text,
                                        fontSize: 14,
                                        lineHeight: 1.5,
                                        alignSelf: "center",
                                    }}
                                >
                                    {member.description.split("\n").map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            <br />
                                        </React.Fragment>
                                    ))}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
