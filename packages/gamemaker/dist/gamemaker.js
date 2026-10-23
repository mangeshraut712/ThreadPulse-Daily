export const animationClasses = {
  celebration: "gm-celebration",
  success: "gm-success",
  error: "gm-error",
  "hint-reveal": "gm-hint-reveal",
  "guess-submit": "gm-guess-submit",
  "clue-contribute": "gm-clue-contribute",
  "puzzle-solve": "gm-puzzle-solve",
};

export function animationClass(type) {
  return animationClasses[type] ?? "";
}
