import ReflectionAgent from "./agents/ReflectionAgent";
import { GENERATOR_PROMPT, EVALUATOR_PROMPT } from "./prompt";

async function main() {
    const reflectionAgent = new ReflectionAgent(GENERATOR_PROMPT, EVALUATOR_PROMPT);
    await reflectionAgent.invoke('写一个冒泡排序');
}

main();