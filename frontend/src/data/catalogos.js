// Catalogos compartidos por los formularios y filtros

export const FACULTADES = ['FIEC', 'FIMCP', 'FCSH', 'FICT', 'FCNM', 'FADCOM', 'FCV', 'ESPAE'];

export const CATEGORIAS = [
    'Conferencia',
    'Taller',
    'Seminario',
    'Hackathon',
    'Feria',
    'Congreso',
    'Académico',
    'Deportivo',
    'Cultural',
    'Laboral',
];

// Intereses que el usuario puede marcar en su perfil
export const INTERESES = [
    { valor: 'pasantia', texto: 'Pasantías' },
    { valor: 'beca', texto: 'Becas' },
    { valor: 'investigacion', texto: 'Investigación' },
    { valor: 'convocatoria', texto: 'Convocatorias' },
    ...CATEGORIAS.map((c) => ({ valor: c, texto: c })),
];
