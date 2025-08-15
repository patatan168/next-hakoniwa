import type { Code, Root } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

type compatibleRootNode = {
  type: 'root';
  children: Node[];
  data?: Record<string, unknown>;
};

const remarkMermaidAuto: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree as compatibleRootNode, 'code', (node, index, parent) => {
      const codeNode = node as Code;
      // Mermaidブロックだけを対象にする
      if (codeNode.lang !== 'mermaid') return;

      const parentNode = parent as Parent;
      const jsxNode: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'Mermaid',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'code',
            value: codeNode.value ?? '',
          },
        ],
        children: [],
        data: {
          _mdxExplicitJsx: true, // 明示的に JSX として扱う
        } as Record<string, unknown>,
      };
      if (parentNode && typeof index === 'number') {
        parentNode.children[index] = jsxNode;
      } else if (typeof index === 'number' && 'children' in tree) {
        // NOTE: parentがない場合（最初のノードなど）は tree.children を直接操作
        tree.children[index] = jsxNode;
      }
    });
  };
};

export default remarkMermaidAuto;
