import parse, { DOMNode, domToReact, Element, HTMLReactParserOptions } from 'html-react-parser';
import Image from 'next/image';
import Link from 'next/link';
import { HTMLAttributeAnchorTarget, ReactElement } from 'react';

const replaceAnchorNode = (node: Element, options: HTMLReactParserOptions): ReactElement => {
  const rawHref = node.attribs.href;
  const rawTarget: HTMLAttributeAnchorTarget = node.attribs.target ?? '_self';
  // クエリ部分を分離
  const [path, queryString] = rawHref.split('?');
  const pathname = path.replace(/^\.{1,2}\//, '/');
  // クエリをオブジェクトに変換
  const query: Record<string, string> = {};
  if (queryString) {
    new URLSearchParams(queryString).forEach((value, key) => {
      query[key] = value;
    });
  }
  return (
    <Link
      className="decoration-sky-700 hover:underline"
      href={{ pathname, query }}
      target={rawTarget}
    >
      {domToReact(node.children as DOMNode[], options)}
    </Link>
  );
};

const replaceImageNode = (node: Element): ReactElement => {
  const { src, alt = '', width = '600', height = '400' } = node.attribs;
  return (
    <Image
      src={src}
      alt={alt}
      width={parseInt(width)}
      height={parseInt(height)}
      loading="lazy"
      className="h-auto max-w-full"
    />
  );
};

export const TransformHTML = ({ html }: { html: string }) => {
  const convertedHtml = html
    .replace(/\[c\](.*?)\[\/c\]/g, '<span class="text-[#a06040] font-bold">$1</span>')
    .replace(
      /\[ui:(.*?)\](.*?)\[\/ui\]/g,
      '<a href="/sight?uuid=$1"><span class="text-[#a06040] font-bold">$2</span></a>'
    )
    .replace(/\[i\](.*?)\[\/i\]/g, '<span class="text-[#a06040] font-bold">$1</span>')
    .replace(/\[p\](.*?)\[\/p\]/g, '<span class="text-[#d08000] font-bold">$1</span>')
    .replace(/\[d\](.*?)\[\/d\]/g, '<span class="text-[#ff0000] font-bold">$1</span>')
    .replace(/\[b\](.*?)\[\/b\]/g, '<span class="font-bold">$1</span>');

  const options: HTMLReactParserOptions = {
    replace: (node) => {
      if (!(node instanceof Element)) return;

      if (node.name === 'a' && node.attribs?.href) return replaceAnchorNode(node, options);
      if (node.name === 'img' && node.attribs?.src) return replaceImageNode(node);
    },
  };

  return parse(convertedHtml, options);
};
