import { insulate } from '@agoric/jessie'; export const qunpack = insulate((h, ms, t) => {
  return [h, ...ms, t];
});

export const qrepack = insulate(parts => {
  // TODO bug: We only provide the raw form at this time. I
  // apologize once again for allowing a cooked form into the
  // standard.
  const raw = [parts[0]];
  const argExprs = [];
  const len = parts.length;
  for (let i = 1; i < len; i += 2) {
    argExprs.push(parts[i]);
    raw.push(parts[i + 1]);
  }
  const template = [...raw];
  template.raw = raw;
  return [['data', template], ...argExprs];
});