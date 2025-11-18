/**
 * Design Tokens per BI Dashboard
 * Centralizza sizing, spacing e colori per consistenza
 */

// Touch target sizes (WCAG 2.1 AAA: 44x44px minimo)
export const touchTargets = {
  minimum: 'min-h-[44px] min-w-[44px]',
  button: 'min-h-[44px] px-4 py-2.5',
  iconButton: 'min-h-[44px] min-w-[44px] p-2',
  checkbox: 'h-5 w-5',
} as const;

// Spacing scale (coerente in tutto il progetto)
export const spacing = {
  xs: 'gap-1',     // 4px
  sm: 'gap-2',     // 8px
  md: 'gap-4',     // 16px - default per componenti
  lg: 'gap-6',     // 24px - tra sezioni
  xl: 'gap-8',     // 32px - tra sezioni principali
} as const;

// Padding consistente
export const padding = {
  card: 'p-6',
  cardHeader: 'p-6 pb-2',
  cardContent: 'p-6 pt-0',
  section: 'p-4 sm:p-6 lg:p-8',
  modal: 'p-4 sm:p-6',
  button: 'px-4 py-2.5',
  input: 'px-4 py-2.5',
} as const;

// Icon sizes (standardizzate)
export const iconSizes = {
  xs: 'w-4 h-4',   // inline text
  sm: 'w-5 h-5',   // button icons
  md: 'w-6 h-6',   // card icons
  lg: 'w-8 h-8',   // header icons
  xl: 'w-10 h-10', // feature icons
} as const;

// Border radius consistente
export const borderRadius = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// Focus ring standardizzato
export const focusRing = {
  default: 'focus:outline-none focus:ring-2 focus:ring-cyan-500',
  offset: 'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
  inset: 'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset',
} as const;

// Colori status (con supporto accessibilità)
export const statusColors = {
  success: {
    border: 'border-green-500',
    bg: 'bg-green-900/90',
    text: 'text-green-400',
    icon: 'text-green-400',
    label: 'Successo',
  },
  warning: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-900/90',
    text: 'text-yellow-400',
    icon: 'text-yellow-400',
    label: 'Attenzione',
  },
  error: {
    border: 'border-red-500',
    bg: 'bg-red-900/90',
    text: 'text-red-400',
    icon: 'text-red-400',
    label: 'Errore',
  },
  info: {
    border: 'border-blue-500',
    bg: 'bg-blue-900/90',
    text: 'text-blue-400',
    icon: 'text-blue-400',
    label: 'Informazione',
  },
} as const;

// Breakpoints responsive
export const breakpoints = {
  mobile: 'sm:',    // 640px+
  tablet: 'md:',    // 768px+
  desktop: 'lg:',   // 1024px+
  wide: 'xl:',      // 1280px+
  ultrawide: '2xl:', // 1536px+
} as const;

// Grid layouts comuni
export const gridLayouts = {
  kpis: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  twoColumns: 'grid grid-cols-1 lg:grid-cols-2',
  threeColumns: 'grid grid-cols-1 md:grid-cols-3',
  fourColumns: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
} as const;

// Typography
export const typography = {
  heading1: 'text-2xl font-bold',
  heading2: 'text-xl font-bold',
  heading3: 'text-lg font-semibold',
  body: 'text-sm',
  caption: 'text-xs',
  label: 'text-sm font-medium',
} as const;

// Transizioni animate
export const transitions = {
  fast: 'transition-colors duration-150',
  default: 'transition-colors duration-200',
  slow: 'transition-all duration-300',
} as const;
