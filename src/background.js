
const extensionName = "Copy Title";

async function contentScript_copyPageDetailsToClipboard() {
    const doCopy = async () => {
        const title = document.title;
        const url = location.href;
        const text = `${title}\n${url}`;
        // console.log(`Page details:\n${text}`);
        await navigator.clipboard.writeText(text);
        // console.log(`Page details copied to clipboard`);
        return text;
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
    // Must be synchronous to remain inside "user gesture"
    // chrome.permissions.contains({
    //     permissions: ['notifications'],
    //     origins: [],
    // }, (hasNotificationPermission) => {
    // });

    const copyInjectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: contentScript_copyPageDetailsToClipboard,
    });
    if (copyInjectionResults && copyInjectionResults[0] && copyInjectionResults[0].result) {
        const copiedText = copyInjectionResults[0].result;
        await notifyOnCopy(copiedText);
        // console.log(extensionName + ": result: " + copiedText);
    }

    // const currentUrlInjectionResults = await chrome.scripting.executeScript({
    //     target: { tabId: tab.id },
    //     func: contentScript_getWindowLocationUrl,
    // });

    // if (currentUrlInjectionResults && currentUrlInjectionResults[0] && currentUrlInjectionResults[0].result) {
    //     const currentUrl = currentUrlInjectionResults[0].result;

    //     const hasNotificationPermission = await chrome.permissions.contains({
    //         permissions: ['notifications'],
    //         origins: [currentUrl],
    //     })

    //     console.log("Notification permissions: " + hasNotificationPermission);
    //     if (hasNotificationPermission) {
    //         await notifyOnCopy();
    //     } else {
    //         console.log("Requesting notification permissions");
    //         const gotNotificationPermission = await chrome.permissions.request({
    //             permissions: ['notifications'],
    //             origins: [currentUrl],
    //         });

    //         if (gotNotificationPermission) {
    //             await notifyOnCopy();
    //         } else {
    //             console.log(extensionName + ": notification permissions have been denied");
    //         }
    //     }
    // }
});