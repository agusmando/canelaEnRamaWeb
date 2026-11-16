import { NavLink, Outlet, useNavigate } from 'react-router';
import { LogOut, MapPin, Package, User } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useAppDispatch, useAppSelector } from '../store';
import { signOut } from '../store/authSlice';
import { cn, formatDate } from '../lib/utils';

/** Layout de "Mi cuenta" con navegación lateral. */
export default function Account() {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const name = user.name?.trim() || user.email?.split('@')[0] || 'Cliente';
  const link = ({ isActive }: { isActive: boolean }) =>
    cn('flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 whitespace-nowrap text-[15px] transition-colors', isActive ? 'bg-brand-50 font-medium text-brand-600' : 'text-ink-700 hover:bg-ink-50');

  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: 'Mi cuenta' }]} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <aside className="min-w-0 space-y-6">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-600 uppercase">{name[0]}</span>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink-800">Hola, {name.split(' ')[0]}</p>
              <p className="truncate text-sm text-ink-500">Cliente desde {formatDate(user.createdAt)}</p>
            </div>
          </div>
          <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            <NavLink to="/mi-cuenta" end className={link}>
              <User className="size-4" /> Mis datos
            </NavLink>
            <NavLink to="/mi-cuenta/domicilio" className={link}>
              <MapPin className="size-4" /> Mi domicilio
            </NavLink>
            <NavLink to="/mi-cuenta/pedidos" className={link}>
              <Package className="size-4" /> Mis pedidos
            </NavLink>
            <button
              aria-label="Cerrar sesión"
              className={cn(link({ isActive: false }), 'ml-auto shrink-0 lg:ml-0')}
              onClick={async () => {
                await dispatch(signOut());
                navigate('/');
              }}
            >
              <LogOut className="size-4" /> <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
