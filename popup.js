// Lorem Ipsform popup script.
//
// Chrome and Firefox both run this as a Manifest V3 extension with
// promise-based APIs, so no per-browser branches are needed.

const api = globalThis.browser ?? globalThis.chrome;

const $ = (id) => document.getElementById(id);

const fillButton = $('fillFormsBtn');
const fillAllButton = $('fillAllFormsBtn');
const formSelector = $('formSelector');
const formList = $('formList');
const resultsDiv = $('results');
const statusDiv = $('status');

const OPTION_IDS = ['fillTexts', 'fillDropdowns', 'fillRadios', 'fillCheckboxes', 'onlyEmptyFields', 'suppressUnicode'];
const OPTION_DEFAULTS = { suppressUnicode: false }; // everything else defaults to on

let statusTimer;

function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
    }, 3000);
}

function currentOptions() {
    return Object.fromEntries(OPTION_IDS.map((id) => [id, $(id).checked]));
}

function setBusy(busy, label) {
    fillButton.disabled = busy;
    fillAllButton.disabled = busy;
    if (busy) {
        const target = formSelector.hidden ? fillButton : fillAllButton;
        target.replaceChildren(Object.assign(document.createElement('span'), { className: 'loading' }), ` ${label}`);
    } else {
        fillButton.textContent = 'Fill Forms Now';
        fillAllButton.textContent = 'Fill All Forms';
    }
}

async function activeTabId() {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');
    return tab.id;
}

// Inject content.js into the tab's top frame (a no-op if it's already there),
// then call one of its methods and return the result.
async function callPage(method, ...args) {
    const tabId = await activeTabId();
    try {
        await api.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    } catch (error) {
        console.warn('Could not inject content script:', error);
        throw new Error('Cannot access this page. Try a regular website (not about:, chrome:, or extension store pages).');
    }
    const [injection] = await api.scripting.executeScript({
        target: { tabId },
        func: async (name, params) => {
            try {
                return { value: await globalThis.__formFiller[name](...params) };
            } catch (error) {
                return { error: String(error && error.message || error) };
            }
        },
        args: [method, args]
    });
    const outcome = injection && injection.result;
    if (!outcome) throw new Error('No response from page. Try refreshing.');
    if (outcome.error) throw new Error(outcome.error);
    return outcome.value;
}

function showResults(results, label) {
    $('textCount').textContent = results.textInputs;
    $('dropdownCount').textContent = results.dropdowns;
    $('radioCount').textContent = results.radioButtons;
    $('checkboxCount').textContent = results.checkboxes;
    resultsDiv.classList.add('show');

    const total = results.textInputs + results.dropdowns + results.radioButtons + results.checkboxes;
    if (total > 0) {
        showStatus(label ? `✅ Filled ${total} elements in "${label}"` : `✅ Filled ${total} form elements`, 'success');
    } else {
        showStatus('⚠️ Nothing to fill (fields may already have values)', 'error');
    }
}

async function fill(scope, label) {
    setBusy(true, 'Filling…');
    try {
        const results = await callPage('fill', scope, currentOptions());
        showResults(results, label);
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
    } finally {
        setBusy(false);
    }
}

async function detectAndFill() {
    setBusy(true, 'Detecting forms…');
    let forms;
    try {
        forms = await callPage('detectForms');
    } catch (error) {
        setBusy(false);
        showStatus(`❌ ${error.message}`, 'error');
        return;
    }
    setBusy(false);

    if (forms.length === 0) {
        showStatus('⚠️ No forms found on this page', 'error');
    } else if (forms.length === 1) {
        fill(forms[0].scope, forms[0].name);
    } else {
        showFormSelector(forms);
    }
}

function showFormSelector(forms) {
    fillButton.hidden = true;
    formSelector.hidden = false;
    formList.replaceChildren();

    for (const form of forms) {
        const item = document.createElement('div');
        item.className = 'form-item';

        const name = document.createElement('div');
        name.className = 'form-name';
        name.textContent = form.name; // page-supplied text: never innerHTML

        const details = document.createElement('div');
        details.className = 'form-details';
        for (const text of [
            `📝 ${form.textInputs} texts`,
            `📋 ${form.dropdowns} dropdowns`,
            `🔘 ${form.radioButtons} radios`,
            `☑️ ${form.checkboxes} checkboxes`
        ]) {
            const detail = document.createElement('div');
            detail.className = 'form-detail-item';
            detail.textContent = text;
            details.append(detail);
        }

        item.append(name, details);
        item.addEventListener('mouseenter', () => callPage('highlight', form.scope).catch(() => {}));
        item.addEventListener('mouseleave', () => callPage('removeHighlight').catch(() => {}));
        item.addEventListener('click', () => {
            callPage('removeHighlight').catch(() => {});
            fill(form.scope, form.name);
        });
        formList.append(item);
    }
}

async function loadPreferences() {
    const { preferences = {} } = await api.storage.sync.get('preferences');
    for (const id of OPTION_IDS) {
        const fallback = OPTION_DEFAULTS[id] ?? true;
        $(id).checked = typeof preferences[id] === 'boolean' ? preferences[id] : fallback;
    }
}

function savePreferences() {
    api.storage.sync.set({ preferences: currentOptions() });
}

fillButton.addEventListener('click', detectAndFill);
fillAllButton.addEventListener('click', () => fill('all'));
OPTION_IDS.forEach((id) => $(id).addEventListener('change', savePreferences));

// Enter runs the visible main action. A focused button already handles Enter
// itself (as a click), so skip it here or the action would run twice.
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || fillButton.disabled || e.target.closest('button, .form-item')) return;
    if (formSelector.hidden) detectAndFill();
    else fill('all');
});

loadPreferences();
fillButton.focus();
