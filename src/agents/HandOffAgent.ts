import { OpenAI } from "openai";
import 'dotenv/config';

export default class HandOffAgent {
    private llm: OpenAI;
    private messages: OpenAI.Chat.ChatCompletionMessageParam[];

    constructor(private name: string, private instructions: string, private handoffs: HandOffAgent[]) {
        this.name = name;
        this.handoffs = handoffs;
        this.messages = [{ role: 'system', content: instructions }];
        this.llm = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
    }

    async invoke(prompt: string, prevMessages?: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string | null> {
        if (!process.env.OPENAI_MODEL) throw new Error('OPENAI_MODEL is not set');

        // Shared Context
        if (prevMessages) {
            this.messages = [
                { role: 'system', content: this.instructions },
                ...prevMessages.filter(m => m.role !== 'system')
            ];
        } else {
            this.messages.push({ role: 'user', content: prompt });
        }

        while (true) {
            const res = await this.llm.chat.completions.create({
                model: process.env.OPENAI_MODEL,
                messages: this.messages,
                tools: this.convertHandoffsToTools(),
            });
            const assistantMessage = res.choices[0].message;
            console.log(`${this.name} response: ${assistantMessage.content}`);
            this.messages.push({ role: assistantMessage.role, content: assistantMessage.content, tool_calls: assistantMessage.tool_calls });

            const toolCall = assistantMessage.tool_calls?.[0];
            if (toolCall) {
                const nextAgentName = toolCall.function.name;
                const nextAgent = this.handoffs.find(h => h.name === nextAgentName);
                if (!nextAgent) throw new Error(`Next agent ${nextAgentName} not found`);
                console.log(`Handing off from ${this.name} to ${nextAgentName}`);
                this.messages.push({ role: 'tool', content: `Handing off to ${nextAgentName}`, tool_call_id: toolCall.id });
                return await nextAgent.invoke(prompt, this.messages);
            } else {
                return assistantMessage.content;
            }
        }
    }

    private convertHandoffsToTools() {
        return this.handoffs.map(handoff => ({
            type: 'function' as const,
            function: {
                name: handoff.name,
                description: handoff.instructions,
                parameters: undefined
            }
        }));
    }
}