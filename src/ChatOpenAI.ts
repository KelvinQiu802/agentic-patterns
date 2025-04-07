import OpenAI from "openai";
import 'dotenv/config';

export default class ChatOpenAI {
    private openai: OpenAI;
    private model: string;
    private messages: OpenAI.Chat.ChatCompletionMessageParam[];

    constructor(model: string) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
        this.model = model;
        this.messages = [];
    }

    async chat(prompt: string) {
        this.messages.push({ role: 'user', content: prompt });
        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.messages,
            stream: true,
        });
        let result = '';
        for await (const chunk of completion) {
            process.stdout.write(chunk.choices[0].delta.content || '');
            result += chunk.choices[0].delta.content || '';
        }
        this.messages.push({ role: 'assistant', content: result });
        return result;
    }
}