/**
 * Motion timing — thống nhất hover / drawer / toast / page.
 */
export const motion = {
  fast: 150,
  normal: 220,
  slow: 320,
} as const;

export type MotionKey = keyof typeof motion;

export const motionDuration: Record<MotionKey, string> = {
  fast: 'duration-150',
  normal: 'duration-[220ms]',
  slow: 'duration-300',
};

export const motionEase = 'ease-out' as const;

export const motionTransition = {
  colors: `${motionDuration.fast} ${motionEase}`,
  layout: `${motionDuration.normal} ${motionEase}`,
  page: `${motionDuration.slow} ${motionEase}`,
} as const;
