export default function ImagePlaceholder({
    width = '100%',
    height = 180,
    label = 'Imagen no disponible',
    style,
}) {
    return (
        <div
        style={{
            width,
            height,
            background: '#e0e0e0',
            border: '1.5px dashed #b0b0b0',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flexShrink: 0,
            ...style,
        }}
        >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#a0a0a0" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" stroke="#a0a0a0" strokeWidth="1.5" />
            <path
            d="M21 15l-5-5L5 21"
            stroke="#a0a0a0"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            />
        </svg>
        <span
            style={{
            fontSize: 11,
            color: '#a0a0a0',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.03em',
            }}
        >
            {label}
        </span>
        </div>
    );
}
