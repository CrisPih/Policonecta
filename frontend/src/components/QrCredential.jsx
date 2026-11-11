import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Credencial digital con el codigo QR de la inscripcion
export default function QrCredential({ content, token, name, title }) {
    const [imagen, setImagen] = useState('');

    useEffect(() => {
        QRCode.toDataURL(content, { width: 220, margin: 1, color: { dark: '#0f1f3d', light: '#ffffff' } })
            .then(setImagen)
            .catch(() => setImagen(''));
    }, [content]);

    return (
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            {imagen && <img src={imagen} alt={`Código QR de ${title}`} width={180} height={180} style={{ border: '1px solid #d4d4d4', borderRadius: 6 }} />}
            <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>{name}</div>
                <div style={{ fontSize: 12, color: '#3b4a66', margin: '4px 0 10px' }}>{title}</div>
                <div style={{ fontSize: 11, color: '#7a7a7a' }}>Presente este código en la entrada del evento.</div>
                <div style={{ fontSize: 11, color: '#7a7a7a', marginTop: 8 }}>Código manual</div>
                <span style={{ fontSize: 12, color: '#0f1f3d', wordBreak: 'break-all' }}>{token}</span>
            </div>
        </div>
    );
}
