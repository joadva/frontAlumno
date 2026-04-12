"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AlumnoDetalle() {
  const router = useRouter();
  const params = useParams();

  // Datos del Alumno y Notas
  const [alumno, setAlumno] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Catalogos Dinámicos
  const [grados, setGrados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [meses, setMeses] = useState([]);

  // Estado para el Grid de evaluación
  const [mesActivo, setMesActivo] = useState(null);
  const [inputsCalificacion, setInputsCalificacion] = useState({});
  const [editModes, setEditModes] = useState({}); // { id_materia: boolean }

  // Estados para UX Feedback y Modal
  const [loadingSubida, setLoadingSubida] = useState(null);
  const [mensajeSubida, setMensajeSubida] = useState({ type: '', text: '' });
  const isSubmittingNota = useRef(false);

  // Modal Historial y Confirmacion
  const [logs, setLogs] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [modalConfirmarBaja, setModalConfirmarBaja] = useState(false);
  const [notaParaBaja, setNotaParaBaja] = useState(null); // Nuevo estado modal nota

  // Estado para edicion de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formProfile, setFormProfile] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const resCat = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/catalogos`, { headers });
      const catPayload = await resCat.json();

      if (catPayload.success && catPayload.data) {
        const { grados, materias, meses } = catPayload.data;
        if (grados) setGrados(grados);
        if (materias) setMaterias(materias);
        if (meses) {
          setMeses(meses);
          if (meses.length > 0 && !mesActivo) setMesActivo(meses[0].id_mes.toString());
        }
      }

      const resAlp = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/alumno?id_alumno=${params.id}`, { headers });
      const alpData = await resAlp.json();
      if (alpData.data && alpData.data.length > 0) setAlumno(alpData.data[0]);

      const resCal = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/calificacion/${params.id}`, { headers });
      const calData = await resCal.json();
      if (calData.data) setCalificaciones(calData.data);

    } catch (err) {
      console.error("Error al sincronizar datos:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id, mesActivo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Utilidades Generales
  const handleUpdate = async (campoUpdate) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/alumno/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...alumno, ...campoUpdate })
      });
      const data = await res.json();
      if (!data.success) throw new Error("Fallo API");
      await fetchData();
      return true;
    } catch (e) {
      showToast('error', "Fallo de comunicación con el sistema principal.");
      return false;
    }
  };

  const handleSaveProfile = async () => {
    setLoadingSubida(true);
    const profileLimpio = {
      ...formProfile,
      nombre: typeof formProfile.nombre === 'string' ? formProfile.nombre.trim() : formProfile.nombre,
      apellido_paterno: typeof formProfile.apellido_paterno === 'string' ? formProfile.apellido_paterno.trim() : formProfile.apellido_paterno,
      apellido_materno: typeof formProfile.apellido_materno === 'string' ? formProfile.apellido_materno.trim() : formProfile.apellido_materno
    };
    const result = await handleUpdate(profileLimpio);
    if (result) setIsEditingProfile(false);
    setLoadingSubida(false);
  };

  const solicitarBaja = () => {
    setModalConfirmarBaja(true);
  };

  const ejecutarBorrarLogic = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/alumno/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      router.push('/dashboard');
    } catch (e) {
      showToast('error', "Error borrando alumno.");
      setModalConfirmarBaja(false);
    }
  };

  // Creación de Nota Nueva
  const handleGuardarNota = async (idMateria, nombreMateria) => {
    if (isSubmittingNota.current) return;
    const nota = inputsCalificacion[idMateria];
    if (!nota || isNaN(nota) || parseFloat(nota) < 0 || parseFloat(nota) > 10) {
      return showToast('error', 'La calificación debe estar entre 0 y 10');
    }

    setLoadingSubida(idMateria);
    isSubmittingNota.current = true;

    try {
      const token = localStorage.getItem('token');
      await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/calificacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id_alumno: params.id,
          id_grado: parseInt(alumno.id_grado || (grados.length > 0 ? grados[0].id_grado : 1)),
          id_mes: parseInt(mesActivo),
          id_materia: parseInt(idMateria),
          calificacion: parseFloat(nota)
        })
      });

      setInputsCalificacion({ ...inputsCalificacion, [idMateria]: '' });
      await fetchData();
      showToast('success', `¡Nota de ${nombreMateria} subida exitosamente con ${nota}!`);
    } catch (er) {
      showToast('error', 'Error en base de datos.');
    } finally {
      setLoadingSubida(null);
      isSubmittingNota.current = false;
    }
  };

  // Edición de Nota Existente
  const handleUpdateNota = async (idMateria, evaluacionRegistrada, nombreMateria) => {
    if (isSubmittingNota.current) return;
    const notaNueva = inputsCalificacion[idMateria];

    if (!notaNueva || isNaN(notaNueva) || parseFloat(notaNueva) < 0 || parseFloat(notaNueva) > 10) {
      return showToast('error', 'La calificación debe estar entre 0 y 10');
    }
    if (parseFloat(notaNueva) === parseFloat(evaluacionRegistrada.calificacion)) {
      setEditModes({ ...editModes, [idMateria]: false });
      return; // No hubo cambios reales
    }

    setLoadingSubida(idMateria);
    isSubmittingNota.current = true;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/calificacion/${evaluacionRegistrada.id_calificacion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          calificacion: parseFloat(notaNueva)
        })
      });

      const payload = await res.json();
      if (!payload.success) throw new Error(payload.message || "Falla nativa en BD");

      setEditModes({ ...editModes, [idMateria]: false }); // Cerrar modo edicion
      setInputsCalificacion({ ...inputsCalificacion, [idMateria]: '' });
      await fetchData();
      showToast('success', `¡Auditoría: Nota de ${nombreMateria} alterada exitosamente a ${notaNueva}!`);
    } catch (er) {
      showToast('error', `Error backend: ${er.message}`);
    } finally {
      setLoadingSubida(null);
      isSubmittingNota.current = false;
    }
  };

  // Solicitar Baja lógica (Soft Delete) Modal
  const solicitarBajaNota = (idCalificacion, nombreMateria) => {
    setNotaParaBaja({ id: idCalificacion, materia: nombreMateria });
  };

  const ejecutarBajaNotaLogic = async () => {
    if (!notaParaBaja) return;
    setLoadingSubida(true); // Bloquear UI general
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/calificacion/${notaParaBaja.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const payload = await res.json();
      if (!payload.success && res.status !== 200) throw new Error(payload.message || "Falla nativa en BD");
      await fetchData();
      showToast('success', `¡Evaluación de ${notaParaBaja.materia} dada de baja exitosamente!`);
    } catch (er) {
      showToast('error', `Error backend: ${er.message}`);
    } finally {
      setNotaParaBaja(null);
      setLoadingSubida(false);
    }
  };

  // Traer Historial para Modal
  const openHistorial = async (idCalificacion) => {
    setLoadingLogs(true);
    setLogs([]); // Abro modal vacio
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/historial/${idCalificacion}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
      }
    } catch (e) {
      showToast('error', "Falla extrayendo el historial de logs.");
      setLogs(null);
    } finally {
      setLoadingLogs(false);
    }
  };

  const closeHistorial = () => setLogs(null);

  const showToast = (type, text) => {
    setMensajeSubida({ type, text });
    setTimeout(() => setMensajeSubida({ type: '', text: '' }), 4000);
  };

  const getNotaGuardada = (idMateria) => {
    return calificaciones.find(c => c.id_materia === idMateria && c.id_mes === parseInt(mesActivo));
  };

  const getNotaGuardadaLocal = (idMateria, idMes) => {
    return calificaciones.find(c => c.id_materia === idMateria && c.id_mes === parseInt(idMes));
  };

  const activarEdicion = (idMateria, valorActual) => {
    setInputsCalificacion({ ...inputsCalificacion, [idMateria]: valorActual });
    setEditModes({ ...editModes, [idMateria]: true });
  };

  // Lógica de examen: Validación de Progreso Lineal Continua
  const isMesBloqueado = (indexIndex) => {
    if (indexIndex === 0) return false; // El primer mes de la base de datos siempre es evaluable

    // Inspeccionamos hacia atrás para garantizar que todos los meses previos estén cerrados al 100%
    for (let i = 0; i < indexIndex; i++) {
      const mesEvaluado = meses[i];
      const isIncompleto = materias.some(mat => !getNotaGuardadaLocal(mat.id_materia, mesEvaluado.id_mes));
      if (isIncompleto) return true; // Cae en cascada bloqueando el resto
    }
    return false;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando conexión con la Base de Datos...</div>;
  if (!alumno) return <div className="min-h-screen flex items-center justify-center text-red-500">Alumno no existe o fue dado de baja.</div>;

  return (
    <main className="min-h-screen p-6 md:p-12 relative flex justify-center">

      {/* MODAL HISTORIAL DE AUDITORÍA */}
      {logs !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-lg shadow-2xl relative border border-white/20">
            <button onClick={closeHistorial} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-xl font-bold mb-1 text-indigo-300">Historial de Modificaciones</h3>
            <p className="text-xs text-gray-400 mb-6">Auditoría transaccional de alteraciones a esta nota.</p>

            {loadingLogs ? (
              <div className="py-8 text-center text-gray-400 animate-pulse">Consultando Logs...</div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-gray-400 bg-white/5 rounded-lg border border-white/5">
                No existen modificaciones previas. Esta nota es original.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-3">
                {logs.map((log, i) => {
                  const esAumento = Number(log.nota_nueva) > Number(log.nota_anterior);
                  const esDisminucion = Number(log.nota_nueva) < Number(log.nota_anterior);
                  return (
                    <div key={i} className="p-3 bg-black/40 rounded-lg border border-white/10 text-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{new Date(log.fecha_cambio).toLocaleString()}</p>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-gray-400 line-through">{Number(log.nota_anterior).toFixed(2)}</span>
                          <span className="text-gray-600">→</span>
                          <span className={esAumento ? 'text-green-400' : (esDisminucion ? 'text-red-400' : 'text-blue-400')}>
                            {Number(log.nota_nueva).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Editado</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACION DE BAJA */}
      {modalConfirmarBaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-red-500/30 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-3xl mb-4 shadow-inner shadow-red-500/50">
              ⚠️
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">¿Dar de baja a este alumno?</h3>
            <p className="text-sm text-gray-400 mb-6">Esta acción desactivará su expediente y lo removerá visualmente del directorio principal.</p>

            <div className="flex space-x-3 w-full">
              <button onClick={() => setModalConfirmarBaja(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors">
                Cancelar
              </button>
              <button onClick={ejecutarBorrarLogic} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 text-white transition-colors">
                Sí, dar de baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACION DE BAJA NOTA */}
      {notaParaBaja !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-red-500/30 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-3xl mb-4 shadow-inner shadow-red-500/50">
              🗑️
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">¿Borrar Evaluación?</h3>
            <p className="text-sm text-gray-400 mb-6">Estás a punto de dar de baja la calificación de <span className="font-bold text-red-400">{notaParaBaja.materia}</span>. Esta acción requiere auditoría directiva.</p>

            <div className="flex space-x-3 w-full">
              <button onClick={() => setNotaParaBaja(null)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors">
                Cancelar
              </button>
              <button onClick={ejecutarBajaNotaLogic} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 text-white transition-colors">
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl z-10 flex flex-col space-y-6">

        {/* Cabecera / Navegacion */}
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white px-4 py-2 border border-white/10 rounded-lg transition-colors">← Volver al Directorio</button>
          <div className="flex space-x-3">
            <button onClick={solicitarBaja} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 transition-colors flex items-center shadow-lg shadow-red-500/10">
              <span className="mr-2">🗑️</span> Dar de Baja (Eliminar)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Panel Izquierdo: Info Alumno */}
          <div className="lg:col-span-1 glass-panel rounded-2xl p-6 h-fit space-y-4 relative">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold">Detalles</h2>
              {!isEditingProfile ? (
                <button onClick={() => { setFormProfile({ nombre: alumno.nombre, apellido_paterno: alumno.apellido_paterno, apellido_materno: alumno.apellido_materno || '', id_grado: alumno.id_grado || '' }); setIsEditingProfile(true); }} className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full hover:bg-blue-500/20 transition-colors">✎ Editar</button>
              ) : (
                <div className="flex space-x-2">
                  <button onClick={() => setIsEditingProfile(false)} className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-full hover:bg-white/10 transition-colors">✕</button>
                  <button onClick={handleSaveProfile} className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full hover:bg-green-500/20 transition-colors">✓ Guardar</button>
                </div>
              )}
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-2xl font-bold mb-3 shadow-lg">
                {alumno?.nombre?.charAt(0) || 'X'}{alumno?.apellido_paterno?.charAt(0) || 'X'}
              </div>

              {!isEditingProfile ? (
                <>
                  <p className="font-semibold text-lg leading-tight break-all">{alumno?.nombre} {alumno?.apellido_paterno} {alumno?.apellido_materno}</p>
                  <div className="mt-2 inline-flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    <span className="text-xs text-gray-500">ID / Matrícula:</span>
                    <span className="text-xs text-indigo-300 font-mono tracking-widest">{alumno.identificador_alumno}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-4 mt-4 text-left">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Nombre(s)</label>
                    <input type="text" maxLength={50} value={formProfile.nombre} onChange={e => setFormProfile({ ...formProfile, nombre: e.target.value })} className="w-full input-glass rounded-xl p-3 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Apellido Paterno</label>
                    <input type="text" maxLength={50} value={formProfile.apellido_paterno} onChange={e => setFormProfile({ ...formProfile, apellido_paterno: e.target.value })} className="w-full input-glass rounded-xl p-3 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Apellido Materno</label>
                    <input type="text" maxLength={50} value={formProfile.apellido_materno} onChange={e => setFormProfile({ ...formProfile, apellido_materno: e.target.value })} className="w-full input-glass rounded-xl p-3 text-sm text-white" />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Grado Escolar</label>
                    <select className="w-full input-glass rounded-xl p-3 text-sm text-yellow-500 [&>option]:bg-gray-900" value={formProfile.id_grado || ''} onChange={e => setFormProfile({ ...formProfile, id_grado: e.target.value })}>
                      {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
                    </select>
                  </div>

                  <div className="pt-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Matrícula (No Editable)</label>
                    <input type="text" value={alumno.identificador_alumno} disabled className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-gray-600 cursor-not-allowed italic" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              {!isEditingProfile ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Grado Escolar</p>
                  <div className="bg-black/20 border border-transparent rounded-lg p-2 text-sm text-yellow-500/70 select-none">
                    {grados.find(g => String(g.id_grado) === String(alumno.id_grado))?.nombre_grado || 'Sin Asignar'}
                  </div>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-gray-400 mb-1">Estatus del Sistema</p>
                <select
                  className="bg-black/40 border border-white/10 rounded-lg p-2 w-full text-sm text-white focus:outline-none"
                  value={alumno.estatus} onChange={(e) => handleUpdate({ estatus: e.target.value })}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                </select>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Matriz de Calificaciones Inteligente con BD Dinámica */}
          <div className="lg:col-span-3 space-y-6">

            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Matriz de Evaluación Continua</h2>
                </div>
                <div className="mt-4 md:mt-0 flex items-center bg-black/30 p-2 rounded-xl border border-white/10">
                  <span className="text-sm font-medium mr-3 ml-2 text-indigo-300">Periodo a Evaluar:</span>
                  <select
                    value={mesActivo || ''}
                    onChange={(e) => setMesActivo(e.target.value)}
                    className="bg-indigo-600 border border-indigo-500 rounded-lg px-4 py-2 text-white font-bold cursor-pointer hover:bg-indigo-500 transition-colors focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white [&>option:disabled]:text-gray-600 [&>option:disabled]:italic shadow-lg shadow-indigo-500/20"
                  >
                    {meses.map((m, idx) => {
                      const bloqueado = isMesBloqueado(idx);
                      return (
                        <option key={m.id_mes} value={m.id_mes} disabled={bloqueado} className="px-2 py-4">
                          {m.nombre_mes} {bloqueado ? '🔒' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              {/* Mensaje Temporal */}
              {mensajeSubida.text && (
                <div className={`mb-6 p-4 rounded-xl border flex justify-center items-center font-medium animate-pulse transition-all shadow-lg ${mensajeSubida.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
                  }`}>
                  {mensajeSubida.type === 'success' ? '✅' : '⚠️'} <span className="ml-2">{mensajeSubida.text}</span>
                </div>
              )}

              {/* Grid de Materias */}
              <div className="overflow-hidden rounded-xl border border-white/10 relative">
                {loadingSubida && <div className="absolute inset-0 z-20 bg-black/20 cursor-wait"></div>}

                <table className="w-full text-left text-sm relative z-10">
                  <thead>
                    <tr className="bg-black/40 text-gray-400 font-medium">
                      <th className="p-4">Asignatura</th>
                      <th className="p-4 w-32 text-center">Calificación</th>
                      <th className="p-4 w-28 text-center hidden md:table-cell">Estatus</th>
                      <th className="p-4 w-40 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {materias.map((mat) => {
                      const evaluacionRegistrada = getNotaGuardada(mat.id_materia);
                      const isEditMode = editModes[mat.id_materia];
                      const isLocked = !!evaluacionRegistrada && !isEditMode;
                      const isUploadingThis = loadingSubida === mat.id_materia;

                      return (
                        <tr key={mat.id_materia} className={`transition-colors ${isLocked ? 'bg-green-900/10' : 'hover:bg-white/5'}`}>
                          <td className="p-4 font-medium flex items-center">
                            {isLocked ? <span className="w-2 h-2 rounded-full bg-green-500 mr-3 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> : <span className="w-2 h-2 rounded-full bg-gray-500 mr-3"></span>}
                            <span className={isLocked ? 'text-white' : 'text-gray-300'}>{mat.nombre_materia}</span>
                          </td>
                          <td className="p-4">
                            {isLocked ? (
                              <div className={`px-3 py-2 rounded-lg text-center text-lg font-bold shadow-inner border ${Number(evaluacionRegistrada.calificacion) <= 5.0 ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
                                {Number(evaluacionRegistrada.calificacion).toFixed(2)}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.01"
                                placeholder="0.00"
                                value={inputsCalificacion[mat.id_materia] || ''}
                                onChange={(e) => setInputsCalificacion({ ...inputsCalificacion, [mat.id_materia]: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg input-glass text-center font-bold text-lg ${isUploadingThis ? 'opacity-50' : 'border-indigo-500/30 focus:border-indigo-400'}`}
                                disabled={isUploadingThis}
                                autoFocus={isEditMode}
                              />
                            )}
                          </td>
                          <td className="p-4 text-center hidden md:table-cell">
                            {isLocked ? (
                              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-md border border-green-500/20">Evaluado</span>
                            ) : isEditMode ? (
                              <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md border border-blue-500/20">Editando</span>
                            ) : (
                              <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">Pendiente</span>
                            )}
                          </td>
                          <td className="p-4 flex items-center justify-center space-x-2">
                            {/* Botón de Acción Principal */}
                            {!evaluacionRegistrada && (
                              <button
                                disabled={isUploadingThis}
                                onClick={() => handleGuardarNota(mat.id_materia, mat.nombre_materia)}
                                className="w-full py-2 px-3 rounded-lg text-sm font-bold transition-all bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 active:scale-95"
                              >
                                Subir Nota
                              </button>
                            )}

                            {/* Botones de Modo Edición */}
                            {evaluacionRegistrada && (
                              <>
                                {isEditMode ? (
                                  <div className="flex space-x-1 w-full">
                                    <button
                                      disabled={isUploadingThis}
                                      onClick={() => handleUpdateNota(mat.id_materia, evaluacionRegistrada, mat.nombre_materia)}
                                      className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${isUploadingThis
                                        ? 'bg-green-400/50 cursor-wait animate-pulse text-white/70'
                                        : 'bg-green-500 hover:bg-green-400 text-white shadow shadow-green-500/20'
                                        }`}
                                      title="Guardar Edición"
                                    > {isUploadingThis ? '⏳' : '✓'} </button>
                                    <button
                                      disabled={isUploadingThis}
                                      onClick={() => setEditModes({ ...editModes, [mat.id_materia]: false })}
                                      className="py-2 px-3 rounded-lg text-xs font-bold bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50"
                                      title="Cancelar"
                                    > ✕ </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2 w-full">
                                    <button
                                      onClick={() => activarEdicion(mat.id_materia, evaluacionRegistrada.calificacion)}
                                      className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-blue-300 transition-colors"
                                    > ✎ Editar </button>

                                    <button
                                      onClick={() => solicitarBajaNota(evaluacionRegistrada.id_calificacion, mat.nombre_materia)}
                                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-white/5 border border-red-500/30 hover:bg-red-500/20 text-red-400 transition-colors"
                                      title="Eliminar Evaluación (Baja lógica)"
                                    > 🗑️ </button>

                                    <button
                                      onClick={() => openHistorial(evaluacionRegistrada.id_calificacion)}
                                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors"
                                      title="Ver Historial (Auditoría)"
                                    > 👁️ </button>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
