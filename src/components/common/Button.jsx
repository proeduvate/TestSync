import './Button.css';

function Button({
    children,
    variant = 'primary', // primary, secondary, success, danger, ghost
    size = 'md', // sm, md, lg
    icon,
    iconPosition = 'left',
    fullWidth = false,
    loading = false,
    disabled = false,
    type = 'button',
    onClick,
    className = '',
    ...props
}) {
    const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full',
        loading && 'btn-loading',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <span className="btn-spinner" />}
            {icon && iconPosition === 'left' && !loading && (
                <span className="btn-icon">{icon}</span>
            )}
            <span className="btn-text">{children}</span>
            {icon && iconPosition === 'right' && !loading && (
                <span className="btn-icon">{icon}</span>
            )}
        </button>
    );
}

export default Button;
