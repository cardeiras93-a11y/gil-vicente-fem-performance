export type Language = 'pt' | 'en' | 'fr';

export interface Translations {
  header: {
    title: string;
    subtitle: string;
    changeAthlete: string;
    adminArea: string;
    langName: string;
  };
  tabs: {
    wellness: string;
    rpe: string;
    hydration: string;
  };
  athleteSelector: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    pinTitle: string;
    pinSubtitle: string;
    confirm: string;
    cancel: string;
    wrongPin: string;
  };
  wellness: {
    title: string;
    subtitle: string;
    menstrualCycleTitle: string;
    menstrualPhases: {
      menstruation: string;
      week1: string;
      week2: string;
      week3: string;
      irregular: string;
    };
    sleepQuality: string;
    sleepDuration: string;
    mood: string;
    stress: string;
    fatigue: string;
    soreness: string;
    heavyLegs: string;
    descriptors1to5: {
      sleepQuality: [string, string, string, string, string];
      sleepDuration: [string, string, string, string, string];
      mood: [string, string, string, string, string];
      stress: [string, string, string, string, string];
      fatigue: [string, string, string, string, string];
      soreness: [string, string, string, string, string];
      heavyLegs: [string, string, string, string, string];
    };
    scaleLegendTitle: string;
    muscleFatigueTitle: string;
    muscleFatigueSubtitle: string;
    physioTitle: string;
    physioQuestion: string;
    yes: string;
    no: string;
    physioReasonPlaceholder: string;
    submit: string;
    submitting: string;
    successMessage: string;
  };
  rpe: {
    title: string;
    subtitle: string;
    borgTitle: string;
    borgDescriptors: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
      7: string;
      8: string;
      9: string;
      10: string;
    };
    postFatigueTitle: string;
    fatigueDescriptors: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
      7: string;
      8: string;
      9: string;
      10: string;
    };
    scaleFatigueLegendTitle: string;
    muscleFatigueTitle: string;
    muscleFatigueSubtitle: string;
    preWorkoutTitle: string;
    preWorkoutOptions: {
      mobility: string;
      activation: string;
      core: string;
      prevention: string;
    };
    commentsTitle: string;
    commentsPlaceholder: string;
    submit: string;
    submitting: string;
    successMessage: string;
  };
  hydration: {
    title: string;
    newEntry: string;
    close: string;
    gsheetsBadge: string;
    gsheetsSub: string;
    scriptBtnShow: string;
    scriptBtnHide: string;
    statusAdequate: string;
    statusCaution: string;
    statusAlert: string;
    dehydrationRate: string;
    refillNeeded: string;
    weightLoss: string;
    actionRequired: string;
    biologicalImpact: string;
    sessionDetails: string;
    preWeight: string;
    postWeight: string;
    fluidLoss: string;
    fluidsIntake: string;
    duration: string;
    history: string;
    calculateAndSave: string;
    step1Title?: string;
    step1Sub?: string;
    savePreWeight?: string;
    step2Title?: string;
    step2Sub?: string;
    savePostWeight?: string;
    preWeightSaved?: string;
    goodTraining?: string;
  };
  bodyChart: {
    anteriorView: string;
    posteriorView: string;
    selectInstruction: string;
    noFatigue: string;
    muscles: {
      shoulders: string;
      chest: string;
      abs: string;
      quads: string;
      knees: string;
      ankles: string;
      upperBack: string;
      glutes: string;
      hamstrings: string;
      calves: string;
    };
  };
  admin: {
    title: string;
    pinPrompt: string;
    squadSummary: string;
    physioReferrals: string;
    roster: string;
    pinMgmt: string;
    subTabs: {
      general: string;
      wellness: string;
      rpe: string;
      hydration: string;
      weight: string;
    };
    fines?: {
      tabFines: string;
      finesTitle: string;
      finesSub: string;
      fineUnit: string;
      trainingDaysOnly: string;
      selectMonth: string;
      copyReport: string;
      totalFines: string;
      trainingDaysCount: string;
      complianceRate: string;
      topMissing: string;
      athlete: string;
      missingWellness: string;
      missingRpe: string;
      missingHydration: string;
      totalFaults: string;
      totalFine: string;
      noFines: string;
      reportCopied: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  pt: {
    header: {
      title: 'GIL VICENTE FC (FUTEBOL FEMININO)',
      subtitle: 'DEPARTAMENTO DE PERFORMANCE & SAÚDE',
      changeAthlete: 'Mudar Atleta',
      adminArea: 'Área Técnica',
      langName: 'Português',
    },
    tabs: {
      wellness: 'Wellness Pré-Treino',
      rpe: 'PSE Pós-Treino',
      hydration: 'Hidratação',
    },
    athleteSelector: {
      title: 'GIL VICENTE FC (FUTEBOL FEMININO)',
      subtitle: 'SELECIONA O TEU PERFIL DE JOGADORA',
      searchPlaceholder: 'Pesquisar jogadora...',
      pinTitle: 'Acesso por PIN',
      pinSubtitle: 'Introduz o teu PIN de 4 dígitos para continuar',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      wrongPin: 'PIN incorreto. Tenta novamente.',
    },
    wellness: {
      title: 'Questionário Wellness Pré-Treino',
      subtitle: 'Avalia o teu estado físico e mental antes da sessão de treino',
      menstrualCycleTitle: 'Fase do Ciclo Menstrual',
      menstrualPhases: {
        menstruation: 'Menstruação',
        week1: '1ª Semana após a menstruação',
        week2: '2ª Semana após a menstruação',
        week3: '3ª Semana após a menstruação',
        irregular: 'Menstruação irregular',
      },
      sleepQuality: 'Qualidade do Sono',
      sleepDuration: 'Duração do Sono',
      mood: 'Humor / Estado de Ânimo',
      stress: 'Nível de Stress / Ansiedade',
      fatigue: 'Fadiga Geral',
      soreness: 'Desconforto Muscular',
      heavyLegs: 'Sensação de Pernas Pesadas',
      descriptors1to5: {
        sleepQuality: ['1 - Muito Mau (Insónia)', '2 - Fraco / Restrito', '3 - Razoável / Médio', '4 - Bom / Reparador', '5 - Excelente / Restaurador'],
        sleepDuration: ['1 - Muito Insuficiente (< 5h)', '2 - Insuficiente (5h - 6h)', '3 - Razoável (6h - 7h)', '4 - Bom (7h - 8h)', '5 - Excelente (> 8h)'],
        mood: ['1 - Muito Irritada / Triste', '2 - Desanimada / Inquieta', '3 - Neutro / Razoável', '4 - Bom / Motivada', '5 - Excelente / Muito Motivada'],
        stress: ['1 - Stress Extremo / Muita Ansiedade', '2 - Elevado Stress', '3 - Moderado', '4 - Pouco Stress', '5 - Nulo / Relaxada'],
        fatigue: ['1 - Exausta / Sem Energia', '2 - Muito Cansada', '3 - Moderado', '4 - Fresca / Energizada', '5 - Excelente / Plena Energia'],
        soreness: ['1 - Dor Muito Intensa', '2 - Bastantes Dores', '3 - Desconforto Moderado', '4 - Ligeiro Desconforto', '5 - Sem Qualquer Dor'],
        heavyLegs: ['1 - Extremamente Pesadas', '2 - Muito Pesadas', '3 - Moderadas', '4 - Leves', '5 - Pernas Muito Leves'],
      },
      scaleLegendTitle: 'Ver Descrição Completa das Escalas (1 a 5)',
      muscleFatigueTitle: 'Localização de Fadiga / Desconforto Muscular',
      muscleFatigueSubtitle: 'Clica nos grupos musculares no boneco onde sentes dor ou fadiga (1 = Mínimo a 10 = Máximo)',
      physioTitle: 'Encaminhamento para Fisioterapia / Departamento Médico',
      physioQuestion: 'Necessitas de avaliação ou tratamento com a Fisioterapia hoje?',
      yes: 'SIM',
      no: 'NÃO',
      physioReasonPlaceholder: 'Descreve brevemente o motivo ou zona a tratar...',
      submit: 'Guardar Questionário Wellness',
      submitting: 'A guardar...',
      successMessage: 'Questionário Wellness registado com sucesso!',
    },
    rpe: {
      title: 'Perceção Subjetiva de Esforço (PSE / RPE)',
      subtitle: 'Regista a intensidade e a carga percecionada do teu treino',
      borgTitle: 'Exigência Física do Treino',
      borgDescriptors: {
        1: '1 - Muito Fácil (Esforço Mínimo)',
        2: '2 - Fácil (Pouca Exigência)',
        3: '3 - Moderado (Carga Tolerável)',
        4: '4 - Algo Difícil (Exigente)',
        5: '5 - Difícil (Esforço Intenso)',
        6: '6 - Difícil +',
        7: '7 - Muito Difícil (Exigência Elevada)',
        8: '8 - Muito Difícil +',
        9: '9 - Extremamente Difícil (Perto do Limite)',
        10: '10 - Máximo (Limite Absoluto)',
      },
      postFatigueTitle: 'Nível de Fadiga Após Treino',
      scaleFatigueLegendTitle: 'Ver Escala Completa de Fadiga (1 a 10)',
      fatigueDescriptors: {
        1: '1 - Nenhuma / Sem Fadiga (Sensação Fresca)',
        2: '2 - Muito Ligeira (Mínimo Cansaço)',
        3: '3 - Ligeira (Cansaço Pouco Significativo)',
        4: '4 - Moderada (Fadiga Perceptível)',
        5: '5 - Moderada + (Fadiga Notória)',
        6: '6 - Substancial (Cansaço Elevado)',
        7: '7 - Elevada (Fadiga Forte)',
        8: '8 - Muito Elevada (Cansaço Muito Forte)',
        9: '9 - Severa / Perto da Exaustão',
        10: '10 - Exaustão Total (Incapaz de Continuar)',
      },
      muscleFatigueTitle: 'Localização da Fadiga / Desconforto Muscular',
      muscleFatigueSubtitle: 'Preenche apenas os grupos musculares onde sentes dor ou desconforto.',
      preWorkoutTitle: 'Trabalho Prévio Realizado',
      preWorkoutOptions: {
        mobility: 'Mobilidade',
        activation: 'Ativação',
        core: 'Core / Estabilidade',
        prevention: 'Prevenção de Lesões',
      },
      commentsTitle: 'Comentários / Observações do Treino',
      commentsPlaceholder: 'Notas adicionais sobre a sessão...',
      submit: 'Guardar Registo RPE',
      submitting: 'A guardar...',
      successMessage: 'Registo RPE submetido com sucesso!',
    },
    hydration: {
      title: 'Dashboard de Hidratação Individual',
      newEntry: 'Novo Registo',
      close: 'Fechar',
      gsheetsBadge: 'Ligação Google Sheets (Gsheets)',
      gsheetsSub: 'As jogadoras e a equipa técnica mantêm a folha Gsheets sincronizada em tempo real.',
      scriptBtnShow: 'Script/Guia',
      scriptBtnHide: 'Ocultar',
      statusAdequate: 'Adequada (< 1.0%)',
      statusCaution: 'Atenção (1.0% - 2.0%)',
      statusAlert: 'ALERTA (> 2.0%)',
      dehydrationRate: 'Taxa de Desidratação',
      refillNeeded: 'Reposição Obrigatória',
      weightLoss: 'perdição',
      actionRequired: 'Ação Recomendada Imediata:',
      biologicalImpact: 'Impacto Biológico / Sintomas:',
      sessionDetails: 'Dados Detalhados da Sessão',
      preWeight: 'Peso Pré-Treino (kg)',
      postWeight: 'Peso Pós-Treino (kg)',
      fluidLoss: 'Variação Líquida de Peso',
      fluidsIntake: 'Líquidos Ingeridos no Treino (L)',
      duration: 'Duração do Treino (min)',
      history: 'Histórico de Sessões',
      calculateAndSave: 'Calcular & Registar Estado Hídrico',
    },
    bodyChart: {
      anteriorView: 'Vista Anterior (Frente)',
      posteriorView: 'Vista Posterior (Costas)',
      selectInstruction: 'Preenche apenas os grupos musculares onde sentes dor ou desconforto.',
      noFatigue: 'Sem dor / fadiga selecionada',
      muscles: {
        shoulders: 'Ombros / Peitorais',
        chest: 'Peito',
        abs: 'Abdominais / Core',
        quads: 'Quadríceps (Frente da Coxa)',
        knees: 'Joelhos / Patela',
        ankles: 'Tornozelos / Pés',
        upperBack: 'Trapezius / Costas',
        glutes: 'Glúteos / Lombari',
        hamstrings: 'Isquiotibiais (Trás da Coxa)',
        calves: 'Gémeos / Soleares',
      },
    },
    admin: {
      title: 'Painel da Equipa Técnica',
      pinPrompt: 'Introduz o PIN do Staff',
      squadSummary: 'Resumo Diário do Plantel',
      physioReferrals: 'Fisioterapia & Casos Urgentes',
      roster: 'Gestão de Atletas & PINs',
      pinMgmt: 'Códigos PIN',
      subTabs: {
        general: 'Visão Geral (Plantel)',
        wellness: 'Questionário Wellness',
        rpe: 'PSE Pós-Treino',
        hydration: 'Hidratação',
        weight: 'PESO',
      },
    },
  },

  en: {
    header: {
      title: 'GIL VICENTE FC (FUTEBOL FEMININO)',
      subtitle: 'PERFORMANCE & HEALTH DEPARTMENT',
      changeAthlete: 'Change Athlete',
      adminArea: 'Technical Area',
      langName: 'English',
    },
    tabs: {
      wellness: 'Pre-Workout Wellness',
      rpe: 'Post-Workout RPE',
      hydration: 'Hydration',
    },
    athleteSelector: {
      title: 'GIL VICENTE FC (FUTEBOL FEMININO)',
      subtitle: 'SELECT YOUR PLAYER PROFILE',
      searchPlaceholder: 'Search player...',
      pinTitle: 'PIN Access',
      pinSubtitle: 'Enter your 4-digit PIN to continue',
      confirm: 'Confirm',
      cancel: 'Cancel',
      wrongPin: 'Incorrect PIN. Try again.',
    },
    wellness: {
      title: 'Pre-Workout Wellness Questionnaire',
      subtitle: 'Assess your physical and mental state before the training session',
      menstrualCycleTitle: 'Menstrual Cycle Phase',
      menstrualPhases: {
        menstruation: 'Menstruation',
        week1: '1st Week post-period',
        week2: '2nd Week post-period',
        week3: '3rd Week post-period',
        irregular: 'Irregular period',
      },
      sleepQuality: 'Sleep Quality',
      sleepDuration: 'Sleep Duration',
      mood: 'Mood / State of Mind',
      stress: 'Stress / Anxiety Level',
      fatigue: 'General Fatigue',
      soreness: 'Muscle Soreness / Discomfort',
      heavyLegs: 'Heavy Legs Sensation',
      descriptors1to5: {
        sleepQuality: ['1 - Very Bad (Insomnia)', '2 - Poor / Restricted', '3 - Fair / Average', '4 - Good / Restful', '5 - Excellent / Restorative'],
        sleepDuration: ['1 - Very Insufficient (< 5h)', '2 - Insufficient (5h - 6h)', '3 - Fair (6h - 7h)', '4 - Good (7h - 8h)', '5 - Excellent (> 8h)'],
        mood: ['1 - Very Irritable / Sad', '2 - Discouraged / Restless', '3 - Neutral / Fair', '4 - Good / Motivated', '5 - Excellent / Highly Motivated'],
        stress: ['1 - Extreme Stress / High Anxiety', '2 - High Stress', '3 - Moderate', '4 - Low Stress', '5 - None / Relaxed'],
        fatigue: ['1 - Exhausted / No Energy', '2 - Very Tired', '3 - Moderate', '4 - Fresh / Energized', '5 - Excellent / Full Energy'],
        soreness: ['1 - Very Severe Pain', '2 - Significant Pain', '3 - Moderate Discomfort', '4 - Mild Discomfort', '5 - No Pain At All'],
        heavyLegs: ['1 - Extremely Heavy', '2 - Very Heavy', '3 - Moderate', '4 - Light', '5 - Very Light Legs'],
      },
      scaleLegendTitle: 'View Full Scale Descriptors (1 to 5)',
      muscleFatigueTitle: 'Muscle Fatigue / Pain Location',
      muscleFatigueSubtitle: 'Click on muscle groups on the body chart where you feel pain or fatigue (1 = Min to 10 = Max)',
      physioTitle: 'Physiotherapy / Medical Department Referral',
      physioQuestion: 'Do you need assessment or treatment with Physio today?',
      yes: 'YES',
      no: 'NO',
      physioReasonPlaceholder: 'Briefly describe reason or body area to treat...',
      submit: 'Save Wellness Questionnaire',
      submitting: 'Saving...',
      successMessage: 'Wellness Questionnaire saved successfully!',
    },
    rpe: {
      title: 'Rating of Perceived Exertion (RPE / PSE)',
      subtitle: 'Log the perceived intensity and load of your workout',
      borgTitle: 'Physical Demand of Training',
      borgDescriptors: {
        1: '1 - Very Easy (Minimal Effort)',
        2: '2 - Easy (Low Demand)',
        3: '3 - Moderate (Tolerable Load)',
        4: '4 - Somewhat Hard (Demanding)',
        5: '5 - Hard (Intense Effort)',
        6: '6 - Hard +',
        7: '7 - Very Hard (High Demand)',
        8: '8 - Very Hard +',
        9: '9 - Extremely Hard (Near Limit)',
        10: '10 - Maximal (Absolute Limit)',
      },
      postFatigueTitle: 'Fatigue Level After Training',
      scaleFatigueLegendTitle: 'View Full Fatigue Scale (1 to 10)',
      fatigueDescriptors: {
        1: '1 - None / No Fatigue (Feeling Fresh)',
        2: '2 - Very Light (Minimal Tiredness)',
        3: '3 - Light (Slight Fatigue)',
        4: '4 - Moderate (Noticeable Fatigue)',
        5: '5 - Moderate + (Noticable Tiredness)',
        6: '6 - Substantial (High Fatigue)',
        7: '7 - High (Strong Fatigue)',
        8: '8 - Very High (Very Strong Fatigue)',
        9: '9 - Severe / Near Exhaustion',
        10: '10 - Total Exhaustion (Unable to Continue)',
      },
      muscleFatigueTitle: 'Muscle Fatigue / Discomfort Location',
      muscleFatigueSubtitle: 'Fill in only the muscle groups where you feel pain or discomfort.',
      preWorkoutTitle: 'Pre-Workout Work Completed',
      preWorkoutOptions: {
        mobility: 'Mobility',
        activation: 'Activation',
        core: 'Core / Stability',
        prevention: 'Injury Prevention',
      },
      commentsTitle: 'Workout Comments / Observations',
      commentsPlaceholder: 'Additional notes about the session...',
      submit: 'Save RPE Entry',
      submitting: 'Saving...',
      successMessage: 'RPE entry submitted successfully!',
    },
    hydration: {
      title: 'Individual Hydration Dashboard',
      newEntry: 'New Entry',
      close: 'Close',
      gsheetsBadge: 'Google Sheets Connection (Gsheets)',
      gsheetsSub: 'Players and staff keep the Gsheets spreadsheet synced in real-time.',
      scriptBtnShow: 'Script/Guide',
      scriptBtnHide: 'Hide',
      statusAdequate: 'Adequate (< 1.0%)',
      statusCaution: 'Caution (1.0% - 2.0%)',
      statusAlert: 'ALERT (> 2.0%)',
      dehydrationRate: 'Dehydration Rate',
      refillNeeded: 'Mandatory Fluid Refill',
      weightLoss: 'loss',
      actionRequired: 'Immediate Action Required:',
      biologicalImpact: 'Biological Impact / Symptoms:',
      sessionDetails: 'Detailed Session Data',
      preWeight: 'Pre-Workout Weight (kg)',
      postWeight: 'Post-Workout Weight (kg)',
      fluidLoss: 'Net Weight Change',
      fluidsIntake: 'Fluids Consumed in Training (L)',
      duration: 'Training Duration (min)',
      history: 'Session History',
      calculateAndSave: 'Calculate & Save Hydration Status',
    },
    bodyChart: {
      anteriorView: 'Anterior View (Front)',
      posteriorView: 'Posterior View (Back)',
      selectInstruction: 'Fill in only the muscle groups where you feel pain or discomfort.',
      noFatigue: 'No pain / fatigue selected',
      muscles: {
        shoulders: 'Shoulders / Chest',
        chest: 'Chest',
        abs: 'Abs / Core',
        quads: 'Quadriceps (Front Thigh)',
        knees: 'Knees / Patella',
        ankles: 'Ankles / Feet',
        upperBack: 'Trapezius / Back',
        glutes: 'Glutes / Lower Back',
        hamstrings: 'Hamstrings (Back Thigh)',
        calves: 'Calves / Soleus',
      },
    },
    admin: {
      title: 'Technical Staff Dashboard',
      pinPrompt: 'Enter Staff PIN',
      squadSummary: 'Daily Squad Summary',
      physioReferrals: 'Physiotherapy & Urgent Cases',
      roster: 'Roster & PIN Management',
      pinMgmt: 'PIN Codes',
      subTabs: {
        general: 'General Overview',
        wellness: 'Wellness Questionnaire',
        rpe: 'Post-Workout RPE',
        hydration: 'Hydration',
        weight: 'WEIGHT',
      },
      fines: {
        tabFines: 'Fines & Non-Compliance Tally',
        finesTitle: 'Monthly Fines & Compliance Management',
        finesSub: 'Track non-submissions on training days.',
        fineUnit: 'Fine Per Missing Form (€)',
        trainingDaysOnly: 'Training Days Only',
        selectMonth: 'Select Month',
        copyReport: 'Copy Fines Report',
        totalFines: 'Total Fines This Month',
        trainingDaysCount: 'Training Days',
        complianceRate: 'Overall Compliance',
        topMissing: 'Top Non-Compliant Player',
        athlete: 'Player',
        missingWellness: 'Missing Wellness',
        missingRpe: 'Missing RPE',
        missingHydration: 'Missing Weigh-In',
        totalFaults: 'Total Faults',
        totalFine: 'Total Due (€)',
        noFines: 'No fines registered for this month 🎉',
        reportCopied: 'Formatted fine report copied to clipboard!',
      },
    },
  },

  fr: {
    header: {
      title: 'GIL VICENTE FC (FUTEBOL FEMININO)',
      subtitle: 'DÉPARTEMENT DE PERFORMANCE & SANTÉ',
      changeAthlete: 'Changer d\'Joueuse',
      adminArea: 'Zone Technique',
      langName: 'Français',
    },
    tabs: {
      wellness: 'Wellness Pré-Entraînement',
      rpe: 'RPE Post-Entraînement',
      hydration: 'Hydratation',
    },
    athleteSelector: {
      title: 'GIL VICENTE FC (FUTEBOL FEMININO)',
      subtitle: 'SÉLECTIONNE TON PROFIL DE JOUEUSE',
      searchPlaceholder: 'Rechercher une joueuse...',
      pinTitle: 'Accès par code PIN',
      pinSubtitle: 'Entre ton code PIN à 4 chiffres pour continuer',
      confirm: 'Confirmer',
      cancel: 'Annuler',
      wrongPin: 'Code PIN incorrect. Réessaie.',
    },
    wellness: {
      title: 'Questionnaire Wellness Pré-Entraînement',
      subtitle: 'Évalue ton état physique et mental avant la séance d\'entraînement',
      menstrualCycleTitle: 'Phase du Cycle Menstruel',
      menstrualPhases: {
        menstruation: 'Règles / Menstruation',
        week1: '1ère semaine après les règles',
        week2: '2ème semaine après les règles',
        week3: '3ème semaine après les règles',
        irregular: 'Règles irrégulières',
      },
      sleepQuality: 'Qualité du Sommeil',
      sleepDuration: 'Durée du Sommeil',
      mood: 'Humeur / État d\'Esprit',
      stress: 'Niveau de Stress / Anxiété',
      fatigue: 'Fatigue Générale',
      soreness: 'Douleurs / Gêne Musculaire',
      heavyLegs: 'Sensation de Jambes Lourdes',
      descriptors1to5: {
        sleepQuality: ['1 - Très Mauvaise (Insomnie)', '2 - Mauvaise / Perturbée', '3 - Moyenne', '4 - Bonne / Reposante', '5 - Excellente / Réparatrice'],
        sleepDuration: ['1 - Très Insuffisante (< 5h)', '2 - Insuffisante (5h - 6h)', '3 - Passable (6h - 7h)', '4 - Bonne (7h - 8h)', '5 - Excellente (> 8h)'],
        mood: ['1 - Très Irritable / Triste', '2 - Découragée / Inquiète', '3 - Neutre', '4 - Bonne / Motivée', '5 - Excellente / Très Motivée'],
        stress: ['1 - Stress Extrême / Très Anxieuse', '2 - Stress Élevé', '3 - Modéré', '4 - Faible Stress', '5 - Aucun / Relaxée'],
        fatigue: ['1 - Épuisée / Sans Énergie', '2 - Très Fatiguée', '3 - Modérée', '4 - En Forme / Énergique', '5 - Excellente / Pleine Énergie'],
        soreness: ['1 - Douleur Très Sévère', '2 - Douleur Importante', '3 - Gêne Modérée', '4 - Légère Gêne', '5 - Aucune Douleur'],
        heavyLegs: ['1 - Extrêmement Lourdes', '2 - Très Lourdes', '3 - Modérées', '4 - Légères', '5 - Jambes Très Légères'],
      },
      scaleLegendTitle: 'Voir la Légende Complète de l\'Échelle (1 à 5)',
      muscleFatigueTitle: 'Localisation de la Fatigue / Douleur Musculaire',
      muscleFatigueSubtitle: 'Clique sur les groupes musculaires de la planche où tu ressens de la douleur ou fatigue (1 = Min à 10 = Max)',
      physioTitle: 'Demande de Kinésithérapie / Département Médical',
      physioQuestion: 'As-tu besoin d\'une évaluation ou soin en Kinésithérapie aujourd\'hui ?',
      yes: 'OUI',
      no: 'NON',
      physioReasonPlaceholder: 'Décris brièvement la raison ou la zone à traiter...',
      submit: 'Enregistrer le Questionnaire Wellness',
      submitting: 'Enregistrement...',
      successMessage: 'Questionnaire Wellness enregistré avec succès !',
    },
    rpe: {
      title: 'Évaluation de l\'Effort Perçu (RPE / PSE)',
      subtitle: 'Enregistre l\'intensité perçue et la charge de ta séance',
      borgTitle: 'Exigence Physique de l\'Entraînement',
      borgDescriptors: {
        1: '1 - Très Facile (Effort Minimal)',
        2: '2 - Facile (Faible Exigence)',
        3: '3 - Modéré (Charge Tolérable)',
        4: '4 - Un Peu Difficile (Exigeant)',
        5: '5 - Difficile (Effort Intense)',
        6: '6 - Difficile +',
        7: '7 - Très Difficile (Haute Exigence)',
        8: '8 - Très Difficile +',
        9: '9 - Extrêmement Difficile (Près de la Limite)',
        10: '10 - Maximal (Limite Absolue)',
      },
      postFatigueTitle: 'Niveau de Fatigue Après l\'Entraînement',
      scaleFatigueLegendTitle: 'Voir la Légende Complète de la Fatigue (1 à 10)',
      fatigueDescriptors: {
        1: '1 - Aucune / Pas de Fatigue (En Forme)',
        2: '2 - Très Légère (Fatigue Minimale)',
        3: '3 - Légère (Petite Fatigue)',
        4: '4 - Modérée (Fatigue Perceptible)',
        5: '5 - Modérée +',
        6: '6 - Substantielle (Fatigue Élevée)',
        7: '7 - Élevée (Forte Fatigue)',
        8: '8 - Très Élevée (Très Forte Fatigue)',
        9: '9 - Sévère / Proche de l\'Épuisement',
        10: '10 - Épuisement Total (Impossible de Continuer)',
      },
      muscleFatigueTitle: 'Localisation de la Fatigue / Gêne Musculaire',
      muscleFatigueSubtitle: 'Remplis uniquement les zones musculaires où tu ressens de la douleur ou gêne.',
      preWorkoutTitle: 'Travail Préparatoire Réalisé',
      preWorkoutOptions: {
        mobility: 'Mobilité',
        activation: 'Activation',
        core: 'Gainage / Stabilité',
        prevention: 'Prévention des Blessures',
      },
      commentsTitle: 'Commentaires / Remarques sur la Séance',
      commentsPlaceholder: 'Notes additionnelles sur la séance...',
      submit: 'Enregistrer l\'Entrée RPE',
      submitting: 'Enregistrement...',
      successMessage: 'Fiche RPE enregistrée avec succès !',
    },
    hydration: {
      title: 'Tableau de Bord d\'Hydratation Individuel',
      newEntry: 'Nouvelle Saisie',
      close: 'Fermer',
      gsheetsBadge: 'Connexion Google Sheets (Gsheets)',
      gsheetsSub: 'Synchronisation en temps réel avec le fichier du staff.',
      scriptBtnShow: 'Guide / Script',
      scriptBtnHide: 'Masquer',
      statusAdequate: 'Adéquate (< 1.0%)',
      statusCaution: 'Attention (1.0% - 2.0%)',
      statusAlert: 'ALERTE (> 2.0%)',
      dehydrationRate: 'Taux de Déshydratation',
      refillNeeded: 'Recharge Hydrique Obligatoire',
      weightLoss: 'perte',
      actionRequired: 'Action Immédiate Requise :',
      biologicalImpact: 'Impact Biologique / Symptômes :',
      sessionDetails: 'Données Détaillées de la Séance',
      preWeight: 'Poids Pré-Entraînement (kg)',
      postWeight: 'Poids Post-Entraînement (kg)',
      fluidLoss: 'Variation de Poids Net',
      fluidsIntake: 'Liquides Consommés à l\'Entraînement (L)',
      duration: 'Durée de l\'Entraînement (min)',
      history: 'Historique des Séances',
      calculateAndSave: 'Calculer & Enregistrer le Statut d\'Hydratation',
    },
    bodyChart: {
      anteriorView: 'Vue Antérieure (Face)',
      posteriorView: 'Vue Postérieure (Dos)',
      selectInstruction: 'Remplis uniquement les zones musculaires où tu ressens de la douleur ou gêne.',
      noFatigue: 'Aucune douleur / fatigue sélectionnée',
      muscles: {
        shoulders: 'Épaules / Poitrine',
        chest: 'Pectoraux',
        abs: 'Abdominaux / Core',
        quads: 'Quadriceps (Cuisse Avant)',
        knees: 'Genoux / Rotule',
        ankles: 'Chevilles / Pieds',
        upperBack: 'Trapèzes / Haut du Dos',
        glutes: 'Fessiers / Bas du Dos',
        hamstrings: 'Ischio-jambiers (Cuisse Arrière)',
        calves: 'Mollets / Soléaires',
      },
    },
    admin: {
      title: 'Tableau de Bord de l\'Équipe Technique',
      pinPrompt: 'Entre le PIN du Staff',
      squadSummary: 'Résumé Quotidien de l\'Effectif',
      physioReferrals: 'Kinésithérapie & Cas Urgents',
      roster: 'Gestion des Joueuses & PINs',
      pinMgmt: 'Codes PIN',
      subTabs: {
        general: 'Vue Générale (Effectif)',
        wellness: 'Questionnaire Wellness',
        rpe: 'RPE Post-Entraînement',
        hydration: 'Hydratation',
        weight: 'POIDS',
      },
      fines: {
        tabFines: 'Décompte des Amendes & Absences',
        finesTitle: 'Gestion Mensuelle des Amendes & Conformité',
        finesSub: 'Suivi des non-remplissages les jours d\'entraînement.',
        fineUnit: 'Amende Par Formulaire Manquant (€)',
        trainingDaysOnly: 'Jours d\'Entraînement Uniquement',
        selectMonth: 'Sélectionner le Mois',
        copyReport: 'Copier le Rapport d\'Amendes',
        totalFines: 'Total Amendes ce Mois-ci',
        trainingDaysCount: 'Jours d\'Entraînement',
        complianceRate: 'Taux Général de Conformité',
        topMissing: 'Joueuse la Plus Absente',
        athlete: 'Joueuse',
        missingWellness: 'Wellness Manquant',
        missingRpe: 'RPE Manquant',
        missingHydration: 'Pesée Manquante',
        totalFaults: 'Total Absences',
        totalFine: 'Total Dû (€)',
        noFines: 'Aucune amende enregistrée ce mois-ci 🎉',
        reportCopied: 'Rapport d\'amendes copié dans le presse-papier !',
      },
    },
  },
};
