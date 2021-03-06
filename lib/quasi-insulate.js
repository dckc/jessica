import { insulate } from '@agoric/jessie'; // Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary

// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar defined here.

/// <reference path="peg.d.ts"/>

// Safe Modules are ones that can be imported without
// insulating their symbols.
const isSafeModule = insulate(moduleName => {
  switch (moduleName) {
    case '@agoric/jessie':{
        return true;
      }
    default:{
        return false;
      }}

});


const terminatedBlock = insulate(manyBodies => {
  const stmts = manyBodies.reduce((prior, body) => {
    const [bs, t] = body;
    bs.forEach(b => prior.push(b));
    prior.push(t);
    return prior;
  }, []);
  return ['block', stmts];
});

const makeInsulatedJessie = insulate((peg, jessiePeg) => {
  const { FAIL, SKIP } = jessiePeg;
  const insulatedTag = jessiePeg`
    # Inherit start production.
    start <- super.start;

    # A.1 Lexical Grammar

    # insulate is reserved by Jessica.
    RESERVED_WORD <- super.RESERVED_WORD / ( "insulate" _WSN );

    # A.5 Scripts and Modules

    useImport <- IMPORT_PFX IDENT                 ${(pfx, id) => ['use', pfx + id]};
    defImport <- IMPORT_PFX IDENT                 ${(pfx, id) => ['def', pfx + id]};

    # A properly hardened expression without side-effects.
    hardenedExpr <-
      "insulate" _WS LEFT_PAREN (pureExpr / useImport) RIGHT_PAREN  ${(fname, _2, expr, _3) =>
  ['call', ['use', fname], [expr]]}
    / super.hardenedExpr;

    # Safe imports don't need to be prefixed.
    safeImportSpecifier <-
      IDENT_NAME AS defVar                 ${(i, _, d) => ['as', i, d[1]]}
    / defVar                               ${d => ['as', d[1], d[1]]}
    / "insulate" _WSN                      ${w => ['as', w, w]};

    safeModule <-
      STRING ${s => {const mod = JSON.parse(s);return isSafeModule(mod) ? mod : FAIL;}};
    `;

  const insulatedExprTag = peg.extends(insulatedTag)`
    # Jump to the expr production.
    start <- _WS expr _EOF              ${e => (..._a) => e};
    `;

  return [insulatedTag, insulatedExprTag];
});

export default makeInsulatedJessie;