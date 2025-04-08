import { APIUserAbortError } from "openai";
import ChatOpenAI from "../ChatOpenAI";
import { logTitle } from "../utils";

export default class GuardrailsAgent {
    private llm: ChatOpenAI;

    constructor(private inputGuardrail: (input: string) => Promise<boolean>,
        private outputGuardrail: (output: string) => Promise<boolean>) {
        if (!process.env.OPENAI_MODEL) throw new Error('OPENAI_MODEL is not set');
        this.llm = new ChatOpenAI(process.env.OPENAI_MODEL);
    }

    async invoke(input: string) {
        const abortController = new AbortController();
        const inputGuardrailWrapper = (async (input: string) => {
            const shouldAbort = await this.inputGuardrail(input);
            if (!shouldAbort) return
            abortController.abort();
            throw new APIUserAbortError({ message: 'Aborted by input guardrail' });
        });
        const outputGuardrailWrapper = (async (output: string) => {
            const shouldAbort = await this.outputGuardrail(output);
            if (!shouldAbort) return
            abortController.abort();
            throw new APIUserAbortError({ message: 'Aborted by output guardrail' });
        });
        try {
            // Fire two promises in parallel
            const result = await Promise.all([
                inputGuardrailWrapper(input),
                this.llm.chat(input, undefined, { signal: abortController.signal }),
            ]);
            // Output Guardrail
            await outputGuardrailWrapper(result[1]);
            return result[1];
        } catch (error) {
            if (error instanceof APIUserAbortError) {
                logTitle(error.message.toUpperCase());
            }
        }
    }
}
