import './Badge.css';

function Badge({
    children,
    variant = 'primary', // primary, secondary, success, warning, danger, info
    size = 'md', // sm, md
    dot = false,
    icon,
    className = ''
}) {
    return (
        <span className={`badge badge-${variant} badge-${size} ${className}`}>
            {dot && <span className="badge-dot" />}
            {icon && <span className="badge-icon">{icon}</span>}
            <span className="badge-text">{children}</span>
        </span>
    );
}

// AI Verification Badge
export function AIBadge({ status }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'verified':
                return { label: 'AI Verified', variant: 'verified', icon: '✓' };
            case 'low-quality':
                return { label: 'Low Quality', variant: 'low-quality', icon: '!' };
            case 'rejected':
                return { label: 'Rejected', variant: 'rejected', icon: '✕' };
            default:
                return { label: 'Pending', variant: 'pending', icon: '○' };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`ai-badge ${config.variant}`}>
            <span className="ai-badge-icon">{config.icon}</span>
            <span className="ai-badge-label">{config.label}</span>
        </span>
    );
}

export default Badge;
