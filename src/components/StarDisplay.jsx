// Componente mejorado para MOSTRAR estrellas (no interactivo)
// Usar este en ProfessorDetail.jsx y ReviewsSection.jsx
const StarDisplay = ({ rating, size = 24 }) => {
    return (
        <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4, 5].map((starIndex) => {
                const fillPercentage = Math.min(Math.max((rating - starIndex + 1) * 100, 0), 100);

                return (
                    <div
                        key={starIndex}
                        style={{
                            position: 'relative',
                            width: size,
                            height: size,
                            display: 'inline-block'
                        }}
                    >
                        {/* Estrella de fondo (vacía con borde) */}
                        <svg
                            width={size}
                            height={size}
                            viewBox="0 0 24 24"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}
                        >
                            <path
                                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                fill="#e5e7eb"
                                stroke="#9ca3af"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {/* Estrella rellena (con clip) */}
                        {fillPercentage > 0 && (
                            <svg
                                width={size}
                                height={size}
                                viewBox="0 0 24 24"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`
                                }}
                            >
                                <path
                                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                    fill="#f59e0b"
                                    stroke="#d97706"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StarDisplay;