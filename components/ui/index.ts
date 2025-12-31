/**
 * UI Components Barrel Exports
 *
 * This file provides a single entry point for all UI components.
 * Use this to import UI features with clean, short imports.
 *
 * @example
 * ```typescript
 * // Instead of:
 * import { Logo } from '@/components/ui/Logo'
 *
 * // Use:
 * import { Logo } from '@/components/ui'
 * ```
 */

/** Main logo component for brand identity */
export { Logo, HeroLogo, MobileLogo } from './Logo';
/** Validation message component for form feedback */
export { ValidationMessage } from './ValidationMessage';