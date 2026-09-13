export type Language = 'pt' | 'en' | 'fr' | 'es';

export interface Translations {
  header: {
    title: string;
    subtitle: string;
    changeAthlete: string;
    adminArea: string;
    physioArea: string;
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
  gate: {
    title: string;
    subtitle: string;
    codePlaceholder: string;
    submit: string;
    error: string;
    footer: string;
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
    borgDescriptors: Record<number, string>;
    postFatigueTitle: string;
    scaleFatigueLegendTitle: string;
    fatigueDescriptors: Record<number, string>;
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
    step1Title: string;
    step1Sub: string;
    savePreWeight: string;
    step2Title: string;
    step2Sub: string;
    savePostWeight: string;
    preWeightSaved: string;
    goodTraining: string;
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
    fines: {
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
      physioArea: 'Gabinete Médico',
      langName: 'Português',
    },
    tabs: {
      wellness: 'Wellness Pré-Treino',
      rpe: 'PSE Pós-Treino',
      hydration: 'Pesagem & Hidratação',
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
    gate: {
      title: 'Gil Vicente FC (Feminino)',
      subtitle: 'Introduza a Chave de Segurança da Equipa para aceder ao sistema de performance e saúde.',
      codePlaceholder: 'Código de Acesso (ex: GVFC2026)',
      submit: 'Desbloquear Acesso',
      error: 'Código de acesso incorreto. Introduza o Passe de Segurança do Gil Vicente FC.',
      footer: '🔒 Acesso restrito a atletas, equipa técnica e médica do Gil Vicente FC.',
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
      weightLoss: 'Variação de Peso',
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
      step1Title: '1. Pesagem Pré-Treino (À Chegada)',
      step1Sub: 'Regista o teu peso antes de iniciar o treino.',
      savePreWeight: 'Guardar Peso Pré-Treino',
      step2Title: '2. Pesagem Pós-Treino (À Saída)',
      step2Sub: 'Regista o teu peso e líquidos ingeridos no final do treino.',
      savePostWeight: 'Concluir Pesagem Pós-Treino',
      preWeightSaved: 'Peso Pré-Treino guardado!',
      goodTraining: 'Bom Treino!',
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
      fines: {
        tabFines: 'Multas & Cumprimento',
        finesTitle: 'Relatório de Cumprimento & Multas',
        finesSub: 'Controlo de atrasos e questionários em falta por jogadora.',
        fineUnit: '€/Falta',
        trainingDaysOnly: 'Apenas Dias de Treino/Jogo',
        selectMonth: 'Selecionar Mês',
        copyReport: 'Copiar Relatório para WhatsApp',
        totalFines: 'Total de Multas',
        trainingDaysCount: 'Dias de Treino/Jogo',
        complianceRate: 'Taxa de Cumprimento',
        topMissing: 'Atletas com Mais Faltas',
        athlete: 'Atleta',
        missingWellness: 'Faltas Wellness',
        missingRpe: 'Faltas PSE',
        missingHydration: 'Faltas Pesagem',
        totalFaults: 'Total Faltas',
        totalFine: 'Valor Multa',
        noFines: 'Sem multas a aplicar!',
        reportCopied: 'Relatório copiado!',
      },
    },
  },

  en: {
    header: {
      title: 'GIL VICENTE FC (WOMEN\'S FOOTBALL)',
      subtitle: 'PERFORMANCE & HEALTH DEPARTMENT',
      changeAthlete: 'Change Athlete',
      adminArea: 'Technical Area',
      physioArea: 'Medical Room',
      langName: 'English',
    },
    tabs: {
      wellness: 'Pre-Workout Wellness',
      rpe: 'Post-Workout RPE',
      hydration: 'Weigh-in & Hydration',
    },
    athleteSelector: {
      title: 'GIL VICENTE FC (WOMEN\'S FOOTBALL)',
      subtitle: 'SELECT YOUR PLAYER PROFILE',
      searchPlaceholder: 'Search player...',
      pinTitle: 'PIN Access',
      pinSubtitle: 'Enter your 4-digit PIN to continue',
      confirm: 'Confirm',
      cancel: 'Cancel',
      wrongPin: 'Incorrect PIN. Please try again.',
    },
    gate: {
      title: 'Gil Vicente FC (Women\'s)',
      subtitle: 'Enter the Team Security Passcode to access the performance and health system.',
      codePlaceholder: 'Access Code (e.g., GVFC2026)',
      submit: 'Unlock Access',
      error: 'Incorrect access code. Please enter the Gil Vicente FC Security Passcode.',
      footer: '🔒 Restricted access for Gil Vicente FC players, technical, and medical staff.',
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
      soreness: 'Muscle Soreness',
      heavyLegs: 'Heavy Legs Sensation',
      descriptors1to5: {
        sleepQuality: ['1 - Very Bad (Insomnia)', '2 - Poor / Restrictive', '3 - Fair / Average', '4 - Good / Restful', '5 - Excellent / Restorative'],
        sleepDuration: ['1 - Very Insufficient (< 5h)', '2 - Insufficient (5h - 6h)', '3 - Fair (6h - 7h)', '4 - Good (7h - 8h)', '5 - Excellent (> 8h)'],
        mood: ['1 - Very Irritable / Sad', '2 - Discouraged / Anxious', '3 - Neutral / Fair', '4 - Good / Motivated', '5 - Excellent / Highly Motivated'],
        stress: ['1 - Extreme Stress / High Anxiety', '2 - High Stress', '3 - Moderate', '4 - Low Stress', '5 - None / Relaxed'],
        fatigue: ['1 - Exhausted / No Energy', '2 - Very Tired', '3 - Moderate', '4 - Fresh / Energized', '5 - Excellent / Full Energy'],
        soreness: ['1 - Very Severe Pain', '2 - Significant Soreness', '3 - Moderate Discomfort', '4 - Mild Discomfort', '5 - No Pain At All'],
        heavyLegs: ['1 - Extremely Heavy', '2 - Very Heavy', '3 - Moderate', '4 - Light', '5 - Very Light Legs'],
      },
      scaleLegendTitle: 'View Full Rating Descriptors (1 to 5)',
      muscleFatigueTitle: 'Fatigue / Soreness Location',
      muscleFatigueSubtitle: 'Click on the muscle groups on the chart where you feel soreness (1 = Min to 10 = Max)',
      physioTitle: 'Physiotherapy / Medical Referral',
      physioQuestion: 'Do you require assessment or treatment with Physio today?',
      yes: 'YES',
      no: 'NO',
      physioReasonPlaceholder: 'Briefly describe reason or body area...',
      submit: 'Save Wellness Questionnaire',
      submitting: 'Saving...',
      successMessage: 'Wellness questionnaire recorded successfully!',
    },
    rpe: {
      title: 'Rating of Perceived Exertion (RPE)',
      subtitle: 'Record the intensity and perceived load of your session',
      borgTitle: 'Physical Session Demand',
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
        10: '10 - Maximum (Absolute Limit)',
      },
      postFatigueTitle: 'Post-Workout Fatigue Level',
      scaleFatigueLegendTitle: 'View Full Fatigue Scale (1 to 10)',
      fatigueDescriptors: {
        1: '1 - None / No Fatigue (Feeling Fresh)',
        2: '2 - Very Light (Minimal Tiredness)',
        3: '3 - Light (Slight Tiredness)',
        4: '4 - Moderate (Noticeable Fatigue)',
        5: '5 - Moderate + (Clear Fatigue)',
        6: '6 - Substantial (High Tiredness)',
        7: '7 - High (Strong Fatigue)',
        8: '8 - Very High (Very Strong Fatigue)',
        9: '9 - Severe / Near Exhaustion',
        10: '10 - Total Exhaustion (Unable to Continue)',
      },
      muscleFatigueTitle: 'Fatigue / Soreness Muscle Map',
      muscleFatigueSubtitle: 'Fill in only the muscle groups where you feel soreness or discomfort.',
      preWorkoutTitle: 'Pre-Workout Preparation',
      preWorkoutOptions: {
        mobility: 'Mobility',
        activation: 'Activation',
        core: 'Core / Stability',
        prevention: 'Injury Prevention',
      },
      commentsTitle: 'Session Comments / Notes',
      commentsPlaceholder: 'Additional notes about the training session...',
      submit: 'Save RPE Record',
      submitting: 'Saving...',
      successMessage: 'RPE record submitted successfully!',
    },
    hydration: {
      title: 'Individual Hydration Dashboard',
      newEntry: 'New Entry',
      close: 'Close',
      gsheetsBadge: 'Google Sheets Integration',
      gsheetsSub: 'Players and staff keep the Gsheets database synchronized in real time.',
      scriptBtnShow: 'Script/Guide',
      scriptBtnHide: 'Hide',
      statusAdequate: 'Adequate (< 1.0%)',
      statusCaution: 'Caution (1.0% - 2.0%)',
      statusAlert: 'ALERT (> 2.0%)',
      dehydrationRate: 'Dehydration Rate',
      refillNeeded: 'Required Fluid Intake',
      weightLoss: 'Weight Change',
      actionRequired: 'Immediate Action Required:',
      biologicalImpact: 'Biological Impact / Symptoms:',
      sessionDetails: 'Session Details',
      preWeight: 'Pre-Training Weight (kg)',
      postWeight: 'Post-Training Weight (kg)',
      fluidLoss: 'Net Fluid Variation',
      fluidsIntake: 'Fluids Drank in Session (L)',
      duration: 'Training Duration (min)',
      history: 'Session History',
      calculateAndSave: 'Calculate & Save Hydration Status',
      step1Title: '1. Pre-Training Weigh-in (Arrival)',
      step1Sub: 'Record your weight before starting training.',
      savePreWeight: 'Save Pre-Training Weight',
      step2Title: '2. Post-Training Weigh-in (Departure)',
      step2Sub: 'Record your weight and fluids drank after training.',
      savePostWeight: 'Complete Post-Training Weigh-in',
      preWeightSaved: 'Pre-Training Weight Saved!',
      goodTraining: 'Have a Great Training!',
    },
    bodyChart: {
      anteriorView: 'Anterior View (Front)',
      posteriorView: 'Posterior View (Back)',
      selectInstruction: 'Select only the muscle groups where you feel soreness or fatigue.',
      noFatigue: 'No muscle soreness selected',
      muscles: {
        shoulders: 'Shoulders / Pecs',
        chest: 'Chest',
        abs: 'Abdominals / Core',
        quads: 'Quadriceps (Front Thigh)',
        knees: 'Knees / Patella',
        ankles: 'Ankles / Feet',
        upperBack: 'Trapezius / Upper Back',
        glutes: 'Glutes / Lower Back',
        hamstrings: 'Hamstrings (Back Thigh)',
        calves: 'Calves / Soleus',
      },
    },
    admin: {
      title: 'Technical Staff Panel',
      pinPrompt: 'Enter Staff PIN',
      squadSummary: 'Daily Squad Summary',
      physioReferrals: 'Physiotherapy & Urgent Cases',
      roster: 'Roster & PIN Management',
      pinMgmt: 'PIN Codes',
      subTabs: {
        general: 'Overview (Squad)',
        wellness: 'Wellness Questionnaire',
        rpe: 'Post-Training RPE',
        hydration: 'Hydration',
        weight: 'WEIGHT',
      },
      fines: {
        tabFines: 'Fines & Compliance',
        finesTitle: 'Compliance & Fine Report',
        finesSub: 'Track missing questionnaires and late entries per player.',
        fineUnit: '€/Missing',
        trainingDaysOnly: 'Training/Match Days Only',
        selectMonth: 'Select Month',
        copyReport: 'Copy Report for WhatsApp',
        totalFines: 'Total Fines',
        trainingDaysCount: 'Training/Match Days',
        complianceRate: 'Compliance Rate',
        topMissing: 'Players with Most Missing Entries',
        athlete: 'Player',
        missingWellness: 'Missing Wellness',
        missingRpe: 'Missing RPE',
        missingHydration: 'Missing Weigh-ins',
        totalFaults: 'Total Missing',
        totalFine: 'Fine Amount',
        noFines: 'No fines to apply!',
        reportCopied: 'Report copied to clipboard!',
      },
    },
  },

  fr: {
    header: {
      title: 'GIL VICENTE FC (FOOTBALL FÉMININ)',
      subtitle: 'DÉPARTEMENT PERFORMANCE & SANTÉ',
      changeAthlete: 'Changer d\'Joueuse',
      adminArea: 'Zone Technique',
      physioArea: 'Cabinet Médical',
      langName: 'Français',
    },
    tabs: {
      wellness: 'Wellness Pré-Entraînement',
      rpe: 'RPE Post-Entraînement',
      hydration: 'Pesée & Hydratation',
    },
    athleteSelector: {
      title: 'GIL VICENTE FC (FOOTBALL FÉMININ)',
      subtitle: 'SÉLECTIONNEZ VOTRE PROFIL DE JOUEUSE',
      searchPlaceholder: 'Rechercher une joueuse...',
      pinTitle: 'Accès par Code PIN',
      pinSubtitle: 'Entrez votre code PIN à 4 chiffres pour continuer',
      confirm: 'Confirmer',
      cancel: 'Annuler',
      wrongPin: 'Code PIN incorrect. Veuillez réessayer.',
    },
    gate: {
      title: 'Gil Vicente FC (Féminin)',
      subtitle: 'Entrez le Code de Sécurité de l\'Équipe pour accéder au système.',
      codePlaceholder: 'Code d\'Accès (ex: GVFC2026)',
      submit: 'Déverrouiller l\'Accès',
      error: 'Code d\'accès incorrect. Veuillez entrer le Pass de Sécurité du Gil Vicente FC.',
      footer: '🔒 Accès réservé aux joueuses et au staff technique et médical du Gil Vicente FC.',
    },
    wellness: {
      title: 'Questionnaire Wellness Pré-Entraînement',
      subtitle: 'Évaluez votre état physique et mental avant la séance',
      menstrualCycleTitle: 'Phase du Cycle Menstruel',
      menstrualPhases: {
        menstruation: 'Règles / Menstruation',
        week1: '1ère Semaine après les règles',
        week2: '2ème Semaine après les règles',
        week3: '3ème Semaine après les règles',
        irregular: 'Règles mestruelles irrégulières',
      },
      sleepQuality: 'Qualité du Sommeil',
      sleepDuration: 'Durée du Sommeil',
      mood: 'Humeur / État d\'Esprit',
      stress: 'Niveau de Stress / Anxiété',
      fatigue: 'Fatigue Générale',
      soreness: 'Douleurs Musculaires',
      heavyLegs: 'Sensation de Jambes Lourdes',
      descriptors1to5: {
        sleepQuality: ['1 - Très Mauvais (Insomnie)', '2 - Faible / Restreint', '3 - Moyen / Passable', '4 - Bon / Réparateur', '5 - Excellent / Restaurateur'],
        sleepDuration: ['1 - Très Insuffisant (< 5h)', '2 - Insuffisant (5h - 6h)', '3 - Passable (6h - 7h)', '4 - Bon (7h - 8h)', '5 - Excellent (> 8h)'],
        mood: ['1 - Très Irritée / Triste', '2 - Démotivée / Anxieuse', '3 - Neutre / Moyen', '4 - Bon / Motivée', '5 - Excellent / Très Motivée'],
        stress: ['1 - Stress Extrême / Forte Anxiété', '2 - Stress Élevé', '3 - Modéré', '4 - Peu de Stress', '5 - Nul / Relaxée'],
        fatigue: ['1 - Épuisée / Sans Énergie', '2 - Très Fatiguée', '3 - Modérée', '4 - En Forme / Énergisée', '5 - Excellente / Pleine Énergie'],
        soreness: ['1 - Douleur Très Intense', '2 - Douleurs Importantes', '3 - Inconfort Modéré', '4 - Léger Inconfort', '5 - Aucune Douleur'],
        heavyLegs: ['1 - Extrêmement Lourdes', '2 - Très Lourdes', '3 - Modérées', '4 - Légères', '5 - Jambes Très Légères'],
      },
      scaleLegendTitle: 'Voir la Description Complète des Échelles (1 à 5)',
      muscleFatigueTitle: 'Localisation de la Fatigue Musculaire',
      muscleFatigueSubtitle: 'Cliquez sur les zones musculaires où vous ressentez une douleur ou fatigue (1 = Min à 10 = Max)',
      physioTitle: 'Orientation vers la Kinésithérapie / Département Médical',
      physioQuestion: 'Avez-vous besoin d\'un soin ou d\'une évaluation avec la Kiné aujourd\'hui?',
      yes: 'OUI',
      no: 'NON',
      physioReasonPlaceholder: 'Décrivez brièvement la raison ou la zone à traiter...',
      submit: 'Enregistrer le Questionnaire Wellness',
      submitting: 'Enregistrement...',
      successMessage: 'Questionnaire Wellness enregistré avec succès!',
    },
    rpe: {
      title: 'Perception Subjective de l\'Effort (RPE)',
      subtitle: 'Enregistrez l\'intensité et la charge ressentie de votre entraînement',
      borgTitle: 'Exigence Physique de la Séance',
      borgDescriptors: {
        1: '1 - Très Facile (Effort Minimal)',
        2: '2 - Facile (Faible Exigence)',
        3: '3 - Modéré (Charge Tolérable)',
        4: '4 - Un Peu Difficile (Exigeant)',
        5: '5 - Difficile (Effort Intense)',
        6: '6 - Difficile +',
        7: '7 - Très Difficile (Forte Exigence)',
        8: '8 - Très Difficile +',
        9: '9 - Extrêmement Difficile (Près de la Limite)',
        10: '10 - Maximal (Limite Absolue)',
      },
      postFatigueTitle: 'Niveau de Fatigue Après Entraînement',
      scaleFatigueLegendTitle: 'Voir l\'Échelle Complète de Fatigue (1 à 10)',
      fatigueDescriptors: {
        1: '1 - Aucune Fatigue (Sensation Fraîche)',
        2: '2 - Très Légère (Fatigue Minimale)',
        3: '3 - Légère (Fatigue Peu Significative)',
        4: '4 - Modérée (Fatigue Perceptible)',
        5: '5 - Modérée + (Fatigue Nette)',
        6: '6 - Substantielle (Fatigue Élevée)',
        7: '7 - Élevée (Forte Fatigue)',
        8: '8 - Très Élevée (Fatigue Très Forte)',
        9: '9 - Sévère / Proche de l\'Épuisement',
        10: '10 - Épuisement Total (Incapable de Continuer)',
      },
      muscleFatigueTitle: 'Localisation des Douleurs Musculaires',
      muscleFatigueSubtitle: 'Remplissez uniquement les groupes musculaires douloureux.',
      preWorkoutTitle: 'Travail Préparatoire Réalisé',
      preWorkoutOptions: {
        mobility: 'Mobilité',
        activation: 'Activation',
        core: 'Gainage / Core',
        prevention: 'Prévention des Blessures',
      },
      commentsTitle: 'Remarques / Observations de la Séance',
      commentsPlaceholder: 'Notes complémentaires sur la séance...',
      submit: 'Enregistrer le RPE',
      submitting: 'Enregistrement...',
      successMessage: 'Enregistrement RPE soumis avec succès!',
    },
    hydration: {
      title: 'Tableau d\'Hydratation Individuel',
      newEntry: 'Nouvelle Entrée',
      close: 'Fermer',
      gsheetsBadge: 'Intégration Google Sheets',
      gsheetsSub: 'Les joueuses et le staff gardent la base de données Gsheets synchronisée.',
      scriptBtnShow: 'Guide/Script',
      scriptBtnHide: 'Masquer',
      statusAdequate: 'Adéquat (< 1.0%)',
      statusCaution: 'Attention (1.0% - 2.0%)',
      statusAlert: 'ALERTE (> 2.0%)',
      dehydrationRate: 'Taux de Déshydratation',
      refillNeeded: 'Apport En Liquides Requis',
      weightLoss: 'Variation de Poids',
      actionRequired: 'Action Immédiate Recommandée:',
      biologicalImpact: 'Impact Biologique / Symptômes:',
      sessionDetails: 'Détails de la Séance',
      preWeight: 'Poids Avant Entraînement (kg)',
      postWeight: 'Poids Après Entraînement (kg)',
      fluidLoss: 'Variation Nette du Poids',
      fluidsIntake: 'Liquides Bus Pendant la Séance (L)',
      duration: 'Durée de la Séance (min)',
      history: 'Historique des Séances',
      calculateAndSave: 'Calculer & Enregistrer l\'État Hydrique',
      step1Title: '1. Pesée Pré-Entraînement (Arrivée)',
      step1Sub: 'Enregistrez votre poids avant de débuter l\'entraînement.',
      savePreWeight: 'Enregistrer le Poids Avant',
      step2Title: '2. Pesée Post-Entraînement (Sortie)',
      step2Sub: 'Enregistrez votre poids et liquides bus en fin d\'entraînement.',
      savePostWeight: 'Valider la Pesée Post-Entraînement',
      preWeightSaved: 'Poids Pré-Entraînement enregistré!',
      goodTraining: 'Bon Entraînement!',
    },
    bodyChart: {
      anteriorView: 'Vue Antérieure (Face)',
      posteriorView: 'Vue Postérieure (Dos)',
      selectInstruction: 'Sélectionnez uniquement les muscles où vous ressentez une douleur.',
      noFatigue: 'Aucune douleur musculaire sélectionnée',
      muscles: {
        shoulders: 'Épaules / Pectoraux',
        chest: 'Poitrine',
        abs: 'Abdominaux / Core',
        quads: 'Quadriceps (Avant Cuisse)',
        knees: 'Genoux / Rotule',
        ankles: 'Chevilles / Pieds',
        upperBack: 'Trapèzes / Haut du Dos',
        glutes: 'Fessiers / Lombaires',
        hamstrings: 'Ischio-jambiers (Arrière Cuisse)',
        calves: 'Mollets / Soléaires',
      },
    },
    admin: {
      title: 'Panneau du Staff Technique',
      pinPrompt: 'Entrez le PIN du Staff',
      squadSummary: 'Résumé Quotidien de l\'Équipe',
      physioReferrals: 'Kinésithérapie & Cas Urgents',
      roster: 'Gestion des Joueuses & Codes PIN',
      pinMgmt: 'Codes PIN',
      subTabs: {
        general: 'Vue Générale (Équipe)',
        wellness: 'Questionnaire Wellness',
        rpe: 'RPE Post-Entraînement',
        hydration: 'Hydratation',
        weight: 'POIDS',
      },
      fines: {
        tabFines: 'Amendes & Discipline',
        finesTitle: 'Rapport de Discipline & Manquements',
        finesSub: 'Suivi des retards et questionnaires manquants par joueuse.',
        fineUnit: '€/Manquement',
        trainingDaysOnly: 'Jours d\'Entraînement/Match Uniquement',
        selectMonth: 'Sélectionner le Mois',
        copyReport: 'Copier le Rapport pour WhatsApp',
        totalFines: 'Total des Amendes',
        trainingDaysCount: 'Jours d\'Entraînement/Match',
        complianceRate: 'Taux de Conformité',
        topMissing: 'Joueuses avec le Plus de Manquements',
        athlete: 'Joueuse',
        missingWellness: 'Wellness Manquants',
        missingRpe: 'RPE Manquants',
        missingHydration: 'Pesées Manquantes',
        totalFaults: 'Total Manquements',
        totalFine: 'Montant de l\'Amende',
        noFines: 'Aucune amende à appliquer!',
        reportCopied: 'Rapport copié dans le presse-papier!',
      },
    },
  },

  es: {
    header: {
      title: 'GIL VICENTE FC (FÚTBOL FEMENINO)',
      subtitle: 'DEPARTAMENTO DE RENDIMIENTO Y SALUD',
      changeAthlete: 'Cambiar Jugadora',
      adminArea: 'Área Técnica',
      physioArea: 'Gabinete Médico',
      langName: 'Español',
    },
    tabs: {
      wellness: 'Wellness Pre-Entrenamiento',
      rpe: 'RPE Post-Entrenamiento',
      hydration: 'Pesaje e Hidratación',
    },
    athleteSelector: {
      title: 'GIL VICENTE FC (FÚTBOL FEMENINO)',
      subtitle: 'SELECCIONA TU PERFIL DE JUGADORA',
      searchPlaceholder: 'Buscar jugadora...',
      pinTitle: 'Acceso por PIN',
      pinSubtitle: 'Introduce tu PIN de 4 dígitos para continuar',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      wrongPin: 'PIN incorrecto. Inténtalo de nuevo.',
    },
    gate: {
      title: 'Gil Vicente FC (Femenino)',
      subtitle: 'Introduce el Código de Seguridad del Equipo para acceder al sistema.',
      codePlaceholder: 'Código de Acceso (ej: GVFC2026)',
      submit: 'Desbloquear Acceso',
      error: 'Código de acceso incorrecto. Introduce el Pase de Seguridad del Gil Vicente FC.',
      footer: '🔒 Acceso restringido a jugadoras, cuerpo técnico y equipo médico del Gil Vicente FC.',
    },
    wellness: {
      title: 'Cuestionario Wellness Pre-Entrenamiento',
      subtitle: 'Evalúa tu estado físico y mental antes de la sesión de entrenamiento',
      menstrualCycleTitle: 'Fase del Ciclo Menstrual',
      menstrualPhases: {
        menstruation: 'Menstruación',
        week1: '1ª Semana tras la menstruación',
        week2: '2ª Semana tras la menstruación',
        week3: '3ª Semana tras la menstruación',
        irregular: 'Menstruación irregular',
      },
      sleepQuality: 'Calidad del Sueño',
      sleepDuration: 'Duración del Sueño',
      mood: 'Estado de Ánimo / Humor',
      stress: 'Nivel de Estrés / Ansiedad',
      fatigue: 'Fatiga General',
      soreness: 'Molestias Musculares',
      heavyLegs: 'Sensación de Piernas Pesadas',
      descriptors1to5: {
        sleepQuality: ['1 - Muy Malo (Insomnio)', '2 - Deficiente / Escaso', '3 - Aceptable / Medio', '4 - Bueno / Reparador', '5 - Excelente / Restaurador'],
        sleepDuration: ['1 - Muy Insuficiente (< 5h)', '2 - Insuficiente (5h - 6h)', '3 - Aceptable (6h - 7h)', '4 - Bueno (7h - 8h)', '5 - Excelente (> 8h)'],
        mood: ['1 - Muy Irritada / Triste', '2 - Desanimada / Inquieta', '3 - Neutral / Aceptable', '4 - Bueno / Motivada', '5 - Excelente / Muy Motivada'],
        stress: ['1 - Estrés Extremo / Alta Ansiedad', '2 - Alto Estrés', '3 - Moderado', '4 - Poco Estrés', '5 - Nulo / Relajada'],
        fatigue: ['1 - Exhausta / Sin Energía', '2 - Muy Cansada', '3 - Moderada', '4 - Fresca / Energizada', '5 - Excelente / Plena Energía'],
        soreness: ['1 - Dolor Muy Intenso', '2 - Bastante Dolor', '3 - Molestia Moderada', '4 - Ligera Molestia', '5 - Sin Ningún Dolor'],
        heavyLegs: ['1 - Extremadamente Pesadas', '2 - Muy Pesadas', '3 - Moderadas', '4 - Ligeras', '5 - Piernas Muy Ligeras'],
      },
      scaleLegendTitle: 'Ver Descripción Completa de las Escalas (1 a 5)',
      muscleFatigueTitle: 'Localización de Fatiga / Molestia Muscular',
      muscleFatigueSubtitle: 'Haz clic en los grupos musculares donde sientas dolor o fatiga (1 = Mínimo a 10 = Máximo)',
      physioTitle: 'Derivación a Fisioterapia / Departamento Médico',
      physioQuestion: '¿Necesitas valoración o tratamiento con Fisioterapia hoy?',
      yes: 'SÍ',
      no: 'NO',
      physioReasonPlaceholder: 'Describe brevemente el motivo o la zona a tratar...',
      submit: 'Guardar Cuestionario Wellness',
      submitting: 'Guardando...',
      successMessage: '¡Cuestionario Wellness registrado con éxito!',
    },
    rpe: {
      title: 'Percepción Subjetiva del Esfuerzo (PSE / RPE)',
      subtitle: 'Registra la intensidad y la carga percibida de tu entrenamiento',
      borgTitle: 'Exigencia Física de la Sesión',
      borgDescriptors: {
        1: '1 - Muy Fácil (Esfuerzo Mínimo)',
        2: '2 - Fácil (Poca Exigencia)',
        3: '3 - Moderado (Carga Tolerable)',
        4: '4 - Algo Difícil (Exigente)',
        5: '5 - Difícil (Esfuerzo Intenso)',
        6: '6 - Difícil +',
        7: '7 - Muy Difícil (Exigencia Elevada)',
        8: '8 - Muy Difícil +',
        9: '9 - Extremadamente Difícil (Cerca del Límite)',
        10: '10 - Máximo (Límite Absoluto)',
      },
      postFatigueTitle: 'Nivel de Fatiga Tras el Entrenamiento',
      scaleFatigueLegendTitle: 'Ver Escala Completa de Fatiga (1 a 10)',
      fatigueDescriptors: {
        1: '1 - Ninguna Fatiga (Sensación Fresca)',
        2: '2 - Muy Ligera (Cansancio Mínimo)',
        3: '3 - Ligera (Cansancio Poco Significativo)',
        4: '4 - Moderada (Fatiga Perceptible)',
        5: '5 - Moderada + (Fatiga Clara)',
        6: '6 - Sustancial (Cansancio Elevado)',
        7: '7 - Elevada (Fatiga Fuerte)',
        8: '8 - Muy Elevada (Cansancio Muy Fuerte)',
        9: '9 - Severa / Cerca del Agotamiento',
        10: '10 - Agotamiento Total (Incapaz de Continuar)',
      },
      muscleFatigueTitle: 'Localización de Fatiga / Molestia Muscular',
      muscleFatigueSubtitle: 'Rellena únicamente los grupos musculares donde sientas dolor o molestia.',
      preWorkoutTitle: 'Trabajo Previo Realizado',
      preWorkoutOptions: {
        mobility: 'Movilidad',
        activation: 'Activación',
        core: 'Core / Estabilidad',
        prevention: 'Prevención de Lesiones',
      },
      commentsTitle: 'Comentarios / Observaciones de la Sesión',
      commentsPlaceholder: 'Notas adicionales sobre el entrenamiento...',
      submit: 'Guardar Registro RPE',
      submitting: 'Guardando...',
      successMessage: '¡Registro RPE enviado con éxito!',
    },
    hydration: {
      title: 'Panel de Hidratación Individual',
      newEntry: 'Nuevo Registro',
      close: 'Cerrar',
      gsheetsBadge: 'Integración con Google Sheets',
      gsheetsSub: 'Las jugadoras y el cuerpo técnico mantienen sincronizada la base de datos.',
      scriptBtnShow: 'Guía/Guión',
      scriptBtnHide: 'Ocultar',
      statusAdequate: 'Adecuada (< 1.0%)',
      statusCaution: 'Atención (1.0% - 2.0%)',
      statusAlert: 'ALERTA (> 2.0%)',
      dehydrationRate: 'Tasa de Deshidratación',
      refillNeeded: 'Reposición Obligatoria',
      weightLoss: 'Variación de Peso',
      actionRequired: 'Acción Inmediata Recomendada:',
      biologicalImpact: 'Impacto Biológico / Síntomas:',
      sessionDetails: 'Detalles de la Sesión',
      preWeight: 'Peso Pre-Entrenamiento (kg)',
      postWeight: 'Peso Post-Entrenamiento (kg)',
      fluidLoss: 'Variación Neta de Peso',
      fluidsIntake: 'Líquidos Ingeridos en Sesión (L)',
      duration: 'Duración del Entrenamiento (min)',
      history: 'Historial de Sesiones',
      calculateAndSave: 'Calcular y Guardar Estado Hídrico',
      step1Title: '1. Pesaje Pre-Entrenamiento (A la llegada)',
      step1Sub: 'Registra tu peso antes de comenzar a entrenar.',
      savePreWeight: 'Guardar Peso Pre-Entrenamiento',
      step2Title: '2. Pesaje Post-Entrenamiento (A la salida)',
      step2Sub: 'Registra tu peso y líquidos ingeridos al finalizar la sesión.',
      savePostWeight: 'Completar Pesaje Post-Entrenamiento',
      preWeightSaved: '¡Peso Pre-Entrenamiento guardado!',
      goodTraining: '¡Buen Entrenamiento!',
    },
    bodyChart: {
      anteriorView: 'Vista Anterior (Frente)',
      posteriorView: 'Vista Posterior (Espalda)',
      selectInstruction: 'Selecciona solo los grupos musculares donde sientas molestias o fatiga.',
      noFatigue: 'Sin dolor / fatiga seleccionada',
      muscles: {
        shoulders: 'Hombros / Pectorales',
        chest: 'Pecho',
        abs: 'Abdominales / Core',
        quads: 'Cuádriceps (Frente Muslo)',
        knees: 'Rodillas / Rótula',
        ankles: 'Tobillos / Pies',
        upperBack: 'Trapecios / Espalda Alta',
        glutes: 'Glúteos / Lumbar',
        hamstrings: 'Isquiotibiales (Atrás Muslo)',
        calves: 'Gemelos / Sóleos',
      },
    },
    admin: {
      title: 'Panel del Cuerpo Técnico',
      pinPrompt: 'Introduce el PIN del Staff',
      squadSummary: 'Resumen Diario de la Plantilla',
      physioReferrals: 'Fisioterapia y Casos Urgentes',
      roster: 'Gestión de Plantilla y Códigos PIN',
      pinMgmt: 'Códigos PIN',
      subTabs: {
        general: 'Visión General (Plantilla)',
        wellness: 'Cuestionario Wellness',
        rpe: 'RPE Post-Entrenamiento',
        hydration: 'Hidratación',
        weight: 'PESO',
      },
      fines: {
        tabFines: 'Multas y Cumplimiento',
        finesTitle: 'Informe de Cumplimiento y Multas',
        finesSub: 'Control de retrasos y cuestionarios no rellenados por jugadora.',
        fineUnit: '€/Falta',
        trainingDaysOnly: 'Solo Días de Entrenamiento/Partido',
        selectMonth: 'Seleccionar Mes',
        copyReport: 'Copiar Informe para WhatsApp',
        totalFines: 'Total de Multas',
        trainingDaysCount: 'Días de Entrenamiento/Partido',
        complianceRate: 'Tasa de Cumplimiento',
        topMissing: 'Jugadoras con Más Faltas',
        athlete: 'Jugadora',
        missingWellness: 'Faltas Wellness',
        missingRpe: 'Faltas RPE',
        missingHydration: 'Faltas Pesaje',
        totalFaults: 'Total Faltas',
        totalFine: 'Importe Multa',
        noFines: '¡Sin multas a aplicar!',
        reportCopied: '¡Informe copiado al portapapeles!',
      },
    },
  },
};
