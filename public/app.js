// public/app.js

import { initializeDefaultCodes, getCancerCodes, getAnatomyCodes } from './js/db.js';
import { parseReportFile } from './js/parser.js';
import { processReportData } from './js/processor.js';
import {
    initializeUI,
    showStatusMessage,
    updateFileNameDisplay,
    displayResults,
    downloadResults,
    displayUnidentifiedCancerCodes,
    displayUnidentifiedAnatomyCodes,
    downloadResultsBtn // 從 ui.js 導出以便在這裡綁定事件
} from './js/ui.js';

let currentStats = []; // 用於儲存當前統計結果，以便下載

/**
 * 處理檔案上傳和分析。
 * @param {File} file - 用戶上傳的檔案。
 */
async function handleFileProcessing(file) {
    showStatusMessage('正在讀取檔案...', 'info');
    try {
        const textContent = await file.text();
        showStatusMessage('檔案讀取成功，正在解析...', 'info');

        const rawData = parseReportFile(textContent);
        if (rawData.length === 0) {
            showStatusMessage('檔案中未找到可解析的病理報告數據。請檢查檔案格式。', 'error');
            displayResults([]); // 清空結果顯示
            displayUnidentifiedCancerCodes([]);
            displayUnidentifiedAnatomyCodes([]);
            return;
        }

        showStatusMessage('檔案解析成功，正在進行數據處理...', 'info');

        // 獲取最新的碼表數據
        const cancerCodes = await getCancerCodes();
        const anatomyCodes = await getAnatomyCodes();

        const { stats, unidentifiedCancerCodes, unidentifiedAnatomyCodes } =
            processReportData(rawData, cancerCodes, anatomyCodes);

        currentStats = stats; // 保存統計結果以供下載

        displayResults(stats);
        displayUnidentifiedCancerCodes(unidentifiedCancerCodes);
        displayUnidentifiedAnatomyCodes(unidentifiedAnatomyCodes);

        if (unidentifiedCancerCodes.length > 0 || unidentifiedAnatomyCodes.length > 0) {
            showStatusMessage('數據處理完成。請注意，存在未識別的癌症碼或未建檔的解剖碼，請在碼表維護區處理。', 'warning');
        } else {
            showStatusMessage('數據處理完成，所有碼都已識別。', 'success');
        }

    } catch (error) {
        console.error('檔案處理失敗:', error);
        showStatusMessage(`檔案處理失敗: ${error.message || error}`, 'error');
    }
}

// 應用程式啟動時執行的初始化函數
async function initApp() {
    console.log('Initializing PWA...');
    // 註冊 Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered with scope:', registration.scope);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    } else {
        console.warn('Service Worker not supported by this browser.');
    }

    // 初始化 IndexedDB 中的預設碼表
    await initializeDefaultCodes();

    // 初始化 UI 並傳入檔案處理的回調函數
    initializeUI(handleFileProcessing);

    // 綁定下載結果按鈕的事件，它需要訪問 currentStats
    downloadResultsBtn.addEventListener('click', () => {
        if (currentStats.length > 0) {
            downloadResults(currentStats);
        } else {
            showStatusMessage('沒有統計結果可供下載。', 'error');
        }
    });

    showStatusMessage('PWA 已載入並準備就緒！', 'info');
}

// 在 DOM 加載完成後啟動應用程式
document.addEventListener('DOMContentLoaded', initApp);