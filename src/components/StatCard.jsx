import './StatCard.css';

export default function StatCard({ label, value, sub, icon }) {
    return (
        <div className="stat-card">
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{value}</div>
            {sub && <div className="stat-card-sub">{sub}</div>}
            {icon && <div className="stat-card-icon">{icon}</div>}
        </div>
    );
}
