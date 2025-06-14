// public/js/processor.js

/**
 * 處理解析後的報告數據，進行篩選、歸戶和統計。
 * @param {Array<Object>} rawData - 從檔案解析出來的原始數據。
 * @param {Array<Object>} cancerCodes - 癌症診斷碼對照表。
 * @param {Array<Object>} anatomyCodes - 解剖部位對照表。
 * @returns {Object} 包含統計結果和未識別碼的物件。
 * {
 * stats: { [mappedAnatomyName]: count },
 * unidentifiedCancerCodes: Set<string>,
 * unidentifiedAnatomyCodes: Set<string>
 * }
 */
export function processReportData(rawData, cancerCodes, anatomyCodes) {
    const cancerCodeMap = new Map(cancerCodes.map(c => [c.snomedCode, c]));
    const anatomyCodeMap = new Map(anatomyCodes.map(a => [a.snomedCode, a.mappedName]));

    const patientDiagnoses = new Map(); // Map<patientId, Set<{ mappedAnatomy: string, isMetastasis: boolean }>>
    const unidentifiedCancerCodes = new Set();
    const unidentifiedAnatomyCodes = new Set();

    rawData.forEach(item => {
        const { patientId, snomedAnatomy, snomedDiagnosis } = item;

        // 1. 篩選癌症診斷碼
        const cancerInfo = cancerCodeMap.get(snomedDiagnosis);
        if (!cancerInfo) {
            // 如果診斷碼不在癌症碼對照表中，則添加到未識別列表
            unidentifiedCancerCodes.add(snomedDiagnosis);
            return; // 跳過此診斷，因為它不在白名單中
        }

        if (!cancerInfo.isCancer) {
            return; // 根據白名單，此診斷碼不是癌症，跳過
        }

        // 2. 解剖部位歸戶
        let mappedAnatomy = anatomyCodeMap.get(snomedAnatomy);
        if (!mappedAnatomy) {
            // 如果解剖碼未建檔，則用其本身作為歸戶部位，並添加到未建檔列表
            mappedAnatomy = snomedAnatomy;
            unidentifiedAnatomyCodes.add(snomedAnatomy);
        }

        // 確保該病人有對應的診斷集合
        if (!patientDiagnoses.has(patientId)) {
            patientDiagnoses.set(patientId, new Set());
        }

        // 將處理後的診斷信息添加到病人對應的集合中
        patientDiagnoses.get(patientId).add({
            mappedAnatomy: mappedAnatomy,
            isMetastasis: cancerInfo.isMetastasis // 儲存是否為轉移癌
        });
    });

    // 3. 執行去重和統計
    const stats = {}; // { [mappedAnatomyName]: count }

    for (const [patientId, diagnosesSet] of patientDiagnoses.entries()) {
        const countedAnatomiesForPatient = new Set(); // 追蹤該病人已計數的部位

        // 將 Set 轉換為陣列，方便排序和過濾
        const diagnosesArray = Array.from(diagnosesSet);

        // 先處理非轉移癌症，確保 Double Primary 的準確性
        const nonMetastaticDiagnoses = diagnosesArray.filter(d => !d.isMetastasis);
        const metastaticDiagnoses = diagnosesArray.filter(d => d.isMetastasis);

        // 處理非轉移癌症 (Double Primary)
        for (const diag of nonMetastaticDiagnoses) {
            if (!countedAnatomiesForPatient.has(diag.mappedAnatomy)) {
                stats[diag.mappedAnatomy] = (stats[diag.mappedAnatomy] || 0) + 1;
                countedAnatomiesForPatient.add(diag.mappedAnatomy);
            }
        }

        // 處理轉移癌症：
        // 如果有轉移癌症，且其歸戶部位與該病人已計數的非轉移癌症部位重複，則不重複計數。
        // 但如果轉移癌症的部位是一個全新的部位（通常不應發生，因為轉移是基於已知原發部位），或與非轉移部位無關，
        // 則該部位已在 nonMetastaticDiagnoses 中處理過或被忽略。
        // 根據您的需求 "有轉移碼，通常是以6結尾的癌症碼，就不重複計算"
        // 這裡的邏輯是，只要是非轉移癌症被計數過，轉移癌症就不會導致額外的計數。
        // 如果一個病人只有轉移癌，沒有原發癌，那麼這個轉移癌將不會被計數為新診斷的部位。
        // 因為統計的是“新診斷癌症數量”，轉移癌應是繼發的。
        // 所以，我們不再額外處理 metastaticDiagnoses 的計數，只關注 nonMetastaticDiagnoses 產生的計數。
        // patientDiagnoses.get(patientId).add(...) 已經把所有診斷都收集了，
        // 而這裡只通過 nonMetastaticDiagnoses 進行計數，確保了轉移癌不單獨計數為「新診斷」。
    }

    // 將統計結果轉換為易於顯示的陣列
    const sortedStats = Object.entries(stats).map(([anatomy, count]) => ({
        anatomy: anatomy,
        count: count
    })).sort((a, b) => b.count - a.count); // 按數量降序排列

    return {
        stats: sortedStats,
        unidentifiedCancerCodes: Array.from(unidentifiedCancerCodes),
        unidentifiedAnatomyCodes: Array.from(unidentifiedAnatomyCodes)
    };
}