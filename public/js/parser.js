// public/js/parser.js

/**
 * 解析病理報告文字檔內容。
 * 預期的每行格式：病歷號碼\s+報告編號\s+解剖部位SNOMED碼-術式碼-診斷SNOMED碼
 * 例如：01075789        S2025D-02360        84000-C-M83803
 *
 * @param {string} textContent - 文字檔的全部內容。
 * @returns {Array<Object>} 解析後的數據陣列，每個物件包含 patientId, snomedAnatomy, snomedDiagnosis。
 */
export function parseReportFile(textContent) {
    const lines = textContent.split(/\r?\n/); // 分割行，考慮 Windows 和 Unix 換行符
    const parsedData = [];

    // 正則表達式：
    // ^(\d+)                                 - 捕獲病歷號碼 (Patient ID)
    // \s+                                   - 匹配一個或多個空白字符 (TAB 或空格)
    // S\d{4}D-\d{5}                         - 匹配報告編號 (SxxxxD-xxxxx)，不捕獲
    // \s+                                   - 匹配一個或多個空白字符
    // (\d+)                                 - 捕獲解剖部位 SNOMED 碼
    // -                                     - 匹配連字符
    // ([A-Z])                               - 捕獲術式碼 (一個大寫字母)
    // -                                     - 匹配連字符
    // ([A-Z0-9]+)                           - 捕獲診斷 SNOMED 碼 (一個或多個大寫字母或數字)
    // \s*$                                  - 匹配行尾可能存在的零個或多個空白字符，並錨定到行尾
    const regex = /^(\d+)\s+S\d{4}D-\d{5}\s+(\d+)-([A-Z])-([A-Z0-9]+)\s*$/;

    for (const line of lines) {
        // 忽略空行或備註行 (例如包含 '不得用於貼病歷' 的行)
        if (!line.trim() || line.includes('不得用於貼病歷')) {
            continue;
        }

        const match = line.match(regex);
        if (match) {
            // match[1]: patientId
            // match[2]: snomedAnatomy
            // match[3]: procedureCode (目前不使用，但已捕獲以供未來擴展)
            // match[4]: snomedDiagnosis
            parsedData.push({
                patientId: match[1],
                snomedAnatomy: match[2],
                snomedDiagnosis: match[4] // 我們只關心解剖和診斷碼
            });
        } else {
            // 可以選擇在這裡記錄無法解析的行，以便調試
            console.warn('無法解析的行:', line);
        }
    }
    return parsedData;
}