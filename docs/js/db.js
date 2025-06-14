// public/js/db.js

const DB_NAME = 'CancerReportDB';
const DB_VERSION = 1;
const CANCER_CODES_STORE = 'cancer_codes';
const ANATOMY_CODES_STORE = 'anatomy_codes';

let db;

/**
 * 打開或創建 IndexedDB 資料庫。
 * @returns {Promise<IDBDatabase>} IndexedDB 資料庫實例。
 */
export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // 創建 object store 來存放癌症診斷碼
            if (!db.objectStoreNames.contains(CANCER_CODES_STORE)) {
                db.createObjectStore(CANCER_CODES_STORE, { keyPath: 'snomedCode' });
            }
            // 創建 object store 來存放解剖部位對照表
            if (!db.objectStoreNames.contains(ANATOMY_CODES_STORE)) {
                db.createObjectStore(ANATOMY_CODES_STORE, { keyPath: 'snomedCode' });
            }
            console.log('Database upgrade needed/completed.');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.errorCode);
            reject('Database error: ' + event.target.errorCode);
        };
    });
}

/**
 * 獲取所有癌症診斷碼。
 * @returns {Promise<Array>} 癌症診斷碼陣列。
 */
export function getCancerCodes() {
    return new Promise((resolve, reject) => {
        if (!db) {
            openDB().then(() => getCancerCodes().then(resolve).catch(reject));
            return;
        }
        const transaction = db.transaction([CANCER_CODES_STORE], 'readonly');
        const store = transaction.objectStore(CANCER_CODES_STORE);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Error fetching cancer codes:', event.target.errorCode);
            reject('Error fetching cancer codes');
        };
    });
}

/**
 * 獲取所有解剖部位對照碼。
 * @returns {Promise<Array>} 解剖部位對照碼陣列。
 */
export function getAnatomyCodes() {
    return new Promise((resolve, reject) => {
        if (!db) {
            openDB().then(() => getAnatomyCodes().then(resolve).catch(reject));
            return;
        }
        const transaction = db.transaction([ANATOMY_CODES_STORE], 'readonly');
        const store = transaction.objectStore(ANATOMY_CODES_STORE);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Error fetching anatomy codes:', event.target.errorCode);
            reject('Error fetching anatomy codes');
        };
    });
}

/**
 * 保存單個癌症診斷碼。
 * @param {Object} code - 癌症診斷碼物件。
 * @returns {Promise<void>}
 */
export function saveCancerCode(code) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database not open');
            return;
        }
        const transaction = db.transaction([CANCER_CODES_STORE], 'readwrite');
        const store = transaction.objectStore(CANCER_CODES_STORE);
        const request = store.put(code); // put: update if exists, add if not

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error saving cancer code:', event.target.errorCode);
            reject('Error saving cancer code');
        };
    });
}

/**
 * 刪除單個癌症診斷碼。
 * @param {string} snomedCode - 要刪除的 SNOMED 診斷碼。
 * @returns {Promise<void>}
 */
export function deleteCancerCode(snomedCode) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database not open');
            return;
        }
        const transaction = db.transaction([CANCER_CODES_STORE], 'readwrite');
        const store = transaction.objectStore(CANCER_CODES_STORE);
        const request = store.delete(snomedCode);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error deleting cancer code:', event.target.errorCode);
            reject('Error deleting cancer code');
        };
    });
}

/**
 * 保存單個解剖部位對照碼。
 * @param {Object} code - 解剖部位對照碼物件。
 * @returns {Promise<void>}
 */
export function saveAnatomyCode(code) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database not open');
            return;
        }
        const transaction = db.transaction([ANATOMY_CODES_STORE], 'readwrite');
        const store = transaction.objectStore(ANATOMY_CODES_STORE);
        const request = store.put(code);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error saving anatomy code:', event.target.errorCode);
            reject('Error saving anatomy code');
        };
    });
}

/**
 * 刪除單個解剖部位對照碼。
 * @param {string} snomedCode - 要刪除的 SNOMED 解剖碼。
 * @returns {Promise<void>}
 */
export function deleteAnatomyCode(snomedCode) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database not open');
            return;
        }
        const transaction = db.transaction([ANATOMY_CODES_STORE], 'readwrite');
        const store = transaction.objectStore(ANATOMY_CODES_STORE);
        const request = store.delete(snomedCode);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error deleting anatomy code:', event.target.errorCode);
            reject('Error deleting anatomy code');
        };
    });
}

/**
 * 初始化預設數據到 IndexedDB。
 * 只有在資料庫首次創建或升級時，且 store 為空時才執行。
 */
