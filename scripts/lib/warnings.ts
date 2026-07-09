/** Count build-time warnings from Vite / Rollup stdout+stderr. */
export function countBuildWarnings(output: string): number {
  return output.split(/\r?\n/).filter((line) => /^\s*\(!\)/.test(line)).length;
}
