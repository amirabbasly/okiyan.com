/**
 * Client / partner brands for the homepage logo wall.
 *
 * REVIEW BEFORE LAUNCH — the business owner must confirm each brand is a client
 * (or a documented partner) and that the site may display its mark.
 *
 * The files in `public/clients/` were extracted from the logo wall supplied by the
 * owner. They are normalised PNGs: white paper made transparent, ink re-toned to the
 * site's slate so light marks stay visible on the white cards, and every file capped
 * at the same height. Replacing a file updates the wall; `Clients.astro` sizes each
 * logo by height and caps the width, so a new lockup drops in without layout work.
 *
 * `mark` (a geometric monogram drawn in Clients.astro) is only a fallback for an
 * entry that has no `logo` file yet.
 */
export type ClientMark = 'ring' | 'square' | 'hex' | 'chevron' | 'wave' | 'bolt' | 'grid' | 'diamond';

export interface Client {
  /** Alt text for the logo; kept even when the mark is purely decorative. */
  name: string;
  /** Official logo file in `public/clients/`, e.g. '/clients/zoom.png'. */
  logo?: string;
  /** Drawn monogram, used only while `logo` is missing. */
  mark?: ClientMark;
  /** Wider letter-spacing reads as a logotype (fallback mark only). */
  tracking?: 'wide' | 'normal';
}

/**
 * The real client logos from the wall the site owner supplied. The files are
 * normalised PNGs (ink re-toned to the site's slate, height-capped) so every
 * mark sits on the same visual baseline; replace a file to update a brand.
 */
export const clients: Client[] = [
  { name: 'پخش خزر', logo: '/clients/khazar.png' },
  { name: 'سرمایه‌گذاری ایران و شرق', logo: '/clients/iran-shargh.png' },
  { name: 'DMBoard', logo: '/clients/dmboard.png' },
  { name: 'پویا', logo: '/clients/pooya.png' },
  { name: 'هاتی', logo: '/clients/hati.png' },
  { name: 'سان', logo: '/clients/san.png' },
  { name: 'لیان', logo: '/clients/lian.png' },
  { name: 'مهستان', logo: '/clients/mahestan.png' },
  { name: 'پیکان', logo: '/clients/peykan.png' },
  { name: 'زی‌لند', logo: '/clients/ziland.png' },
  { name: 'ZOOMIT', logo: '/clients/zoomit.png' },
  { name: 'پارس‌ای‌اچ', logo: '/clients/parseh.png' },
  { name: 'کالای ایرانی', logo: '/clients/kalaa-irani.png' },
];
