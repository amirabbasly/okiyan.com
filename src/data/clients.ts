/**
 * Client / partner brands for the homepage logo wall.
 *
 * REVIEW BEFORE LAUNCH — two points the business owner must confirm:
 *  1) Each brand below must actually be a client (or a documented partner) and
 *     the owner must have permission to display its name and logo.
 *  2) `logo` expects an image file in `public/clients/<file>.svg` (or .png).
 *     While it is missing, the wall renders a neutral typographic lockup
 *     (`mark` + name) so the layout never breaks.
 *
 * `mark` picks one of the geometric monograms drawn in Clients.astro; it keeps
 * the wall visually consistent until real logo files are dropped in.
 */
export type ClientMark = 'ring' | 'square' | 'hex' | 'chevron' | 'wave' | 'bolt' | 'grid' | 'diamond';

export interface Client {
  name: string;
  /** Optional official logo file, e.g. '/clients/samsung.svg'. */
  logo?: string;
  mark: ClientMark;
  /** Wider letter-spacing reads as a logotype. */
  tracking?: 'wide' | 'normal';
}

export const clients: Client[] = [
  { name: 'Samsung', mark: 'ring' },
  { name: 'Bosch', mark: 'hex' },
  { name: 'Siemens', mark: 'square' },
  { name: 'Philips', mark: 'diamond' },
  { name: 'Panasonic', mark: 'wave', tracking: 'normal' },
  { name: 'LG', mark: 'ring', tracking: 'wide' },
  { name: 'Schneider Electric', mark: 'grid', tracking: 'normal' },
  { name: 'ABB', mark: 'chevron', tracking: 'wide' },
  { name: 'Honeywell', mark: 'bolt', tracking: 'normal' },
  { name: 'Caterpillar', mark: 'chevron', tracking: 'normal' },
  { name: 'Sony', mark: 'diamond', tracking: 'wide' },
  { name: 'Xiaomi', mark: 'square', tracking: 'normal' },
  { name: 'Miele', mark: 'wave', tracking: 'wide' },
  { name: 'Kärcher', mark: 'bolt', tracking: 'normal' },
];
