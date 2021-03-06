import { insulate } from '@agoric/jessie'; // FIXME: Not really a read-eval-print-loop, yet.
const repl = insulate((
deps,
doEval,
file,
argv) => {
  // Read...
  const data = deps.readInput(file);
  // Eval ...
  const main = doEval(data, file);
  // Execute as main, if a function.
  const val = typeof main === 'function' ? main(deps, argv) : main;
  // ... maybe Print.
  if (val !== undefined) {
    deps.writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
  }
});

export default repl;