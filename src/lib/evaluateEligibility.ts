import type {
  EligibilityRules, Scheme, Lang, Caste, Gender, EducationLevel,
  RationCardType, PensionType, Occupation,
} from '@/types';

export interface EligibilityInput {
  ap_resident?: boolean;
  gender?: Gender;
  age?: number;
  annual_income?: number;
  monthly_income?: number;
  govt_employee?: boolean;
  pucca_house?: boolean;
  pension_type?: PensionType;
  disability_pct?: number;
  ration_card_type?: RationCardType;
  has_lpg?: boolean;
  caste?: Caste;
  education_level?: EducationLevel;
  registered_farmer?: boolean;
  registered_weaver?: boolean;
  income_tax_payer?: boolean;
  unemployed?: boolean;
  enrolled_other_scheme?: boolean;
  child_in_school?: boolean;
  foreign_admission?: boolean;
  occupation?: Occupation;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: { en: string; te: string };
  benefit?: { en: string; te: string };
}

const EDU_RANK: Record<EducationLevel, number> = {
  below_ssc: 0, ssc: 1, intermediate: 2, degree: 3, pg: 4,
};

const EDU_LABEL: Record<EducationLevel, { en: string; te: string }> = {
  below_ssc: { en: 'below SSC', te: 'SSC కంటే తక్కువ' },
  ssc: { en: 'SSC', te: 'SSC' },
  intermediate: { en: 'Intermediate', te: 'ఇంటర్మీడియట్' },
  degree: { en: 'Degree', te: 'డిగ్రీ' },
  pg: { en: 'Post Graduation', te: 'పోస్ట్ గ్రాడ్యుయేషన్' },
};

const RATION_LABEL: Record<RationCardType, string> = {
  white: 'White', yellow: 'Yellow', pink: 'Pink', none: 'None',
};

function inr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function schemeName(scheme: Scheme, lang: Lang): string {
  return lang === 'te' ? scheme.name_telugu : scheme.name;
}

export function schemeBenefit(scheme: Scheme, input: EligibilityInput, lang: Lang): string {
  if (scheme.pension_type_benefits && input.pension_type) {
    const b = scheme.pension_type_benefits[input.pension_type];
    if (b) return lang === 'te' ? b.amount_te : b.amount;
  }
  return (lang === 'te' ? scheme.benefit_telugu : scheme.benefit) ?? '';
}

/** Which input fields the calculator should render for a scheme. */
export interface RelevantFields {
  ap_resident: boolean;
  gender: boolean;
  age: boolean;
  annual_income: boolean;
  monthly_income: boolean;
  govt_employee: boolean;
  pucca_house: boolean;
  pension_type: boolean;
  disability_pct: boolean;
  ration_card_type: boolean;
  has_lpg: boolean;
  caste: boolean;
  education_level: boolean;
  registered_farmer: boolean;
  registered_weaver: boolean;
  income_tax_payer: boolean;
  unemployed: boolean;
  enrolled_other_scheme: boolean;
  child_in_school: boolean;
  foreign_admission: boolean;
  occupation: boolean;
}

export function relevantFields(r: EligibilityRules): RelevantFields {
  return {
    ap_resident: !!r.requires_ap_resident,
    gender: !!r.gender_female,
    age: r.min_age != null || r.max_age != null || r.age_min != null || r.age_max != null,
    annual_income: r.max_annual_income != null || r.max_income != null,
    monthly_income: r.max_monthly_income != null,
    govt_employee: !!r.disallow_govt_employee,
    pucca_house: !!(r.disallow_pucca_house || r.requires_no_pucca_house),
    pension_type: !!(r.pension_types && r.pension_types.length),
    disability_pct: r.min_disability_pct != null,
    ration_card_type: !!(r.ration_card_types && r.ration_card_types.length),
    has_lpg: !!r.disallow_lpg,
    caste: !!(r.castes && r.castes.length) || !!(r.caste_categories && r.caste_categories.length),
    education_level: r.min_education != null,
    registered_farmer: !!r.requires_registered_farmer,
    registered_weaver: !!r.requires_registered_weaver,
    income_tax_payer: !!r.disallow_income_tax_payer,
    unemployed: !!r.requires_unemployed,
    enrolled_other_scheme: !!r.disallow_enrolled_other_scheme,
    child_in_school: !!r.requires_child_in_school,
    foreign_admission: !!r.requires_foreign_admission,
    occupation: !!(r.occupations && r.occupations.length),
  };
}

