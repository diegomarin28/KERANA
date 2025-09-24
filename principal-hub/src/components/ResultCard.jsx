import { useNavigate } from "react-router-dom";

export default function ResultCard({ title, subtitle, rating, pill, to, onClick }) {
    const navigate = useNavigate();
    const handle = () => (to ? navigate(to) : onClick?.());

    return (
        <div className="card" onClick={handle}>
            <div className="card-top">
                <strong>{title}</strong>
                {pill && <span className="card-pill">{pill}</span>}
            </div>
            {subtitle && <div className="card-sub">{subtitle}</div>}
            {typeof rating === "number" && <div className="card-rate">★ {rating.toFixed(1)}</div>}
        </div>
    );
}
