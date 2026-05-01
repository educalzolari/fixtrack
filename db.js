const SUPABASE_URL = "https://axgqawopidzljidnaodd.supabase.co";
const SUPABASE_KEY = "sb_publishable_NKLsMIAtibXaIyoIbjIl4Q_H4sPnLx2";

const _db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function repairToRow(r) {
  return {
    id: r.id,
    cliente: r.cliente || "",
    dispositivo: r.dispositivo || "Celular",
    marca: r.marca || "",
    modelo: r.modelo || "",
    identificador: r.identificador || "",
    password_dispositivo: r.passwordDispositivo || "",
    patron_imagen: r.patronImagen || "",
    patron_secuencia: r.patronSecuencia || "",
    gastos: r.gastos || [],
    accesorios: r.accesorios || "",
    costo_aproximado: Number(r.costoAproximado || 0),
    anticipo: Number(r.anticipo || 0),
    fecha_entrega: r.fechaEntrega || "",
    fecha_ingreso: r.fechaIngreso || "",
    estado: r.estado || "En espera",
    problema: r.problema || "",
    observaciones: r.observaciones || "",
    cierre: r.cierre || null,
    telefono: r.telefono || null,
  };
}

function rowToRepair(row) {
  return {
    id: row.id,
    cliente: row.cliente || "",
    dispositivo: row.dispositivo || "Celular",
    marca: row.marca || "",
    modelo: row.modelo || "",
    identificador: row.identificador || "",
    passwordDispositivo: row.password_dispositivo || "",
    patronImagen: row.patron_imagen || "",
    patronSecuencia: row.patron_secuencia || "",
    gastos: Array.isArray(row.gastos) ? row.gastos : [],
    accesorios: row.accesorios || "",
    costoAproximado: Number(row.costo_aproximado || 0),
    anticipo: Number(row.anticipo || 0),
    fechaEntrega: row.fecha_entrega || "",
    fechaIngreso: row.fecha_ingreso || "",
    estado: row.estado || "En espera",
    problema: row.problema || "",
    observaciones: row.observaciones || "",
    cierre: row.cierre || null,
    telefono: row.telefono || "",
  };
}

async function dbLoad() {
  const { data, error } = await _db
    .from("reparaciones")
    .select("*")
    .order("id", { ascending: false });
  if (error) {
    console.error("Error cargando reparaciones:", error);
    return [];
  }
  return data.map(rowToRepair);
}

async function dbInsert(repair) {
  const { error } = await _db.from("reparaciones").insert(repairToRow(repair));
  if (error) console.error("Error insertando reparacion:", error);
}

async function dbUpsert(repair) {
  const { error } = await _db
    .from("reparaciones")
    .upsert(repairToRow(repair), { onConflict: "id" });
  if (error) console.error("Error actualizando reparacion:", error);
}

async function dbGetById(id) {
  const { data, error } = await _db
    .from("reparaciones")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return rowToRepair(data);
}