export async function initializeDefaultCodes() {
    try {
        await openDB(); // 確保資料庫已開啟

        const cancerCodes = await getCancerCodes();
        if (cancerCodes.length === 0) {
            const defaultCancerCodes = [
                { snomedCode: 'M80000', description: '腫瘤, 未另說明', isCancer: true, isMetastasis: false },
                { snomedCode: 'M80103', description: '惡性腫瘤, 未另說明', isCancer: true, isMetastasis: false },
                { snomedCode: 'M81403', description: '腺癌, 未另說明', isCancer: true, isMetastasis: false },
                { snomedCode: 'M81406', description: '腺癌, 轉移性', isCancer: true, isMetastasis: true }, // 轉移性範例
                { snomedCode: 'M83803', description: '黏液腺癌', isCancer: true, isMetastasis: false },
                { snomedCode: 'M85003', description: '浸潤性乳腺癌, 未另說明', isCancer: true, isMetastasis: false },
                { snomedCode: 'M85002', description: '非浸潤性乳腺癌', isCancer: true, isMetastasis: false },
                { snomedCode: 'M80703', description: '鱗狀細胞癌, 未另說明', isCancer: true, isMetastasis: false },
                { snomedCode: 'M81203', description: '移行細胞癌', isCancer: true, isMetastasis: false },
                { snomedCode: 'M81703', description: '肝細胞癌', isCancer: true, isMetastasis: false },
                { snomedCode: 'M82603', description: '腺樣囊性癌', isCancer: true, isMetastasis: false },
                { snomedCode: 'M82606', description: '腺樣囊性癌, 轉移性', isCancer: true, isMetastasis: true },
                { snomedCode: 'M83103', description: '腎細胞癌, 未另說明', isCancer: true, isMetastasis: false },
                { snomedCode: 'M85503', description: '腺泡細胞癌', isCancer: true, isMetastasis: false },
                { snomedCode: 'M85843', description: '濾泡性淋巴瘤', isCancer: true, isMetastasis: false }, // 淋巴瘤範例
                { snomedCode: 'M89363', description: '胃腸道基質腫瘤, 惡性', isCancer: true, isMetastasis: false },
                { snomedCode: 'M09450', description: '良性腺瘤', isCancer: false, isMetastasis: false } // 良性範例
            ];
            console.log('Initializing default cancer codes...');
            for (const code of defaultCancerCodes) {
                await saveCancerCode(code);
            }
        }

        const anatomyCodes = await getAnatomyCodes();
        if (anatomyCodes.length === 0) {
            const defaultAnatomyCodes = [
                { snomedCode: '84000', mappedName: 'Lung' },
                { snomedCode: '73000', mappedName: 'Bladder' },
                { snomedCode: '04030', mappedName: 'Breast' },
                { snomedCode: '77100', mappedName: 'Kidney' },
                { snomedCode: '04020', mappedName: 'Breast' }, // 範例：不同SNOMED歸戶到相同部位
                { snomedCode: '96100', mappedName: 'Lymph Node' },
                { snomedCode: '28200', mappedName: 'Colon' },
                { snomedCode: '57000', mappedName: 'Liver' },
                { snomedCode: '56000', mappedName: 'Pancreas' },
                { snomedCode: '67000', mappedName: 'Prostate' },
                { snomedCode: '53000', mappedName: 'Stomach' },
                { snomedCode: '51030', mappedName: 'Esophagus' },
                { snomedCode: '98000', mappedName: 'Bone Marrow' },
                { snomedCode: '63000', mappedName: 'Thyroid Gland' },
                { snomedCode: '86110', mappedName: 'Testis' },
                { snomedCode: '87010', mappedName: 'Epididymis' }, // 範例：Testis 和 Epididymis 可能需要歸戶到一個更大的 'Male Genital' 部位，但目前獨立
                { snomedCode: '66000', mappedName: 'Ovary' },
                { snomedCode: '08200', mappedName: 'Brain' },
                { snomedCode: '96200', mappedName: 'Spleen' },
                { snomedCode: '59000', mappedName: 'Gallbladder' },
                { snomedCode: '96000', mappedName: 'Lymph Node' }, // 另一種淋巴結
                { snomedCode: '28400', mappedName: 'Rectum' },
                { snomedCode: '08400', mappedName: 'Spinal Cord' },
                { snomedCode: '61100', mappedName: 'Uterus' },
                { snomedCode: '28700', mappedName: 'Appendix' }
            ];
            console.log('Initializing default anatomy codes...');
            for (const code of defaultAnatomyCodes) {
                await saveAnatomyCode(code);
            }
        }
    } catch (error) {
        console.error('Error initializing default codes:', error);
    }
}