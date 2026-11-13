import { Link } from 'react-router';
import logo from '@/assets/logo.png';
import logoWhite from '@/assets/logo-white.png';
import { cn } from '../lib/utils';

export function Logo({ variant = 'brand', className }: { variant?: 'brand' | 'white'; className?: string }) {
  return (
    <Link to="/" aria-label="Canela en Rama · Inicio" className={cn('inline-block shrink-0', className)}>
      <img src={variant === 'white' ? logoWhite : logo} alt="Canela en Rama" className="h-full w-auto" draggable={false} />
    </Link>
  );
}
