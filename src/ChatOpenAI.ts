import OpenAI, { APIUserAbortError } from "openai";
import 'dotenv/config';
import z from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { RequestOptions } from "openai/core";

export default class ChatOpenAI {
    private openai: OpenAI;
    private model: string;
    private messages: OpenAI.Chat.ChatCompletionMessageParam[];

    constructor(model: string, sysPrompt?: string) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
        this.model = model;
        this.messages = [];
        sysPrompt && this.messages.push({ role: 'system', content: sysPrompt });
    }

    async chat(prompt: string, responseFormat?: z.ZodSchema, options?: RequestOptions) {
        this.messages.push({ role: 'user', content: prompt });
        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.messages,
            stream: true,
            response_format: responseFormat ? zodResponseFormat(responseFormat, 'suggestion') : undefined,
        }, options);
        let result = '';
        for await (const chunk of completion) {
            process.stdout.write(chunk.choices[0].delta.content || '');
            result += chunk.choices[0].delta.content || '';
        }
        process.stdout.write('\n');
        this.messages.push({ role: 'assistant', content: result });
        return result;
    }
}