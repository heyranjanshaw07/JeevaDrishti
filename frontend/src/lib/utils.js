// Utility for combining classNames (no clsx dependency needed)
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
