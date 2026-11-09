import { useEffect, useState } from 'react';

const CONSULTA = '(max-width: 767px)';

// Indica si la pantalla tiene ancho de telefono
export default function useEsMovil() {
    const [esMovil, setEsMovil] = useState(() => window.matchMedia(CONSULTA).matches);

    useEffect(() => {
        const media = window.matchMedia(CONSULTA);
        const cambio = (e) => setEsMovil(e.matches);
        media.addEventListener('change', cambio);
        return () => media.removeEventListener('change', cambio);
    }, []);

    return esMovil;
}
