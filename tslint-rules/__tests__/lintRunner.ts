import { Configuration, Linter } from 'tslint';

export const helper = ({ src, rule, fileName }: { src: any; rule:any; fileName?: string}) => {
  const linter = new Linter({ fix: false });
  linter.lint(
    fileName || '',
    src,
    Configuration.parseConfigFile({
      rules: {
        [rule.name || rule]: true,
      },
      rulesDirectory: 'src/tslint-rules',
    }),
  );
  return linter.getResult();
};
