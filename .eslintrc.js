module.exports = {
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "env": {
    "es6": true,
    "node": true
  },
  "rules": {
    // Override default options
    "semi": 2,
    "indent": [
      "error",
      2
    ],
    "quotes": [
      "error", 
      "double", 
      { "allowTemplateLiterals": true }
    ],
    "no-cond-assign": [
      "error",
      "always"
    ],
    "init-declarations": "off",
    "no-console": "off",
    "no-inline-comments": "off",
    "one-var": "off"
  },
  "ignorePatterns": ["/test/*.js"],
};
