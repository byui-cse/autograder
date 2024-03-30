# Autograder Linters

The `json` files in this directory are the default configurations used by the various linters. **These are disabled by default and meant for development and testing**. If you want to use our default linting rules (they are pretty common rules) you can set the `useDefaultLintRules` to `true` in the Autograder's configuration option:

```js
import Autograder from '@byui-cse/autograder';

const ag = new Autograder({
    useDefaultLintRules: true
});
```

If you register linter rules with the `linter` option or later with one of the linter configuration register functions, you will overwrite any default rules that were loaded:

```js
import Autograder from '@byui-cse/autograder';

/**
 * Here we register linter configurations and rules for CSS, HTML, and JS; we do not have to
 * register all three, we can add only the ones we want.
 */
const ag = new Autograder({
    linter: {
        cssConfig: { ... },
        htmlConfig: { ... },
        jsConfig: { ... }
    }
    useDefaultLintRules: true
});

/**
 * We could also register linter rules later with the registration functions; again do not have to
 * register all three, we only have to call and register what we want.
 */
ag.registerCssLinterConfig({...}); 
ag.registerHtmlLinterConfig({...}); 
ag.registerJsLinterConfig({...}); 
```

Please review the `json` files in this directory for an example of what the configuration objects should look like. Keep in mind you can add many more settings depending on the linter:

- [stylelint](https://stylelint.io/user-guide/configure) is used for CSS.
- [htmlhint](https://htmlhint.com/docs/user-guide/list-rules) is used for HTML.
- [eslint](https://eslint.org/docs/latest/use/configure/) is used for JS.