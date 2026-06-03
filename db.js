function normalizeFotos(raw) {
  if (raw && !Array.isArray(raw) && typeof raw === "object") {
    return {
      recepcion:  Array.isArray(raw.recepcion)  ? raw.recepcion  : [],
      reparacion: Array.isArray(raw.reparacion) ? raw.reparacion : [],
      entrega:    Array.isArray(raw.entrega)    ? raw.entrega    : [],
    };
  }
  return { recepcion: Array.isArray(raw) ? raw : [], reparacion: [], entrega: [] };
}

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
    fotos: r.fotos || { recepcion: [], reparacion: [], entrega: [] },
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
    fotos: normalizeFotos(row.fotos),
  };
}

// ── Fotos ────────────────────────────────────────────────

async function compressImage(file, maxPx = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    };
    img.src = url;
  });
}

async function dbUploadFotos(repairId, files) {
  const urls = [];
  for (const file of files) {
    const blob = await compressImage(file);
    const path = `${repairId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await _db.storage.from("fotos-reparaciones").upload(path, blob, { contentType: "image/jpeg" });
    if (!error) {
      const { data } = _db.storage.from("fotos-reparaciones").getPublicUrl(path);
      urls.push(data.publicUrl);
    } else {
      console.error("Error subiendo foto:", error);
    }
  }
  return urls;
}

async function dbDeleteFoto(url) {
  const path = url.split("/fotos-reparaciones/")[1];
  if (!path) return;
  await _db.storage.from("fotos-reparaciones").remove([path]);
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

async function dbDelete(id) {
  const { error } = await _db.from("reparaciones").delete().eq("id", id);
  if (error) console.error("Error eliminando reparacion:", error);
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

// ── Clientes ────────────────────────────────────────────

function rowToCliente(row) {
  return {
    id: row.id,
    nombre: row.nombre || "",
    telefono: row.telefono || "",
    correo: row.correo || "",
    direccion: row.direccion || "",
  };
}

async function dbLoadClientes() {
  const { data, error } = await _db
    .from("clientes")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) {
    console.error("Error cargando clientes:", error);
    return [];
  }
  return data.map(rowToCliente);
}

async function dbInsertCliente(cliente) {
  const { data, error } = await _db
    .from("clientes")
    .insert({ nombre: cliente.nombre, telefono: cliente.telefono || "", correo: cliente.correo || "", direccion: cliente.direccion || "" })
    .select()
    .single();
  if (error) {
    console.error("Error insertando cliente:", error);
    return null;
  }
  return rowToCliente(data);
}