export function evaluateEligibility(
  scheme: Scheme,
  input: EligibilityInput,
  _lang: Lang
): EligibilityResult {
  const r = scheme.eligibility_rules;

  const fail = (en: string, te: string): EligibilityResult => ({
    eligible: false,
    reason: { en, te },
  });

  if (r.requires_ap_resident && input.ap_resident === false) {
    return fail(
      'This scheme is only for Andhra Pradesh residents',
      'ఈ పథకం ఆంధ్రప్రదేశ్ నివాసులకు మాత్రమే'
    );
  }

  if (r.gender_female && input.gender !== 'female') {
    return fail('This scheme is only for women', 'ఈ పథకం మహిళలకు మాత్రమే');
  }

  const minAge = r.min_age ?? r.age_min;
  const maxAge = r.max_age ?? r.age_max;
  if (minAge != null && (input.age == null || input.age < minAge)) {
    return fail(
      `Age must be at least ${minAge} years`,
      `వయస్సు కనీసం ${minAge} సంవత్సరాలు ఉండాలి`
    );
  }
  if (maxAge != null && input.age != null && input.age > maxAge) {
    return fail(
      `Age must be ${maxAge} years or less`,
      `వయస్సు ${maxAge} సంవత్సరాలు లేదా తక్కువ ఉండాలి`
    );
  }

  const maxAnnual = r.max_annual_income ?? r.max_income;
  if (maxAnnual != null && (input.annual_income == null || input.annual_income > maxAnnual)) {
    return fail(
      `Annual income must be below ${inr(maxAnnual)}`,
      `వార్షిక ఆదాయం ${inr(maxAnnual)} కంటే తక్కువగా ఉండాలి`
    );
  }

  if (r.max_monthly_income != null && (input.monthly_income == null || input.monthly_income > r.max_monthly_income)) {
    return fail(
      `Monthly income must be below ${inr(r.max_monthly_income)}`,
      `మాసిక ఆదాయం ${inr(r.max_monthly_income)} కంటే తక్కువగా ఉండాలి`
    );
  }

  if (r.disallow_govt_employee && input.govt_employee) {
    return fail('Government employees are not eligible', 'ప్రభుత్వ ఉద్యోగులు అర్హులు కాదు');
  }

  if ((r.disallow_pucca_house || r.requires_no_pucca_house) && input.pucca_house) {
    return fail(
      'Applicants who already own a pucca house are not eligible',
      'ఇప్పటికే పక్కా ఇల్లు ఉన్న వారు అర్హులు కాదు'
    );
  }

  if (r.pension_types && r.pension_types.length) {
    if (!input.pension_type || !r.pension_types.includes(input.pension_type)) {
      return fail('Please select a valid pension type', 'దయచేసి సరైన పింఛన్ రకాన్ని ఎంచుకోండి');
    }
    // Sub-type specific rules
    if (input.pension_type === 'old_age' && (input.age == null || input.age < 60)) {
      return fail('Old age pension requires age 60 or above', 'వృద్ధాప్య పింఛన్‌కు వయస్సు 60 లేదా అంతకంటే ఎక్కువ ఉండాలి');
    }
    if (input.pension_type === 'disabled' && (input.disability_pct == null || input.disability_pct < 40)) {
      return fail('Disability pension requires disability of 40% or more', 'దివ్యాంగ పింఛన్‌కు 40% లేదా అంతకంటే ఎక్కువ దివ్యాంగత్వం ఉండాలి');
    }
    if ((input.pension_type === 'widow' || input.pension_type === 'single_woman') && input.gender !== 'female') {
      return fail('This pension type is only for women', 'ఈ పింఛన్ మహిళలకు మాత్రమే');
    }
  }

  if (r.min_disability_pct != null && (input.disability_pct == null || input.disability_pct < r.min_disability_pct)) {
    return fail(
      `Requires disability of at least ${r.min_disability_pct}%`,
      `కనీసం ${r.min_disability_pct}% దివ్యాంగత్వం అవసరం`
    );
  }

  if (r.ration_card_types && r.ration_card_types.length) {
    if (!input.ration_card_type || !r.ration_card_types.includes(input.ration_card_type)) {
      const labels = r.ration_card_types.map((t) => RATION_LABEL[t]).join(' / ');
      return fail(
        `Requires ${labels} ration card`,
        `${labels} రేషన్ కార్డు అవసరం`
      );
    }
  }

  if (r.disallow_lpg && input.has_lpg) {
    return fail(
      'Not eligible — applicant already has an LPG connection',
      'ఇప్పటికే LPG కనెక్షన్ ఉన్నవారు అర్హులు కాదు'
    );
  }

  const castes = r.castes ?? (r.caste_categories as Caste[] | undefined);
  if (castes && castes.length) {
    if (!input.caste || !castes.includes(input.caste)) {
      return fail(
        `This scheme is only for ${castes.join(', ')}`,
        `ఈ పథకం ${castes.join(', ')} వర్గాలకు మాత్రమే`
      );
    }
  }

  if (r.min_education) {
    if (!input.education_level || EDU_RANK[input.education_level] < EDU_RANK[r.min_education]) {
      const lbl = EDU_LABEL[r.min_education];
      return fail(
        `Minimum education required: ${lbl.en}`,
        `కనీస విద్యార్హత: ${lbl.te}`
      );
    }
  }

  if (r.requires_registered_farmer && !input.registered_farmer) {
    return fail('Applicant must be a registered farmer', 'దరఖాస్తుదారు నమోదైన రైతు అయి ఉండాలి');
  }

  if (r.requires_registered_weaver && !input.registered_weaver) {
    return fail('Applicant must be a registered weaver', 'దరఖాస్తుదారు నమోదైన నేతన్న అయి ఉండాలి');
  }

  if (r.disallow_income_tax_payer && input.income_tax_payer) {
    return fail('Income tax payers are not eligible', 'ఆదాయపు పన్ను చెల్లింపుదారులు అర్హులు కాదు');
  }

  if (r.requires_unemployed && !input.unemployed) {
    return fail('Only unemployed applicants are eligible', 'నిరుద్యోగులు మాత్రమే అర్హులు');
  }

  if (r.disallow_enrolled_other_scheme && input.enrolled_other_scheme) {
    return fail(
      'Cannot be enrolled in another AP cash transfer scheme',
      'మరో AP నగదు బదిలీ పథకంలో ఉన్న వారికి వర్తించదు'
    );
  }

  if (r.requires_child_in_school && !input.child_in_school) {
    return fail(
      'Requires a child currently enrolled in school',
      'ప్రస్తుతం పాఠశాలలో చదువుతున్న పిల్లలు ఉండాలి'
    );
  }

  if (r.requires_foreign_admission && !input.foreign_admission) {
    return fail(
      'Requires a valid foreign university admission letter',
      'చెల్లుబాటు అయ్యే విదేశీ విశ్వవిద్యాలయ ప్రవేశ పత్రం అవసరం'
    );
  }

  if (r.occupations && r.occupations.length) {
    if (!input.occupation || !r.occupations.includes(input.occupation)) {
      const labels = r.occupations.map((o) => o.replace('_', ' ')).join(', ');
      return fail(
        `This scheme is only for: ${labels}`,
        `ఈ పథకం ఈ వృత్తులకు మాత్రమే: ${labels}`
      );
    }
  }

  return {
    eligible: true,
    benefit: {
      en: schemeBenefit(scheme, input, 'en'),
      te: schemeBenefit(scheme, input, 'te'),
    },
  };
}
