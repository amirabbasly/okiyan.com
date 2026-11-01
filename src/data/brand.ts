/**
 * OKIYAN brand mark — two interlocking crescents, drawn in the brand palette
 * (deep navy + petrol blue; light grey + light petrol on dark backgrounds).
 * Traced from the master logo src/assets/brand/okiyan-logo.webp; edit there and re-trace.
 * Used by Logo.astro, illustrations and scripts/generate-assets.mjs (favicon, logo.png, OG).
 */
/** Brand colours (see the palette in src/styles/global.css). */
export const BRAND = {
  navy: '#162c47', // سرمه‌ای عمیق
  petrol: '#234d66', // آبی نفتی
  petrolLight: '#8fb4c9', // petrol tint for dark backgrounds
  silver: '#a8b0ba', // نقره‌ای خنثی
  mist: '#e8ecee', // خاکستری روشن
  white: '#ffffff', // سفید
} as const;

export const MARK = {
  viewBox: '438 94 676 657',
  width: 676,
  height: 657,
  /** Left crescent (the larger, navy one). */
  left: 'M 682 161.124 C 534.565 178.110, 427.427 321.119, 443.857 479 C 460.870 642.482, 617.696 762.172, 792.500 745.085 C 860.767 738.412, 929.652 710.284, 972.855 671.440 C 979.065 665.857, 978.926 664.995, 972.349 668.309 C 892.187 708.708, 811.815 710.152, 736 672.554 C 649.055 629.436, 586.447 543.476, 576.928 454.151 C 567.287 363.671, 619.340 272.611, 704.171 231.559 C 755.545 206.698, 800.107 202.139, 850.362 216.604 C 856.925 218.493, 862.483 219.851, 862.713 219.621 C 863.249 219.084, 854.970 211.362, 848.500 206.363 C 805.275 172.968, 737.955 154.677, 682 161.124',
  /** Right crescent (the accent one). */
  right: 'M 772.500 98.608 C 707.232 105.195, 647.915 128.207, 602.378 164.606 C 581.823 181.036, 572.295 190.116, 580.962 185.016 C 664.259 135.997, 761.281 134.619, 841.500 181.315 C 940.199 238.769, 998.705 375.104, 968.966 478.349 C 934.592 597.689, 811.527 662.491, 697.967 621.047 C 693.585 619.448, 690 618.521, 690 618.987 C 690 622.411, 722.456 647.490, 739.236 657.032 C 826.990 706.935, 932.570 695.310, 1012.500 626.943 C 1092.154 558.813, 1125.340 460.401, 1103.490 357.118 C 1077.313 233.382, 983.773 133.714, 868.189 106.404 C 840.811 99.935, 795.740 96.263, 772.500 98.608',
} as const;
