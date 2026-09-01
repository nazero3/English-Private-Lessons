export const FALLBACK_LUMINATE = {
  activities: [
    {
      id: 'a1',
      title: 'يوم الأهل المفتوح',
      description: 'لقاء قصير مع المعلّمين ومتابعة تقدّم الأبناء.',
      starts_at: null,
      location: 'مركز كينز',
    },
    {
      id: 'a2',
      title: 'مسابقة المحادثة الإنجليزية',
      description: 'تحدٍ ودي للطلاب النشطين — الحضور يمنح نقاطاً للعائلة.',
      starts_at: null,
      location: 'قاعة كينز',
    },
    {
      id: 'a3',
      title: 'ورشة مهارات المستقبل',
      description: 'جلسة قصيرة في التفكير والثقة قبل الامتحانات.',
      starts_at: null,
      location: 'أونلاين + المركز',
    },
  ],
  prizes: [
    { id: 'p1', title: 'خصم الحصة التالية', description: 'يُطبَّق في المركز حسب بطاقتك.', credit_cost: 80 },
    { id: 'p2', title: 'حصة تجريبية للأخ/الأخت', description: 'دعوة أخ أو أخت لحضور حصة تعريفية.', credit_cost: 150 },
    { id: 'p3', title: 'ظهور في كينز تُضيء', description: 'بطاقة شرف على الصفحة العامة (بدون درجات).', credit_cost: 40 },
    { id: 'p4', title: 'حقيبة كينز', description: 'هدية رمزية من المركز عند التوفر.', credit_cost: 220 },
  ],
  vip_parents: [{ id: 'v1', display_name: 'أم سارة', badge: 'بطاقة برونز', tier: 'bronze' }],
  best_students: [{ id: 's1', display_name: 'سارة', badge: 'نجم الحضور', tier: '' }],
  good_parents: [{ id: 'g1', display_name: 'أم سارة', badge: 'شريك الأسبوع', tier: 'bronze' }],
  copy: { complimentary: 'عضوية عائلة كينز مجاناً مع كل كورس' },
}
