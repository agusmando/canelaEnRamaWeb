/** Datos del local (configurables por variables de entorno). */
export const CONTACT = {
  address: 'Colombia 1268, Godoy Cruz, Mendoza',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Colombia+1268,+Godoy+Cruz,+Mendoza',
  mapsEmbed: 'https://www.google.com/maps?q=Colombia+1268,+Godoy+Cruz,+Mendoza&output=embed',
  phone: '+54 9 261 579-0124',
  whatsapp: import.meta.env.VITE_WHATSAPP || '5492615790124',
  instagram: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/',
  facebook: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/',
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
