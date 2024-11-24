const { ComponentDialog, WaterfallDialog, ChoicePrompt, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { Extrato } = require('../Extrato');
const { Pedido } = require('../Pedido');
const { Produto } = require('../Produto');


const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'choicePrompt';
let welcomeDialogCheck = false

class MainDialog extends ComponentDialog {
    constructor(id, userState) {
        super(id);

        this.userState = userState;

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new Pedido('Pedido'));
        this.addDialog(new Extrato('Extrato'));
        this.addDialog(new Produto('Produto'));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.choiceCardStep.bind(this),
            this.processChoiceStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        // Checks welcome Info Dialog
        if (welcomeDialogCheck === false){
            welcomeDialogCheck = true
            await turnContext.sendActivity(
                'O que deseja?'
            );
        }

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * 1. Prompts the user if the user is not in the middle of a dialog.
     * 2. Re-prompts the user when an invalid input is received.
     * @param {WaterfallStepContext} stepContext
     */
    async choiceCardStep(stepContext) {
        console.log('MainDialog.choiceCardStep'); // Log para depuração

        // Configurações do ChoicePrompt
        const options = {
            prompt: 'Escolha a opção desejada:',
            retryPrompt: 'Opção inválida. Selecione as opções disponíveis:',
            choices: this.getChoices()
        };

        // Prompt ao usuário com as opções configuradas
        return await stepContext.prompt(CHOICE_PROMPT, options);
    }

    // Processa a escolha do usuário
    async processChoiceStep(stepContext) {
        const choice = stepContext.result.value;

        // Resposta dinâmica baseada na escolha
        let responseMessage;
        if (choice === 'Consultar Pedidos') {
            return await stepContext.beginDialog('Pedido');
        } else if (choice === 'Consultar Extrato') {
            return await stepContext.beginDialog('Extrato');
        } else if (choice === 'Consultar Produto') {
            return await stepContext.beginDialog('Produto');
        } else {
            responseMessage = 'Opção não reconhecida.';
            await stepContext.context.sendActivity(responseMessage);
        }

        await stepContext.context.sendActivity(responseMessage);
        return await stepContext.endDialog();
    }

    // Configurações das opções do ChoicePrompt
    getChoices() {
        return [
            { value: 'Consultar Pedidos', synonyms: ['pedidos', 'primeira opção', 'pedido', '1'] },
            { value: 'Consultar Extrato', synonyms: ['extrato', 'segunda opção','extrato', '2'] },
            { value: 'Consultar Produto', synonyms: ['produto', 'terceira opção', 'produtos', '3'] }
        ];
    }
}

module.exports.MainDialog = MainDialog;
