"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const passwordRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/;
    if (!passwordRegex.test(password)) {
      setError('La contraseña debe tener más de 8 caracteres, al menos una mayúscula y un carácter especial.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/dev/auth/register' : '/dev/auth/login';
      const bodyPayload = isRegister
        ? { nombre_completo: nombreCompleto, correo, password }
        : { correo, password };

      const res = await fetch(`https://073uvgd1q2.execute-api.us-east-1.amazonaws.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error en autenticación');
      }

      if (isRegister) {
        setSuccessMsg('¡Usuario registrado! Ahora puedes iniciar sesión.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Guardar token y redireccionar
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute top-[-10%] md:top-[-20%] left-[-10%] md:left-[-5%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] md:bottom-[-20%] right-[-10%] md:right-[-5%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-1000"></div>

      <div className="w-full max-w-md z-10 glass-panel rounded-2xl p-8 md:p-12 transform transition-all hover:scale-[1.01] duration-500">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-2">
            Portal Digital
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegister ? 'Crea una cuenta para administrar estudiantes' : 'Ingresa tus credenciales para continuar'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {isRegister && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Nombre Completo</label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required={isRegister}
                className="w-full px-4 py-3 rounded-xl input-glass placeholder-gray-500"
                placeholder="Ej. Juan Pérez"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Correo Electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl input-glass placeholder-gray-500"
              placeholder="profesor@escuela.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-gray-300">Contraseña</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl input-glass placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/30 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Procesando...' : (isRegister ? 'Registrar Usuario' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-indigo-400 hover:text-white transition-colors"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Registrate aquí'}
          </button>
        </div>

      </div>
    </main>
  );
}
