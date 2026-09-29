// SnapFind AI — Official Luxury Gold Photography Design System
// Master Color Tokens

export const colors = {
  // --- PRIMARY FOUNDATION ---
  // Midnight Navy (Main application background, sidebar, navigation, dark hero, dark workspace)
  midnight: "#0B1220",
  "midnight-dark": "#070C16",
  "midnight-light": "#0F182A",

  // Deep Slate (Cards, secondary panels, inputs, dropdowns, navigation surfaces, widgets)
  slate: "#151D2E",
  "slate-surface": "#151D2E",
  "slate-hover": "#1B253B",
  "slate-active": "#202C45",
  "slate-border": "#232F48",
  "slate-border-light": "#2D3B59",
  "slate-inset": "#0F1624",
  "slate-700": "#232F48",
  "slate-800": "#1B253B",
  "slate-900": "#0F1624",

  // --- BRAND ACCENT (Restrained & Premium) ---
  // Champagne Gold (Primary CTA, active navigation, important icons, selected states, highlights)
  gold: "#D6A84F",
  "gold-hover": "#C5963E",
  "gold-dark": "#A87C2B",
  "gold-light": "#E4BE72",
  "gold-subtle": "rgba(214, 168, 79, 0.12)",
  "gold-border": "rgba(214, 168, 79, 0.35)",

  // --- SECONDARY ACCENT (Used Sparingly) ---
  // Warm Coral (Secondary actions, notifications, attention states, selected photo highlights)
  coral: "#E87961",
  "coral-hover": "#D66750",
  "coral-subtle": "rgba(232, 121, 97, 0.15)",
  "coral-border": "rgba(232, 121, 97, 0.35)",

  // --- SUCCESS & STATUS ---
  // Sage Green (Successful uploads, completed events, online status, positive indicators)
  sage: "#5FA58B",
  "sage-hover": "#4E9279",
  "sage-subtle": "rgba(95, 165, 139, 0.15)",
  "sage-border": "rgba(95, 165, 139, 0.35)",

  // --- TYPOGRAPHY CONTRAST ---
  // Soft White (Headings, primary text, important labels, navigation text)
  "soft-white": "#F7F5F0",
  white: "#FFFFFF",

  // Cool Gray (Descriptions, metadata, secondary labels, dates, supporting information)
  "cool-gray": "#A8B0BE",
  "cool-gray-light": "#C4CAD4",
  "cool-gray-muted": "#6E788B",

  // --- CLIENT-FACING LIGHT BACKGROUND ---
  // Ivory (Light-mode client screens, photo sharing, guest portals)
  ivory: "#FAF8F3",
  "ivory-card": "#FFFFFF",
  "ivory-border": "#E5DFD5",
  "ivory-text": "#0B1220",
  "ivory-muted": "#687385",

  // --- SEMANTIC ALIASES & COMPATIBILITY BRIDGES ---
  // These guarantee existing components seamlessly inherit the Luxury Gold palette
  base: "#0B1220",
  panel: "#151D2E",
  panel2: "#0F1624",
  hairline: "#232F48",
  cloud: "#F7F5F0",
  dim: "#A8B0BE",
  forest: "#D6A84F",
  "forest-hover": "#C5963E",
  "forest-dark": "#0B1220",
  "forest-light": "#E4BE72",
  "forest-tint": "rgba(214, 168, 79, 0.12)",
  champagne: "#D6A84F",
  "champagne-light": "#E4BE72",
  "champagne-soft": "rgba(214, 168, 79, 0.12)",
  "champagne-dark": "#A87C2B",
  charcoal: "#F7F5F0",
  "charcoal-soft": "#E1DFD9",
  "warm-gray": "#A8B0BE",
  "warm-gray-light": "#6E788B",
  "warm-border": "#232F48",
  "warm-border-light": "#1B253B",
  "surface-card": "#151D2E",
  "surface-hover": "#1B253B",
  "surface-inset": "#0F1624",
  cream: "#151D2E",
  "cream-soft": "#0F1624",

  // Status mappings
  success: "#5FA58B",
  "success-bg": "rgba(95, 165, 139, 0.15)",
  "success-border": "rgba(95, 165, 139, 0.35)",
  warning: "#D6A84F",
  "warning-bg": "rgba(214, 168, 79, 0.15)",
  "warning-border": "rgba(214, 168, 79, 0.35)",
  danger: "#E87961",
  "danger-bg": "rgba(232, 121, 97, 0.15)",
  "danger-border": "rgba(232, 121, 97, 0.35)",
  info: "#5B8BF5",
  "info-bg": "rgba(91, 139, 245, 0.15)",
  "info-border": "rgba(91, 139, 245, 0.35)",
} as const;

export type ColorToken = keyof typeof colors;
