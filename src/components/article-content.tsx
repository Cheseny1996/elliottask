import type { ReactNode } from "react";

export function ArticleContent({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const content: ReactNode[] = [];

  blocks.forEach((block, index) => {
    if (block.startsWith("## ")) {
      content.push(<h2 key={index}>{block.slice(3)}</h2>);
    } else if (block.startsWith("### ")) {
      content.push(<h3 key={index}>{block.slice(4)}</h3>);
    } else if (block.split("\n").every((line) => line.startsWith("- "))) {
      content.push(
        <ul key={index}>
          {block.split("\n").map((line) => <li key={line}>{line.slice(2)}</li>)}
        </ul>,
      );
    } else {
      content.push(<p key={index}>{block.replace(/\n/g, " ")}</p>);
    }
  });

  return <div className="article-content">{content}</div>;
}
