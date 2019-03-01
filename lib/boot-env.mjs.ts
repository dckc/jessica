import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';

import interpJessie from './interp-jessie.mjs';

function tagString(template: TemplateStringsArray, ...args: any[]) {
    const cooked = args.reduce((prior, hole, i) => {
        prior.push(String(hole), template[i + 1]);
        return prior;
    }, [template[0]]);
    const tmpl = [cooked.join('')];
    const raw = args.reduce((prior, hole, i) => {
        prior.push(String(hole), template.raw[i + 1]);
        return prior;
    }, [template.raw[0]]);
    return Object.assign(tmpl, {raw: [raw.join('')]});
}

function bootEnv(endowments: object) {
    // Bootstrap a peg tag.
    const pegTag = bootPeg<IPegTag>(makePeg, bootPegAst);

    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const jessieTag = makeJessie(pegTag.extends(justinTag));

    const env = harden({
        ...endowments,
        confine: (src: string, evalenv: object, options?: ConfineOptions) => {
            const ast = jessieTag(tagString`${src + '\n;'}`);
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src: string, evalenv: object, options?: ConfineOptions) => {
            const ast = jessieTag(tagString`${'(' + src + '\n)'}`);
            return harden(interpJessie.expr(ast, evalenv, options || {}));
        },
        eval: (src: string): any => {
            const ast = jessieTag(tagString`${src}`);
            return harden(interpJessie(ast, env));
        },
    });
    return env;
}

export default harden(bootEnv);
