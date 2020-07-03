// @ts-nocheck
const vscode = require('vscode');
const tio = require('./api');

const delay = ms => new Promise(r => setTimeout(r, ms));

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let disposable = vscode.commands.registerTextEditorCommand('tio.run', async (editor, edit) => {
        const lang = await vscode.window.showQuickPick(tio.languages, { placeHolder: "Language" });
        if (lang == null) return;
        const code = editor.document.getText();
        const output = vscode.window.createOutputChannel("tio");
        output.clear();
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Tio: Running"
        }, async (progress) => {
            progress.report({ increment: 0 });

            const token = setTimeout(() => {
                progress.report({ increment: 10, message: "..." });
            }, 500);

            const { out, err } = await tio.run(code, lang);

            clearTimeout(token);
            progress.report({ increment: 90, message: "..." })

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
    });
    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
