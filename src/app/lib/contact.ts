import type { BusinessHour } from '../api/types';

/** Datos del local (configurables por variables de entorno). */
export const CONTACT = {
  address: 'Colombia 1268, Godoy Cruz, Mendoza',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Canela+en+rama',
  mapsEmbed: 'https://www.google.com/maps?q=Canela+en+rama&output=embed',
  phone: '+54 9 261 579-0124',
  whatsapp: import.meta.env.VITE_WHATSAPP || '5492615790124',
  instagram: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/canelaenramamza',
  facebook: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/canelaenramamza',
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

// ---------------------------------------------------------------- Horarios del local

const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * "Lun a Sáb: 09:00 a 13:00 y 16:00 a 21:00 · Dom: cerrado" — agrupa días
 * consecutivos con el mismo horario (mismo formato que usan los mails).
 */
export function formatBusinessHours(hours: BusinessHour[]): string {
  const sig = (h: BusinessHour) => (h.closed ? 'c' : h.ranges.map((r) => `${r.open}-${r.close}`).join('|'));
  const parts: string[] = [];
  let i = 0;
  while (i < hours.length) {
    const h = hours[i];
    let j = i;
    while (j + 1 < hours.length && sig(hours[j + 1]) === sig(h)) j++;
    const label = j > i ? `${DAY_SHORT[i]} a ${DAY_SHORT[j]}` : DAY_SHORT[i];
    parts.push(h.closed ? `${label}: cerrado` : `${label}: ${h.ranges.map((r) => `${r.open} a ${r.close}`).join(' y ')}`);
    i = j + 1;
  }
  return parts.join(' · ');
}
