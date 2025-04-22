"use client";
import { ChatCompletionStream } from "openai/resources/beta/chat/completions.mjs";
import { useState } from "react";

// app/page.tsx
function Page() {
  let [question, setQuestion] = useState("");
  let [sources, setSources] = useState([]);
  let [answer, setAnswer] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let response = await fetch("/api/getSources", {
      method: "POST",
      body: JSON.stringify({ question }),
    });

    let sources = await response.json();
    setSources(sources);

    const answerResponse = await fetch("/api/getAnswer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, sources }),
    });
    const runner = ChatCompletionStream.fromReadableStream(answerResponse.body as any);
    runner.on("content", (delta: any) =>
      setAnswer((prev: any) => prev + delta)
    );
    // const answerResponse = await fetch("/api/getAnswer", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ question, sources }),
    // });

    // let answer = await answerResponse.json();
    // setAnswer(answer);
  }
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Can you explain the theory of relativity?"
      />

      {sources.length > 0 && (
        <div>
          <p>Sources</p>
          <ul>
            {sources.map((source: any) => (
              <li key={source.url}>
                <a href={source.url}>{source.name}</a>
                <p>{source.snippet}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {answer && <p>{answer}</p>}
    </form>
  );
}

export default Page;
