import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import {
  ChevronDown,
  Heart,
  Home,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Package,
  Percent,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  User,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCartQuery, useCategoriesQuery } from '../api/shopApi';
import { useAppDispatch, useAppSelector, useCartKey } from '../store';
import { signOut } from '../store/authSlice';
import { slugify } from '../lib/shop';
import { cn, formatCurrency } from '../lib/utils';
import { CategoryIcon } from './CategoryIcon';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/productos', label: 'Productos', icon: ShoppingBag },
  { to: '/ofertas', label: 'Ofertas', icon: Percent },
  { to: '/envios', label: 'Envíos', icon: Truck },
  { to: '/contacto', label: 'Contacto', icon: Mail },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative inline-flex items-center gap-1.5 px-3 py-3 text-[15px] transition-colors hover:text-brand-500',
    'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-500 after:transition-transform',
    isActive ? 'font-medium text-brand-500 after:scale-x-100' : 'text-ink-800 after:scale-x-0 hover:after:scale-x-100',
  );

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="bg-ink-800 text-white">
        <p className="no-scrollbar mx-auto flex max-w-[1440px] items-center justify-center gap-5 overflow-x-auto px-4 py-1.5 text-xs whitespace-nowrap sm:text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="size-3.5 text-brand-300" /> Envíos en el Gran Mendoza
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Store className="size-3.5 text-brand-300" /> Retiro sin cargo en Godoy Cruz
          </span>
          <Link to="/ofertas" className="hidden items-center gap-1.5 font-medium hover:underline md:inline-flex">
            <Percent className="size-3.5 text-leaf-500" /> Ofertas de la semana
          </Link>
        </p>
      </div>

      <div className="border-b border-ink-200">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-2 px-3 sm:h-[76px] sm:gap-6 sm:px-8">
          <button className="btn-icon md:hidden" aria-label="Abrir menú" onClick={() => setMobileOpen(true)}>
            <Menu className="size-6" />
          </button>
          <Logo className="h-8 sm:h-11" />
          <SearchBox className="mx-auto hidden w-full max-w-[480px] md:block" />
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5 md:ml-0">
            <FavoritesButton />
            <UserMenu />
            <CartButton />
          </div>
        </div>
      </div>

      <div className="border-b border-ink-100 px-4 pb-3 md:hidden">
        <SearchBox className="pt-3" />
      </div>

      <nav aria-label="Principal" className="hidden border-b border-ink-100 md:block">
        <ul className="flex items-center justify-center gap-2 lg:gap-6">
          {NAV.slice(0, 2).map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.end} className={navClass}>
                {n.label}
              </NavLink>
            </li>
          ))}
          <li>
            <CategoriesMenu />
          </li>
          {NAV.slice(2).map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} className={navClass}>
                {n.to === '/ofertas' && <Percent className="size-4 rounded-full bg-leaf-500 p-0.5 text-white" strokeWidth={3} />}
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </header>
  );
}

// ---------------------------------------------------------------- Categorías

