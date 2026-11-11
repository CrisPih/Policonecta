import { useState } from 'react';

const formatoMonto = (n) => `$${Number(n || 0).toFixed(2)}`;

// Formulario de pago simulado con comprobante al aprobarse
export default function PaymentModal({ title, concept, amount, onPay, onClose, onDone, children, disabled = false }) {
    const [tarjeta, setTarjeta] = useState({ card_name: '', card_number: '', card_expiry: '', card_cvv: '' });
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState('');
    const [comprobante, setComprobante] = useState(null);

    const cambiar = (campo) => (e) => {
        let valor = e.target.value;
        if (campo === 'card_number') {
            valor = valor.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
        }
        if (campo === 'card_expiry') {
            valor = valor.replace(/\D/g, '').slice(0, 4);
            if (valor.length > 2) valor = `${valor.slice(0, 2)}/${valor.slice(2)}`;
        }
        if (campo === 'card_cvv') {
            valor = valor.replace(/\D/g, '').slice(0, 4);
        }
        setTarjeta((t) => ({ ...t, [campo]: valor }));
    };

    const pagar = async (e) => {
        e.preventDefault();
        setError('');

        if (!tarjeta.card_name.trim() || tarjeta.card_number.length < 13 || tarjeta.card_expiry.length !== 5 || tarjeta.card_cvv.length < 3) {
            setError('Complete los datos de la tarjeta.');
            return;
        }

        setProcesando(true);
        try {
            const resultado = await onPay(tarjeta);
            setComprobante(resultado?.payment ?? null);
        } catch (err) {
            setError(err.message || 'No se pudo procesar el pago.');
        } finally {
            setProcesando(false);
        }
    };

    const cerrar = () => {
        if (comprobante && onDone) onDone();
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,31,61,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                zIndex: 1000,
            }}
            onClick={(e) => e.target === e.currentTarget && !procesando && cerrar()}
        >
            <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 440, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #e8edf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f1f3d' }}>{comprobante ? 'Pago aprobado' : title}</h2>
                    <button onClick={cerrar} disabled={procesando} aria-label="Cerrar" style={{ background: 'none', border: 'none', fontSize: 20, color: '#7a7a7a', cursor: 'pointer', lineHeight: 1 }}>
                        ×
                    </button>
                </div>

                {comprobante ? (
                    <div style={{ padding: 22 }}>
                        <div style={{ background: '#fff', border: '1px solid #d4d4d4', borderRadius: 6, padding: 16, fontSize: 13, color: '#0f1f3d' }}>
                            <Fila etiqueta="Concepto" valor={concept} />
                            <Fila etiqueta="Monto" valor={formatoMonto(comprobante.amount)} />
                            <Fila etiqueta="Tarjeta" valor={`${comprobante.card_brand} terminada en ${comprobante.card_last4}`} />
                            <Fila etiqueta="Referencia" valor={comprobante.reference} />
                        </div>
                        <button onClick={cerrar} style={{ ...botonPrincipal, marginTop: 18 }}>Aceptar</button>
                    </div>
                ) : (
                    <form onSubmit={pagar} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {children}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: '#f3f6fb', borderRadius: 6, padding: '10px 14px' }}>
                            <span style={{ fontSize: 13, color: '#3b4a66' }}>{concept}</span>
                            <strong style={{ fontSize: 18, color: '#0f1f3d' }}>{formatoMonto(amount)}</strong>
                        </div>

                        <Campo etiqueta="Nombre en la tarjeta">
                            <input value={tarjeta.card_name} onChange={cambiar('card_name')} autoComplete="cc-name" style={entrada} />
                        </Campo>
                        <Campo etiqueta="Número de tarjeta">
                            <input value={tarjeta.card_number} onChange={cambiar('card_number')} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" style={entrada} />
                        </Campo>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Campo etiqueta="Vencimiento">
                                <input value={tarjeta.card_expiry} onChange={cambiar('card_expiry')} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" style={entrada} />
                            </Campo>
                            <Campo etiqueta="CVV">
                                <input value={tarjeta.card_cvv} onChange={cambiar('card_cvv')} inputMode="numeric" autoComplete="cc-csc" placeholder="123" style={entrada} />
                            </Campo>
                        </div>

                        <p style={{ margin: 0, fontSize: 11, color: '#7a7a7a' }}>
                            Pago simulado. Tarjeta de prueba: 4242 4242 4242 4242.
                        </p>

                        {error && (
                            <div style={{ background: '#fff', color: '#0f1f3d', padding: '10px 12px', borderRadius: 4, fontSize: 12 }}>{error}</div>
                        )}

                        <button type="submit" disabled={procesando || disabled} style={{ ...botonPrincipal, opacity: procesando || disabled ? 0.6 : 1 }}>
                            {procesando ? 'Procesando...' : `Pagar ${formatoMonto(amount)}`}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function Campo({ etiqueta, children }) {
    return (
        <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3a3a3a', marginBottom: 5 }}>{etiqueta}</span>
            {children}
        </label>
    );
}

function Fila({ etiqueta, valor }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0' }}>
            <span>{etiqueta}</span>
            <strong style={{ textAlign: 'right' }}>{valor}</strong>
        </div>
    );
}

const entrada = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    fontSize: 13,
    color: '#0f1f3d',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
};

const botonPrincipal = {
    width: '100%',
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
};
