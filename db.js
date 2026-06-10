function normalizeFotos(raw) {
  console.log("[fotos] normalizeFotos input type:", typeof raw, "value:", JSON.stringify(raw));
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return { recepcion: [], reparacion: [], entrega: [] }; }
  }
  if (raw && !Array.isArray(raw) && typeof raw === "object") {
    const result = {
      recepcion:  Array.isArray(raw.recepcion)  ? raw.recepcion  : [],
      reparacion: Array.isArray(raw.reparacion) ? raw.reparacion : [],
      entrega:    Array.isArray(raw.entrega)    ? raw.entrega    : [],
    };
    console.log("[fotos] normalizeFotos output recepcion:", result.recepcion);
    return result;
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
    fecha_entrega_real: r.fechaEntregaReal || "",
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
    fechaEntregaReal: row.fecha_entrega_real || "",
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

async function dbLoadOne(id) {
  const { data, error } = await _db
    .from("reparaciones")
    .select("*")
    .eq("id", id)
    .single();
  if (error) { console.error("Error cargando reparacion:", error); return null; }
  console.log("[fotos] dbLoadOne raw data.fotos:", JSON.stringify(data.fotos));
  return rowToRepair(data);
}

async function dbInsert(repair) {
  const { data, error } = await _db.from("reparaciones").insert(repairToRow(repair)).select().single();
  if (error) { console.error("Error insertando reparacion:", error); return null; }
  return rowToRepair(data);
}

async function dbUpsert(repair) {
  const { error } = await _db
    .from("reparaciones")
    .upsert(repairToRow(repair), { onConflict: "id" });
  if (error) console.error("Error actualizando reparacion:", error);
}

async function dbUpsertAndReturn(repair) {
  const { data, error } = await _db
    .from("reparaciones")
    .upsert(repairToRow(repair), { onConflict: "id" })
    .select()
    .single();
  if (error) { console.error("Error actualizando reparacion:", error); return null; }
  return rowToRepair(data);
}

async function dbUpdateFotos(id, fotos) {
  console.log("[fotos] dbUpdateFotos id:", id, "fotos:", JSON.stringify(fotos));
  const { data, error } = await _db
    .from("reparaciones")
    .update({ fotos })
    .eq("id", id)
    .select("id, fotos")
    .single();
  if (error) { console.error("[fotos] dbUpdateFotos error:", error); return null; }
  console.log("[fotos] dbUpdateFotos guardado OK:", JSON.stringify(data.fotos));
  return normalizeFotos(data.fotos);
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

// ── Inventario ───────────────────────────────────────────

function rowToItem(row) {
  return {
    id: row.id,
    nombre: row.nombre || "",
    categoria: row.categoria || "Repuesto",
    descripcion: row.descripcion || "",
    proveedor: row.proveedor || "",
    precioCosto: Number(row.precio_costo || 0),
    precioVenta: Number(row.precio_venta || 0),
    esChipImei: Boolean(row.es_chip_imei),
    sku: row.sku || "",
    stock: Number(row.stock || 0),
    stockMinimo: Number(row.stock_minimo || 0),
  };
}

function itemToRow(item) {
  return {
    id: item.id,
    nombre: item.nombre || "",
    categoria: item.categoria || "Repuesto",
    descripcion: item.descripcion || "",
    proveedor: item.proveedor || "",
    precio_costo: Number(item.precioCosto || 0),
    precio_venta: Number(item.precioVenta || 0),
    es_chip_imei: Boolean(item.esChipImei),
    sku: item.sku || "",
    stock: Number(item.stock || 0),
    stock_minimo: Number(item.stockMinimo || 0),
  };
}

async function dbLoadInventario() {
  const { data, error } = await _db
    .from("inventario")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) {
    console.error("Error cargando inventario:", error);
    return [];
  }
  return data.map(rowToItem);
}

async function dbInsertItem(item) {
  const row = itemToRow(item);
  delete row.id;
  const { data, error } = await _db.from("inventario").insert(row).select().single();
  if (error) { console.error("Error insertando item:", error); return null; }
  return rowToItem(data);
}

async function dbUpsertItem(item) {
  const { data, error } = await _db
    .from("inventario")
    .upsert(itemToRow(item), { onConflict: "id" })
    .select()
    .single();
  if (error) { console.error("Error actualizando item:", error); return null; }
  return rowToItem(data);
}

async function dbDeleteItem(id) {
  const { error } = await _db.from("inventario").delete().eq("id", id);
  if (error) console.error("Error eliminando item:", error);
}

// ===== MOVIMIENTOS =====

function rowToMovimiento(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    descripcion: row.descripcion,
    categoria: row.categoria,
    tipo: row.tipo,
    monto: Number(row.monto || 0),
    reparacionId: row.reparacion_id || null,
  };
}

function movimientoToRow(m) {
  return {
    fecha: m.fecha,
    descripcion: m.descripcion,
    categoria: m.categoria,
    tipo: m.tipo,
    monto: Number(m.monto || 0),
    reparacion_id: m.reparacionId || null,
  };
}

async function dbLoadMovimientos() {
  const { data, error } = await _db
    .from("movimientos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });
  if (error) { console.error("Error cargando movimientos:", error); return []; }
  return data.map(rowToMovimiento);
}

async function dbInsertMovimiento(m) {
  const { data, error } = await _db.from("movimientos").insert(movimientoToRow(m)).select().single();
  if (error) { console.error("Error insertando movimiento:", error); return null; }
  return rowToMovimiento(data);
}

async function dbDeleteMovimiento(id) {
  const { error } = await _db.from("movimientos").delete().eq("id", id);
  if (error) console.error("Error eliminando movimiento:", error);
}

async function dbDeleteMovimientosByReparacion(reparacionId) {
  const { error } = await _db.from("movimientos").delete().eq("reparacion_id", reparacionId);
  if (error) console.error("Error eliminando movimientos de reparacion:", error);
}

async function dbSyncIngresoMovimiento(repair, costoFinal) {
  await _db.from("movimientos").delete().eq("reparacion_id", repair.id).eq("categoria", "Reparación");
  return await dbInsertMovimiento({
    fecha: repair.cierre?.fechaFinalizacion || new Date().toISOString().slice(0, 10),
    descripcion: `Reparación #${repair.id} — ${repair.cliente}`,
    categoria: "Reparación",
    tipo: "ingreso",
    monto: costoFinal,
    reparacionId: repair.id,
  });
}

async function dbSyncGastosMovimiento(repair, total) {
  await _db.from("movimientos").delete().eq("reparacion_id", repair.id).eq("categoria", "Gasto de reparación");
  if (total <= 0) return null;
  return await dbInsertMovimiento({
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: `Gastos reparación #${repair.id} — ${repair.cliente}`,
    categoria: "Gasto de reparación",
    tipo: "egreso",
    monto: total,
    reparacionId: repair.id,
  });
}
