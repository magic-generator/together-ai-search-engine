import { NextResponse } from "next/server";
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from "@mozilla/readability";
import OpenAI from "openai";
import axios from "axios";
import { Together } from "together-ai";
const together = new Together();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
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
  )

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
  const runner = await together.chat.completions.stream({
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: json.question },
    ],
  });

  return new Response(runner.toReadableStream());
  // console.log(results);
  // let data = JSON.stringify({
  //   "messages": [
  //     {
  //       "content": systemPrompt,
  //       "role": "system"
  //     },
  //     {
  //       "content": json.question,
  //       "role": "user"
  //     }
  //   ],
  //   "model": "deepseek-chat",
  //   "frequency_penalty": 0,
  //   "max_tokens": 2048,
  //   "presence_penalty": 0,
  //   "response_format": {
  //     "type": "text"
  //   },
  //   "stop": null,
  //   "stream": true,
  //   "stream_options": null,
  //   "temperature": 1,
  //   "top_p": 1,
  //   "tools": null,
  //   "tool_choice": "none",
  //   "logprobs": false,
  //   "top_logprobs": null
  // });

  // let config = {
  //   method: 'post',
  //   maxBodyLength: Infinity,
  //     url: 'https://api.deepseek.com/chat/completions',
  //     headers: { 
  //       'Content-Type': 'application/json', 
  //       'Accept': 'application/json', 
  //       'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
  //     },
  //     data : data
  //   };

  // axios(config)
  // .then((response) => {
  //   console.log(JSON.stringify(response.data));
  // })
  // .catch((error) => {
  //   console.log(error);
  // });
  // return NextResponse.json({ message: results });
}
