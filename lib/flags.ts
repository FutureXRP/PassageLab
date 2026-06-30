// PassageLab — lib/flags.ts
// Feature flags. NEXT_PUBLIC_* vars are inlined at build time and readable on
// both the client and the server, so a single flag gates the whole Academic
// tier end-to-end (UI + API). Default OFF — when unset/false, the Academic
// tier is completely invisible and inert, and the app behaves exactly as it
// did before the tier existed. Flip by setting NEXT_PUBLIC_ACADEMIC_ENABLED=true
// in the environment and redeploying.
export const ACADEMIC_ENABLED =
  process.env.NEXT_PUBLIC_ACADEMIC_ENABLED === 'true' ||
  process.env.NEXT_PUBLIC_ACADEMIC_ENABLED === '1'
