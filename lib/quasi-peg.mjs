// PEG quasi Grammar for PEG quasi Grammars
// Michael FIG <michael+jessica@fig.org>, 2019-01-05
//
// This grammar is adapted from:
// http://piumarta.com/software/peg/peg-0.1.18/src/peg.peg
//
// Modified for Jessica to support:
//   Semantic actions provided in tagged template HOLEs
//   '~' for negative lookahead (instead of '!')
//   ';' terminator for definitions
//   '**' and '++' for separators
//   'super.RULE' syntax for extended grammars
//   '\xFF' instead of octal character literals
// which are adapted from:
// https://github.com/erights/quasiParserGenerator
/// <reference path="peg.d.ts"/>
const makePeg = immunize((pegTag, metaCompile) => {
    const { ACCEPT, HOLE, SKIP } = pegTag;
    function simple(prefix, list) {
        if (list.length === 0) {
            return ['empty'];
        }
        if (list.length === 1) {
            return list[0];
        }
        return [prefix, ...list];
    }
    function flatArgs(args) {
        return args.reduce((prior, a) => {
            prior.push(...flatSeq(a));
            return prior;
        }, []);
    }
    function flatSeq(term) {
        if (Array.isArray(term)) {
            if (term.length === 0) {
                return [];
            }
            const [kind, ...terms] = term;
            if (kind === 'seq') {
                return flatArgs(terms);
            }
            else if (terms.length === 0 && Array.isArray(kind)) {
                return flatSeq(kind);
            }
            else {
                return [[kind, ...flatArgs(terms)]];
            }
        }
        return [term];
    }
    return pegTag `
# Hierarchical syntax

Grammar      <- _Spacing Definition+ _EndOfFile
                    ${metaCompile};

Definition   <- Identifier LEFTARROW Expression SEMI &${ACCEPT}
                    ${(i, _, e, _2) => ['def', i, e]};
Expression   <- Sequence ** SLASH
                    ${list => simple('or', list)};
Sequence     <- (Prefix*
                    ${list => simple('seq', list)})
                 HOLE?
                    ${(seq, optHole) => optHole.length === 0 ?
        ['val0', ...flatSeq(seq)] :
        ['act', optHole[0], ...flatSeq(seq)]};
Prefix       <- AND HOLE
                    ${(_, a) => ['pred', a]}
              / AND Suffix
                    ${(_, s) => ['peek', s]}
              / NOT Suffix
                    ${(_, s) => ['peekNot', s]}
              /     Suffix;
Suffix       <- Primary (STARSTAR
                        / PLUSPLUS) Primary
                    ${(patt, q, sep) => [q, patt, sep]}
              / Primary (QUESTION
                        / STAR
                        / PLUS)
                    ${(patt, optQ) => [optQ[0], patt]}
              / Primary;
Primary      <- Super
              / Identifier ~LEFTARROW
              / OPEN Expression CLOSE
                    ${(_, e, _2) => e}
              / Literal
                    ${(s) => ['lit', s]}
              / Class
                    ${(c) => ['cls', c]}
              / DOT
                    ${() => ['dot']}
              / BEGIN
                    ${() => ['begin']}
              / END
                    ${() => ['end']}
              ;

Super        <- 'super.' Identifier
                    ${(_, i) => ['super', i]};

# Lexical syntax

Identifier   <- < IdentStart IdentCont* > _Spacing;
IdentStart   <- [a-zA-Z_];
IdentCont    <- IdentStart / [0-9];
Literal      <- ['] < (~['] Char )* > ['] _Spacing
              / ["] < (~["] Char )* > ["] _Spacing;
Class        <- '[' < (~']' Range)* > ']' _Spacing;
Range        <- Char '-' Char / Char;
Char         <- '\\' [abefnrtv'"\[\]\\\`\$]
              / '\\x' [0-9a-fA-F][0-9a-fA-F]
              / '\\' '-'
              / ~'\\' .;
LEFTARROW    <- '<-' _Spacing;
SLASH        <- '/' _Spacing;
SEMI         <- ';' _Spacing;
AND          <- '&' _Spacing;
NOT          <- '~' _Spacing;
QUESTION     <- '?' _Spacing;
STAR         <- '*' _Spacing;
PLUS         <- '+' _Spacing;
OPEN         <- '(' _Spacing;
CLOSE        <- ')' _Spacing;
DOT          <- '.' _Spacing;
_Spacing      <- (Space / Comment)*        ${_ => SKIP};
Comment      <- '#' (~EndOfLine .)* EndOfLine;
Space        <- ' ' / '\t' / EndOfLine;
EndOfLine    <- '\r\n' / '\n' / '\r';
_EndOfFile    <- ~.;

HOLE         <- &${HOLE} _Spacing;
BEGIN        <- '<' _Spacing;
END          <- '>' _Spacing;
PLUSPLUS     <- '++' _Spacing;
STARSTAR     <- '**' _Spacing;
`;
});
export default immunize(makePeg);
