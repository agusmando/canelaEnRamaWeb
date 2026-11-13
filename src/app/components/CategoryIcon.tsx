import {
  Apple,
  Bean,
  Candy,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Droplets,
  Flame,
  Leaf,
  Nut,
  Package,
  Pill,
  Snowflake,
  Sparkles,
  Sprout,
  Wheat,
  WheatOff,
  type LucideIcon,
} from 'lucide-react';
import { normalize } from '../lib/shop';

/** Ícono por categoría (por palabra clave del nombre). */
const RULES: [string[], LucideIcon][] = [
  [['sin tacc', 'sin gluten', 'celiac'], WheatOff],
  [['fruto', 'nuez', 'almendra'], Nut],
  [['harina', 'cereal'], Wheat],
  [['grano', 'legumbre', 'poroto'], Bean],
  [['especia', 'condimento'], Flame],
  [['semilla'], Sprout],
  [['infusion', 'te ', 'yerba', 'cafe'], Coffee],
  [['bebida', 'jugo'], CupSoda],
  [['aceite', 'salsa'], Droplets],
  [['dulce', 'golosina', 'chocolate'], Candy],
  [['reposteria', 'galleti'], Cookie],
  [['panificado', 'pan'], Croissant],
  [['cosmetic'], Sparkles],
  [['suplemento', 'vitamina'], Pill],
  [['congelado'], Snowflake],
  [['fresco', 'fruta', 'verdura'], Apple],
  [['organico', 'natural'], Leaf],
];

export function iconForCategory(name: string): LucideIcon {
  const n = normalize(name) + ' ';
  return RULES.find(([keys]) => keys.some((k) => n.includes(k)))?.[1] ?? Package;
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconForCategory(name);
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
