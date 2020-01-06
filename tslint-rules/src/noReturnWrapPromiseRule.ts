
import * as Lint from 'tslint';
import typescript from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {

  /* tslint:disable:object-literal-sort-keys */
  public static metadata: Lint.IRuleMetadata = {
    ruleName: 'no-return-wrap-promises',
    description: 'Disallows promises wrapping.',
    rationale: Lint.Utils.dedent`
        An async function always wraps the return value in a promise.
        This could bring unwanted behavior for literal values and returned objects that are not actually products of an asynchronous call.
    `,
    optionsDescription: 'Not configurable.',
    options: null,
    optionExamples: [true],
    type: 'functionality',
    typescriptOnly: false,
    hasFix: true,
  };
  /* tslint:enable:object-literal-sort-keys */

  public static readonly FAILURE_MESSAGE = 'Async functions wrapping promises are not allowed.';

  public apply(sourceFile: typescript.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

function getModifier(node: typescript.Node, modifier: typescript.SyntaxKind) {
  if (node.modifiers !== undefined) {
    return node.modifiers.find((m: any) => m.kind === modifier);
  }
  return undefined;
}

function isAsyncFunction(node: typescript.Node): boolean {
  return getModifier(node, typescript.SyntaxKind.AsyncKeyword) !== undefined;
}

function isExportedFunction(node: typescript.Node): boolean {
  return getModifier(node, typescript.SyntaxKind.ExportKeyword) !== undefined;
}

function isAwait(node: typescript.Node): boolean {
  return node.kind === typescript.SyntaxKind.AwaitKeyword;
}

function isReturn(node: typescript.Node): boolean {
  return node.kind === typescript.SyntaxKind.ReturnKeyword;
}

/**
 * Function to check if there is an await inside the block of code.
 * @param node
 */
function functionBlockHasAwait(node: typescript.Node): boolean {
  if (isAwait(node)) {
    return true;
  }

  // tslint:disable-next-line:no-unsafe-any
  if (node.kind === typescript.SyntaxKind.ArrowFunction
    || node.kind === typescript.SyntaxKind.FunctionDeclaration) {
    return false;
  }

  const awaitInChildren = node.getChildren().map((functionBlockNode: typescript.Node) => functionBlockHasAwait(functionBlockNode));
  return awaitInChildren.some(Boolean);
}

function functionBlockHasReturn(node: typescript.Node): boolean {
  if (isReturn(node)) {
    const returnCall = node.parent.getChildren().map((c: typescript.Node) => c.kind === typescript.SyntaxKind.CallExpression);
    return returnCall.some(Boolean);
  }

  const returnInChildren = node.getChildren().map((functionBlockNode: typescript.Node) => functionBlockHasReturn(functionBlockNode));
  return returnInChildren.some(Boolean);
}

function isShortArrowReturn(node: typescript.ArrowFunction | typescript.FunctionDeclaration | typescript.MethodDeclaration) {
  return node.kind === typescript.SyntaxKind.ArrowFunction
    && typescript.isCallExpression(node)
    && node.body.kind !== typescript.SyntaxKind.Block;
}

/**
 * walk is a function to go trough the ts elements and check
 * the  proposed validations such.
 * @param ctx
 */
function walk(ctx: Lint.WalkContext<void>) {
  typescript.forEachChild(ctx.sourceFile, recur);

  function recur(node: typescript.Node): void {
    if (!isExportedFunction(node) && isAsyncFunction(node)
      // @ts-ignore
      && !functionBlockHasAwait(node.body as typescript.Node)
      // @ts-ignore
      && !functionBlockHasReturn(node.body as typescript.Node)
      // @ts-ignore
      && !isShortArrowReturn(node)) {

      const asyncModifier = getModifier(node, typescript.SyntaxKind.AsyncKeyword);
      if (asyncModifier !== undefined) {
        ctx.addFailureAt(
          asyncModifier.getStart(),
          asyncModifier.getEnd() - asyncModifier.getStart(),
          Rule.FAILURE_MESSAGE,
        );
      }
    }
    typescript.forEachChild(node, recur);
  }
}
