const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const axios = require('axios'); // Importa o axios

const WATERFALL_DIALOG = 'waterfallDialog';
const CPF_PROMPT = 'cpfPrompt';

class Extrato extends ComponentDialog {
    constructor(id) {
        super(id);

        // Adicionar o TextPrompt para solicitar o CPF
        this.addDialog(new TextPrompt(CPF_PROMPT));

        // Configurar o WaterfallDialog com os novos passos
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.promptForCpfStep.bind(this),
            this.processCpfStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    // Passo 1: Solicita o CPF ao usuário
    async promptForCpfStep(stepContext) {
        return await stepContext.prompt(CPF_PROMPT, {
            prompt: 'Digite o CPF para mostrar o extrato:'
        });
    }

    // Passo 2: Processa o CPF e chama a API
    async processCpfStep(stepContext) {
        const cpf = stepContext.result;

        try {
            // Faz a chamada à API usando o CPF fornecido
            const response = await axios.get(`https://colocar_api/ecommerce/extrato/buscar-por-cpf/${cpf}`);

            const extrato = response.data;

            if (extrato && extrato.length > 0) {
                let mensagem = 'Extrato:\n\n';
                const campos = {
                    "CPF do Responsável:": "cpf",
                    "ID da Compra:": "id",
                    "Produto:": "productName",
                    "Preço:": "price",
                    "Data da Compra:": "dataCompra"
                };
            
                extrato.forEach(item => {
                    Object.entries(campos).forEach(([label, key]) => {
                        if (key === "price") {
                            mensagem += `\n${label} R$ ${item[key].toFixed(2)}\n`;
                        } else if (key === "dataCompra") {
                            mensagem += `\n${label} ${new Date(item[key]).toLocaleString('pt-BR')}\n`;
                        } else {
                            mensagem += `\n${label} ${item[key]}\n`;
                        }
                    });
                    mensagem += `---------------------------------\n`;
                });
                await stepContext.context.sendActivity(mensagem);
            } else {
                await stepContext.context.sendActivity('Não foram encontrados registros.');}
            } catch (error) {
                console.error('Erro ao chamar a API:', error);
                await stepContext.context.sendActivity('Ocorreu um erro ao obter o extrato.');
            }
            return await stepContext.next();
    }

    async finalStep(stepContext) {
        await stepContext.context.sendActivity('Posso ajudar em mais alguma coisa?');
        return await stepContext.endDialog();
    }
}

module.exports.Extrato = Extrato;

