import { useGoogleReviewsQuery } from '../api/shopApi';
import type { GoogleReviews } from '../api/types';

/**
 * Reseñas públicas de la ficha de Google Maps (Canela en Rama, Colombia 1268),
 * leídas el 25 nov 2026. Si este listado tiene textos, la home y el login
 * muestran estas y no las del API. El login solo rota las de 4 o 5 estrellas.
 */
const FETCHED_AT = '2026-11-25T00:00:00.000Z';

export const STATIC_GOOGLE_REVIEWS: GoogleReviews = {
  place: {
    placeId: null,
    name: 'Canela en Rama',
    rating: 4.9,
    userRatingCount: 74,
    googleMapsUri:
      'https://www.google.com/maps/place/Canela+en+Rama/@-32.905648,-68.8591,17z/data=!4m6!3m5!1s0x967e0912785fe695:0x83cfb8c0a7d58b19',
    lastSyncAt: FETCHED_AT,
    configured: false,
    lastError: null,
  },
  reviews: [
    {
      id: 1,
      googleId: 'maps-laura-sanchez',
      authorName: 'Laura Sánchez',
      authorPhotoUrl: null,
      authorUrl: null,
      rating: 5,
      text: 'Excelente atención y variedad en los productos. Muy buena predisposición.',
      language: 'es',
      relativeTime: 'Hace 4 años',
      publishedAt: null,
      featured: true,
      active: true,
      fetchedAt: FETCHED_AT,
    },
    {
      id: 2,
      googleId: 'maps-carmen-castro',
      authorName: 'Carmen Castro',
      authorPhotoUrl: null,
      authorUrl: null,
      rating: 5,
      text: 'Muy buenos productos, especiales y muy buena atención bss',
      language: 'es',
      relativeTime: 'Hace 4 años',
      publishedAt: null,
      featured: true,
      active: true,
      fetchedAt: FETCHED_AT,
    },
    {
      id: 3,
      googleId: 'maps-joaco-martinez-espejo',
      authorName: 'Joaco Martinez Espejo',
      authorPhotoUrl: null,
      authorUrl: null,
      rating: 3,
      text: 'Buen lugar la atención es excelente y los precios no son malos, no es lo más económico, pero no está mal recomiendo comprar.',
      language: 'es',
      relativeTime: 'Hace 2 años',
      publishedAt: null,
      featured: true,
      active: true,
      fetchedAt: FETCHED_AT,
    },
    {
      id: 4,
      googleId: 'maps-lucas-dominguez',
      authorName: 'Lucas Dominguez',
      authorPhotoUrl: null,
      authorUrl: null,
      rating: 5,
      text: 'Excelente atención! Gran variedad de productos. El pan integral casero es delicioso y con muchas semillas, es por encargue y super fresco! Lo recomiendo.',
      language: 'es',
      relativeTime: 'Hace 6 años',
      publishedAt: null,
      featured: true,
      active: true,
      fetchedAt: FETCHED_AT,
    },
    {
      id: 5,
      googleId: 'maps-melisa-trinajstic',
      authorName: 'Melisa Trinajstic',
      authorPhotoUrl: null,
      authorUrl: null,
      rating: 5,
      text: 'Re lindo! Excelente atención y mucha variedad! Y muy prolijo y ordenado todo!',
      language: 'es',
      relativeTime: 'Hace 6 años',
      publishedAt: null,
      featured: true,
      active: true,
      fetchedAt: FETCHED_AT,
    },
  ],
};

/** Si hay reseñas hardcodeadas con texto, esas se muestran. Si no, las del API. */
export function usePublicGoogleReviews() {
  const query = useGoogleReviewsQuery();
  const hardcoded = STATIC_GOOGLE_REVIEWS.reviews.filter((r) => r.active && r.text?.trim());
  if (hardcoded.length) {
    return { ...query, data: { ...STATIC_GOOGLE_REVIEWS, reviews: hardcoded }, isLoading: false, isFetching: false };
  }
  return query;
}
