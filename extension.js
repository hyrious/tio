// @ts-nocheck
const vscode = require('vscode');
const tio = require('./api');

const delay = ms => new Promise(r => setTimeout(r, ms));

let output = null;
let cachedArgs = "", cachedInput = "", cachedCflags = "";

function invokeTio(code, lang, options) {
    if (output == null)
        output = vscode.window.createOutputChannel("tio");
    output.clear();

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Tio: Running"
    }, async (progress) => {
        progress.report({ increment: 0 });

        const token = setTimeout(() => {
            progress.report({ increment: 10, message: "..." });
        }, 500);

        const { out, err } = await tio.run(code, lang, options);

        clearTimeout(token);

        progress.report({ increment: 90, message: "...done!" });

        if (out) {
            output.appendLine("Output:");
            output.appendLine(out);
            output.show();
        }

        if (err) {
            output.appendLine("Info:");
            output.appendLine(err);
            output.show();
        }

        await delay(400);
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('tio.run', async (editor, _) => {
        const lang = await vscode.window.showQuickPick(tio.languages, { placeHolder: "Language" });
        if (lang == null) return;

        const code = editor.document.getText();

        invokeTio(code, lang, {});
    }));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('tio.run2', async (editor, _) => {
        const lang = await vscode.window.showQuickPick(tio.languages, { placeHolder: "Language" });
        if (lang == null) return;

        const input = await vscode.window.showInputBox({ value: cachedInput, placeHolder: "Input" });
        if (input == null) return;
        cachedInput = input;

        const args = await vscode.window.showInputBox({ value: cachedArgs, placeHolder: "Args" });
        if (args == null) return;
        cachedArgs = args;

        let options = { input, args: args.split(/\s+/) };
        if (lang.startsWith('c-') || lang.startsWith('cpp-')) {
            const flags = await vscode.window.showInputBox({ value: cachedCflags, placeHolder: "CFLAGS" });
            if (flags == null) return;
            cachedCflags = flags;
            options.flags = flags.split(/\s+/);
        }

        const code = editor.document.getText();

        invokeTio(code, lang, options);
    }));
}

function deactivate() {
    if (output != null) {
        output.hide();
        output.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};
