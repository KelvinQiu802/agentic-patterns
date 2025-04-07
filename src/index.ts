import ReflectionAgent from "./agents/ReflectionAgent";

async function main() {
    const reflectionAgent = new ReflectionAgent(
        '你是一个专业的程序员, 擅长typescript',
        '你是一个专业的Code Reviewer, 擅长发现代码中的问题, 并给出修改建议'
    );
    await reflectionAgent.invoke('写一个冒泡排序');
}

main();