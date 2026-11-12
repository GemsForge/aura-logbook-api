/**
 * Expands a compact control's touch area to at least 44×44 CSS px (WCAG 2.5.5) without changing how it looks:
 * an invisible pseudo-element extends the hit box around a 28–32px button. Spread into the control's `sx`.
 */
export const tapTarget44 = {
  position: "relative",
  "&::after": { content: '""', position: "absolute", top: "50%", left: "50%", width: 44, height: 44, transform: "translate(-50%, -50%)" },
} as const;
