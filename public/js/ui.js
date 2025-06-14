// public/js/ui.js

import { getCancerCodes, saveCancerCode, deleteCancerCode, getAnatomyCodes, saveAnatomyCode, deleteAnatomyCode } from './db.js';

// 獲取 DOM 元素
const fileInput = document.getElementById('fileInput');
const processFileBtn = document.getElementById('processFileBtn');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('results-section');
const resultsTableBody = document.querySelector('#resultsTable tbody');
const downloadResultsBtn = document.getElementById('downloadResultsBtn');
const codeMaintenanceSection = document.getElementById('code-maintenance-section');

// 碼表維護相關元素
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// 癌症碼元素
const cancerCodeTableBody = document.querySelector('#cancerCodeTable tbody');
const addCancerCodeSnomedInput = document.getElementById('addCancerCodeSnomed');
const addCancerCodeDescInput = document.getElementById('addCancerCodeDesc');
const addCancerCodeIsCancerCheckbox = document.getElementById('addCancerCodeIsCancer');
const addCancerCodeIsMetastasisCheckbox = document.getElementById('addCancerCodeIsMetastasis');
const saveCancerCodeBtn = document.getElementById('saveCancerCodeBtn');
const cancelEditCancerCodeBtn = document.getElementById('cancelEditCancerCodeBtn');
const unidentifiedCancerCodesArea = document.getElementById('unidentifiedCancerCodes');
const unidentifiedCancerCodeList = document.getElementById('unidentifiedCancerCodeList');
const addSelectedUnidentifiedCancerCodesBtn = document.getElementById('addSelectedUnidentifiedCancerCodesBtn');
const exportCancerCodesBtn = document.getElementById('exportCancerCodesBtn');

// 解剖碼元素
const anatomyCodeTableBody = document.querySelector('#anatomyCodeTable tbody');
const addAnatomyCodeSnomedInput = document.getElementById('addAnatomyCodeSnomed');
const addAnatomyCodeMappedNameInput = document.getElementById('addAnatomyCodeMappedName');
const saveAnatomyCodeBtn = document.getElementById('saveAnatomyCodeBtn');
const cancelEditAnatomyCodeBtn = document.getElementById('cancelEditAnatomyCodeBtn');
const unidentifiedAnatomyCodesArea = document.getElementById('unidentifiedAnatomyCodes');
const unidentifiedAnatomyCodeList = document.getElementById('unidentifiedAnatomyCodeList');
const exportAnatomyCodesBtn = document.getElementById('exportAnatomyCodesBtn');

let currentEditingCancerCodeSnomed = null; // 用於編輯模式
let currentEditingAnatomyCodeSnomed = null; // 用於編輯模式

/**
 * 顯示狀態訊息。
 * @param {string} message - 要顯示的訊息。
 * @param {string} type - 訊息類型 ('success', 'error', 或空)。
 */
export function showStatusMessage(message, type = '') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    // 清除訊息以便下次顯示
    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 5000);
}

/**
 * 顯示或隱藏區塊。
 * @param {HTMLElement} element - 要操作的 DOM 元素。
 * @param {boolean} show - true 為顯示，false 為隱藏。
 */
function toggleSection(element, show) {
    element.style.display = show ? 'block' : 'none';
}

/**
 * 更新檔案名稱顯示。
 * @param {string} name - 檔案名稱。
 */
export function updateFileNameDisplay(name) {
    fileNameDisplay.textContent = `已選取檔案: ${name}`;
}

/**
 * 顯示統計結果。
 * @param {Array<Object>} stats - 統計結果陣列。
 */
export function displayResults(stats) {
    resultsTableBody.innerHTML = ''; // 清空舊結果
    if (stats.length === 0) {
        resultsTableBody.innerHTML = '<tr><td colspan="2">沒有符合條件的癌症診斷。</td></tr>';
    } else {
        stats.forEach(item => {
            const row = resultsTableBody.insertRow();
            row.insertCell().textContent = item.anatomy;
            row.insertCell().textContent = item.count;
        });
    }
    toggleSection(resultsSection, true);
}

