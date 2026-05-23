import './Loader.css';

function Loader({ size = 'md', text, fullScreen = false }) {
    if (fullScreen) {
        return (
            <div className="loader-overlay">
                <div className="loader-content">
                    <div className={`loader ${size}`} />
                    {text && <p className="loader-text">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="loader-wrapper">
            <div className={`loader ${size}`} />
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
}

// Skeleton loader for content placeholders
export function Skeleton({ type = 'text', width, height, className = '' }) {
    const style = {
        width: width || (type === 'text' ? '100%' : undefined),
        height: height || undefined,
    };

    return (
        <div className={`skeleton ${type} ${className}`} style={style} />
    );
}

export default Loader;
