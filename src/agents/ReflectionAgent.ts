import ChatOpenAI from "../ChatOpenAI";
import z from 'zod';
import { logTitle } from "../utils";

const EvaluatorResponseSchema = z.object({
    reason: z.string().describe('Must return first'),
    suggestion: z.string().describe('Modification suggestion'),
    pass: z.boolean().describe('Return true if no further changes are needed, otherwise false')
});

export default class ReflectionAgent {
    private generator: ChatOpenAI;
    private evaluator: ChatOpenAI;

    constructor(generatorSysPrompt: string, evaluatorSysPrompt: string) {
        if (!process.env.OPENAI_MODEL) throw new Error('OPENAI_MODEL is not set');
        this.generator = new ChatOpenAI(process.env.OPENAI_MODEL, generatorSysPrompt);
        this.evaluator = new ChatOpenAI(process.env.OPENAI_MODEL, evaluatorSysPrompt);
    }

    private async generate(prompt: string) {
        return await this.generator.chat(prompt);
    }

    private async evaluate(prompt: string): Promise<z.infer<typeof EvaluatorResponseSchema>> {
        const response = await this.evaluator.chat(prompt, EvaluatorResponseSchema);
        try {
            const parsed = JSON.parse(response);
            return EvaluatorResponseSchema.parse(parsed);
        } catch (error) {
            console.error(error);
            return this.evaluate(prompt); // Retry if the response is not valid
        }
    }

    async invoke(prompt: string, maxIterations: number = 5) {
        if (maxIterations <= 0) throw new Error('maxIterations must be greater than 0');
        for (let i = 0; i < maxIterations; i++) {
            logTitle(`Iteration ${i + 1} of ${maxIterations}`);
            logTitle('GENERATION');
            const generatorResponse = await this.generate(prompt);
            if (i === maxIterations - 1) return generatorResponse; // Return on the last iteration
            logTitle('EVALUATION');
            const evaluatorResponse = await this.evaluate(generatorResponse);
            if (evaluatorResponse.pass) return generatorResponse; // Return if the evaluator passes
            prompt = evaluatorResponse.suggestion;
        }
        return prompt;
    }
}
