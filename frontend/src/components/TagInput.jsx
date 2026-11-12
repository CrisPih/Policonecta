import { useState } from 'react';

// Campo para escribir palabras y mostrarlas como etiquetas que se pueden quitar
export default function TagInput({ value = [], onChange, placeholder = 'Escriba y pulse Enter', max = 15, disabled = false }) {
    const [texto, setTexto] = useState('');

    const agregar = () => {
        const nuevas = texto
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .filter((t) => !value.some((v) => v.toLowerCase() === t.toLowerCase()));
        if (nuevas.length) onChange([...value, ...nuevas].slice(0, max));
        setTexto('');
    };

    const quitar = (t) => onChange(value.filter((v) => v !== t));

    const teclas = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            agregar();
        } else if (e.key === 'Backspace' && !texto && value.length) {
            quitar(value[value.length - 1]);
        }
    };

    return (
        <div style={{ border: '1px solid #d4d4d4', borderRadius: 4, padding: 6, display: 'flex', flexWrap: 'wrap', gap: 6, background: disabled ? '#fafafa' : '#fff' }}>
            {value.map((t) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #c3cfe4', color: '#1e40af', borderRadius: 14, padding: '3px 4px 3px 10px', fontSize: 12 }}>
                    {t}
                    <button
                        type="button"
                        onClick={() => quitar(t)}
                        disabled={disabled}
                        aria-label={`Quitar ${t}`}
                        style={{ background: 'none', border: 'none', color: '#7a7a7a', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 4px' }}
                    >
                        ×
                    </button>
                </span>
            ))}
            {value.length < max && (
                <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={teclas}
                    onBlur={agregar}
                    disabled={disabled}
                    placeholder={value.length ? '' : placeholder}
                    style={{ flex: 1, minWidth: 140, border: 'none', outline: 'none', fontSize: 13, padding: '4px 6px', fontFamily: 'inherit', background: 'transparent' }}
                />
            )}
        </div>
    );
}
