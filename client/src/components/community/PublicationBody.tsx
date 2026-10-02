import { Fragment } from "react";
import { safePublishingUrl } from "@/lib/publishingApi";
// A deliberately small Markdown subset. React escapes all text; raw HTML is never interpreted.
function inline(text: string) {
  const pattern = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    nodes.push(text.slice(last, index));
    if (match[3]) nodes.push(<strong key={index}>{match[3]}</strong>);
    else {
      const url = safePublishingUrl(match[2]);
      nodes.push(
        url ? (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer ugc sponsored"
            className="break-words text-cyan-200 underline"
          >
            {match[1]}
          </a>
        ) : (
          <Fragment key={index}>{match[1]}</Fragment>
        ),
      );
    }
    last = index + match[0].length;
  }
  nodes.push(text.slice(last));
  return nodes;
}
export default function PublicationBody({ body }: { body: string }) {
  return (
    <div className="space-y-3 break-words text-white/80 leading-7">
      {body.split("\n").map((line, i) => {
        if (line.startsWith("## "))
          return (
            <h3 className="pt-4 text-xl font-bold text-white" key={i}>
              {inline(line.slice(3))}
            </h3>
          );
        if (line.startsWith("# "))
          return (
            <h2 className="pt-4 text-2xl font-bold text-white" key={i}>
              {inline(line.slice(2))}
            </h2>
          );
        if (line.startsWith("- "))
          return (
            <p className="pl-4" key={i}>
              • {inline(line.slice(2))}
            </p>
          );
        if (line.startsWith("> "))
          return (
            <blockquote className="border-l-2 border-cyan-200/30 pl-4" key={i}>
              {inline(line.slice(2))}
            </blockquote>
          );
        return line ? (
          <p className="whitespace-pre-wrap" key={i}>
            {inline(line)}
          </p>
        ) : (
          <div className="h-2" aria-hidden key={i} />
        );
      })}
    </div>
  );
}
