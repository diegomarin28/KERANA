import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { Button } from "../components/ui/Button";

export default function CourseCard({ course, onFav }) {
    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case "apunte": return "📄";
            case "profesor": return "👨‍🏫";
            case "mentor": return "🎯";
            case "materia": return "📚";
            default: return "📖";
        }
    };

    const getTone = (tipo) => {
        switch (tipo) {
            case "apunte": return "primary";
            case "profesor": return "blue";
            case "mentor": return "gray";
            case "materia": return "amber";
            default: return "gray";
        }
    };

    return (
        <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.1rem" }}>{getTipoIcon(course.tipo)}</span>
                    <Chip tone={getTone(course.tipo)}>{(course.tipo || "curso").toUpperCase()}</Chip>
                </div>

                <h3 style={{ margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {course.titulo}
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                    {course.subtitulo}
                </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {course.tipo !== "materia" && (
                    <Button variant="ghost" onClick={onFav} title="Agregar a favoritos">🤍</Button>
                )}
                <Button variant="secondary">Ver</Button>
            </div>
        </Card>
    );
}
