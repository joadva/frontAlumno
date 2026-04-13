"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [alumnoAReactivar, setAlumnoAReactivar] = useState(null);
  const [isReactivating, setIsReactivating] = useState(false);

  // Agregar para Edicion In-Line Modal
  const [grados, setGrados] = useState([]);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Tabs & Paginacion
  const [tabActiva, setTabActiva] = useState('directorio');
  const [alumnosReprobados, setAlumnosReprobados] = useState([]);
  const [paginaBase, setPaginaBase] = useState(1);
  const [paginaReprobado, setPaginaReprobado] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const LIMIT_REPRO = 10;

  const fetchAlumnos = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/alumno${query ? `?q=${query}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (res.ok) {
        setAlumnos(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReprobados = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/reprobados`, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (res.ok) setAlumnosReprobados(result.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const fetchCatalogos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/catalogos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data.grados) setGrados(data.data.grados);
    } catch (e) { }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');

    fetchCatalogos();
    if (tabActiva === 'directorio') fetchAlumnos();
    else fetchReprobados();
  }, [router, fetchAlumnos, fetchReprobados, fetchCatalogos, tabActiva]);

  // Manejador del Modal Edit
  const handleSaveProfile = async () => {
    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/alumno/${alumnoEditando.id_alumno}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(alumnoEditando)
      });
      setAlumnoEditando(null);
      fetchAlumnos(busqueda);
    } catch (e) {
      alert("Error al actualizar");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPaginaBase(1);
    fetchAlumnos(busqueda);
  };

  const paginarData = (lista, currentPg, limit) => lista.slice((currentPg - 1) * limit, currentPg * limit);
  const totalPagesBase = Math.ceil(alumnos.length / porPagina);
  const totalPagesRepro = Math.ceil(alumnosReprobados.length / LIMIT_REPRO);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <main className="min-h-screen p-6 md:p-12 relative overflow-hidden flex flex-col items-center">
      <div className="fixed top-[-10%] md:top-[-20%] left-[-10%] md:left-[-5%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none"></div>

      <nav className="w-full max-w-5xl z-10 flex justify-between items-center mb-8 glass-panel p-4 rounded-2xl">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
            P
          </div>
          <span className="font-semibold text-lg">Portal Admin</span>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => router.push('/dashboard/nuevo')} className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors text-white font-medium">
            + Nuevo Alumno
          </button>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
            Salir
          </button>
        </div>
      </nav>

      {/* MODAL REACTIVACION */}
      {alumnoAReactivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-indigo-500/30 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-3xl mb-4 shadow-inner shadow-indigo-500/50">
              ♻️
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">¿Reingresar Alumno?</h3>
            <p className="text-sm text-gray-400 mb-6">El expediente del alumno volverá a estar activo en tu directorio principal.</p>

            <div className="flex space-x-3 w-full">
              <button onClick={() => setAlumnoAReactivar(null)} disabled={isReactivating} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setIsReactivating(true);
                  try {
                    const token = localStorage.getItem('token');
                    await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/alumno/reactivar/${alumnoAReactivar}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
                    setAlumnoAReactivar(null);
                    fetchAlumnos(busqueda);
                  } catch (e) {
                    console.error("Falla al reactivar");
                  } finally {
                    setIsReactivating(false);
                  }
                }}
                disabled={isReactivating}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {isReactivating ? '⏳' : 'Sí, reingresar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL RAPIDO */}
      {alumnoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md shadow-2xl border border-indigo-500/30">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Editar Perfil Rápido</h3>
              <button onClick={() => setAlumnoEditando(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-5 mb-6">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Nombre(s)</label>
                <input type="text" value={alumnoEditando.nombre} onChange={e => setAlumnoEditando({ ...alumnoEditando, nombre: e.target.value })} className="w-full input-glass rounded-xl p-3 text-sm text-white" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Ap. Paterno</label>
                  <input type="text" value={alumnoEditando.apellido_paterno} onChange={e => setAlumnoEditando({ ...alumnoEditando, apellido_paterno: e.target.value })} className="w-full input-glass rounded-xl p-3 text-sm text-white" />
                </div>
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Ap. Materno</label>
                  <input type="text" value={alumnoEditando.apellido_materno || ''} onChange={e => setAlumnoEditando({ ...alumnoEditando, apellido_materno: e.target.value })} className="w-full input-glass rounded-xl p-3 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Grado Escolar</label>
                <select className="w-full input-glass rounded-xl p-3 text-sm text-yellow-500 [&>option]:bg-gray-900" value={alumnoEditando.id_grado || ''} onChange={e => setAlumnoEditando({ ...alumnoEditando, id_grado: e.target.value })}>
                  {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold ml-1 mb-1 block">Estatus</label>
                <select
                  className={`w-full input-glass rounded-xl p-3 text-sm font-semibold [&>option]:bg-gray-900 ${alumnoEditando.estatus === 'INACTIVO' ? 'text-red-400' :
                    alumnoEditando.estatus === 'SUSPENDIDO' ? 'text-yellow-400' : 'text-green-400'
                    }`}
                  value={alumnoEditando.estatus || 'ACTIVO'}
                  onChange={e => setAlumnoEditando({ ...alumnoEditando, estatus: e.target.value })}
                >
                  <option value="ACTIVO">✅ ACTIVO</option>
                  <option value="SUSPENDIDO">⚠️ SUSPENDIDO</option>
                  <option value="INACTIVO">❌ INACTIVO</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={loadingAction}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 text-white transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {loadingAction ? '⏳ Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl z-10 space-y-6">
        {/* TABS NAVEGACIÓN */}
        <div className="flex space-x-2 bg-black/40 p-2 rounded-2xl w-fit mb-4 border border-white/5 mx-auto">
          <button onClick={() => { setTabActiva('directorio'); setPaginaBase(1); }} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tabActiva === 'directorio' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Directorio Principal</button>
          {/* <button onClick={() => { setTabActiva('reprobados'); setPaginaReprobado(1); }} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tabActiva === 'reprobados' ? 'bg-red-500 hover:bg-red-600 border border-red-500/50 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'}`}>⚠️ Alumnos Reprobados</button> */}
        </div>

        {/* Barra de Búsqueda */}
        <div className="glass-panel p-6 rounded-2xl">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <input
              type="text"
              placeholder="Buscar por matrícula, nombre o apellido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl input-glass"
            />
            <button type="submit" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors border border-white/10">
              Buscar
            </button>
          </form>
        </div>

        {/* MÓDULO DIRECTORIO GENERAL */}
        {tabActiva === 'directorio' && (
          <div className="glass-panel rounded-2xl overflow-hidden p-6">
            <h2 className="text-xl font-bold mb-4">Directorio de Alumnos Flexibles</h2>
            {loading ? (
              <p className="text-gray-400 animate-pulse">Cargando registros...</p>
            ) : alumnos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-black/40 text-gray-400 font-medium">
                    <tr>
                      <th className="p-4 rounded-tl-lg">Matrícula</th>
                      <th className="p-4">Nombre Completo</th>
                      <th className="p-4">Estatus</th>
                      <th className="p-4 text-center rounded-tr-lg">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginarData(alumnos, paginaBase, porPagina).map(al => {
                      const isBaja = Number(al.activo) === 0;
                      const esInactivo = al.estatus === 'INACTIVO' || isBaja;
                      const esSuspendido = al.estatus === 'SUSPENDIDO';
                      const puedeRegistrar = !esInactivo && !esSuspendido;

                      // Color dinámico del badge
                      let badgeClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
                      let badgeText = al.estatus || 'ACTIVO';
                      if (esInactivo) {
                        badgeClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
                        badgeText = isBaja ? 'DADO DE BAJA' : 'INACTIVO';
                      } else if (esSuspendido) {
                        badgeClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
                        badgeText = 'SUSPENDIDO';
                      }

                      return (
                        <tr
                          key={al.id_alumno}
                          className={`hover:bg-white/5 transition-colors group ${esInactivo ? 'opacity-50' : 'cursor-pointer'}`}
                        >
                          <td className="p-4 font-mono text-indigo-300 text-xs">{al.identificador_alumno}</td>
                          <td className="p-4 font-medium group-hover:text-indigo-200 transition-colors">
                            {al.nombre} {al.apellido_paterno} {al.apellido_materno}
                            {esInactivo && <span className="ml-2 text-xs text-red-500 font-bold">(Inactivo)</span>}
                            {esSuspendido && <span className="ml-2 text-xs text-yellow-500 font-bold">(Suspendido)</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </td>
                          <td className="p-4 flex items-center justify-center space-x-2">
                            {!isBaja ? (
                              <>
                                <button onClick={() => setAlumnoEditando({ ...al })} className="text-blue-400 hover:text-white bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all font-bold text-xs" title="Edición Rápida">
                                  ✎ Editar
                                </button>
                                <button
                                  onClick={() => puedeRegistrar && router.push(`/dashboard/alumno/${al.id_alumno}`)}
                                  disabled={!puedeRegistrar}
                                  className={`px-4 py-1.5 rounded-lg font-bold text-xs border transition-all ${puedeRegistrar ? 'text-gray-400 hover:text-white bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer' : 'text-gray-600 bg-white/[0.02] border-white/5 cursor-not-allowed opacity-40'}`}
                                  title={!puedeRegistrar ? 'Alumno inactivo o suspendido' : ''}
                                >
                                  Registrar Notas →
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setAlumnoAReactivar(al.id_alumno)} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all">
                                Reactivar
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-black/20 rounded-xl border border-white/5">
                <p className="text-gray-400">No se encontraron alumnos con ese criterio.</p>
              </div>
            )}

            {/* PAGINADOR BASE */}
            {!loading && alumnos.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-white/5 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Mostrar:</span>
                  <select
                    value={porPagina}
                    onChange={e => { setPorPagina(Number(e.target.value)); setPaginaBase(1); }}
                    className="bg-white/5 border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-xs text-gray-500">
                    {Math.min((paginaBase - 1) * porPagina + 1, alumnos.length)}–{Math.min(paginaBase * porPagina, alumnos.length)} de {alumnos.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPaginaBase(p => Math.max(1, p - 1))} disabled={paginaBase === 1} className="px-3 py-1.5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">←</button>
                  {Array.from({ length: totalPagesBase }, (_, i) => i + 1).map(num => (
                    <button key={num} onClick={() => setPaginaBase(num)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${num === paginaBase ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/10'}`}>{num}</button>
                  ))}
                  <button onClick={() => setPaginaBase(p => Math.min(totalPagesBase, p + 1))} disabled={paginaBase === totalPagesBase || totalPagesBase === 0} className="px-3 py-1.5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">→</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MÓDULO ALUMNOS EN RIESGO */}
        {tabActiva === 'reprobados' && (
          <div className="glass-panel rounded-2xl overflow-hidden p-6 border-red-500/10">
            <h2 className="text-xl font-bold mb-4 text-red-400">Alertas Académicas Acumuladas</h2>
            {loading ? (
              <p className="text-gray-400 animate-pulse">Analizando calificaciones...</p>
            ) : alumnosReprobados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-red-500/10 text-red-300 font-medium border-b border-red-500/20">
                    <tr>
                      <th className="p-4">Matrícula</th>
                      <th className="p-4">Alumno</th>
                      <th className="p-4">Materia Deficiente</th>
                      <th className="p-4 text-center">Periodo</th>
                      <th className="p-4 text-center">Calificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-500/10">
                    {paginarData(alumnosReprobados, paginaReprobado, LIMIT_REPRO).map((rep, idx) => (
                      <tr key={idx} className="hover:bg-red-500/5 transition-colors cursor-pointer group" onClick={() => router.push(`/dashboard/alumno/${rep.id_alumno}`)}>
                        <td className="p-4 font-mono text-red-300/70 text-xs">{rep.identificador_alumno}</td>
                        <td className="p-4 font-medium text-white">{rep.nombre} {rep.apellido_paterno}</td>
                        <td className="p-4 text-orange-300">{rep.nombre_materia}</td>
                        <td className="p-4 text-center text-gray-400">{rep.nombre_mes}</td>
                        <td className="p-4 text-center">
                          <span className="bg-red-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg shadow-red-500/40">
                            {Number(rep.calificacion).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-green-500/5 rounded-xl border border-green-500/10 shadow-inner">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-green-400 font-bold">¡Excelente! Ningún alumno tiene materias reprobadas.</p>
              </div>
            )}

            {/* PAGINADOR REPROBADOS */}
            {!loading && alumnosReprobados.length > LIMIT_REPRO && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-red-500/10">
                <button onClick={() => setPaginaReprobado(p => Math.max(1, p - 1))} disabled={paginaReprobado === 1} className="px-4 py-2 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">&larr; Anterior</button>
                <span className="text-sm font-medium text-red-500/60">Pág {paginaReprobado} de {totalPagesRepro}</span>
                <button onClick={() => setPaginaReprobado(p => Math.min(totalPagesRepro, p + 1))} disabled={paginaReprobado === totalPagesRepro} className="px-4 py-2 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Siguiente &rarr;</button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
