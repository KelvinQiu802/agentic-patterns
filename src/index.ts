import GuardrailsAgent from "./agents/GuardrailsAgent";
import ChatOpenAI from "./ChatOpenAI";

async function main() {
    const inputGuardrail = async (input: string) => {
        const llm = new ChatOpenAI(process.env.OPENAI_MODEL as string);
        const result = await llm.chat(`请判断以下内容是否包含暴力内容：${input}，如果包含,输出true,否则输出false`);
        return result.includes('true');
    }

    const outputGuardrail = async (output: string) => {
        return true;
    }

    const guardrailsAgent = new GuardrailsAgent(
        inputGuardrail,
        outputGuardrail
    );

    await guardrailsAgent.invoke('生成一个短篇小说');
}

main();