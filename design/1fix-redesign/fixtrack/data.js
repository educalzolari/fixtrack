/* 1Fix — mock workshop data ------------------------------------------------ */
window.FIX = (function () {
  // estado pipeline: en_espera → activo → finalizado → entregado
  const ESTADOS = {
    en_espera:  { key: 'en_espera',  label: 'En espera',  sc: 'sc-espera',     next: 'activo'     },
    activo:     { key: 'activo',     label: 'Activo',     sc: 'sc-activo',     next: 'finalizado' },
    finalizado: { key: 'finalizado', label: 'Finalizado', sc: 'sc-finalizado', next: 'entregado'  },
    entregado:  { key: 'entregado',  label: 'Entregado',  sc: 'sc-entregado',  next: null         },
  };
  const ORDER = ['activo', 'en_espera', 'finalizado', 'entregado'];

  const JOBS = [
    { id: 1008, fecha: '2026-06-01', cliente: 'Angel Tenasio',    tel: '11 5521 8830', marca: 'Motorola', modelo: 'E15',      tipo: 'phone',  servicio: 'Pantalla astillada. No enciende.', imei: '352266232312836', estado: 'activo',     costo: 38000 },
    { id: 1003, fecha: '2026-05-06', cliente: 'Silvina Pettacci', tel: '11 6740 1192', marca: 'Apple',    modelo: 'iPhone 11', tipo: 'phone',  servicio: 'Se apagó y no encendió más.',     imei: '',                estado: 'en_espera', costo: 0 },
    { id: 1009, fecha: '2026-06-02', cliente: 'Judith Barreto',   tel: '11 3398 5521', marca: 'Motorola', modelo: '7i Power', tipo: 'phone',  servicio: 'Problemas de carga.',             imei: '',                estado: 'finalizado', costo: 22000 },
    { id: 1007, fecha: '2026-05-28', cliente: 'Alejandra Barreto',tel: '11 2210 7785', marca: 'Motorola', modelo: 'G04',      tipo: 'phone',  servicio: 'Módulo roto.',                    imei: '359822882609625', estado: 'finalizado', costo: 45000 },
    { id: 1004, fecha: '2026-05-25', cliente: 'Lara Castillo',    tel: '11 4419 2204', marca: 'Apple',    modelo: 'iPhone 11', tipo: 'phone',  servicio: 'Batería hinchada.',               imei: '',                estado: 'finalizado', costo: 30000 },
    { id: 1011, fecha: '2026-06-06', cliente: 'Luis Ruelli',      tel: '11 5582 0093', marca: 'Samsung',  modelo: 'A54',      tipo: 'phone',  servicio: 'Se mojó. No carga.',              imei: '355079231080495', estado: 'entregado', costo: 0 },
    { id: 1010, fecha: '2026-06-03', cliente: 'Cecilia Roldán',   tel: '11 6611 3340', marca: 'Samsung',  modelo: 'A06',      tipo: 'phone',  servicio: 'Pantalla astillada.',             imei: '',                estado: 'entregado', costo: 60000 },
    { id: 1006, fecha: '2026-05-27', cliente: 'Lucrecia Moreno',  tel: '11 7732 9981', marca: 'Samsung',  modelo: 'A03',      tipo: 'phone',  servicio: 'Virus / software.',               imei: '',                estado: 'entregado', costo: 15000 },
    { id: 1005, fecha: '2026-05-22', cliente: 'Marcos Duarte',    tel: '11 2284 6610', marca: 'Xiaomi',   modelo: 'Redmi 12', tipo: 'phone',  servicio: 'Cambio de glass.',                imei: '861234509987654', estado: 'entregado', costo: 25000 },
    { id: 1002, fecha: '2026-05-18', cliente: 'Paula Giménez',    tel: '11 5098 4471', marca: 'Lenovo',   modelo: 'Tab M10',  tipo: 'tablet', servicio: 'No toma carga.',                  imei: '',                estado: 'entregado', costo: 20000 },
  ];

  // unique clientes derived + a couple extra
  const CLIENTES = (() => {
    const map = {};
    JOBS.forEach(j => {
      if (!map[j.cliente]) map[j.cliente] = { nombre: j.cliente, tel: j.tel, jobs: 0, gasto: 0 };
      map[j.cliente].jobs += 1; map[j.cliente].gasto += j.costo;
    });
    map['Ramiro Sosa']   = { nombre: 'Ramiro Sosa',   tel: '11 3320 7741', jobs: 0, gasto: 0 };
    map['Valeria Acuña'] = { nombre: 'Valeria Acuña', tel: '11 6612 0098', jobs: 0, gasto: 0 };
    return Object.values(map).sort((a, b) => a.nombre.localeCompare(b.nombre));
  })();

  const MARCAS = ['Samsung', 'Motorola', 'Apple', 'Xiaomi', 'Lenovo', 'Huawei', 'Otra'];
  const TIPOS = [
    { key: 'phone',   label: 'Celular' },
    { key: 'tablet',  label: 'Tablet' },
    { key: 'laptop',  label: 'Notebook' },
    { key: 'console', label: 'Consola' },
    { key: 'other',   label: 'Otro' },
  ];

  return { ESTADOS, ORDER, JOBS, CLIENTES, MARCAS, TIPOS };
})();
