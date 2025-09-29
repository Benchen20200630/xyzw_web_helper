/**
 * 从 answer.json 文件加载题目数据的答题工具
 * 用于一键答题功能，从公共目录读取题目数据
 */

let questionsData = null
let isLoading = false

/**
 * 异步加载答题数据
 * @returns {Promise<Array>} 题目数据数组
 */
export async function loadQuestionsData() {
  if (questionsData) {
    return questionsData
  }

  if (isLoading) {
    // 如果正在加载，等待加载完成
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return questionsData
  }

  try {
    isLoading = true
    // 精简日志：移除加载提示
    
    // 从 public 目录加载答题数据
    const response = await fetch('/answer.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const text = await response.text()
    
    // 由于文件格式不是标准JSON，需要特殊处理
    // 文件内容看起来像是 JavaScript 数组，需要转换为 JSON 格式
    let jsonText = text.trim()
    
    try {
      // 直接尝试 JSON.parse
      questionsData = JSON.parse(jsonText)
    } catch (parseError) {
      // 降噪：解析失败不刷屏
      
      // 处理 JavaScript 对象格式为 JSON 格式
      // 将 name: "..." 转换为 "name": "..."
      // 将 value: 1 转换为 "value": 1
      jsonText = jsonText
        .replace(/(\w+):\s*"/g, '"$1": "')      // name: "xxx" -> "name": "xxx"
        .replace(/(\w+):\s*(\d+)/g, '"$1": $2') // value: 1 -> "value": 1
        .replace(/(\w+):\s*([^",}\]]+)/g, '"$1": "$2"') // 处理其他情况
      
      try {
        questionsData = JSON.parse(jsonText)
      } catch (secondParseError) {
        // 如果还是失败，尝试使用 eval（本地文件，相对安全）
        // 降噪
        if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
          try {
            // 创建一个安全的执行环境
            questionsData = Function('"use strict"; return (' + text + ')')()
          } catch (evalError) {
            console.error('所有解析方法都失败了')
            throw new Error(`数据解析失败: ${evalError.message}`)
          }
        } else {
          throw new Error('数据格式不正确，必须是数组格式')
        }
      }
    }
    
    if (!Array.isArray(questionsData)) {
      throw new Error('加载的数据不是数组格式')
    }
    
    // 降噪
    return questionsData
    
  } catch (error) {
    console.error('❌ 加载答题数据失败:', error)
    // 返回空数组，避免程序崩溃
    questionsData = []
    return questionsData
  } finally {
    isLoading = false
  }
}

/**
 * 模糊匹配函数 - 查找题目中的关键词
 * @param {string} questionFromDB - 数据库中的题目
 * @param {string} actualQuestion - 实际收到的题目
 * @param {number} threshold - 匹配阈值（1表示包含匹配）
 * @returns {boolean} - 是否匹配
 */
export function matchQuestion(questionFromDB, actualQuestion, threshold = 1) {
  if (!questionFromDB || !actualQuestion) return false
  
  // 简单的包含匹配
  if (threshold === 1) {
    // 去除空格和特殊字符进行匹配
    const cleanDB = questionFromDB.replace(/\s+/g, '').toLowerCase()
    const cleanActual = actualQuestion.replace(/\s+/g, '').toLowerCase()
    
    return cleanActual.includes(cleanDB) || cleanDB.includes(cleanActual)
  }
  
  return false
}

/**
 * 查找题目答案
 * @param {string} question - 题目文本
 * @returns {Promise<number|null>} - 答案选项(1-4)，未找到返回null
 */
export async function findAnswer(question) {
  try {
    const questions = await loadQuestionsData()
    
    if (!questions || questions.length === 0) {
      // 降噪
      return null
    }
    
    // 遍历所有题目寻找匹配
    for (let i = 0; i < questions.length; i++) {
      const item = questions[i]
      if (!item.name || !item.value) continue
      
      if (matchQuestion(item.name, question, 1)) {
        // 降噪
        return item.value
      }
    }
    
    // 降噪
    return null // 未找到匹配的题目
    
  } catch (error) {
    console.error('❌ 查找答案时出错:', error)
    return null
  }
}

/**
 * 获取已加载的题目数量
 * @returns {Promise<number>} 题目数量
 */
export async function getQuestionCount() {
  const questions = await loadQuestionsData()
  return questions ? questions.length : 0
}

/**
 * 预加载答题数据（可选，用于提前加载）
 * @returns {Promise<void>}
 */
export async function preloadQuestions() {
  try {
    await loadQuestionsData()
  // 降噪
  } catch (error) {
    console.error('❌ 答题数据预加载失败:', error)
  }
}

/**
 * 清除缓存，强制重新加载（用于调试）
 */
export function clearCache() {
  questionsData = null
  // 降噪
}
