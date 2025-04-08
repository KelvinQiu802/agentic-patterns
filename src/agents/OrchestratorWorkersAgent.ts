import { z } from "zod";
import ChatOpenAI from "../ChatOpenAI";
import { ORCHASTRATOR_PROMPT, WORKER_PROMPT } from "../prompt";
import { logTitle } from "../utils";

const sectionSchema = z.object({
    name: z.string().describe('name of the section'),
    description: z.string().describe('description of the section'),
});

const reportSchema = z.object({
    sections: z.array(sectionSchema).describe('sections of the report'),
});

const workerSchema = z.object({
    title: z.string().describe('title of the section'),
    content: z.string().describe('content of the section'),
});

export default class OrchestratorWorkersAgent {
    private orchestrator: ChatOpenAI
    private model: string;

    constructor() {
        if (!process.env.OPENAI_MODEL) throw new Error('OPENAI_MODEL is not set');
        this.model = process.env.OPENAI_MODEL;
        this.orchestrator = new ChatOpenAI(this.model, ORCHASTRATOR_PROMPT);
    }

    async invoke(task: string) {
        logTitle('ORCHESTRATOR');
        const response = await this.orchestrator.chat(task, reportSchema);
        const formattedResponse = reportSchema.parse(JSON.parse(response));
        const sections = formattedResponse.sections;

        logTitle(`WORKER`);
        const result = await Promise.all(sections.map(async (section) => {
            const worker = new ChatOpenAI(this.model, WORKER_PROMPT);
            const response = await worker.chat(`${section.name}: ${section.description}`, workerSchema);
            const formattedResponse = workerSchema.parse(JSON.parse(response));
            return formattedResponse;
        }));

        logTitle('SYNTHESIS');
        const synthesis = result.map(section => `${section.title}\n${section.content}\n\n`).join('\n');
        console.log(synthesis);
        return synthesis;
    }
}
