import HandOffAgent from "./agents/HandOffAgent";

async function main() {
    const englishAgent = new HandOffAgent(
        'english_agent',
        'You only speak English',
        []
    );

    const chineseAgent = new HandOffAgent(
        'chinese_agent',
        '你只说中文',
        []
    );

    const handOffAgent = new HandOffAgent(
        'handoff_agent',
        '你是一个分流助手，请根据用户的问题，将问题分流到不同的助手',
        [englishAgent, chineseAgent]
    );

    await handOffAgent.invoke('帮我把下面的英文翻译成中文: To be or not to be, that is the question.');
}

main();