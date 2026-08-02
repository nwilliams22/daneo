import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-2 mb-3 text-2xl font-bold tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-9 mb-3 border-b border-line pb-1.5 text-lg font-bold tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-[15px] font-bold">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="my-2.5 text-sm leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2.5 ml-5 list-disc space-y-1 text-sm leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 ml-5 list-decimal space-y-1 text-sm leading-relaxed">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-gold pl-3 text-sm text-muted italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-7 border-line" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-line px-3 py-2 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line/60 px-3 py-1.5 align-top leading-relaxed">
      {children}
    </td>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-teal underline underline-offset-2"
    >
      {children}
    </a>
  ),
};

export default function Markdown({ md }: { md: string }) {
  return (
    <div className="text-ink">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
