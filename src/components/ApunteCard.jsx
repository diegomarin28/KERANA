import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import PDFThumbnail from "../components/PDFThumbnail";

export default function ApunteCard({ note }) {
    const navigate = useNavigate();

    if (!note) return null;

    return (
        <Card
            style={{
                padding: 0,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                overflow: 'hidden'
            }}
            onClick={(e) => {
                e.preventDefault();
                navigate(`/apuntes/${note.id_apunte}`);
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Vista previa del PDF - igual que Notes */}
            <PDFThumbnail
                url={note.signedUrl || null}
                width={280}
                height={160}
            />

            {/* Contenido de la card */}
            <div style={{ padding: 16 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>
                    {note.titulo}
                </h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    flexWrap: 'wrap'
                }}>
                    <span style={{
                        padding: '2px 8px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500
                    }}>
                        {note.materia?.nombre_materia || 'Sin materia'}
                    </span>
                    {note.estrellas > 0 && (
                        <span style={{ color: '#f59e0b', fontSize: 14 }}>
                            {'★'.repeat(note.estrellas)}
                        </span>
                    )}
                </div>

                {note.descripcion && (
                    <p style={{
                        color: '#6b7280',
                        fontSize: 14,
                        marginBottom: 12,
                        lineHeight: 1.4
                    }}>
                        {note.descripcion.length > 80
                            ? note.descripcion.substring(0, 80) + '...'
                            : note.descripcion}
                    </p>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTop: '1px solid #e5e7eb'
                }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                        Por {note.usuario?.nombre || 'Anónimo'}
                    </span>
                    <span style={{
                        padding: '4px 10px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                    }}>
                        {note.creditos} 💰
                    </span>
                </div>
            </div>
        </Card>
    );
}