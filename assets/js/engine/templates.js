// The 10 template designs. Every template is a parameter set interpreted by
// the single layout engine in layout.js — no per-template layout code.

export const TEMPLATES = [
  {
    id: 'classic-serif', name: 'Classic Serif',
    font: 'inherit', band: null, sideRail: false, centeredHeader: false,
    goldRules: true, doubleRules: false, boxedTable: false,
    table: { headFill: 'none', zebra: false, rowRule: true },
    titleCaps: false, titleSize: 27, density: 1, labelCaps: true,
  },
  {
    id: 'modern-grid', name: 'Modern Grid',
    font: 'sans', band: { h: 10, fill: 'brand' }, sideRail: false, centeredHeader: false,
    goldRules: false, doubleRules: false, boxedTable: false,
    table: { headFill: 'brand', zebra: true, rowRule: false },
    titleCaps: true, titleSize: 22, density: 1, labelCaps: true,
  },
  {
    id: 'minimal-mono', name: 'Minimal Mono',
    font: 'mono', band: null, sideRail: false, centeredHeader: false,
    goldRules: false, doubleRules: false, boxedTable: false,
    table: { headFill: 'none', zebra: false, rowRule: true },
    titleCaps: true, titleSize: 18, density: 1.1, labelCaps: true,
  },
  {
    id: 'bold-header', name: 'Bold Header',
    font: 'sans', band: { h: 110, fill: 'brand', contentInBand: true }, sideRail: false, centeredHeader: false,
    goldRules: false, doubleRules: false, boxedTable: false,
    table: { headFill: 'ink', zebra: false, rowRule: true },
    titleCaps: true, titleSize: 30, density: 1, labelCaps: true,
  },
  {
    id: 'elegant-ledger', name: 'Elegant Ledger',
    font: 'inherit', band: null, sideRail: false, centeredHeader: true,
    goldRules: true, doubleRules: true, boxedTable: false,
    table: { headFill: 'none', zebra: false, rowRule: true },
    titleCaps: true, titleSize: 20, density: 1.05, labelCaps: true,
  },
  {
    id: 'compact', name: 'Compact',
    font: 'sans', band: null, sideRail: false, centeredHeader: false,
    goldRules: false, doubleRules: false, boxedTable: false,
    table: { headFill: 'none', zebra: true, rowRule: false },
    titleCaps: false, titleSize: 18, density: 0.82, labelCaps: false,
  },
  {
    id: 'gst-standard', name: 'GST Standard',
    font: 'sans', band: null, sideRail: false, centeredHeader: true,
    goldRules: false, doubleRules: false, boxedTable: true,
    table: { headFill: 'none', zebra: false, rowRule: true },
    titleCaps: true, titleSize: 16, density: 0.92, labelCaps: false,
  },
  {
    id: 'creative', name: 'Creative',
    font: 'sans', band: null, sideRail: true, centeredHeader: false,
    goldRules: false, doubleRules: false, boxedTable: false,
    table: { headFill: 'brand', zebra: false, rowRule: false },
    titleCaps: false, titleSize: 28, density: 1, labelCaps: true,
  },
  {
    id: 'letterhead', name: 'Letterhead',
    font: 'inherit', band: null, sideRail: false, centeredHeader: true,
    goldRules: true, doubleRules: false, boxedTable: false,
    table: { headFill: 'none', zebra: false, rowRule: true },
    titleCaps: false, titleSize: 20, density: 1.05, labelCaps: true,
  },
  {
    id: 'statement', name: 'Statement',
    font: 'inherit', band: null, sideRail: false, centeredHeader: false,
    goldRules: false, doubleRules: true, boxedTable: false,
    table: { headFill: 'none', zebra: true, rowRule: false },
    titleCaps: true, titleSize: 19, density: 0.95, labelCaps: true,
  },
];

export function template(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
