/** @type {import('stylelint').Config} */

export default {
  // CSS in JS
  customSyntax: 'postcss-styled-syntax',
  extends: ['stylelint-config-recommended'],
  plugins: ['stylelint-declaration-block-no-ignored-properties'],
  rules: {
    // ネストの制限
    'max-nesting-depth': 5,
    // 空白のスタイルにしない
    'block-no-empty': true,
    // ショートハンドプロパティで上書きしない
    'declaration-block-no-shorthand-property-overrides': true,
    // displayの値によって無視されてしまうプロパティを検知
    'plugin/declaration-block-no-ignored-properties': true,
    // 疑似要素はコロン2つに制限
    'selector-pseudo-element-colon-notation': 'double',
  },
};
