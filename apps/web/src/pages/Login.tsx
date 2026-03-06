import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LogoIcon } from '../components/common/LogoIcon';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'operator'>('admin');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Login: Posting to /auth/login');
      const res = await api.post('/auth/login', { email, password });
      console.log('Login: Response data:', res.data);
      const { access_token } = res.data;
      let { user } = res.data;

      if (!access_token) {
        console.error('Login: Missing access_token in response', res.data);
        throw new Error('Invalid response sent from server: missing access_token');
      }

      // Fallback: If user object is missing (stale backend), decode from token
      if (!user) {
        try {
          // Simple base64 decode for JWT payload (part 2)
          const base64Url = access_token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            window
              .atob(base64)
              .split('')
              .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join(''),
          );

          user = JSON.parse(jsonPayload);
          console.log('Decoded user from token:', user);
        } catch (e) {
          console.error('Failed to decode token fallback:', e);
          throw new Error('Invalid response: User data missing and token decode failed');
        }
      }

      login(access_token, user);

      if (user.role === 'CONTRATISTA') {
        navigate('/portal/dashboard');
      } else if (user.role === 'PM') {
        navigate('/field/dashboard');
      } else if (
        user.projectMembers &&
        user.projectMembers.some((m: { role: string }) => m.role === 'FIELD_OPERATOR')
      ) {
        navigate('/field/operator');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      if (err.response) {
        const status = err.response.status;
        console.error(`Technical Error (${status}):`, err.response.data);

        if (status === 401) {
          setError('Correo o contraseña incorrectos.');
        } else if (status === 403) {
          setError('No tienes acceso para iniciar sesión en esta plataforma.');
        } else if (status >= 500) {
          setError(
            'Ocurrió un problema en nuestros servidores. Por favor, intenta de nuevo más tarde.',
          );
        } else {
          setError(`Error no reconocido (${status}). Contáctenos si persiste.`);
        }
      } else if (err.request) {
        setError('No hay respuesta del servidor. Verifica tu conexión o intenta más tarde.');
      } else {
        setError('Ocurrió un error interno al intentar iniciar sesión.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-field-orange">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LogoIcon className="w-12 h-12 shrink-0" />
            <span className="text-4xl tracking-tight flex items-center">
              <span
                className="text-field-blue"
                style={{
                  fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                  fontWeight: '400',
                }}
              >
                Field
              </span>
              <span
                className="text-field-orange"
                style={{ fontFamily: '"Mangal Pro", Mangal, sans-serif', fontWeight: 'bold' }}
              >
                Close
              </span>
            </span>
          </div>
          <p className="text-gray-500 mt-2 font-medium">Gestión de Construcción Profesional</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex mb-6 border-b border-gray-200">
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium transition-colors duration-200 ${
              loginType === 'admin'
                ? 'border-b-2 border-field-blue text-field-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setLoginType('admin')}
          >
            Administrador / PM
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium transition-colors duration-200 ${
              loginType === 'operator'
                ? 'border-b-2 border-field-blue text-field-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setLoginType('operator')}
          >
            Operador de Campo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {loginType === 'admin' ? 'Email' : 'Usuario'}
            </label>
            <input
              type={loginType === 'admin' ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={loginType === 'admin' ? 'ej. admin@demo.com' : 'ej. operador1'}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-field-blue text-white py-3 rounded hover:bg-[#111e33] transition font-bold tracking-wide"
          >
            INICIAR SESIÓN
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-gray-500">
          {loginType === 'admin'
            ? 'Use: admin@demo.com / password123'
            : 'Ingrese credenciales de operador'}
        </div>
      </div>
    </div>
  );
};
