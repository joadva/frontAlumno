"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoAlumno() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [grados, setGrados] = useState([]);
  const isSubmitting = useRef(false);

  const [formData, setFormData] = useState({
    identificador_alumno: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    genero: 'H',
    estatus: 'ACTIVO',
    id_grado: ''
  });

  useEffect(() => {
    // Extraer desde BD el catalogo de grados dinamicamente
    const fetchCatalogos = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/catalogos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data.grados) {
          setGrados(data.data.grados);
          if (data.data.grados.length > 0) {
            setFormData(prev => ({ ...prev, id_grado: data.data.grados[0].id_grado }));
          }
        }
      } catch (error) {
        console.error("Error cargando catálogos", error);
      }
    };
    fetchCatalogos();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    
    if (formData.fecha_nacimiento) {
      const selectedYear = parseInt(formData.fecha_nacimiento.split('-')[0], 10);
      const currentYear = new Date().getFullYear();
      if (selectedYear > currentYear) {
        setMensaje({ text: '❌ El año de nacimiento no puede ser mayor al actual', type: 'error' });
        return;
      }
    }
    
    isSubmitting.current = true;
    setLoading(true);
    setMensaje({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://073uvgd1q2.execute-api.us-east-1.amazonaws.com/dev/alumno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          ...formData, 
          identificador_alumno: formData.identificador_alumno.trim().toUpperCase(),
          nombre: formData.nombre.trim(),
          apellido_paterno: formData.apellido_paterno.trim(),
          apellido_materno: formData.apellido_materno ? formData.apellido_materno.trim() : '',
          id_grado: parseInt(formData.id_grado) 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Error al guardar');

      setMensaje({ text: '✅ Alumno registrado', type: 'success' });
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setMensaje({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 relative flex flex-col items-center">
      <div className="w-full max-w-4xl z-10 glass-panel p-4 rounded-2xl mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white px-4 py-2 border border-white/10 rounded-lg">← Volver</button>
        <span className="font-medium mr-4">Alta de Estudiante</span>
      </div>

      <div className="w-full max-w-4xl z-10 glass-panel rounded-2xl p-6 md:p-10 shadow-2xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Registro</h2>
        {mensaje.text && (
          <div className={`mb-6 p-4 rounded-xl border ${mensaje.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{mensaje.text}</div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Matrícula *</label>
            <input type="text" name="identificador_alumno" required maxLength={30} value={formData.identificador_alumno} onChange={handleChange} className="w-full px-4 py-3 rounded-xl input-glass" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Nombre(s) *</label>
            <input type="text" name="nombre" required maxLength={50} value={formData.nombre} onChange={handleChange} className="w-full px-4 py-3 rounded-xl input-glass" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Apellido Paterno *</label>
            <input type="text" name="apellido_paterno" required maxLength={50} value={formData.apellido_paterno} onChange={handleChange} className="w-full px-4 py-3 rounded-xl input-glass" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Apellido Materno</label>
            <input type="text" name="apellido_materno" maxLength={50} value={formData.apellido_materno} onChange={handleChange} className="w-full px-4 py-3 rounded-xl input-glass" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Nacimiento</label>
            <input type="date" name="fecha_nacimiento" max={new Date().toISOString().split('T')[0]} value={formData.fecha_nacimiento} onChange={handleChange} className="w-full px-4 py-3 rounded-xl input-glass text-gray-300" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Grado *</label>
            <select name="id_grado" required value={formData.id_grado} onChange={handleChange} className="w-full px-4 py-3 rounded-xl input-glass [&>option]:bg-gray-900 text-sm">
              {grados.length === 0 && <option value="">Cargando...</option>}
              {grados.map((g) => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-gray-300 ml-1">Estatus</label>
            <select name="estatus" value={formData.estatus} onChange={handleChange} className="w-full px-4 py-3 rounded-xl input-glass [&>option]:bg-gray-900">
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end mt-4">
            <button type="submit" disabled={loading} className="py-3 px-8 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold flex items-center shadow-lg shadow-indigo-500/30 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Guardando...' : 'Crear Registro'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
