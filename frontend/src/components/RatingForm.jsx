import { useState } from 'react';
import { eventService } from '../services/eventService';

// Calificacion de 1 a 5 y comentario para un evento al que se asistio
export default function RatingForm({ eventId, onDone }) {
    const [nota, setNota] = useState(0);
    const [encima, setEncima] = useState(0);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    const enviar = async (e) => {
        e.preventDefault();
        if (!nota) {
            setError('Seleccione una calificación.');
            return;
        }
        setEnviando(true);
        setError('');
        try {
            await eventService.rateEvent(eventId, nota, comentario.trim() || null);
            onDone?.(nota);
        } catch (err) {
            setError(err.message || 'No se pudo enviar la valoración.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div role="radiogroup" aria-label="Calificación" style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={nota === n}
                        aria-label={`${n} de 5`}
                        onClick={() => setNota(n)}
                        onMouseEnter={() => setEncima(n)}
                        onMouseLeave={() => setEncima(0)}
                        style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', padding: 0, color: n <= (encima || nota) ? '#1e40af' : '#c9d2e3', lineHeight: 1 }}
                    >
                        ★
                    </button>
                ))}
            </div>
            <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Comentario para el organizador (opcional)"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4d4d4', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
            />
            {error && <div style={{ fontSize: 12, color: '#3b4a66' }}>{error}</div>}
            <div>
                <button
                    type="submit"
                    disabled={enviando}
                    style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: enviando ? 0.6 : 1 }}
                >
                    {enviando ? 'Enviando...' : 'Enviar valoración'}
                </button>
            </div>
        </form>
    );
}