function CategoriesMenu() {
  const { data: categories } = useCategoriesQuery();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const timer = useRef<number>(undefined);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const hover = (v: boolean) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(v), v ? 60 : 160);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      <button
        className={cn('flex items-center gap-1.5 px-3 py-3 text-[15px] hover:text-brand-500', open ? 'text-brand-500' : 'text-ink-800')}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        Categorías <ChevronDown className={cn('size-4 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 z-50 w-[min(720px,90vw)] -translate-x-1/2 pt-1 animate-fade-in">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-ink-200 bg-white p-3 shadow-lift">
            {(categories ?? []).map((c) => (
              <Link
                key={c.id}
                to={`/productos?categoria=${slugify(c.name)}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-600"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-brand-100 text-brand-500">
                  <CategoryIcon name={c.name} className="size-4" />
                </span>
                {c.name}
              </Link>
            ))}
            <Link to="/productos" className="col-span-3 mt-1 flex items-center gap-2 rounded-lg border-t border-ink-100 px-3 pt-3 pb-1 text-sm font-medium text-brand-500 hover:underline">
              <LayoutGrid className="size-4" /> Ver todos los productos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Usuario

function UserMenu() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname + location.search }}
        aria-label="Ingresar"
        className="btn-icon w-auto gap-2 px-2.5 text-ink-800 lg:px-3.5"
      >
        <UserRound className="size-[22px]" strokeWidth={1.75} />
        <span className="hidden text-left text-xs leading-tight lg:block">
          <span className="block text-ink-500">Hola,</span>
          <span className="block text-sm font-medium">Ingresá</span>
        </span>
      </Link>
    );
  }

  const name = user.name?.trim() || user.email?.split('@')[0] || 'Mi cuenta';
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Menú de usuario"
        className="btn-icon w-auto gap-2 px-1.5 text-ink-800 ring-brand-200 aria-expanded:bg-ink-100 lg:pr-3"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600 uppercase">{name[0]}</span>
        )}
        <span className="hidden max-w-[110px] truncate text-sm font-medium lg:block">{name.split(' ')[0]}</span>
        <ChevronDown className={cn('hidden size-4 text-ink-400 transition-transform lg:block', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-xl border border-ink-200 bg-white p-1.5 shadow-lift animate-fade-in">
          <div className="border-b border-ink-100 px-3 py-2.5">
            <p className="truncate font-medium text-ink-800">{name}</p>
            {user.email && <p className="truncate text-xs text-ink-500">{user.email}</p>}
          </div>
          <Link to="/mi-cuenta" className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
            <User className="size-4" /> Mi cuenta
          </Link>
          <Link to="/mi-cuenta/pedidos" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
            <Package className="size-4" /> Mis pedidos
          </Link>
          <Link to="/favoritos" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
            <Heart className="size-4" /> Favoritos
          </Link>
          <div className="my-1 h-px bg-ink-100" />
          <button
            onClick={async () => {
              await dispatch(signOut());
              navigate('/');
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Carrito

function CartButton() {
  const key = useCartKey();
  const { data: cart } = useCartQuery(key);
  const count = cart?.items.reduce((n, i) => n + (i.selectedBulkOption ? i.quantity : 1), 0) ?? 0;
  return (
    <Link
      to="/carrito"
      className="group flex items-center gap-2.5 rounded-full py-1.5 pr-1.5 pl-2 text-ink-800 transition-colors hover:bg-ink-100 sm:pr-3"
      aria-label={`Carrito, ${count} productos`}
    >
      <span className="relative flex size-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition-transform group-hover:scale-105">
        <ShoppingCart className="size-[18px]" strokeWidth={2} />
        {count > 0 && (
          <span
            key={count}
            className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full bg-ink-800 px-1 text-[10px] font-bold text-white ring-2 ring-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="hidden text-left leading-tight sm:block">
        <span className="block text-xs text-ink-500">Mi carrito</span>
        <span className="block text-sm font-semibold tabular-nums">{formatCurrency(cart?.summary.total ?? 0)}</span>
      </span>
    </Link>
  );
}

function FavoritesButton() {
  const count = useAppSelector((s) => s.prefs.favorites.length);
  return (
    <Link to="/favoritos" aria-label={`Favoritos, ${count}`} title="Favoritos" className="btn-icon relative hidden text-ink-800 sm:inline-flex">
      <Heart className="size-[22px]" strokeWidth={1.75} />
      {count > 0 && (
        <span
          key={count}
          className="absolute top-0.5 right-0.5 flex h-4 min-w-4 animate-pop items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------- Mobile

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { data: categories } = useCategoriesQuery();
  const [catsOpen, setCatsOpen] = useState(false);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <Logo className="h-9" />
          <button onClick={onClose} aria-label="Cerrar menú" className="btn-icon">
            <X className="size-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV.slice(0, 2).map((n) => (
            <MobileLink key={n.to} to={n.to} end={n.end} icon={n.icon}>
              {n.label}
            </MobileLink>
          ))}
          <button
            onClick={() => setCatsOpen((o) => !o)}
            aria-expanded={catsOpen}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base text-ink-800 hover:bg-ink-50"
          >
            <LayoutGrid className="size-5 text-ink-400" /> Categorías
            <ChevronDown className={cn('ml-auto size-5 text-ink-400 transition-transform', catsOpen && 'rotate-180')} />
          </button>
          {catsOpen && (
            <div className="mb-2 grid grid-cols-2 gap-1 pl-4">
              {(categories ?? []).map((c) => (
                <Link key={c.id} to={`/productos?categoria=${slugify(c.name)}`} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-700 hover:bg-brand-50">
                  <CategoryIcon name={c.name} className="size-4 text-brand-500" />
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          {NAV.slice(2).map((n) => (
            <MobileLink key={n.to} to={n.to} icon={n.icon}>
              {n.label}
            </MobileLink>
          ))}
          <div className="my-3 h-px bg-ink-100" />
          <MobileLink to="/favoritos" icon={Heart}>
            Favoritos
          </MobileLink>
          <MobileLink to="/mi-cuenta/pedidos" icon={Package}>
            Mis pedidos
          </MobileLink>
          <MobileLink to="/mi-cuenta" icon={User} end>
            Mi cuenta
          </MobileLink>
        </nav>
      </div>
    </div>
  );
}

function MobileLink({ to, icon: Icon, end, children }: { to: string; icon: LucideIcon; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors', isActive ? 'bg-brand-50 font-medium text-brand-600' : 'text-ink-800 hover:bg-ink-50')
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-5', isActive ? 'text-brand-500' : 'text-ink-400')} />
          {children}
        </>
      )}
    </NavLink>
  );
}
