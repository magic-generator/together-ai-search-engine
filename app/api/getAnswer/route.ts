import { NextResponse } from "next/server";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";
import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function getTextFromUrl(url: string) {
  // 1. Use fetch() to get the HTML content
  const response = await fetch(url);
  const html = await response.text();

  // 2. Use the `jsdom` library to parse the HTML into a JavaScript object
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, {
    virtualConsole,
    url: url,
  });

  // 3. Use `@mozilla/readability` to clean the document and
  //    return only the main text of the page
  const reader = new Readability(dom.window.document);
  const doc = reader.parse();
  return doc?.textContent;
}

export async function POST(req: Request) {
  let json = await req.json();
  // let results = await getTextFromUrl(json.sources[0].url);
  let results = await Promise.all(
    json.sources.map((source: any) => getTextFromUrl(source.url))
  );

  const systemPrompt = `
    Given a user question and some context, please write a clean, concise
    and accurate answer to the question based on the context. You will be
    given a set of related contexts to the question. Please use the
    context when crafting your answer.

    Here are the set of contexts:

    <contexts>
    ${results.map((result) => `${result}\n\n`)}
    </contexts>
  `;
  
  // https://github.com/openai/openai-node/blob/master/examples/stream-to-client-next.ts
  const stream = openai.beta.chat.completions.stream({
    model: "deepseek-chat",
    stream: true,
    // @ts-ignore
    messages: [
      { content: systemPrompt, role: "system" },
      { content: json.question, role: "user" },
    ],
  });

  // return res.send(stream.toReadableStream());
  // @ts-ignore -- Or, for the app router:
  return new Response(stream.toReadableStream());
}
