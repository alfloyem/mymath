export function useErrorMessage() {
  const { t } = useI18n()
  const messages: Record<string, string> = {
    'Giriş bilgileri geçersiz veya şifre henüz onaylanmadı.': 'invalidCredentials',
    'Alanları kontrol edin.': 'checkFields',
    'Geçersiz istek kaynağı.': 'invalidOrigin',
    'Admin oturumu gerekli.': 'sessionRequired',
    'Kayıt bulunamadı.': 'recordNotFound',
    'Çok fazla deneme. Daha sonra tekrar deneyin.': 'tooManyAttempts',
    'İlişkili kayıtlar var. Önce öğrencileri taşıyın ve sınavları kaldırın.': 'relatedRecords',
    'Bu kayıt zaten var.': 'recordExists',
    'Kullanıcı adı zaten kullanılıyor.': 'recordExists',
    'Talep zaten işlenmiş.': 'requestProcessed',
    'Bu sınav kapalı.': 'examClosed',
    'Öğrenci bu sınavın grubunda değil.': 'wrongGroup',
    'Cevap sayısı cevap anahtarı ile eşleşmelidir.': 'answerCountMismatch',
    'Yalnız A, B, C, D, E veya boş cevap kullanılabilir.': 'invalidAnswer',
    'Bağlantı iptal edilmiş veya süresi dolmuş. Yöneticinizden yeni bağlantı isteyin.': 'expiredLink',
    'Bu bağlantı artık geçerli değil.': 'expiredLink',
    'Her soru için bir konu belirtin veya konuları boş bırakın.': 'topicCountMismatch',
    'Tüm gruplar tam olarak bir kez belirtilmelidir.': 'invalidGroupOrder'
  }
  return (message: string | undefined, fallback = 'operationFailed') => message && messages[message] ? t(messages[message]!) : t(fallback)
}
