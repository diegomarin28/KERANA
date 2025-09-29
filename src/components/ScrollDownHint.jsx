import { useEffect } from "react"; //este archivo es de las flechitas que aparecen en el home, q te marca q siga info abajo y q puedas ir para ahi

export default function ScrollDownHint({
                                           targetId = "after-hero",
                                           offset = 64,
                                           label = "Ver más",
                                           showLabel = false,   // como lo puse en flase no se ve el Ver más
                                           chevrons = 1,          // ← cantidad de flechitas
                                           size = 17,             // ← tamaño (px) de cada flecha
                                           stroke = 3,            // ← grosor del “trazo” (px)
                                           speed = 1.8,           // ← segundos de la animación
                                           distance = 6,          // ← cuánto “baja” cada flecha (px)
                                           bottom = 20,           // ← distancia al borde inferior del hero (px)
                                           color = "#ffffff",     // ← color (usa “currentColor” si querés heredarlo)
                                           gap = 4,               // ← separación vertical entre flechas (px)
                                           delayStep = 0.15       // ← desfase entre flechas (seg)
                                       }) {
    const handleClick = (e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { window.scrollBy({ top: -offset, left: 0, behavior: "auto" }); }, 380);
    };

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) {
            const el = document.querySelector(".scroll-hint");
            if (el) el.classList.add("reduced");
        }
    }, []);

    return (
        <>
            <button
                type="button"
                aria-label={label}
                className="scroll-hint"
                onClick={handleClick}
            >
                {/* Flechitas */}
                {Array.from({ length: chevrons }).map((_, i) => (
                    <span
                        key={i}
                        className={`chevron chevron-${i}`}
                        style={{ animationDelay: `${i * delayStep}s`, opacity: 0.85 - i * 0.15 }}
                    />
                ))}

                {/* Texto */}
                {showLabel && <span className="scroll-text">{label}</span>}
            </button>

            <style>{`
        .scroll-hint {
          position: absolute;
          left: 50%;
          bottom: ${bottom}px;
          transform: translateX(-50%);
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: ${gap}px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: ${color};
          text-shadow: 0 1px 2px rgba(0,0,0,.25);
          padding: 6px;
          z-index: 2;
        }
        .scroll-text { font-size: 12px; opacity: .9; }
        .chevron {
          width: ${size}px;
          height: ${size}px;
          border-right: ${stroke}px solid currentColor;
          border-bottom: ${stroke}px solid currentColor;
          transform: rotate(45deg);
          animation: float ${speed}s ease-in-out infinite;
        }
        @keyframes float {
          0%   { transform: translateY(0) rotate(45deg); }
          50%  { transform: translateY(${distance}px) rotate(45deg); }
          100% { transform: translateY(0) rotate(45deg); }
        }
        .scroll-hint:hover { color: #f8fafc; }
        .scroll-hint:active { transform: translateX(-50%) translateY(1px); }

        @media (prefers-reduced-motion: reduce) {
          .chevron { animation: none; }
        }
        .scroll-hint.reduced .chevron { animation: none; }
      `}</style>
        </>
    );
}