/**
 * 下載統計結果為 CSV。
 * @param {Array<Object>} stats - 統計結果陣列。
 */
export function downloadResults(stats) {
    let csvContent = '解剖部位 (癌別),癌症數量\n';
    stats.forEach(item => {
        csvContent += `${item.anatomy},${item.count}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cancer_stats.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatusMessage('統計結果已下載。', 'success');
}

/**
 * 渲染癌症碼對照表。
 */
export async function renderCancerCodeTable() {
    const codes = await getCancerCodes();
    cancerCodeTableBody.innerHTML = '';
    codes.forEach(code => {
        const row = cancerCodeTableBody.insertRow();
        row.insertCell().textContent = code.snomedCode;
        row.insertCell().textContent = code.description;
        row.insertCell().textContent = code.isCancer ? '是' : '否';
        row.insertCell().textContent = code.isMetastasis ? '是' : '否';

        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = '編輯';
        editBtn.onclick = () => editCancerCode(code);
        actionsCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '刪除';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = async () => {
            if (confirm(`確定要刪除癌症碼 ${code.snomedCode} 嗎？`)) {
                await deleteCancerCode(code.snomedCode);
                showStatusMessage('癌症碼已刪除', 'success');
                renderCancerCodeTable();
            }
        };
        actionsCell.appendChild(deleteBtn);
    });
}

/**
 * 編輯癌症碼表單。
 * @param {Object} code - 要編輯的癌症碼物件。
 */
function editCancerCode(code) {
    addCancerCodeSnomedInput.value = code.snomedCode;
    addCancerCodeSnomedInput.disabled = true; // SNOMED 碼通常不允許編輯
    addCancerCodeDescInput.value = code.description;
    addCancerCodeIsCancerCheckbox.checked = code.isCancer;
    addCancerCodeIsMetastasisCheckbox.checked = code.isMetastasis;
    saveCancerCodeBtn.textContent = '更新癌症碼';
    cancelEditCancerCodeBtn.style.display = 'inline-block';
    currentEditingCancerCodeSnomed = code.snomedCode;
}

/**
 * 渲染解剖部位對照表。
 */
export async function renderAnatomyCodeTable() {
    const codes = await getAnatomyCodes();
    anatomyCodeTableBody.innerHTML = '';
    codes.forEach(code => {
        const row = anatomyCodeTableBody.insertRow();
        row.insertCell().textContent = code.snomedCode;
        row.insertCell().textContent = code.mappedName;

        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = '編輯';
        editBtn.onclick = () => editAnatomyCode(code);
        actionsCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '刪除';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = async () => {
            if (confirm(`確定要刪除解剖碼 ${code.snomedCode} 嗎？`)) {
                await deleteAnatomyCode(code.snomedCode);
                showStatusMessage('解剖碼已刪除', 'success');
                renderAnatomyCodeTable();
            }
        };
        actionsCell.appendChild(deleteBtn);
    });
}

/**
 * 編輯解剖部位碼表單。
 * @param {Object} code - 要編輯的解剖部位碼物件。
 */
function editAnatomyCode(code) {
    addAnatomyCodeSnomedInput.value = code.snomedCode;
    addAnatomyCodeSnomedInput.disabled = true; // SNOMED 碼通常不允許編輯
    addAnatomyCodeMappedNameInput.value = code.mappedName;
    saveAnatomyCodeBtn.textContent = '更新解剖碼';
    cancelEditAnatomyCodeBtn.style.display = 'inline-block';
    currentEditingAnatomyCodeSnomed = code.snomedCode;
}

/**
 * 清空癌症碼編輯表單。
 */
function clearCancerCodeForm() {
    addCancerCodeSnomedInput.value = '';
    addCancerCodeSnomedInput.disabled = false;
    addCancerCodeDescInput.value = '';
    addCancerCodeIsCancerCheckbox.checked = false;
    addCancerCodeIsMetastasisCheckbox.checked = false;
    saveCancerCodeBtn.textContent = '儲存癌症碼';
    cancelEditCancerCodeBtn.style.display = 'none';
    currentEditingCancerCodeSnomed = null;
}

/**
 * 清空解剖碼編輯表單。
 */
function clearAnatomyCodeForm() {
    addAnatomyCodeSnomedInput.value = '';
    addAnatomyCodeSnomedInput.disabled = false;
    addAnatomyCodeMappedNameInput.value = '';
    saveAnatomyCodeBtn.textContent = '儲存解剖碼';
    cancelEditAnatomyCodeBtn.style.display = 'none';
    currentEditingAnatomyCodeSnomed = null;
}

/**
 * 顯示未識別的癌症診斷碼。
 * @param {Array<string>} codes - 未識別碼陣列。
 */
export function displayUnidentifiedCancerCodes(codes) {
    unidentifiedCancerCodeList.innerHTML = '';
    if (codes.length === 0) {
        unidentifiedCancerCodesArea.style.display = 'none';
        addSelectedUnidentifiedCancerCodesBtn.style.display = 'none';
        return;
    }

    unidentifiedCancerCodesArea.style.display = 'block';
    addSelectedUnidentifiedCancerCodesBtn.style.display = 'inline-block';

    codes.forEach(code => {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = code;
        checkbox.id = `unidentified-cancer-${code}`; // 確保 ID 唯一
        li.appendChild(checkbox);

        const label = document.createElement('label');
        label.htmlFor = `unidentified-cancer-${code}`;
        label.textContent = `SNOMED: ${code}`; // 這裡可以考慮從某些來源獲取更詳細的描述，如果有的話
        li.appendChild(label);
        unidentifiedCancerCodeList.appendChild(li);
    });
}

/**
 * 處理選取未識別癌症碼並新增至對照表。
 */
async function handleAddSelectedUnidentifiedCancerCodes() {
    const selectedCheckboxes = unidentifiedCancerCodeList.querySelectorAll('input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0) {
        showStatusMessage('請選擇要新增的診斷碼。', 'error');
        return;
    }

    for (const checkbox of selectedCheckboxes) {
        const snomedCode = checkbox.value;
        // 這裡預設新增為癌症且非轉移。用戶可以在編輯介面修改。
        await saveCancerCode({
            snomedCode: snomedCode,
            description: `新診斷癌碼: ${snomedCode}`, // 提供預設描述
            isCancer: true,
            isMetastasis: false
        });
    }
    showStatusMessage('已選診斷碼已新增至癌症碼對照表。', 'success');
    unidentifiedCancerCodesArea.style.display = 'none'; // 隱藏提示區
    addSelectedUnidentifiedCancerCodesBtn.style.display = 'none';
    renderCancerCodeTable(); // 重新渲染表格
}

/**
 * 顯示未建檔的解剖碼。
 * @param {Array<string>} codes - 未建檔碼陣列。
 */
export function displayUnidentifiedAnatomyCodes(codes) {
    unidentifiedAnatomyCodeList.innerHTML = '';
    if (codes.length === 0) {
        unidentifiedAnatomyCodesArea.style.display = 'none';
        return;
    }

    unidentifiedAnatomyCodesArea.style.display = 'block';

    codes.forEach(code => {
        const li = document.createElement('li');
        li.textContent = `SNOMED: ${code} - 請在下方編輯區新增或修改歸戶部位。`;
        unidentifiedAnatomyCodeList.appendChild(li);
    });
    // 考慮直接將未識別碼的輸入框填充，方便用戶直接編輯
    if (codes.length > 0 && !currentEditingAnatomyCodeSnomed) { // 如果沒有正在編輯的，才填充第一個
        addAnatomyCodeSnomedInput.value = codes[0];
        addAnatomyCodeMappedNameInput.focus();
    }
}

/**
 * 匯出對照表為 JSON 檔案。
 * @param {Array<Object>} data - 要匯出的數據。
 * @param {string} filename - 匯出的檔案名稱。
 */
function exportJson(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatusMessage(`${filename} 已匯出。`, 'success');
}


// 初始化 UI 狀態和事件監聽器
export function initializeUI(processFileCallback) {
    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            updateFileNameDisplay(event.target.files[0].name);
            processFileBtn.disabled = false;
        } else {
            updateFileNameDisplay('未選擇檔案');
            processFileBtn.disabled = true;
        }
    });

    processFileBtn.addEventListener('click', () => {
        if (fileInput.files.length > 0) {
            processFileCallback(fileInput.files[0]);
        } else {
            showStatusMessage('請先選擇檔案！', 'error');
        }
    });

    // 下載結果按鈕事件
    downloadResultsBtn.addEventListener('click', () => {
        // 在 app.js 中獲取當前統計結果並傳遞給此函數
        // 目前先留空，由 app.js 處理
    });

    // 碼表維護 Tab 切換
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const targetTabId = button.dataset.tab;
            document.getElementById(`${targetTabId}-tab`).classList.add('active');
        });
    });

    // 癌症碼保存/更新
    saveCancerCodeBtn.addEventListener('click', async () => {
        const snomedCode = addCancerCodeSnomedInput.value.trim();
        const description = addCancerCodeDescInput.value.trim();
        const isCancer = addCancerCodeIsCancerCheckbox.checked;
        const isMetastasis = addCancerCodeIsMetastasisCheckbox.checked;

        if (!snomedCode || !description) {
            showStatusMessage('SNOMED 碼和描述不能為空！', 'error');
            return;
        }

        try {
            await saveCancerCode({ snomedCode, description, isCancer, isMetastasis });
            showStatusMessage(currentEditingCancerCodeSnomed ? '癌症碼已更新！' : '癌症碼已儲存！', 'success');
            clearCancerCodeForm();
            renderCancerCodeTable();
        } catch (error) {
            showStatusMessage('儲存癌症碼失敗：' + error, 'error');
        }
    });

    cancelEditCancerCodeBtn.addEventListener('click', clearCancerCodeForm);
    addSelectedUnidentifiedCancerCodesBtn.addEventListener('click', handleAddSelectedUnidentifiedCancerCodes);

    // 解剖碼保存/更新
    saveAnatomyCodeBtn.addEventListener('click', async () => {
        const snomedCode = addAnatomyCodeSnomedInput.value.trim();
        const mappedName = addAnatomyCodeMappedNameInput.value.trim();

        if (!snomedCode || !mappedName) {
            showStatusMessage('SNOMED 碼和歸戶部位不能為空！', 'error');
            return;
        }

        try {
            await saveAnatomyCode({ snomedCode, mappedName });
            showStatusMessage(currentEditingAnatomyCodeSnomed ? '解剖碼已更新！' : '解剖碼已儲存！', 'success');
            clearAnatomyCodeForm();
            renderAnatomyCodeTable();
        } catch (error) {
            showStatusMessage('儲存解剖碼失敗：' + error, 'error');
        }
    });

    cancelEditAnatomyCodeBtn.addEventListener('click', clearAnatomyCodeForm);

    // 匯出碼表
    exportCancerCodesBtn.addEventListener('click', async () => {
        const codes = await getCancerCodes();
        exportJson(codes, 'cancer_codes.json');
    });

    exportAnatomyCodesBtn.addEventListener('click', async () => {
        const codes = await getAnatomyCodes();
        exportJson(codes, 'anatomy_codes.json');
    });

    // 初始渲染碼表
    renderCancerCodeTable();
    renderAnatomyCodeTable();
    toggleSection(codeMaintenanceSection, true); // 初始顯示碼表維護區塊
}

// 導出 downloadResultsBtn 供 app.js 綁定事件時使用
export { downloadResultsBtn };