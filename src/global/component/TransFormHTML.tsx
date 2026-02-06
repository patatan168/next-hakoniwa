import parse, { DOMNode, domToReact, Element } from 'html-react-parser';
import Image from 'next/image';
import Link from 'next/link';
import { HTMLAttributeAnchorTarget } from 'react';

export const TransformHTML = ({ html }: { html: string }) => {
  return parse(html, {
    replace: (node) => {
      if (!(node instanceof Element)) return;

      // <a> → <Link>
      if (node.name === 'a' && node.attribs?.href) {
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
            {domToReact(node.children as DOMNode[])}
          </Link>
        );
      }

      // <img> → <Image>
      if (node.name === 'img' && node.attribs?.src) {
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
      }
    },
  });
};
