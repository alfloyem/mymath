export const choices = ['A', 'B', 'C', 'D', 'E']
export function grade(answerKey: string[], answers: (string | null)[], topics: string[] = []) {
  if (!answerKey.length || answers.length !== answerKey.length) throw new Error('Cevap sayısı cevap anahtarı ile eşleşmelidir.')
  if (answerKey.some(a => !choices.includes(a)) || answers.some(a => a !== null && !choices.includes(a))) throw new Error('Yalnız A, B, C, D, E veya boş cevap kullanılabilir.')
  let correct = 0, wrong = 0, blank = 0
  const topicsMap = new Map<string, { correct: number; wrong: number; blank: number }>()
  answerKey.forEach((key, i) => {
    const topic = topics[i]?.trim() || 'Genel'
    if (!topicsMap.has(topic)) topicsMap.set(topic, { correct: 0, wrong: 0, blank: 0 })
    const stats = topicsMap.get(topic)!
    if (answers[i] === null) { blank++; stats.blank++ }
    else if (answers[i] === key) { correct++; stats.correct++ }
    else { wrong++; stats.wrong++ }
  })
  return { correct, wrong, blank, score: Math.round(correct / answerKey.length * 10000) / 100, topicAnalysis: Object.fromEntries(topicsMap) }
}
