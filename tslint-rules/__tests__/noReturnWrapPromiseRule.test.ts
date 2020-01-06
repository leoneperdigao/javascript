import { helper } from './lintRunner';
import { Rule } from '../src/tslint-rules/noReturnWrapPromiseRule';

const rule = 'no-return-wrap-promise';

describe('no-return-wrap-promise Rule', () => {
  describe('Functions', () => {
    it("should fail when the async function doesn't have an await", () => {
      const src = `
            async function a(){
               let b = 1;
               console.log(b);
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should fail with correct message', () => {
      const src = `async function a(){
               let b = 1;
               console.log(b);
            }
        `;
      const startPosition = src.indexOf('async');
      const endPosition = startPosition + 'async'.length;
      const failure = helper({ src, rule }).failures[0];

      expect(failure.getStartPosition().getPosition()).toEqual(startPosition);
      expect(failure.getEndPosition().getPosition()).toEqual(endPosition);
      expect(failure.getFailure()).toBe(Rule.FAILURE_MESSAGE);
    });

    it('should not fail when the async function has an await', () => {
      const src = `
            async function a(){
               let b = 1;
               await console.log(b);
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(0);
    });

    it('should not fail when the async function has an await inside a function call', () => {
      const src = `
            async function a(){
               let b = 1;
               console.log(await b());
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(0);
    });

    it('should fail when the async function has an await inside a arrow function declaration', () => {
      const src = `
            async function a(){
               let b = 1;
               let b = async () => {
                    await fetch();
               };
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should fail when the async function has an await inside a regular function declaration', () => {
      const src = `
            async function a(){
               let b = 1;
               async function f() {
                    await fetch();
               };
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should fail when the function is not at the top level', () => {
      const src = `
            function a(){
               let b = 1;
               async function f() {
                    fetch();
               };
            }
        `;

      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });
  });

  describe('Arrow functions', () => {
    it("should fail when the async arrow function doesn't have an await", () => {
      const src = `
            const a = async () => {
               let b = 1;
               console.log(b);
            }
            `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });
  });

  describe('Classes', () => {
    it('should fail when async class method has no await', () => {
      const src = `
            class A {
                async b() {
                    console.log(1);
                }
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should not fail when async class method has await', () => {
      const src = `
            class A {
                async b() {
                    await b();
                }
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(0);
    });

    it('should check classes that are inside functions', () => {
      const src = `
          async () => {
            await a();
            class A {
                async b() {
                    console.log(1);
                }
            }
          };
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });
  });

  describe('return statements', () => {
    it('should not fail when the async function has a return function statement', () => {
      const src = `
            async function a(){
              return fetch();
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(0);
    });

    it('should not fail when the async function has a wrapped short return promise', () => {
      const src = `
            let a = async () => {
              return fetch();
            };
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(0);
    });

    it('should fail when the async function has a return literal object, wrapping a promise', () => {
      const src = `
            const b = 10;
            async function a() {
               return b;
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should fail when the async function has a return statement, wrapping a promise', () => {
      const src = `
            async function a() {
               let b = 1;
               return b;
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should fail when the async function has a return statement, wrapping a promise', () => {
      const src = `
            async function a() {
               return {
                 a: 1
               };
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should fail when the async function has a return statement, wrapping a promise', () => {
      const src = `
            async function a() {
               let b = 1;
               let a = () => {
                return 1;
               }
            }
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

    it('should fail when the async function has a wrapped short return promise', () => {
      const src = `
            let a = async () => 1;
        `;
      const result = helper({ src, rule });
      expect(result.errorCount).toBe(1);
    });

  });
});
