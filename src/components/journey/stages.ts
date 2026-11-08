/**
 * Stage titles for the shipment journey. The bar under the scene shows exactly
 * these five labels; the SVG is the illustration, the timeline is the motion.
 * Keep the count equal to STAGE_COUNT.
 */
export interface JourneyStage {
  id: string;
  title: string;
}

export const journeyStages: JourneyStage[] = [
  { id: 'stage-review', title: 'بررسی کالا و اسناد' },
  { id: 'stage-shipping', title: 'حمل از مبدأ' },
  { id: 'stage-port', title: 'ورود به بندر یا فرودگاه' },
  { id: 'stage-customs', title: 'تشریفات و ترخیص گمرکی' },
  { id: 'stage-delivery', title: 'حمل داخلی و تحویل' },
];
