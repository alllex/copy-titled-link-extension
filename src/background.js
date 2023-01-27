
const extensionName = "Copy Title";

async function contentScript_copyPageDetailsToClipboard() {
    function getSelectionText() {
        let text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        return text;
    }

    function getTitleAndUrl() {
        const url = location.href;
        const selectionText = getSelectionText();
        if (selectionText) {
            const urlBeforeHash = url.split('#')[0];
            const encodedSelectionText = encodeURIComponent(selectionText);
            const highlightUrl = urlBeforeHash + "#:~:text=" + encodedSelectionText;
            return {
                title: selectionText,
                url: highlightUrl,
            };
        }

        return {
            title: document.title,
            url: url,
        };
    }

    const doCopy = async () => {
        const { title, url } = getTitleAndUrl();

        const htmlText = `<a href="${url}">${title}</a>`;
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });
        const plainText = `${title}\n${url}`;
        const textBlob = new Blob([plainText], { type: 'text/plain', });

        const clipboardItem = new ClipboardItem({
            [htmlBlob.type]: htmlBlob,
            [textBlob.type]: textBlob,
        });

        // TODO: will not work in Safari
        await navigator.clipboard.write([clipboardItem]);
        return plainText;
    };

    const wrapError = (e) => new Error(extensionName + ": failed to copy page details", { cause: e });

    try {
        return await doCopy();
    } catch (e) {
        if (!(e instanceof DOMException)) {
            throw wrapError(e);
        }
    }

    // Avoids `DOMException: Document is not focused` in case DevTools was focused
    return new Promise((resolve, reject) => {
        const _asyncCopyFn = (async () => {
            try {
                value = await doCopy();
                resolve(value);
            } catch (e) {
                reject(wrapError(e));
            }
            window.removeEventListener("focus", _asyncCopyFn);
        });

        window.addEventListener("focus", _asyncCopyFn);
        console.log(extensionName + ": Hit <Tab> to give focus back to document and copy page details");
    });
}

async function notifyOnCopy(copiedText) {
    await chrome.notifications.create({
        type: "basic",
        iconUrl: "images/icon-128.png",
        title: "Copied to clipboard",
        message: copiedText,
    });
}

chrome.action.onClicked.addListener(async (tab) => {
    const copyInjectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: contentScript_copyPageDetailsToClipboard,
    });

    if (copyInjectionResults && copyInjectionResults[0] && copyInjectionResults[0].result) {
        const copiedText = copyInjectionResults[0].result;
        await notifyOnCopy(copiedText);
    }
});