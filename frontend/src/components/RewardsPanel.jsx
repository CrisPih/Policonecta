import { useEffect, useState } from 'react';
import { eventService } from '../services/eventService';

// Saldo de puntos, catalogo de recompensas y cupones del participante
export default function RewardsPanel() {
    const [datos, setDatos] = useState(null);
    const [canjeando, setCanjeando] = useState(null);
    const [aviso, setAviso] = useState('');
    const [codigo, setCodigo] = useState('');
    const [agregando, setAgregando] = useState(false);
    const [avisoCodigo, setAvisoCodigo] = useState('');

    // Agrega un cupon a partir de un codigo promocional
    const agregarCodigo = async (e) => {
        e.preventDefault();
        if (!codigo.trim()) return;
        setAgregando(true);
        setAvisoCodigo('');
        try {
            const r = await eventService.claimCoupon(codigo.trim());
            setAvisoCodigo(`${r.message} ${r.coupon.name}.`);
            setCodigo('');
            await cargar();
        } catch (err) {
            setAvisoCodigo(err.message || 'No se pudo agregar el cupón.');
        } finally {
            setAgregando(false);
        }
    };

    const cargar = () => eventService.getRewards().then(setDatos).catch(() => setDatos({ points: 0, rewards: [], coupons: [] }));

    useEffect(() => {
        cargar();
    }, []);

    const canjear = async (recompensa) => {
        if (!window.confirm(`¿Canjear ${recompensa.points} puntos por "${recompensa.name}"?`)) return;
        setCanjeando(recompensa.key);
        setAviso('');
        try {
            const r = await eventService.redeemReward(recompensa.key);
            setAviso(`${r.message} Código: ${r.coupon.code}`);
            await cargar();
        } catch (err) {
            setAviso(err.message || 'No se pudo realizar el canje.');
        } finally {
            setCanjeando(null);
        }
    };

    if (!datos) return <p style={{ fontSize: 12, color: '#7a7a7a', margin: 0 }}>Cargando puntos...</p>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ border: '1px solid #d4d4d4', borderRadius: 6, padding: '12px 18px', textAlign: 'center', minWidth: 110 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#1e40af', lineHeight: 1 }}>{datos.points}</div>
                    <div style={{ fontSize: 11, color: '#3b4a66', marginTop: 4 }}>puntos</div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>Programa de puntos</h2>
                    <p style={{ margin: 0, fontSize: 12, color: '#7a7a7a' }}>10 puntos por cada asistencia registrada con el código QR.</p>
                </div>
            </div>

            <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>Recompensas</h3>
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                {datos.rewards.map((r) => {
                    const alcanza = datos.points >= r.points;
                    return (
                        <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: '1px solid #d4d4d4', borderRadius: 4, padding: '10px 14px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>{r.name}</div>
                                <div style={{ fontSize: 12, color: '#7a7a7a' }}>{r.points} puntos</div>
                            </div>
                            <button
                                onClick={() => canjear(r)}
                                disabled={!alcanza || canjeando === r.key}
                                style={{
                                    background: alcanza ? '#1e40af' : '#fff',
                                    color: alcanza ? '#fff' : '#9a9a9a',
                                    border: `1px solid ${alcanza ? '#1e40af' : '#d4d4d4'}`,
                                    borderRadius: 4,
                                    padding: '7px 14px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: alcanza ? 'pointer' : 'not-allowed',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {canjeando === r.key ? 'Canjeando...' : 'Canjear'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {aviso && <p style={{ margin: '0 0 16px', fontSize: 12, color: '#0f1f3d' }}>{aviso}</p>}

            <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>Mis cupones</h3>

            <form onSubmit={agregarCodigo} style={{ display: 'flex', gap: 8, marginBottom: avisoCodigo ? 6 : 14, flexWrap: 'wrap' }}>
                <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Código promocional"
                    aria-label="Código promocional"
                    maxLength={30}
                    style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid #d4d4d4', borderRadius: 4, fontSize: 13, fontFamily: 'inherit' }}
                />
                <button
                    type="submit"
                    disabled={!codigo.trim() || agregando}
                    style={{ background: '#fff', color: '#1e40af', border: '1px solid #1e40af', borderRadius: 4, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !codigo.trim() || agregando ? 0.5 : 1 }}
                >
                    {agregando ? 'Agregando...' : 'Agregar cupón'}
                </button>
            </form>
            {avisoCodigo && <p style={{ margin: '0 0 14px', fontSize: 12, color: '#0f1f3d' }}>{avisoCodigo}</p>}
            {datos.coupons.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: '#9a9a9a' }}>Sin cupones</p>
            ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                    {datos.coupons.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, borderBottom: '1px solid #efefef', paddingBottom: 8, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ color: '#0f1f3d', fontWeight: 600 }}>{c.name}</div>
                                <div style={{ color: '#3b4a66' }}>Código: {c.code}</div>
                            </div>
                            <div style={{ color: c.status === 'usado' ? '#9a9a9a' : '#1e40af', fontWeight: 600 }}>
                                {c.status === 'usado' ? 'Usado' : 'Disponible'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
