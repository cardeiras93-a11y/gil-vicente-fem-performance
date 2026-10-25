import { MobilityPlan, AthletePlanAssignment } from './types';

// ==============================================================================
// PLANOS DE PREVENÇÃO & ANAMNESE • GIL VICENTE FC
// Estrutura Rigorosa em 2 Secções (Máximo 15 Minutos):
//   Secção 01: Mobilidade Articular & Descompressão (6 MIN)
//   Secção 02: Ativação Neuromuscular & Força Preventiva (8 MIN)
// Duração Total: 14 MINUTOS
// ==============================================================================

export const ANAMNESE_PREVENTION_PLANS: MobilityPlan[] = [
  {
    "id": "prev_joelho_lca_menisco",
    "titlePt": "Plano Preventivo: Joelho (LCA, Meniscos & Rótula)",
    "titleEn": "Preventive Plan: Knee (ACL, Meniscus & Patellar Stability)",
    "categoryPt": "Clínico • Prevenção Joelho (2 Secções • 14 Min)",
    "categoryEn": "Clinical • Knee Prevention (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "🦵 Joelho • LCA & Meniscos",
    "groupBadgeEn": "🦵 Knee • ACL & Meniscus",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • DEPARTAMENTO DE PERFORMANCE & SAÚDE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • PERFORMANCE & HEALTH DEPARTMENT",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular tibiofemoral e ativação sinovial prévia sem impacto.",
    "warmupEn": "Tibiofemoral decompression and synovial activation without impact.",
    "finisherPt": "Massagem manual peri-rotuliana suave e retorno à calma.",
    "finisherEn": "Gentle peri-patellar massage and calm recovery.",
    "blocks": [
      {
        "id": "prev_joelho_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "pj_mob_1",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "pj_mob_2",
            "namePt": "1.2 Rotações Interna & Externa da Tíbia Sentada",
            "nameEn": "1.2 Seated Tibial Internal/External Rotations",
            "seriesRepsPt": "2x 8 reps / perna",
            "seriesRepsEn": "2x 8 reps / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco a 90°. Isola a rotação axial da tíbia sobre o fémur sem mover o joelho ou anca. Restaura o mecanismo de 'screw-home' fundamental para a integridade do LCA.",
            "descriptionEn": "Seated at 90°. Isolate pure axial rotation of tibia without hip sway. Restores normal screw-home knee locking mechanism.",
            "imageSrc": "/exercises/tibial_rotation_pro.svg"
          }
        ]
      },
      {
        "id": "prev_joelho_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "pj_str_1",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos (Isometria contínua)",
            "seriesRepsEn": "3x 35-40 seconds (Continuous hold)",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "pj_str_2",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s no bloqueio)",
            "seriesRepsEn": "3x 12 reps / leg (2s peak hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "pj_str_3",
            "namePt": "2.3 Split Squat Hip-Dominant (Anti-Valgo com Banda)",
            "nameEn": "2.3 Hip-Dominant Split Squat w/ Knee Band",
            "seriesRepsPt": "2x 8 reps / perna (Descida lenta 3s)",
            "seriesRepsEn": "2x 8 reps / leg (3s slow descent)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Passada estável com inclinação anterior do tronco a 45°. Foco na dominância glútea e alinhamento rígido joelho-segundo dedo do pé, eliminando qualquer colapso em valgo dinâmico.",
            "descriptionEn": "Staggered stance with 45° forward torso hinge. Heavy glute recruitment and strict knee tracking over 2nd toe, eradicating dynamic valgus collapse.",
            "imageSrc": "/exercises/split_squat_hip_dominant_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "prev_tornozelo_sindesmose_peroneais",
    "titlePt": "Plano Preventivo: Tornozelo (Entorses, Peroneais & Sindesmose)",
    "titleEn": "Preventive Plan: Ankle (Sprains, Peroneals & Syndesmosis)",
    "categoryPt": "Clínico • Prevenção Tornozelo (2 Secções • 14 Min)",
    "categoryEn": "Clinical • Ankle Prevention (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "🦶 Tornozelo • Sindesmose & Ligamentos",
    "groupBadgeEn": "🦶 Ankle • Syndesmosis & Ligaments",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • DEPARTAMENTO DE PERFORMANCE & SAÚDE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • PERFORMANCE & HEALTH DEPARTMENT",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular do retropé e astrágalo.",
    "warmupEn": "Rearfoot and talus joint decompression.",
    "finisherPt": "Libertação miofascial plantar e retorno à calma.",
    "finisherEn": "Plantar fascia release and calm recovery.",
    "blocks": [
      {
        "id": "prev_tornozelo_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "pt_mob_1",
            "namePt": "1.1 Tração Articular Anterior de Tornozelo com Banda (Deslize do Astrágalo)",
            "nameEn": "1.1 Banded Ankle Joint Traction (Talus Posterior Glide)",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Banda forte colocada no colo do pé (astrágalo). Puxa para trás enquanto o joelho avança, libertando o impacto anterior comum após entorses e fraturas.",
            "descriptionEn": "Strong band placed over talar dome pulling posterior while knee drives forward. Unlocks restricted ankle joint and prevents anterior impingement.",
            "imageSrc": "/exercises/ankle_traction_pro.svg"
          },
          {
            "id": "pt_mob_2",
            "namePt": "1.2 Rotações Circulares Ativas de Tornozelo (Ankle CARs Controladas)",
            "nameEn": "1.2 Controlled Articular Rotations (Ankle CARs)",
            "seriesRepsPt": "2x 6 círculos lentos / sentido",
            "seriesRepsEn": "2x 6 slow circles / direction",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Joelho estabilizado com as mãos. Desenha o maior círculo possível com a ponta do pé sem rodar a tíbia. Explora dorsiflexão, inversão, flexão plantar e eversão máxima.",
            "descriptionEn": "Knee stabilized with arms. Draw maximal controlled circle with foot exploring full articular margins without tibial rotation.",
            "imageSrc": "/exercises/ankle_cars_pro.svg"
          }
        ]
      },
      {
        "id": "prev_tornozelo_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "pt_str_1",
            "namePt": "2.1 Eversão Resistida com Banda (Reforço dos Peroneais Longo e Curto)",
            "nameEn": "2.1 Banded Resisted Ankle Eversion (Peroneal Strengthening)",
            "seriesRepsPt": "3x 12-15 reps / pé (Pausa 2s no pico)",
            "seriesRepsEn": "3x 12-15 reps / foot (2s peak hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada lateralmente. Roda a planta do pé para fora contra a resistência elástica. Ativação dos estabilizadores dinâmicos contra a entorse em inversão.",
            "descriptionEn": "Band anchored medially. Push lateral border of foot outward against band with 2s squeeze. Primary defense against inversion sprains.",
            "imageSrc": "/exercises/ankle_eversion_pro.svg"
          },
          {
            "id": "pt_str_2",
            "namePt": "2.2 Ativação da Abóbada Plantar & Short-Foot Isométrico",
            "nameEn": "2.2 Plantar Arch Activation & Short-Foot Isometric",
            "seriesRepsPt": "3x 25 segundos / pé",
            "seriesRepsEn": "3x 25 seconds / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Pé descalço apoiado no solo (tripé: calcanhar, base do 1º e 5º metatarso). Encurta o pé puxando o metatarso em direção ao calcanhar sem dobrar os dedos. Ergue o arco plantar.",
            "descriptionEn": "Barefoot tripod contact. Shorten foot pulling metatarsal heads towards heel without curling toes, elevating medial longitudinal arch.",
            "imageSrc": "/exercises/ankle_shortfoot_pro.svg"
          },
          {
            "id": "pt_str_3",
            "namePt": "2.3 Pogo Hops Reativos no Solo (Rigidez da Sindesmose & Aquiles)",
            "nameEn": "2.3 Reactive Pogo Hops (Syndesmosis & Achilles Stiffness)",
            "seriesRepsPt": "3x 15 saltos elásticos rápidos",
            "seriesRepsEn": "3x 15 quick elastic hops",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Saltos curtos e reativos apoiando no terço anterior do pé sem deixar os calcanhares tocarem no solo. Joelhos quase esticados para gerar rigidez elástica pura.",
            "descriptionEn": "Fast, stiff vertical pogo hops on forefoot with minimal knee bend. Trains tendon stiffness and reactive stabilization of syndesmosis.",
            "imageSrc": "/exercises/pogo_hops_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "prev_isquios_quads_excentrico",
    "titlePt": "Plano Preventivo: Isquiotibiais & Cadeia Posterior (Excêntrico & Força)",
    "titleEn": "Preventive Plan: Hamstrings & Posterior Chain (Eccentric & Strength)",
    "categoryPt": "Clínico • Prevenção Isquiotibiais (2 Secções • 14 Min)",
    "categoryEn": "Clinical • Hamstring Prevention (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "⚡ Isquios & Glúteos • Excêntrico",
    "groupBadgeEn": "⚡ Hamstrings & Glutes • Eccentric",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • DEPARTAMENTO DE PERFORMANCE & SAÚDE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • PERFORMANCE & HEALTH DEPARTMENT",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão fascial e neural da cadeia posterior.",
    "warmupEn": "Posterior chain fascial and neural release.",
    "finisherPt": "Alongamento passivo ligeiro em descarga e relaxamento.",
    "finisherEn": "Light unloaded hamstring flow and relaxation.",
    "blocks": [
      {
        "id": "prev_isquios_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "pi_mob_1",
            "namePt": "1.1 Slump Floss Neural Dinâmico Sentada (Descompressão do Nervo Ciático)",
            "nameEn": "1.1 Seated Dynamic Neural Slump Floss (Sciatic Nerve Flossing)",
            "seriesRepsPt": "2x 8 ciclos / perna",
            "seriesRepsEn": "2x 8 cycles / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco com coluna curvada em slump. À medida que estende o joelho flete a cabeça para trás; ao fletir o joelho encosta o queixo ao peito. Desliza o tecido neural sem estiramento agressivo.",
            "descriptionEn": "Seated slump position. Alternate knee extension with head extension, and knee flexion with chin-to-chest. Restores neural mobility without strain.",
            "imageSrc": "/exercises/hamstring_floss_neural_pro.svg"
          },
          {
            "id": "pi_mob_2",
            "namePt": "1.2 Alongamento Dinâmico em Decúbito com Banda (Hamstring Band Flow)",
            "nameEn": "1.2 Supine Dynamic Hamstring Flow w/ Band",
            "seriesRepsPt": "2x 30s / perna (Movimento contínuo)",
            "seriesRepsEn": "2x 30s / leg (Continuous flow)",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com banda elástica presa no pé. Eleva a perna esticada até ao limite confortável e desce controlada, bombeando flexão dorsal do tornozelo no topo.",
            "descriptionEn": "Supine holding elastic band on midfoot. Rhythmically raise straight leg to end range and lower smoothly with active dorsiflexion.",
            "imageSrc": "/exercises/supine_hamstring_band_pro.svg"
          }
        ]
      },
      {
        "id": "prev_isquios_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "pi_str_1",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Isometric Peak Hold",
            "seriesRepsPt": "3x 8-10 reps (Pausa 3s no topo)",
            "seriesRepsEn": "3x 8-10 reps (3s peak hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          },
          {
            "id": "pi_str_2",
            "namePt": "2.2 Nordic Hamstring Curl Excêntrico Assistido com Banda",
            "nameEn": "2.2 Band-Assisted Eccentric Nordic Hamstring Curl",
            "seriesRepsPt": "3x 6 reps (Descida em 4-5 segundos)",
            "seriesRepsEn": "3x 6 reps (4-5s slow descent)",
            "restPt": "45s",
            "restEn": "45s",
            "descriptionPt": "Ajoelhada com tornozelos presos e banda de suporte no peito ancorada atrás. Inclina o corpo para a frente mantendo linha reta joelho-anca-ombro. O padrão de ouro contra roturas em sprint.",
            "descriptionEn": "Kneeling with fixed ankles and band assistance on chest. Fall forward maintaining straight hip line. The global gold-standard against sprint tears.",
            "imageSrc": "/exercises/assisted_nordic_curl_band_pro.svg"
          },
          {
            "id": "pi_str_3",
            "namePt": "2.3 Flexão Prone de Isquiotibiais Unipodal com Banda Elástica",
            "nameEn": "2.3 Single-Leg Prone Banded Hamstring Curl",
            "seriesRepsPt": "2x 10 reps / perna (Controlo excêntrico)",
            "seriesRepsEn": "2x 10 reps / leg (Controlled return)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Deitada de barriga para baixo com banda elástica presa ao calcanhar e ancorada à frente. Flete o joelho trazendo o calcanhar ao glúteo, corrigindo assimetrias bilaterais.",
            "descriptionEn": "Prone lying with elastic band looped around heel. Curl heel towards glutes with 2s peak squeeze, balancing single-leg strength deficits.",
            "imageSrc": "/exercises/prone_leg_curl_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "prev_rotuliano_patelar_bipartida",
    "titlePt": "Plano Preventivo: Tendão Rotuliano & Rótula Bipartida (Analgesia & VMO)",
    "titleEn": "Preventive Plan: Patellar Tendon & Bipartite Patella (Analgesia & VMO)",
    "categoryPt": "Clínico • Prevenção Rotuliana (2 Secções • 14 Min)",
    "categoryEn": "Clinical • Patellar Prevention (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "🩺 Rótula & Tendão Rotuliano",
    "groupBadgeEn": "🩺 Patella & Patellar Tendon",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • DEPARTAMENTO DE PERFORMANCE & SAÚDE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • PERFORMANCE & HEALTH DEPARTMENT",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Mobilização passiva e suave da patela em descarga completa.",
    "warmupEn": "Passive gentle patellar mobilization in complete unloading.",
    "finisherPt": "Descarga em decúbito com pernas elevadas.",
    "finisherEn": "Legs elevated rest and tendon recovery.",
    "blocks": [
      {
        "id": "prev_rot_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "pr_mob_1",
            "namePt": "1.1 Mobilização Manual da Rótula Superior & Inferior",
            "nameEn": "1.1 Manual Superior/Inferior Patellar Glides",
            "seriesRepsPt": "2x 30 segundos / joelho",
            "seriesRepsEn": "2x 30 seconds / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada com a perna totalmente relaxada no solo. Com os polegares e indicadores, desliza a rótula suavemente para cima, para baixo e lateralmente sem dor para libertar a cápsula.",
            "descriptionEn": "Seated with leg fully relaxed. Gently glide patella superiorly, inferiorly and medially with thumbs to release patellofemoral pressure.",
            "imageSrc": "/exercises/patellar_mobilization_pro.svg"
          },
          {
            "id": "pr_mob_2",
            "namePt": "1.2 Alongamento de Sóleo na Parede com Joelho Fletido",
            "nameEn": "1.2 Wall Soleus Stretch w/ Bent Knee",
            "seriesRepsPt": "2x 30 segundos / perna",
            "seriesRepsEn": "2x 30 seconds / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Perna traseira com joelho fletido e calcanhar colado ao solo na parede. Reduz a tração descendente do tendão de Aquiles que afeta a mecânica fémoro-rotuliana.",
            "descriptionEn": "Back leg bent at knee with heel glued to floor. Stretches soleus, preventing restricted dorsiflexion from overloading patellar tendon.",
            "imageSrc": "/exercises/soleus_wall_stretch_pro.svg"
          }
        ]
      },
      {
        "id": "prev_rot_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "pr_str_1",
            "namePt": "2.1 Wall-Sit Isométrico a 90° com Aperto de Bola (Analgesia Patelar)",
            "nameEn": "2.1 90° Isometric Wall-Sit w/ Ball Squeeze (Patellar Analgesia)",
            "seriesRepsPt": "3x 35-45 segundos contínuos",
            "seriesRepsEn": "3x 35-45 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Costas coladas à parede, coxas paralelas ao solo (90°). Aperta uma bola de borracha entre os joelhos para recrutar adutores e vasto medial, descarregando a rótula bipartida.",
            "descriptionEn": "Back on wall, thighs at 90°. Squeeze ball between knees during isometric hold. Induces neurological analgesia and stabilizes patella.",
            "imageSrc": "/exercises/wall_sit_isometric_ball_pro.svg"
          },
          {
            "id": "pr_str_2",
            "namePt": "2.2 Poliquin Step-Up com Calcanhar Elevado em Bloco",
            "nameEn": "2.2 Heel-Elevated Poliquin Step-Up",
            "seriesRepsPt": "3x 8-10 reps / perna (Descida lenta)",
            "seriesRepsEn": "3x 8-10 reps / leg (Controlled drop)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "No bordo de um pequeno degrau com cunha no calcanhar. Desce a perna livre tocando apenas com o calcanhar no solo enquanto o joelho da frente avança em linha com o pé.",
            "descriptionEn": "On low wedge with elevated heel. Lower opposite heel to gently touch floor while driving active knee forward, firing pure VMO fibers.",
            "imageSrc": "/exercises/poliquin_step_up_pro.svg"
          },
          {
            "id": "pr_str_3",
            "namePt": "2.3 Terminal Knee Extension (TKE) com Foco no Vasto Medial",
            "nameEn": "2.3 Terminal Knee Extension (TKE) w/ Heavy Band",
            "seriesRepsPt": "3x 12 reps / perna (Bloqueio 2s no topo)",
            "seriesRepsEn": "3x 12 reps / leg (2s lockout hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada à frente logo acima da linha articular. Estende totalmente o joelho contra a banda, contraindo com força máxima o VMO nos últimos 15° de extensão.",
            "descriptionEn": "Band anchored in front. Lock out knee forcefully against elastic tension in terminal 15 degrees, reinforcing patellar central track.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "prev_adutores_virilha_copenhagen",
    "titlePt": "Plano Preventivo: Adutores & Púbis (Groin / Sínfise Púbica & Bacia)",
    "titleEn": "Preventive Plan: Adductors & Pubis (Groin & Pelvic Stability)",
    "categoryPt": "Clínico • Prevenção Adutores (2 Secções • 14 Min)",
    "categoryEn": "Clinical • Adductor Prevention (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "🛡️ Adutores • Virilha & Púbis",
    "groupBadgeEn": "🛡️ Adductors • Groin & Pubis",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • DEPARTAMENTO DE PERFORMANCE & SAÚDE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • PERFORMANCE & HEALTH DEPARTMENT",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Mobilidade dinâmica da cápsula articular da anca.",
    "warmupEn": "Dynamic hip capsule mobility.",
    "finisherPt": "Libertação em decúbito dorsal e respiração diafragmática.",
    "finisherEn": "Supine adductor relaxation and deep breathing.",
    "blocks": [
      {
        "id": "prev_adutores_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "pa_mob_1",
            "namePt": "1.1 Mobilidade Adutora em Balanço Quádrupe (Adductor Rocking)",
            "nameEn": "1.1 Quadruped Dynamic Adductor Rocking",
            "seriesRepsPt": "2x 8 reps / perna",
            "seriesRepsEn": "2x 8 reps / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Em 4 apoios com uma perna estendida lateralmente e pé colado ao solo. Balança a bacia para trás em direção ao calcanhar, libertando a fáscia dos adutores magno e longo.",
            "descriptionEn": "Quadruped with one leg extended laterally with flat foot. Rock hips back towards heel to dynamically open adductor canal.",
            "imageSrc": "/exercises/adductor_rocking_pro.svg"
          },
          {
            "id": "pa_mob_2",
            "namePt": "1.2 Alongamento Rã Ativo com Rotação Interna de Anca (Frog Flow)",
            "nameEn": "1.2 Active Frog Stretch w/ Internal Hip Rotations",
            "seriesRepsPt": "2x 8 respirações profundas",
            "seriesRepsEn": "2x 8 deep breaths",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Joelhos bem afastados no colchonete com ancas a 90°. Balança suavemente a bacia abrindo a cápsula articular medial da anca e aliviando a sínfise púbica.",
            "descriptionEn": "Knees wide on mat at 90° angle. Smoothly rock hips forward and back opening medial hip capsule and relieving pubic symphysis.",
            "imageSrc": "/exercises/frog_stretch_pro.svg"
          }
        ]
      },
      {
        "id": "prev_adutores_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "pa_str_1",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20 segundos / lado",
            "seriesRepsEn": "3x 15-20 seconds / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          },
          {
            "id": "pa_str_2",
            "namePt": "2.2 Copenhagen Dinâmico com Elevação da Perna Suspensa",
            "nameEn": "2.2 Dynamic Copenhagen Adduction Lift",
            "seriesRepsPt": "3x 8 reps / lado",
            "seriesRepsEn": "3x 8 reps / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Na posição de Copenhagen, sobe e desce a perna inferior tocando levemente no banco de baixo. Força concêntrica e excêntrica para remate e passe de futebol.",
            "descriptionEn": "From Copenhagen position, raise bottom leg up to meet bench and lower smoothly. Dynamic kicking power and pubic groin shielding.",
            "imageSrc": "/exercises/copenhagen_adduction_dynamic_pro.svg"
          },
          {
            "id": "pa_str_3",
            "namePt": "2.3 Adução Isométrica em Decúbito Lateral",
            "nameEn": "2.3 Side-Lying Isometric Adductor Hold",
            "seriesRepsPt": "2x 20 segundos / lado",
            "seriesRepsEn": "2x 20 seconds / side",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Deitada de lado com a perna superior cruzada à frente. Eleva a perna de baixo estendida contra a gravidade sustentando a contração no adutor longo.",
            "descriptionEn": "Side lying with top leg crossed forward. Elevate bottom straight leg against gravity holding peak adductor tension.",
            "imageSrc": "/exercises/side_lying_hip_adduction_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "prev_ombro_cotovelo_cervical",
    "titlePt": "Plano Preventivo: Membro Superior (Ombro, Cotovelo & Cervical)",
    "titleEn": "Preventive Plan: Upper Body (Shoulder, Elbow & Cervical)",
    "categoryPt": "Clínico • Prevenção Membro Superior (2 Secções • 14 Min)",
    "categoryEn": "Clinical • Upper Body Prevention (2 Sections • 14 Min)",
    "group": "superiores",
    "groupBadgePt": "🧗 Ombro, Cotovelo & Coluna",
    "groupBadgeEn": "🧗 Shoulder, Elbow & Spine",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • DEPARTAMENTO DE PERFORMANCE & SAÚDE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • PERFORMANCE & HEALTH DEPARTMENT",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Mobilidade escapular e torácica sem carga.",
    "warmupEn": "Scapular and thoracic unloaded mobility.",
    "finisherPt": "Alongamento peitoral em porta/parede e descompressão cervical.",
    "finisherEn": "Doorway pectoral stretch and cervical decompression.",
    "blocks": [
      {
        "id": "prev_ombro_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "po_mob_1",
            "namePt": "1.1 Rotação Torácica & Alcance Superior em Meio-Ajoelhado com Banda",
            "nameEn": "1.1 Half-Kneeling Banded Thoracic Rotation & High Reach",
            "seriesRepsPt": "2x 8 reps / lado",
            "seriesRepsEn": "2x 8 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Meio-ajoelhada segurando banda ancorada. Roda o tronco para o lado da perna dianteira estendendo o braço ao teto com descompressão torácica e escapular.",
            "descriptionEn": "Half-kneeling holding anchored band. Rotate ribcage opening chest and reaching straight to ceiling to restore thoracic mobility.",
            "imageSrc": "/exercises/half_kneeling_band_thoracic_reach_pro.svg"
          },
          {
            "id": "po_mob_2",
            "namePt": "1.2 Passagens de Ombros e Peitoral com Banda (Dislocates Fluídos)",
            "nameEn": "1.2 Band Shoulder Dislocates & Chest Opening",
            "seriesRepsPt": "2x 10 reps fluídas",
            "seriesRepsEn": "2x 10 fluid reps",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "De pé com pegada larga na banda elástica e braços estendidos. Passa a banda por cima da cabeça até às costas sem arquear a lombar, abrindo a cápsula glenoumeral.",
            "descriptionEn": "Standing holding elastic band with wide grip. Pass band overhead and behind back without lumbar hyperextension.",
            "imageSrc": "/exercises/shoulder_dislocates_band_pro.svg"
          }
        ]
      },
      {
        "id": "prev_ombro_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "po_str_1",
            "namePt": "2.1 Wall Slides com Mini-Banda nos Pulsos (W para Y com Ativação Serratus)",
            "nameEn": "2.1 Wall Slides w/ Wrist Miniband (W-to-Y Scapular Activation)",
            "seriesRepsPt": "3x 8-10 reps (Pausa 2s no topo)",
            "seriesRepsEn": "3x 8-10 reps (2s top reach hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Antebraços encostados à parede em 'W' com mini-banda tensa entre os pulsos. Desliza os braços para cima até formar um 'Y', empurrando ativamente a parede para ativar o serrátil anterior.",
            "descriptionEn": "Forearms on wall in 'W' with miniband tension. Slide up into 'Y' pushing against wall to activate serratus and lower traps.",
            "imageSrc": "/exercises/wall_slide_w_to_y_miniband_pro.svg"
          },
          {
            "id": "po_str_2",
            "namePt": "2.2 Prancha Alta com Toque nos Ombros e Mini-Banda",
            "nameEn": "2.2 High Plank Shoulder Taps w/ Miniband",
            "seriesRepsPt": "3x 8 toques / lado (Bacia imóvel)",
            "seriesRepsEn": "3x 8 taps / side (Locked hips)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Em prancha alta com mini-banda nos pulsos e pés afastados. Toca no ombro oposto sem rodar a bacia ou colapsar o cotovelo de apoio. Proteção para quedas e choques.",
            "descriptionEn": "High plank with wrist band and wide feet. Touch opposite shoulder with minimal hip rotation, building solid fall resilience.",
            "imageSrc": "/exercises/plank_shoulder_tap_band_pro.svg"
          },
          {
            "id": "po_str_3",
            "namePt": "2.3 Pássaro-Cão com Banda Cruzada & Estabilidade Cervico-Torácica",
            "nameEn": "2.3 Banded Cross-Body Bird-Dog & Cervical Stability",
            "seriesRepsPt": "2x 8 reps / lado",
            "seriesRepsEn": "2x 8 reps / side",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Em 4 apoios com banda presa entre mão e pé opostos. Estende simultaneamente sem oscilação da coluna, mantendo olhar no solo e pescoço alinhado.",
            "descriptionEn": "Quadruped with band looped across opposite hand and foot. Extend horizontally maintaining neutral cervical spine and rock-solid core.",
            "imageSrc": "/exercises/banded_bird_dog_core_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "prev_core_anti_rotacao_extensao",
    "titlePt": "Plano Preventivo: Core & Complexo Lombo-Pélvico (Anti-Rotação & Pélvis)",
    "titleEn": "Preventive Plan: Core & Lumbo-Pelvic Stability (Anti-Rotation & Pelvis)",
    "categoryPt": "Clínico • Prevenção Core & Pélvis (2 Secções • 14 Min)",
    "categoryEn": "Clinical • Core & Pelvic Prevention (2 Sections • 14 Min)",
    "group": "superiores",
    "groupBadgePt": "🎯 Core & Pélvis • Estabilidade",
    "groupBadgeEn": "🎯 Core & Pelvis • Stability",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • DEPARTAMENTO DE PERFORMANCE & SAÚDE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • PERFORMANCE & HEALTH DEPARTMENT",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Mobilidade vertebral e respiração 360° em decúbito.",
    "warmupEn": "Vertebral mobility and 360° diaphragmatic breathing.",
    "finisherPt": "Descompressão em posição de criança e retorno à calma.",
    "finisherEn": "Child's pose decompression and calm recovery.",
    "blocks": [
      {
        "id": "prev_core_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "pc_mob_1",
            "namePt": "1.1 Torção Vertebral em Decúbito Dorsal (Supine Spinal Twist)",
            "nameEn": "1.1 Supine Spinal Twist Flow",
            "seriesRepsPt": "2x 30s / lado",
            "seriesRepsEn": "2x 30s / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com braços em cruz. Roda os joelhos fletidos para um lado mantendo os ombros colados ao chão, desanuviando a coluna lombar e sacroilíaca.",
            "descriptionEn": "Supine with arms in 'T'. Drop bent knees to side while keeping shoulder blades glued to mat, releasing lumbar spinal compression.",
            "imageSrc": "/exercises/supine_spinal_twist_pro.svg"
          },
          {
            "id": "pc_mob_2",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          }
        ]
      },
      {
        "id": "prev_core_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "pc_str_1",
            "namePt": "2.1 Pallof Press Isométrico com Rotação Controlada do Tronco",
            "nameEn": "2.1 Isometric Pallof Press w/ Controlled Torso Rotation",
            "seriesRepsPt": "3x 8-10 reps / lado (Pausa 2s)",
            "seriesRepsEn": "3x 8-10 reps / side (2s pause)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "De pé com banda ancorada lateralmente na altura do peito. Empurra a banda à frente e resiste à força de rotação. Roda 15° de tronco mantendo bacia totalmente imóvel.",
            "descriptionEn": "Standing with chest-high anchored band. Press band forward resisting lateral pull, performing micro 15° rotations with locked hips.",
            "imageSrc": "/exercises/pallof_press_band_rotation_pro.svg"
          },
          {
            "id": "pc_str_2",
            "namePt": "2.2 Dead-Bug com Mini-Banda nos Pés (Anti-Extensão Lombar)",
            "nameEn": "2.2 Dead-Bug w/ Foot Miniband (Anti-Extension Core)",
            "seriesRepsPt": "3x 8 reps / lado",
            "seriesRepsEn": "3x 8 reps / side",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Deitada de costas com mini-banda nos pés e braços verticais. Estende perna e braço opostos mantendo a lombar colada ao solo, eliminando hiperlordose compensatória.",
            "descriptionEn": "Supine with miniband around feet. Extend opposite arm and leg while pressing lumbar spine firmly into floor against extension.",
            "imageSrc": "/exercises/deadbug_miniband_pro.svg"
          },
          {
            "id": "pc_str_3",
            "namePt": "2.3 Pássaro-Cão com Banda Cruzada & Estabilidade Diagonal",
            "nameEn": "2.3 Cross-Body Banded Bird-Dog Diagonal Hold",
            "seriesRepsPt": "2x 8 reps / lado",
            "seriesRepsEn": "2x 8 reps / side",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Em 4 apoios com banda cruzada mão-pé opostos. Estende mantendo pelve rigorosamente nivelada com o solo. Fortalece oblíquos internos e multífidos.",
            "descriptionEn": "Quadruped with cross band. Extend horizontally maintaining level pelvis. Builds deep spinal multifidi and oblique sling strength.",
            "imageSrc": "/exercises/banded_bird_dog_core_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-1_carlota",
    "titlePt": "Plano Individual: CARLOTA (Cirurgias Bilaterais LCA + Meniscos)",
    "titleEn": "Individual Plan: CARLOTA (Cirurgias Bilaterais LCA + Meniscos)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 CARLOTA • 14 MIN",
    "groupBadgeEn": "👤 CARLOTA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-1_carlota_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_kg",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "ex_tr",
            "namePt": "1.2 Rotação Interna & Externa da Tíbia Sentada",
            "nameEn": "1.2 Seated Tibial Internal/External Rotations",
            "seriesRepsPt": "2x 8 reps / perna",
            "seriesRepsEn": "2x 8 reps / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco a 90°. Isola a rotação axial da tíbia sobre o fémur sem mover o joelho ou anca. Restaura o mecanismo de 'screw-home' fundamental para a integridade do LCA.",
            "descriptionEn": "Seated at 90°. Isolate pure axial rotation of tibia without hip sway. Restores normal screw-home knee locking mechanism.",
            "imageSrc": "/exercises/tibial_rotation_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-1_carlota_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "ex_sq",
            "namePt": "2.3 Split Squat Hip-Dominant (Anti-Valgo com Banda)",
            "nameEn": "2.3 Hip-Dominant Split Squat w/ Knee Band",
            "seriesRepsPt": "2x 8 reps / perna (Descida lenta 3s)",
            "seriesRepsEn": "2x 8 reps / leg (3s slow descent)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Passada estável com inclinação anterior do tronco a 45°. Foco na dominância glútea e alinhamento rígido joelho-segundo dedo do pé, eliminando qualquer colapso em valgo dinâmico.",
            "descriptionEn": "Staggered stance with 45° forward torso hinge. Heavy glute recruitment and strict knee tracking over 2nd toe, eradicating dynamic valgus collapse.",
            "imageSrc": "/exercises/split_squat_hip_dominant_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-3_cartaxo",
    "titlePt": "Plano Individual: CARTAXO (Pancadas Joelho + Força Superior)",
    "titleEn": "Individual Plan: CARTAXO (Pancadas Joelho + Força Superior)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 CARTAXO • 14 MIN",
    "groupBadgeEn": "👤 CARTAXO • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-3_cartaxo_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_pm",
            "namePt": "1.1 Mobilização Manual da Rótula Superior & Inferior",
            "nameEn": "1.1 Manual Superior/Inferior Patellar Glides",
            "seriesRepsPt": "2x 30s / joelho",
            "seriesRepsEn": "2x 30s / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada com a perna totalmente relaxada no solo. Com os polegares e indicadores, desliza a rótula suavemente para cima, para baixo e lateralmente sem dor para libertar a cápsula.",
            "descriptionEn": "Seated with leg fully relaxed. Gently glide patella superiorly, inferiorly and medially with thumbs to release patellofemoral pressure.",
            "imageSrc": "/exercises/patellar_mobilization_pro.svg"
          },
          {
            "id": "ex_disl",
            "namePt": "1.2 Passagens de Ombros e Peitoral com Banda (Dislocates Fluídos)",
            "nameEn": "1.2 Band Shoulder Dislocates & Chest Opening",
            "seriesRepsPt": "2x 10 reps",
            "seriesRepsEn": "2x 10 reps",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "De pé com pegada larga na banda elástica e braços estendidos. Passa a banda por cima da cabeça até às costas sem arquear a lombar, abrindo a cápsula glenoumeral.",
            "descriptionEn": "Standing holding elastic band with wide grip. Pass band overhead and behind back without lumbar hyperextension.",
            "imageSrc": "/exercises/shoulder_dislocates_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-3_cartaxo_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_wsb",
            "namePt": "2.1 Wall-Sit Isométrico a 90° com Aperto de Bola (Analgesia Patelar)",
            "nameEn": "2.1 90° Isometric Wall-Sit w/ Ball Squeeze (Patellar Analgesia)",
            "seriesRepsPt": "3x 35 segundos contínuos",
            "seriesRepsEn": "3x 35 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Costas coladas à parede, coxas paralelas ao solo (90°). Aperta uma bola de borracha entre os joelhos para recrutar adutores e vasto medial, descarregando a rótula bipartida.",
            "descriptionEn": "Back on wall, thighs at 90°. Squeeze ball between knees during isometric hold. Induces neurological analgesia and stabilizes patella.",
            "imageSrc": "/exercises/wall_sit_isometric_ball_pro.svg"
          },
          {
            "id": "ex_ws",
            "namePt": "2.1 Wall Slides com Mini-Banda nos Pulsos (W para Y)",
            "nameEn": "2.1 Wall Slides w/ Wrist Miniband (W-to-Y)",
            "seriesRepsPt": "3x 8 reps (Pausa 2s no topo)",
            "seriesRepsEn": "3x 8 reps (2s top hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Antebraços encostados à parede em 'W' com mini-banda tensa entre os pulsos. Desliza os braços para cima até formar um 'Y', empurrando ativamente a parede para ativar o serrátil anterior.",
            "descriptionEn": "Forearms on wall in 'W' with miniband tension. Slide up into 'Y' pushing against wall to activate serratus and lower traps.",
            "imageSrc": "/exercises/wall_slide_w_to_y_miniband_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-4_eva",
    "titlePt": "Plano Individual: EVA (Prevenção Geral & Potência Pélvica)",
    "titleEn": "Individual Plan: EVA (Prevenção Geral & Potência Pélvica)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 EVA • 14 MIN",
    "groupBadgeEn": "👤 EVA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-4_eva_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          },
          {
            "id": "ex_shb",
            "namePt": "1.2 Alongamento Dinâmico em Decúbito com Banda",
            "nameEn": "1.2 Supine Dynamic Hamstring Flow w/ Band",
            "seriesRepsPt": "2x 30s / perna",
            "seriesRepsEn": "2x 30s / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com banda elástica presa no pé. Eleva a perna esticada até ao limite confortável e desce controlada, bombeando flexão dorsal do tornozelo no topo.",
            "descriptionEn": "Supine holding elastic band on midfoot. Rhythmically raise straight leg to end range and lower smoothly with active dorsiflexion.",
            "imageSrc": "/exercises/supine_hamstring_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-4_eva_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_cp",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20s / lado",
            "seriesRepsEn": "3x 15-20s / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          },
          {
            "id": "ex_mw",
            "namePt": "2.3 Monster Walk com Mini-Banda nos Joelhos",
            "nameEn": "2.3 Monster Walk w/ Miniband around Knees",
            "seriesRepsPt": "2x 10 passos / direção",
            "seriesRepsEn": "2x 10 steps / direction",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Em posição atlética de semi-agachamento com mini-banda logo acima dos joelhos. Passos diagonais curtos mantendo joelhos e pés alinhados, ativando glúteo médio e rotadores externos.",
            "descriptionEn": "Athletic semi-squat stance with miniband above knees. Short diagonal steps keeping knees pressed wide, firing gluteus medius.",
            "imageSrc": "/exercises/monster_walk_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-5_faith",
    "titlePt": "Plano Individual: FAITH (Reparação Meniscal Joelho Direito)",
    "titleEn": "Individual Plan: FAITH (Reparação Meniscal Joelho Direito)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 FAITH • 14 MIN",
    "groupBadgeEn": "👤 FAITH • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-5_faith_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_kg",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-5_faith_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_cp",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20s / lado",
            "seriesRepsEn": "3x 15-20s / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-6_lara",
    "titlePt": "Plano Individual: LARA (Historial de Lesão Isquiotibiais)",
    "titleEn": "Individual Plan: LARA (Historial de Lesão Isquiotibiais)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 LARA • 14 MIN",
    "groupBadgeEn": "👤 LARA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-6_lara_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_slump",
            "namePt": "1.1 Slump Floss Neural Dinâmico Sentada (Nervo Ciático)",
            "nameEn": "1.1 Seated Dynamic Neural Slump Floss",
            "seriesRepsPt": "2x 8 ciclos / perna",
            "seriesRepsEn": "2x 8 cycles / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco com coluna curvada em slump. À medida que estende o joelho flete a cabeça para trás; ao fletir o joelho encosta o queixo ao peito. Desliza o tecido neural sem estiramento agressivo.",
            "descriptionEn": "Seated slump position. Alternate knee extension with head extension, and knee flexion with chin-to-chest. Restores neural mobility without strain.",
            "imageSrc": "/exercises/hamstring_floss_neural_pro.svg"
          },
          {
            "id": "ex_shb",
            "namePt": "1.2 Alongamento Dinâmico em Decúbito com Banda",
            "nameEn": "1.2 Supine Dynamic Hamstring Flow w/ Band",
            "seriesRepsPt": "2x 30s / perna",
            "seriesRepsEn": "2x 30s / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com banda elástica presa no pé. Eleva a perna esticada até ao limite confortável e desce controlada, bombeando flexão dorsal do tornozelo no topo.",
            "descriptionEn": "Supine holding elastic band on midfoot. Rhythmically raise straight leg to end range and lower smoothly with active dorsiflexion.",
            "imageSrc": "/exercises/supine_hamstring_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-6_lara_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_nc",
            "namePt": "2.2 Nordic Hamstring Curl Excêntrico Assistido com Banda",
            "nameEn": "2.2 Band-Assisted Eccentric Nordic Hamstring Curl",
            "seriesRepsPt": "3x 6 reps (Descida em 4s)",
            "seriesRepsEn": "3x 6 reps (4s slow fall)",
            "restPt": "45s",
            "restEn": "45s",
            "descriptionPt": "Ajoelhada com tornozelos presos e banda de suporte no peito ancorada atrás. Inclina o corpo para a frente mantendo linha reta joelho-anca-ombro. O padrão de ouro contra roturas em sprint.",
            "descriptionEn": "Kneeling with fixed ankles and band assistance on chest. Fall forward maintaining straight hip line. The global gold-standard against sprint tears.",
            "imageSrc": "/exercises/assisted_nordic_curl_band_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          },
          {
            "id": "ex_plc",
            "namePt": "2.3 Flexão Prone de Isquiotibiais Unipodal com Banda",
            "nameEn": "2.3 Single-Leg Prone Banded Hamstring Curl",
            "seriesRepsPt": "2x 10 reps / perna",
            "seriesRepsEn": "2x 10 reps / leg",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Deitada de barriga para baixo com banda elástica presa ao calcanhar e ancorada à frente. Flete o joelho trazendo o calcanhar ao glúteo, corrigindo assimetrias bilaterais.",
            "descriptionEn": "Prone lying with elastic band looped around heel. Curl heel towards glutes with 2s peak squeeze, balancing single-leg strength deficits.",
            "imageSrc": "/exercises/prone_leg_curl_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-7_laura_patrício",
    "titlePt": "Plano Individual: LAURA PATRÍCIO (Sindesmose Tornozelo + Cotovelo)",
    "titleEn": "Individual Plan: LAURA PATRÍCIO (Sindesmose Tornozelo + Cotovelo)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 LAURA PATRÍCIO • 14 MIN",
    "groupBadgeEn": "👤 LAURA PATRÍCIO • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-7_laura_patrício_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_at",
            "namePt": "1.1 Tração Articular Anterior de Tornozelo com Banda",
            "nameEn": "1.1 Banded Ankle Joint Traction",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Banda forte colocada no colo do pé (astrágalo). Puxa para trás enquanto o joelho avança, libertando o impacto anterior comum após entorses e fraturas.",
            "descriptionEn": "Strong band placed over talar dome pulling posterior while knee drives forward. Unlocks restricted ankle joint and prevents anterior impingement.",
            "imageSrc": "/exercises/ankle_traction_pro.svg"
          },
          {
            "id": "ex_trreach",
            "namePt": "1.1 Rotação Torácica & Alcance Superior em Meio-Ajoelhado com Banda",
            "nameEn": "1.1 Half-Kneeling Banded Thoracic Rotation & High Reach",
            "seriesRepsPt": "2x 8 reps / lado",
            "seriesRepsEn": "2x 8 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Meio-ajoelhada segurando banda ancorada. Roda o tronco para o lado da perna dianteira estendendo o braço ao teto com descompressão torácica e escapular.",
            "descriptionEn": "Half-kneeling holding anchored band. Rotate ribcage opening chest and reaching straight to ceiling to restore thoracic mobility.",
            "imageSrc": "/exercises/half_kneeling_band_thoracic_reach_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-7_laura_patrício_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ae",
            "namePt": "2.1 Eversão Resistida com Banda (Peroneais)",
            "nameEn": "2.1 Banded Resisted Ankle Eversion (Peroneal)",
            "seriesRepsPt": "3x 12-15 reps / pé",
            "seriesRepsEn": "3x 12-15 reps / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada lateralmente. Roda a planta do pé para fora contra a resistência elástica. Ativação dos estabilizadores dinâmicos contra a entorse em inversão.",
            "descriptionEn": "Band anchored medially. Push lateral border of foot outward against band with 2s squeeze. Primary defense against inversion sprains.",
            "imageSrc": "/exercises/ankle_eversion_pro.svg"
          },
          {
            "id": "ex_sf",
            "namePt": "2.2 Ativação da Abóbada Plantar & Short-Foot Isométrico",
            "nameEn": "2.2 Plantar Arch & Short-Foot Isometric",
            "seriesRepsPt": "3x 25 segundos / pé",
            "seriesRepsEn": "3x 25 seconds / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Pé descalço apoiado no solo. Encurta o pé puxando o metatarso em direção ao calcanhar sem dobrar os dedos. Ergue o arco plantar e estabiliza o astrágalo e navicular.",
            "descriptionEn": "Barefoot tripod contact. Shorten foot pulling metatarsal heads towards heel without curling toes, elevating medial arch.",
            "imageSrc": "/exercises/ankle_shortfoot_pro.svg"
          },
          {
            "id": "ex_ws",
            "namePt": "2.1 Wall Slides com Mini-Banda nos Pulsos (W para Y)",
            "nameEn": "2.1 Wall Slides w/ Wrist Miniband (W-to-Y)",
            "seriesRepsPt": "3x 8 reps (Pausa 2s no topo)",
            "seriesRepsEn": "3x 8 reps (2s top hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Antebraços encostados à parede em 'W' com mini-banda tensa entre os pulsos. Desliza os braços para cima até formar um 'Y', empurrando ativamente a parede para ativar o serrátil anterior.",
            "descriptionEn": "Forearms on wall in 'W' with miniband tension. Slide up into 'Y' pushing against wall to activate serratus and lower traps.",
            "imageSrc": "/exercises/wall_slide_w_to_y_miniband_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-8_luana_correia",
    "titlePt": "Plano Individual: LUANA CORREIA (Prevenção Pélvica & Força Adutora)",
    "titleEn": "Individual Plan: LUANA CORREIA (Prevenção Pélvica & Força Adutora)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 LUANA CORREIA • 14 MIN",
    "groupBadgeEn": "👤 LUANA CORREIA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-8_luana_correia_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          },
          {
            "id": "ex_shb",
            "namePt": "1.2 Alongamento Dinâmico em Decúbito com Banda",
            "nameEn": "1.2 Supine Dynamic Hamstring Flow w/ Band",
            "seriesRepsPt": "2x 30s / perna",
            "seriesRepsEn": "2x 30s / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com banda elástica presa no pé. Eleva a perna esticada até ao limite confortável e desce controlada, bombeando flexão dorsal do tornozelo no topo.",
            "descriptionEn": "Supine holding elastic band on midfoot. Rhythmically raise straight leg to end range and lower smoothly with active dorsiflexion.",
            "imageSrc": "/exercises/supine_hamstring_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-8_luana_correia_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_cp",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20s / lado",
            "seriesRepsEn": "3x 15-20s / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          },
          {
            "id": "ex_sq",
            "namePt": "2.3 Split Squat Hip-Dominant (Anti-Valgo com Banda)",
            "nameEn": "2.3 Hip-Dominant Split Squat w/ Knee Band",
            "seriesRepsPt": "2x 8 reps / perna (Descida lenta 3s)",
            "seriesRepsEn": "2x 8 reps / leg (3s slow descent)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Passada estável com inclinação anterior do tronco a 45°. Foco na dominância glútea e alinhamento rígido joelho-segundo dedo do pé, eliminando qualquer colapso em valgo dinâmico.",
            "descriptionEn": "Staggered stance with 45° forward torso hinge. Heavy glute recruitment and strict knee tracking over 2nd toe, eradicating dynamic valgus collapse.",
            "imageSrc": "/exercises/split_squat_hip_dominant_pro.svg"
          },
          {
            "id": "ex_pallof",
            "namePt": "2.1 Pallof Press Isométrico com Rotação Controlada do Tronco",
            "nameEn": "2.1 Isometric Pallof Press w/ Controlled Torso Rotation",
            "seriesRepsPt": "3x 8 reps / lado",
            "seriesRepsEn": "3x 8 reps / side",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "De pé com banda ancorada lateralmente na altura do peito. Empurra a banda à frente e resiste à força de rotação. Roda 15° de tronco mantendo bacia totalmente imóvel.",
            "descriptionEn": "Standing with chest-high anchored band. Press band forward resisting lateral pull, performing micro 15° rotations with locked hips.",
            "imageSrc": "/exercises/pallof_press_band_rotation_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-9_luana_macedo",
    "titlePt": "Plano Individual: LUANA MACEDO (Menisco & Dedo da Mão)",
    "titleEn": "Individual Plan: LUANA MACEDO (Menisco & Dedo da Mão)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 LUANA MACEDO • 14 MIN",
    "groupBadgeEn": "👤 LUANA MACEDO • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-9_luana_macedo_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_kg",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "ex_disl",
            "namePt": "1.2 Passagens de Ombros e Peitoral com Banda (Dislocates Fluídos)",
            "nameEn": "1.2 Band Shoulder Dislocates & Chest Opening",
            "seriesRepsPt": "2x 10 reps",
            "seriesRepsEn": "2x 10 reps",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "De pé com pegada larga na banda elástica e braços estendidos. Passa a banda por cima da cabeça até às costas sem arquear a lombar, abrindo a cápsula glenoumeral.",
            "descriptionEn": "Standing holding elastic band with wide grip. Pass band overhead and behind back without lumbar hyperextension.",
            "imageSrc": "/exercises/shoulder_dislocates_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-9_luana_macedo_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_wsb",
            "namePt": "2.1 Wall-Sit Isométrico a 90° com Aperto de Bola (Analgesia Patelar)",
            "nameEn": "2.1 90° Isometric Wall-Sit w/ Ball Squeeze (Patellar Analgesia)",
            "seriesRepsPt": "3x 35 segundos contínuos",
            "seriesRepsEn": "3x 35 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Costas coladas à parede, coxas paralelas ao solo (90°). Aperta uma bola de borracha entre os joelhos para recrutar adutores e vasto medial, descarregando a rótula bipartida.",
            "descriptionEn": "Back on wall, thighs at 90°. Squeeze ball between knees during isometric hold. Induces neurological analgesia and stabilizes patella.",
            "imageSrc": "/exercises/wall_sit_isometric_ball_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-10_magui",
    "titlePt": "Plano Individual: MAGUI (Fratura Navicular & Entorses)",
    "titleEn": "Individual Plan: MAGUI (Fratura Navicular & Entorses)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 MAGUI • 14 MIN",
    "groupBadgeEn": "👤 MAGUI • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-10_magui_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_at",
            "namePt": "1.1 Tração Articular Anterior de Tornozelo com Banda",
            "nameEn": "1.1 Banded Ankle Joint Traction",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Banda forte colocada no colo do pé (astrágalo). Puxa para trás enquanto o joelho avança, libertando o impacto anterior comum após entorses e fraturas.",
            "descriptionEn": "Strong band placed over talar dome pulling posterior while knee drives forward. Unlocks restricted ankle joint and prevents anterior impingement.",
            "imageSrc": "/exercises/ankle_traction_pro.svg"
          },
          {
            "id": "ex_ac",
            "namePt": "1.2 Rotações Circulares Ativas de Tornozelo (Ankle CARs)",
            "nameEn": "1.2 Controlled Articular Rotations (Ankle CARs)",
            "seriesRepsPt": "2x 6 círculos / sentido",
            "seriesRepsEn": "2x 6 circles / direction",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Joelho estabilizado com as mãos. Desenha o maior círculo possível com a ponta do pé sem rodar a tíbia. Explora dorsiflexão, inversão, flexão plantar e eversão máxima.",
            "descriptionEn": "Knee stabilized with arms. Draw maximal controlled circle with foot exploring full articular margins without tibial rotation.",
            "imageSrc": "/exercises/ankle_cars_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-10_magui_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_sf",
            "namePt": "2.2 Ativação da Abóbada Plantar & Short-Foot Isométrico",
            "nameEn": "2.2 Plantar Arch & Short-Foot Isometric",
            "seriesRepsPt": "3x 25 segundos / pé",
            "seriesRepsEn": "3x 25 seconds / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Pé descalço apoiado no solo. Encurta o pé puxando o metatarso em direção ao calcanhar sem dobrar os dedos. Ergue o arco plantar e estabiliza o astrágalo e navicular.",
            "descriptionEn": "Barefoot tripod contact. Shorten foot pulling metatarsal heads towards heel without curling toes, elevating medial arch.",
            "imageSrc": "/exercises/ankle_shortfoot_pro.svg"
          },
          {
            "id": "ex_ae",
            "namePt": "2.1 Eversão Resistida com Banda (Peroneais)",
            "nameEn": "2.1 Banded Resisted Ankle Eversion (Peroneal)",
            "seriesRepsPt": "3x 12-15 reps / pé",
            "seriesRepsEn": "3x 12-15 reps / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada lateralmente. Roda a planta do pé para fora contra a resistência elástica. Ativação dos estabilizadores dinâmicos contra a entorse em inversão.",
            "descriptionEn": "Band anchored medially. Push lateral border of foot outward against band with 2s squeeze. Primary defense against inversion sprains.",
            "imageSrc": "/exercises/ankle_eversion_pro.svg"
          },
          {
            "id": "ex_ph",
            "namePt": "2.3 Pogo Hops Reativos no Solo (Rigidez Elástica)",
            "nameEn": "2.3 Reactive Pogo Hops (Elastic Stiffness)",
            "seriesRepsPt": "3x 15 saltos rápidos",
            "seriesRepsEn": "3x 15 quick hops",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Saltos curtos e reativos apoiando no terço anterior do pé sem deixar os calcanhares tocarem no solo. Joelhos quase esticados para gerar rigidez elástica pura.",
            "descriptionEn": "Fast, stiff vertical pogo hops on forefoot with minimal knee bend. Trains tendon stiffness and reactive stabilization.",
            "imageSrc": "/exercises/pogo_hops_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-11_malta",
    "titlePt": "Plano Individual: MALTA (Profilaxia Funcional & Agilidade)",
    "titleEn": "Individual Plan: MALTA (Profilaxia Funcional & Agilidade)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 MALTA • 14 MIN",
    "groupBadgeEn": "👤 MALTA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-11_malta_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_trreach",
            "namePt": "1.1 Rotação Torácica & Alcance Superior em Meio-Ajoelhado com Banda",
            "nameEn": "1.1 Half-Kneeling Banded Thoracic Rotation & High Reach",
            "seriesRepsPt": "2x 8 reps / lado",
            "seriesRepsEn": "2x 8 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Meio-ajoelhada segurando banda ancorada. Roda o tronco para o lado da perna dianteira estendendo o braço ao teto com descompressão torácica e escapular.",
            "descriptionEn": "Half-kneeling holding anchored band. Rotate ribcage opening chest and reaching straight to ceiling to restore thoracic mobility.",
            "imageSrc": "/exercises/half_kneeling_band_thoracic_reach_pro.svg"
          },
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-11_malta_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_cp",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20s / lado",
            "seriesRepsEn": "3x 15-20s / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          },
          {
            "id": "ex_db",
            "namePt": "2.2 Dead-Bug com Mini-Banda nos Pés (Anti-Extensão Lombar)",
            "nameEn": "2.2 Dead-Bug w/ Foot Miniband (Anti-Extension)",
            "seriesRepsPt": "3x 8 reps / lado",
            "seriesRepsEn": "3x 8 reps / side",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Deitada de costas com mini-banda nos pés e braços verticais. Estende perna e braço opostos mantendo a lombar colada ao solo, eliminando hiperlordose compensatória.",
            "descriptionEn": "Supine with miniband around feet. Extend opposite arm and leg while pressing lumbar spine firmly into floor against extension.",
            "imageSrc": "/exercises/deadbug_miniband_pro.svg"
          },
          {
            "id": "ex_ph",
            "namePt": "2.3 Pogo Hops Reativos no Solo (Rigidez Elástica)",
            "nameEn": "2.3 Reactive Pogo Hops (Elastic Stiffness)",
            "seriesRepsPt": "3x 15 saltos rápidos",
            "seriesRepsEn": "3x 15 quick hops",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Saltos curtos e reativos apoiando no terço anterior do pé sem deixar os calcanhares tocarem no solo. Joelhos quase esticados para gerar rigidez elástica pura.",
            "descriptionEn": "Fast, stiff vertical pogo hops on forefoot with minimal knee bend. Trains tendon stiffness and reactive stabilization.",
            "imageSrc": "/exercises/pogo_hops_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-12_manu",
    "titlePt": "Plano Individual: MANU (Rótulas Bipartidas Bilaterais)",
    "titleEn": "Individual Plan: MANU (Rótulas Bipartidas Bilaterais)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 MANU • 14 MIN",
    "groupBadgeEn": "👤 MANU • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-12_manu_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_pm",
            "namePt": "1.1 Mobilização Manual da Rótula Superior & Inferior",
            "nameEn": "1.1 Manual Superior/Inferior Patellar Glides",
            "seriesRepsPt": "2x 30s / joelho",
            "seriesRepsEn": "2x 30s / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada com a perna totalmente relaxada no solo. Com os polegares e indicadores, desliza a rótula suavemente para cima, para baixo e lateralmente sem dor para libertar a cápsula.",
            "descriptionEn": "Seated with leg fully relaxed. Gently glide patella superiorly, inferiorly and medially with thumbs to release patellofemoral pressure.",
            "imageSrc": "/exercises/patellar_mobilization_pro.svg"
          },
          {
            "id": "ex_ad",
            "namePt": "1.1 Dorsiflexão Dinâmica de Tornozelo na Parede com Banda de Deslize",
            "nameEn": "1.1 Wall Banded Ankle Dorsiflexion Mobilization",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Em lunge virada para a parede com banda elástica a puxar o astrágalo para trás. Avança o joelho além da ponta dos dedos mantendo calcanhar colado ao chão.",
            "descriptionEn": "Half kneeling facing wall with band pulling talus posterior. Drive knee past toes keeping heel firmly grounded.",
            "imageSrc": "/exercises/ankle_dorsiflexion_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-12_manu_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_wsb",
            "namePt": "2.1 Wall-Sit Isométrico a 90° com Aperto de Bola (Analgesia Patelar)",
            "nameEn": "2.1 90° Isometric Wall-Sit w/ Ball Squeeze (Patellar Analgesia)",
            "seriesRepsPt": "3x 35 segundos contínuos",
            "seriesRepsEn": "3x 35 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Costas coladas à parede, coxas paralelas ao solo (90°). Aperta uma bola de borracha entre os joelhos para recrutar adutores e vasto medial, descarregando a rótula bipartida.",
            "descriptionEn": "Back on wall, thighs at 90°. Squeeze ball between knees during isometric hold. Induces neurological analgesia and stabilizes patella.",
            "imageSrc": "/exercises/wall_sit_isometric_ball_pro.svg"
          },
          {
            "id": "ex_ps",
            "namePt": "2.2 Poliquin Step-Up com Calcanhar Elevado em Bloco",
            "nameEn": "2.2 Heel-Elevated Poliquin Step-Up",
            "seriesRepsPt": "3x 8-10 reps / perna",
            "seriesRepsEn": "3x 8-10 reps / leg",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "No bordo de um pequeno degrau com cunha no calcanhar. Desce a perna livre tocando apenas com o calcanhar no solo enquanto o joelho da frente avança em linha com o pé.",
            "descriptionEn": "On low wedge with elevated heel. Lower opposite heel to gently touch floor while driving active knee forward, firing pure VMO fibers.",
            "imageSrc": "/exercises/poliquin_step_up_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-13_marthe",
    "titlePt": "Plano Individual: MARTHE (Força & Cadeia Posterior)",
    "titleEn": "Individual Plan: MARTHE (Força & Cadeia Posterior)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 MARTHE • 14 MIN",
    "groupBadgeEn": "👤 MARTHE • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-13_marthe_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          },
          {
            "id": "ex_trreach",
            "namePt": "1.1 Rotação Torácica & Alcance Superior em Meio-Ajoelhado com Banda",
            "nameEn": "1.1 Half-Kneeling Banded Thoracic Rotation & High Reach",
            "seriesRepsPt": "2x 8 reps / lado",
            "seriesRepsEn": "2x 8 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Meio-ajoelhada segurando banda ancorada. Roda o tronco para o lado da perna dianteira estendendo o braço ao teto com descompressão torácica e escapular.",
            "descriptionEn": "Half-kneeling holding anchored band. Rotate ribcage opening chest and reaching straight to ceiling to restore thoracic mobility.",
            "imageSrc": "/exercises/half_kneeling_band_thoracic_reach_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-13_marthe_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_cp",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20s / lado",
            "seriesRepsEn": "3x 15-20s / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          },
          {
            "id": "ex_ptap",
            "namePt": "2.2 Prancha Alta com Toque nos Ombros e Mini-Banda",
            "nameEn": "2.2 High Plank Shoulder Taps w/ Miniband",
            "seriesRepsPt": "3x 8 toques / lado",
            "seriesRepsEn": "3x 8 taps / side",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Em prancha alta com mini-banda nos pulsos e pés afastados. Toca no ombro oposto sem rodar a bacia ou colapsar o cotovelo de apoio. Proteção para quedas e choques.",
            "descriptionEn": "High plank with wrist band and wide feet. Touch opposite shoulder with minimal hip rotation, building solid fall resilience.",
            "imageSrc": "/exercises/plank_shoulder_tap_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-14_meriva",
    "titlePt": "Plano Individual: MERIVA (Lesão Muscular Prévia Coxa)",
    "titleEn": "Individual Plan: MERIVA (Lesão Muscular Prévia Coxa)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 MERIVA • 14 MIN",
    "groupBadgeEn": "👤 MERIVA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-14_meriva_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_slump",
            "namePt": "1.1 Slump Floss Neural Dinâmico Sentada (Nervo Ciático)",
            "nameEn": "1.1 Seated Dynamic Neural Slump Floss",
            "seriesRepsPt": "2x 8 ciclos / perna",
            "seriesRepsEn": "2x 8 cycles / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco com coluna curvada em slump. À medida que estende o joelho flete a cabeça para trás; ao fletir o joelho encosta o queixo ao peito. Desliza o tecido neural sem estiramento agressivo.",
            "descriptionEn": "Seated slump position. Alternate knee extension with head extension, and knee flexion with chin-to-chest. Restores neural mobility without strain.",
            "imageSrc": "/exercises/hamstring_floss_neural_pro.svg"
          },
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-14_meriva_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_nc",
            "namePt": "2.2 Nordic Hamstring Curl Excêntrico Assistido com Banda",
            "nameEn": "2.2 Band-Assisted Eccentric Nordic Hamstring Curl",
            "seriesRepsPt": "3x 6 reps (Descida em 4s)",
            "seriesRepsEn": "3x 6 reps (4s slow fall)",
            "restPt": "45s",
            "restEn": "45s",
            "descriptionPt": "Ajoelhada com tornozelos presos e banda de suporte no peito ancorada atrás. Inclina o corpo para a frente mantendo linha reta joelho-anca-ombro. O padrão de ouro contra roturas em sprint.",
            "descriptionEn": "Kneeling with fixed ankles and band assistance on chest. Fall forward maintaining straight hip line. The global gold-standard against sprint tears.",
            "imageSrc": "/exercises/assisted_nordic_curl_band_pro.svg"
          },
          {
            "id": "ex_mw",
            "namePt": "2.3 Monster Walk com Mini-Banda nos Joelhos",
            "nameEn": "2.3 Monster Walk w/ Miniband around Knees",
            "seriesRepsPt": "2x 10 passos / direção",
            "seriesRepsEn": "2x 10 steps / direction",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Em posição atlética de semi-agachamento com mini-banda logo acima dos joelhos. Passos diagonais curtos mantendo joelhos e pés alinhados, ativando glúteo médio e rotadores externos.",
            "descriptionEn": "Athletic semi-squat stance with miniband above knees. Short diagonal steps keeping knees pressed wide, firing gluteus medius.",
            "imageSrc": "/exercises/monster_walk_band_pro.svg"
          },
          {
            "id": "ex_ph",
            "namePt": "2.3 Pogo Hops Reativos no Solo (Rigidez Elástica)",
            "nameEn": "2.3 Reactive Pogo Hops (Elastic Stiffness)",
            "seriesRepsPt": "3x 15 saltos rápidos",
            "seriesRepsEn": "3x 15 quick hops",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Saltos curtos e reativos apoiando no terço anterior do pé sem deixar os calcanhares tocarem no solo. Joelhos quase esticados para gerar rigidez elástica pura.",
            "descriptionEn": "Fast, stiff vertical pogo hops on forefoot with minimal knee bend. Trains tendon stiffness and reactive stabilization.",
            "imageSrc": "/exercises/pogo_hops_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-15_nicole",
    "titlePt": "Plano Individual: NICOLE (Entorses Tornozelo + Joelho Dto.)",
    "titleEn": "Individual Plan: NICOLE (Entorses Tornozelo + Joelho Dto.)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 NICOLE • 14 MIN",
    "groupBadgeEn": "👤 NICOLE • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-15_nicole_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_ad",
            "namePt": "1.1 Dorsiflexão Dinâmica de Tornozelo na Parede com Banda de Deslize",
            "nameEn": "1.1 Wall Banded Ankle Dorsiflexion Mobilization",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Em lunge virada para a parede com banda elástica a puxar o astrágalo para trás. Avança o joelho além da ponta dos dedos mantendo calcanhar colado ao chão.",
            "descriptionEn": "Half kneeling facing wall with band pulling talus posterior. Drive knee past toes keeping heel firmly grounded.",
            "imageSrc": "/exercises/ankle_dorsiflexion_band_pro.svg"
          },
          {
            "id": "ex_ac",
            "namePt": "1.2 Rotações Circulares Ativas de Tornozelo (Ankle CARs)",
            "nameEn": "1.2 Controlled Articular Rotations (Ankle CARs)",
            "seriesRepsPt": "2x 6 círculos / sentido",
            "seriesRepsEn": "2x 6 circles / direction",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Joelho estabilizado com as mãos. Desenha o maior círculo possível com a ponta do pé sem rodar a tíbia. Explora dorsiflexão, inversão, flexão plantar e eversão máxima.",
            "descriptionEn": "Knee stabilized with arms. Draw maximal controlled circle with foot exploring full articular margins without tibial rotation.",
            "imageSrc": "/exercises/ankle_cars_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-15_nicole_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_ae",
            "namePt": "2.1 Eversão Resistida com Banda (Peroneais)",
            "nameEn": "2.1 Banded Resisted Ankle Eversion (Peroneal)",
            "seriesRepsPt": "3x 12-15 reps / pé",
            "seriesRepsEn": "3x 12-15 reps / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada lateralmente. Roda a planta do pé para fora contra a resistência elástica. Ativação dos estabilizadores dinâmicos contra a entorse em inversão.",
            "descriptionEn": "Band anchored medially. Push lateral border of foot outward against band with 2s squeeze. Primary defense against inversion sprains.",
            "imageSrc": "/exercises/ankle_eversion_pro.svg"
          },
          {
            "id": "ex_sf",
            "namePt": "2.2 Ativação da Abóbada Plantar & Short-Foot Isométrico",
            "nameEn": "2.2 Plantar Arch & Short-Foot Isometric",
            "seriesRepsPt": "3x 25 segundos / pé",
            "seriesRepsEn": "3x 25 seconds / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Pé descalço apoiado no solo. Encurta o pé puxando o metatarso em direção ao calcanhar sem dobrar os dedos. Ergue o arco plantar e estabiliza o astrágalo e navicular.",
            "descriptionEn": "Barefoot tripod contact. Shorten foot pulling metatarsal heads towards heel without curling toes, elevating medial arch.",
            "imageSrc": "/exercises/ankle_shortfoot_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-16_ramos",
    "titlePt": "Plano Individual: RAMOS (Rotura Lig. Taloperonial & Entorse 3)",
    "titleEn": "Individual Plan: RAMOS (Rotura Lig. Taloperonial & Entorse 3)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 RAMOS • 14 MIN",
    "groupBadgeEn": "👤 RAMOS • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-16_ramos_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_at",
            "namePt": "1.1 Tração Articular Anterior de Tornozelo com Banda",
            "nameEn": "1.1 Banded Ankle Joint Traction",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Banda forte colocada no colo do pé (astrágalo). Puxa para trás enquanto o joelho avança, libertando o impacto anterior comum após entorses e fraturas.",
            "descriptionEn": "Strong band placed over talar dome pulling posterior while knee drives forward. Unlocks restricted ankle joint and prevents anterior impingement.",
            "imageSrc": "/exercises/ankle_traction_pro.svg"
          },
          {
            "id": "ex_ad",
            "namePt": "1.1 Dorsiflexão Dinâmica de Tornozelo na Parede com Banda de Deslize",
            "nameEn": "1.1 Wall Banded Ankle Dorsiflexion Mobilization",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Em lunge virada para a parede com banda elástica a puxar o astrágalo para trás. Avança o joelho além da ponta dos dedos mantendo calcanhar colado ao chão.",
            "descriptionEn": "Half kneeling facing wall with band pulling talus posterior. Drive knee past toes keeping heel firmly grounded.",
            "imageSrc": "/exercises/ankle_dorsiflexion_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-16_ramos_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ae",
            "namePt": "2.1 Eversão Resistida com Banda (Peroneais)",
            "nameEn": "2.1 Banded Resisted Ankle Eversion (Peroneal)",
            "seriesRepsPt": "3x 12-15 reps / pé",
            "seriesRepsEn": "3x 12-15 reps / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada lateralmente. Roda a planta do pé para fora contra a resistência elástica. Ativação dos estabilizadores dinâmicos contra a entorse em inversão.",
            "descriptionEn": "Band anchored medially. Push lateral border of foot outward against band with 2s squeeze. Primary defense against inversion sprains.",
            "imageSrc": "/exercises/ankle_eversion_pro.svg"
          },
          {
            "id": "ex_sf",
            "namePt": "2.2 Ativação da Abóbada Plantar & Short-Foot Isométrico",
            "nameEn": "2.2 Plantar Arch & Short-Foot Isometric",
            "seriesRepsPt": "3x 25 segundos / pé",
            "seriesRepsEn": "3x 25 seconds / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Pé descalço apoiado no solo. Encurta o pé puxando o metatarso em direção ao calcanhar sem dobrar os dedos. Ergue o arco plantar e estabiliza o astrágalo e navicular.",
            "descriptionEn": "Barefoot tripod contact. Shorten foot pulling metatarsal heads towards heel without curling toes, elevating medial arch.",
            "imageSrc": "/exercises/ankle_shortfoot_pro.svg"
          },
          {
            "id": "ex_ph",
            "namePt": "2.3 Pogo Hops Reativos no Solo (Rigidez Elástica)",
            "nameEn": "2.3 Reactive Pogo Hops (Elastic Stiffness)",
            "seriesRepsPt": "3x 15 saltos rápidos",
            "seriesRepsEn": "3x 15 quick hops",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Saltos curtos e reativos apoiando no terço anterior do pé sem deixar os calcanhares tocarem no solo. Joelhos quase esticados para gerar rigidez elástica pura.",
            "descriptionEn": "Fast, stiff vertical pogo hops on forefoot with minimal knee bend. Trains tendon stiffness and reactive stabilization.",
            "imageSrc": "/exercises/pogo_hops_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-17_ribeiro",
    "titlePt": "Plano Individual: RIBEIRO (Rotura Muscular Coxa + Entorse Pé)",
    "titleEn": "Individual Plan: RIBEIRO (Rotura Muscular Coxa + Entorse Pé)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 RIBEIRO • 14 MIN",
    "groupBadgeEn": "👤 RIBEIRO • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-17_ribeiro_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_slump",
            "namePt": "1.1 Slump Floss Neural Dinâmico Sentada (Nervo Ciático)",
            "nameEn": "1.1 Seated Dynamic Neural Slump Floss",
            "seriesRepsPt": "2x 8 ciclos / perna",
            "seriesRepsEn": "2x 8 cycles / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco com coluna curvada em slump. À medida que estende o joelho flete a cabeça para trás; ao fletir o joelho encosta o queixo ao peito. Desliza o tecido neural sem estiramento agressivo.",
            "descriptionEn": "Seated slump position. Alternate knee extension with head extension, and knee flexion with chin-to-chest. Restores neural mobility without strain.",
            "imageSrc": "/exercises/hamstring_floss_neural_pro.svg"
          },
          {
            "id": "ex_at",
            "namePt": "1.1 Tração Articular Anterior de Tornozelo com Banda",
            "nameEn": "1.1 Banded Ankle Joint Traction",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Banda forte colocada no colo do pé (astrágalo). Puxa para trás enquanto o joelho avança, libertando o impacto anterior comum após entorses e fraturas.",
            "descriptionEn": "Strong band placed over talar dome pulling posterior while knee drives forward. Unlocks restricted ankle joint and prevents anterior impingement.",
            "imageSrc": "/exercises/ankle_traction_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-17_ribeiro_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_nc",
            "namePt": "2.2 Nordic Hamstring Curl Excêntrico Assistido com Banda",
            "nameEn": "2.2 Band-Assisted Eccentric Nordic Hamstring Curl",
            "seriesRepsPt": "3x 6 reps (Descida em 4s)",
            "seriesRepsEn": "3x 6 reps (4s slow fall)",
            "restPt": "45s",
            "restEn": "45s",
            "descriptionPt": "Ajoelhada com tornozelos presos e banda de suporte no peito ancorada atrás. Inclina o corpo para a frente mantendo linha reta joelho-anca-ombro. O padrão de ouro contra roturas em sprint.",
            "descriptionEn": "Kneeling with fixed ankles and band assistance on chest. Fall forward maintaining straight hip line. The global gold-standard against sprint tears.",
            "imageSrc": "/exercises/assisted_nordic_curl_band_pro.svg"
          },
          {
            "id": "ex_ae",
            "namePt": "2.1 Eversão Resistida com Banda (Peroneais)",
            "nameEn": "2.1 Banded Resisted Ankle Eversion (Peroneal)",
            "seriesRepsPt": "3x 12-15 reps / pé",
            "seriesRepsEn": "3x 12-15 reps / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada lateralmente. Roda a planta do pé para fora contra a resistência elástica. Ativação dos estabilizadores dinâmicos contra a entorse em inversão.",
            "descriptionEn": "Band anchored medially. Push lateral border of foot outward against band with 2s squeeze. Primary defense against inversion sprains.",
            "imageSrc": "/exercises/ankle_eversion_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-18_rita_r",
    "titlePt": "Plano Individual: RITA R. (Hiperextensões Joelho + Entorses)",
    "titleEn": "Individual Plan: RITA R. (Hiperextensões Joelho + Entorses)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 RITA R. • 14 MIN",
    "groupBadgeEn": "👤 RITA R. • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-18_rita_r_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_pm",
            "namePt": "1.1 Mobilização Manual da Rótula Superior & Inferior",
            "nameEn": "1.1 Manual Superior/Inferior Patellar Glides",
            "seriesRepsPt": "2x 30s / joelho",
            "seriesRepsEn": "2x 30s / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada com a perna totalmente relaxada no solo. Com os polegares e indicadores, desliza a rótula suavemente para cima, para baixo e lateralmente sem dor para libertar a cápsula.",
            "descriptionEn": "Seated with leg fully relaxed. Gently glide patella superiorly, inferiorly and medially with thumbs to release patellofemoral pressure.",
            "imageSrc": "/exercises/patellar_mobilization_pro.svg"
          },
          {
            "id": "ex_ac",
            "namePt": "1.2 Rotações Circulares Ativas de Tornozelo (Ankle CARs)",
            "nameEn": "1.2 Controlled Articular Rotations (Ankle CARs)",
            "seriesRepsPt": "2x 6 círculos / sentido",
            "seriesRepsEn": "2x 6 circles / direction",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Joelho estabilizado com as mãos. Desenha o maior círculo possível com a ponta do pé sem rodar a tíbia. Explora dorsiflexão, inversão, flexão plantar e eversão máxima.",
            "descriptionEn": "Knee stabilized with arms. Draw maximal controlled circle with foot exploring full articular margins without tibial rotation.",
            "imageSrc": "/exercises/ankle_cars_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-18_rita_r_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "ex_ph",
            "namePt": "2.3 Pogo Hops Reativos no Solo (Rigidez Elástica)",
            "nameEn": "2.3 Reactive Pogo Hops (Elastic Stiffness)",
            "seriesRepsPt": "3x 15 saltos rápidos",
            "seriesRepsEn": "3x 15 quick hops",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Saltos curtos e reativos apoiando no terço anterior do pé sem deixar os calcanhares tocarem no solo. Joelhos quase esticados para gerar rigidez elástica pura.",
            "descriptionEn": "Fast, stiff vertical pogo hops on forefoot with minimal knee bend. Trains tendon stiffness and reactive stabilization.",
            "imageSrc": "/exercises/pogo_hops_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-19_sara_alves",
    "titlePt": "Plano Individual: SARA ALVES (Ligamentoplastia LCA + Meniscos)",
    "titleEn": "Individual Plan: SARA ALVES (Ligamentoplastia LCA + Meniscos)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 SARA ALVES • 14 MIN",
    "groupBadgeEn": "👤 SARA ALVES • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-19_sara_alves_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_kg",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "ex_tr",
            "namePt": "1.2 Rotação Interna & Externa da Tíbia Sentada",
            "nameEn": "1.2 Seated Tibial Internal/External Rotations",
            "seriesRepsPt": "2x 8 reps / perna",
            "seriesRepsEn": "2x 8 reps / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco a 90°. Isola a rotação axial da tíbia sobre o fémur sem mover o joelho ou anca. Restaura o mecanismo de 'screw-home' fundamental para a integridade do LCA.",
            "descriptionEn": "Seated at 90°. Isolate pure axial rotation of tibia without hip sway. Restores normal screw-home knee locking mechanism.",
            "imageSrc": "/exercises/tibial_rotation_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-19_sara_alves_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "ex_cp",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20s / lado",
            "seriesRepsEn": "3x 15-20s / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-20_sara_teixeira",
    "titlePt": "Plano Individual: SARA TEIXEIRA (Reconstrução LCA (Maio 2024))",
    "titleEn": "Individual Plan: SARA TEIXEIRA (Reconstrução LCA (Maio 2024))",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 SARA TEIXEIRA • 14 MIN",
    "groupBadgeEn": "👤 SARA TEIXEIRA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-20_sara_teixeira_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_kg",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "ex_shb",
            "namePt": "1.2 Alongamento Dinâmico em Decúbito com Banda",
            "nameEn": "1.2 Supine Dynamic Hamstring Flow w/ Band",
            "seriesRepsPt": "2x 30s / perna",
            "seriesRepsEn": "2x 30s / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com banda elástica presa no pé. Eleva a perna esticada até ao limite confortável e desce controlada, bombeando flexão dorsal do tornozelo no topo.",
            "descriptionEn": "Supine holding elastic band on midfoot. Rhythmically raise straight leg to end range and lower smoothly with active dorsiflexion.",
            "imageSrc": "/exercises/supine_hamstring_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-20_sara_teixeira_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "ex_sq",
            "namePt": "2.3 Split Squat Hip-Dominant (Anti-Valgo com Banda)",
            "nameEn": "2.3 Hip-Dominant Split Squat w/ Knee Band",
            "seriesRepsPt": "2x 8 reps / perna (Descida lenta 3s)",
            "seriesRepsEn": "2x 8 reps / leg (3s slow descent)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Passada estável com inclinação anterior do tronco a 45°. Foco na dominância glútea e alinhamento rígido joelho-segundo dedo do pé, eliminando qualquer colapso em valgo dinâmico.",
            "descriptionEn": "Staggered stance with 45° forward torso hinge. Heavy glute recruitment and strict knee tracking over 2nd toe, eradicating dynamic valgus collapse.",
            "imageSrc": "/exercises/split_squat_hip_dominant_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-21_serena",
    "titlePt": "Plano Individual: SERENA (Cirurgia LCA (Fevereiro 2025))",
    "titleEn": "Individual Plan: SERENA (Cirurgia LCA (Fevereiro 2025))",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 SERENA • 14 MIN",
    "groupBadgeEn": "👤 SERENA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-21_serena_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_kg",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "ex_tr",
            "namePt": "1.2 Rotação Interna & Externa da Tíbia Sentada",
            "nameEn": "1.2 Seated Tibial Internal/External Rotations",
            "seriesRepsPt": "2x 8 reps / perna",
            "seriesRepsEn": "2x 8 reps / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco a 90°. Isola a rotação axial da tíbia sobre o fémur sem mover o joelho ou anca. Restaura o mecanismo de 'screw-home' fundamental para a integridade do LCA.",
            "descriptionEn": "Seated at 90°. Isolate pure axial rotation of tibia without hip sway. Restores normal screw-home knee locking mechanism.",
            "imageSrc": "/exercises/tibial_rotation_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-21_serena_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-22_simães",
    "titlePt": "Plano Individual: SIMÃES (Contusão Joelho (2 Meses Out))",
    "titleEn": "Individual Plan: SIMÃES (Contusão Joelho (2 Meses Out))",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 SIMÃES • 14 MIN",
    "groupBadgeEn": "👤 SIMÃES • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-22_simães_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_pm",
            "namePt": "1.1 Mobilização Manual da Rótula Superior & Inferior",
            "nameEn": "1.1 Manual Superior/Inferior Patellar Glides",
            "seriesRepsPt": "2x 30s / joelho",
            "seriesRepsEn": "2x 30s / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada com a perna totalmente relaxada no solo. Com os polegares e indicadores, desliza a rótula suavemente para cima, para baixo e lateralmente sem dor para libertar a cápsula.",
            "descriptionEn": "Seated with leg fully relaxed. Gently glide patella superiorly, inferiorly and medially with thumbs to release patellofemoral pressure.",
            "imageSrc": "/exercises/patellar_mobilization_pro.svg"
          },
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-22_simães_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_wsb",
            "namePt": "2.1 Wall-Sit Isométrico a 90° com Aperto de Bola (Analgesia Patelar)",
            "nameEn": "2.1 90° Isometric Wall-Sit w/ Ball Squeeze (Patellar Analgesia)",
            "seriesRepsPt": "3x 35 segundos contínuos",
            "seriesRepsEn": "3x 35 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Costas coladas à parede, coxas paralelas ao solo (90°). Aperta uma bola de borracha entre os joelhos para recrutar adutores e vasto medial, descarregando a rótula bipartida.",
            "descriptionEn": "Back on wall, thighs at 90°. Squeeze ball between knees during isometric hold. Induces neurological analgesia and stabilizes patella.",
            "imageSrc": "/exercises/wall_sit_isometric_ball_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-23_ticha",
    "titlePt": "Plano Individual: TICHA (Profilaxia Dinâmica & Adutores)",
    "titleEn": "Individual Plan: TICHA (Profilaxia Dinâmica & Adutores)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 TICHA • 14 MIN",
    "groupBadgeEn": "👤 TICHA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-23_ticha_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_9090",
            "namePt": "1.2 Transições 90/90 de Anca com Alcance Dinâmico",
            "nameEn": "1.2 90/90 Hip Flow w/ Dynamic Reach",
            "seriesRepsPt": "2x 6 reps / lado",
            "seriesRepsEn": "2x 6 reps / side",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em 90/90. Transita os joelhos de um lado para o outro mantendo tronco ereto e alcança a mão em diagonal para abrir a fáscia lombo-pélvica.",
            "descriptionEn": "Seated in 90/90. Transition knees smoothly side to side and project torso forward to release lumbo-pelvic fascia.",
            "imageSrc": "/exercises/hip_90_90_flow_reach_pro.svg"
          },
          {
            "id": "ex_shb",
            "namePt": "1.2 Alongamento Dinâmico em Decúbito com Banda",
            "nameEn": "1.2 Supine Dynamic Hamstring Flow w/ Band",
            "seriesRepsPt": "2x 30s / perna",
            "seriesRepsEn": "2x 30s / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com banda elástica presa no pé. Eleva a perna esticada até ao limite confortável e desce controlada, bombeando flexão dorsal do tornozelo no topo.",
            "descriptionEn": "Supine holding elastic band on midfoot. Rhythmically raise straight leg to end range and lower smoothly with active dorsiflexion.",
            "imageSrc": "/exercises/supine_hamstring_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-23_ticha_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_cp",
            "namePt": "2.1 Copenhagen Plank Isométrico Curto com Joelho no Banco",
            "nameEn": "2.1 Short-Lever Copenhagen Adductor Plank",
            "seriesRepsPt": "3x 15-20s / lado",
            "seriesRepsEn": "3x 15-20s / side",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Prancha lateral com o joelho superior apoiado no banco (alavanca curta protetora). Eleva a bacia alinhada e mantém a perna inferior suspensa sem cair.",
            "descriptionEn": "Side plank with top knee resting on gym bench (protective short lever). Elevate pelvis maintaining straight body line with bottom leg hovering.",
            "imageSrc": "/exercises/copenhagen_plank_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          },
          {
            "id": "ex_mw",
            "namePt": "2.3 Monster Walk com Mini-Banda nos Joelhos",
            "nameEn": "2.3 Monster Walk w/ Miniband around Knees",
            "seriesRepsPt": "2x 10 passos / direção",
            "seriesRepsEn": "2x 10 steps / direction",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Em posição atlética de semi-agachamento com mini-banda logo acima dos joelhos. Passos diagonais curtos mantendo joelhos e pés alinhados, ativando glúteo médio e rotadores externos.",
            "descriptionEn": "Athletic semi-squat stance with miniband above knees. Short diagonal steps keeping knees pressed wide, firing gluteus medius.",
            "imageSrc": "/exercises/monster_walk_band_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-24_tita",
    "titlePt": "Plano Individual: TITA (Fratura Astrágalo + Peroneais)",
    "titleEn": "Individual Plan: TITA (Fratura Astrágalo + Peroneais)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 TITA • 14 MIN",
    "groupBadgeEn": "👤 TITA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-24_tita_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_at",
            "namePt": "1.1 Tração Articular Anterior de Tornozelo com Banda",
            "nameEn": "1.1 Banded Ankle Joint Traction",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Banda forte colocada no colo do pé (astrágalo). Puxa para trás enquanto o joelho avança, libertando o impacto anterior comum após entorses e fraturas.",
            "descriptionEn": "Strong band placed over talar dome pulling posterior while knee drives forward. Unlocks restricted ankle joint and prevents anterior impingement.",
            "imageSrc": "/exercises/ankle_traction_pro.svg"
          },
          {
            "id": "ex_ad",
            "namePt": "1.1 Dorsiflexão Dinâmica de Tornozelo na Parede com Banda de Deslize",
            "nameEn": "1.1 Wall Banded Ankle Dorsiflexion Mobilization",
            "seriesRepsPt": "2x 10 pulsos / tornozelo",
            "seriesRepsEn": "2x 10 pulses / ankle",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Em lunge virada para a parede com banda elástica a puxar o astrágalo para trás. Avança o joelho além da ponta dos dedos mantendo calcanhar colado ao chão.",
            "descriptionEn": "Half kneeling facing wall with band pulling talus posterior. Drive knee past toes keeping heel firmly grounded.",
            "imageSrc": "/exercises/ankle_dorsiflexion_band_pro.svg"
          },
          {
            "id": "ex_ac",
            "namePt": "1.2 Rotações Circulares Ativas de Tornozelo (Ankle CARs)",
            "nameEn": "1.2 Controlled Articular Rotations (Ankle CARs)",
            "seriesRepsPt": "2x 6 círculos / sentido",
            "seriesRepsEn": "2x 6 circles / direction",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Joelho estabilizado com as mãos. Desenha o maior círculo possível com a ponta do pé sem rodar a tíbia. Explora dorsiflexão, inversão, flexão plantar e eversão máxima.",
            "descriptionEn": "Knee stabilized with arms. Draw maximal controlled circle with foot exploring full articular margins without tibial rotation.",
            "imageSrc": "/exercises/ankle_cars_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-24_tita_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ae",
            "namePt": "2.1 Eversão Resistida com Banda (Peroneais)",
            "nameEn": "2.1 Banded Resisted Ankle Eversion (Peroneal)",
            "seriesRepsPt": "3x 12-15 reps / pé",
            "seriesRepsEn": "3x 12-15 reps / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada lateralmente. Roda a planta do pé para fora contra a resistência elástica. Ativação dos estabilizadores dinâmicos contra a entorse em inversão.",
            "descriptionEn": "Band anchored medially. Push lateral border of foot outward against band with 2s squeeze. Primary defense against inversion sprains.",
            "imageSrc": "/exercises/ankle_eversion_pro.svg"
          },
          {
            "id": "ex_sf",
            "namePt": "2.2 Ativação da Abóbada Plantar & Short-Foot Isométrico",
            "nameEn": "2.2 Plantar Arch & Short-Foot Isometric",
            "seriesRepsPt": "3x 25 segundos / pé",
            "seriesRepsEn": "3x 25 seconds / foot",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Pé descalço apoiado no solo. Encurta o pé puxando o metatarso em direção ao calcanhar sem dobrar os dedos. Ergue o arco plantar e estabiliza o astrágalo e navicular.",
            "descriptionEn": "Barefoot tripod contact. Shorten foot pulling metatarsal heads towards heel without curling toes, elevating medial arch.",
            "imageSrc": "/exercises/ankle_shortfoot_pro.svg"
          },
          {
            "id": "ex_ph",
            "namePt": "2.3 Pogo Hops Reativos no Solo (Rigidez Elástica)",
            "nameEn": "2.3 Reactive Pogo Hops (Elastic Stiffness)",
            "seriesRepsPt": "3x 15 saltos rápidos",
            "seriesRepsEn": "3x 15 quick hops",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Saltos curtos e reativos apoiando no terço anterior do pé sem deixar os calcanhares tocarem no solo. Joelhos quase esticados para gerar rigidez elástica pura.",
            "descriptionEn": "Fast, stiff vertical pogo hops on forefoot with minimal knee bend. Trains tendon stiffness and reactive stabilization.",
            "imageSrc": "/exercises/pogo_hops_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-25_verónica",
    "titlePt": "Plano Individual: VERÓNICA (Cirurgia LCA (Maio 2023))",
    "titleEn": "Individual Plan: VERÓNICA (Cirurgia LCA (Maio 2023))",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 VERÓNICA • 14 MIN",
    "groupBadgeEn": "👤 VERÓNICA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-25_verónica_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_kg",
            "namePt": "1.1 Knee Gapping com Toalha/Banda em Descarga",
            "nameEn": "1.1 Knee Joint Gapping w/ Towel/Band",
            "seriesRepsPt": "2x 10 pulsos / joelho",
            "seriesRepsEn": "2x 10 pulses / knee",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada ou sentada com rolo/toalha na dobra poplítea. Flete o joelho com tração suave para abrir espaço na articulação fémoro-tibial e descompressão dos cornos meniscais posteriores.",
            "descriptionEn": "Supine or seated with soft towel/band roll in knee crease. Gently flex knee to create joint decompression in tibiofemoral space.",
            "imageSrc": "/exercises/knee_gapping_pro.svg"
          },
          {
            "id": "ex_tr",
            "namePt": "1.2 Rotação Interna & Externa da Tíbia Sentada",
            "nameEn": "1.2 Seated Tibial Internal/External Rotations",
            "seriesRepsPt": "2x 8 reps / perna",
            "seriesRepsEn": "2x 8 reps / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco a 90°. Isola a rotação axial da tíbia sobre o fémur sem mover o joelho ou anca. Restaura o mecanismo de 'screw-home' fundamental para a integridade do LCA.",
            "descriptionEn": "Seated at 90°. Isolate pure axial rotation of tibia without hip sway. Restores normal screw-home knee locking mechanism.",
            "imageSrc": "/exercises/tibial_rotation_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-25_verónica_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_ss",
            "namePt": "2.1 Spanish Squat Isométrico com Banda Dupla",
            "nameEn": "2.1 Spanish Squat Isometric w/ Double Heavy Band",
            "seriesRepsPt": "3x 35-40 segundos contínuos",
            "seriesRepsEn": "3x 35-40 continuous seconds",
            "restPt": "40s",
            "restEn": "40s",
            "descriptionPt": "Banda resistente ancorada à altura da rótula. Flete joelhos a 60°-70° mantendo tronco rigorosamente ereto e tíbias verticais. Co-contração quadricípete/isquiotibiais que alivia a tensão anterior do LCA.",
            "descriptionEn": "Rigid band anchored behind knee joint. Squat to 60°-70° with vertical shins and torso. Generates safe co-contraction protecting ACL graft.",
            "imageSrc": "/exercises/spanish_squat_isometric_pro.svg"
          },
          {
            "id": "ex_tke",
            "namePt": "2.2 Terminal Knee Extension (TKE) com Banda Elástica",
            "nameEn": "2.2 Terminal Knee Extension (TKE) w/ Elastic Band",
            "seriesRepsPt": "3x 12 reps / perna (Pausa 2s)",
            "seriesRepsEn": "3x 12 reps / leg (2s hold)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Banda ancorada em frente logo acima da linha articular. Estende totalmente o joelho contra a resistência elástica, esmagando o vasto medial oblíquo (VMO) no bloqueio terminal.",
            "descriptionEn": "Band anchored in front. Fully extend knee against elastic tension, firing VMO for 2s peak contraction before controlled return.",
            "imageSrc": "/exercises/terminal_knee_extension_band_pro.svg"
          },
          {
            "id": "ex_sq",
            "namePt": "2.3 Split Squat Hip-Dominant (Anti-Valgo com Banda)",
            "nameEn": "2.3 Hip-Dominant Split Squat w/ Knee Band",
            "seriesRepsPt": "2x 8 reps / perna (Descida lenta 3s)",
            "seriesRepsEn": "2x 8 reps / leg (3s slow descent)",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Passada estável com inclinação anterior do tronco a 45°. Foco na dominância glútea e alinhamento rígido joelho-segundo dedo do pé, eliminando qualquer colapso em valgo dinâmico.",
            "descriptionEn": "Staggered stance with 45° forward torso hinge. Heavy glute recruitment and strict knee tracking over 2nd toe, eradicating dynamic valgus collapse.",
            "imageSrc": "/exercises/split_squat_hip_dominant_pro.svg"
          }
        ]
      }
    ]
  },
  {
    "id": "plan_indiv_ath-27_chelsea",
    "titlePt": "Plano Individual: CHELSEA (Défice Isquiotibial Esquerdo)",
    "titleEn": "Individual Plan: CHELSEA (Défice Isquiotibial Esquerdo)",
    "categoryPt": "Individual • Anamnese Clínico (2 Secções • 14 Min)",
    "categoryEn": "Individual • Clinical Anamnesis (2 Sections • 14 Min)",
    "group": "inferiores",
    "groupBadgePt": "👤 CHELSEA • 14 MIN",
    "groupBadgeEn": "👤 CHELSEA • 14 MIN",
    "seasonLinePt": "GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • PLANO INDIVIDUALIZADO ANAMNESE",
    "seasonLineEn": "GIL VICENTE FOOTBALL CLUB • 2026/2027 SEASON • INDIVIDUAL CLINICAL PLAN",
    "targetPosition": "all",
    "durationMinutes": 14,
    "durationTextPt": "14 MIN (Máx. 15 Min)",
    "durationTextEn": "14 MIN (Max 15 Min)",
    "warmupPt": "Descompressão articular e tecidular específica.",
    "warmupEn": "Joint decompression and tissue specific release.",
    "finisherPt": "Alongamento leve em descarga e retorno à calma.",
    "finisherEn": "Light unloaded stretch and calm recovery.",
    "blocks": [
      {
        "id": "plan_indiv_ath-27_chelsea_sec01",
        "number": "01",
        "titlePt": "SECÇÃO 1: MOBILIDADE ARTICULAR & DESCOMPRESSÃO",
        "titleEn": "SECTION 1: JOINT MOBILITY & DECOMPRESSION",
        "durationMinutes": 6,
        "durationTextPt": "6 MIN",
        "durationTextEn": "6 MIN",
        "exercises": [
          {
            "id": "ex_slump",
            "namePt": "1.1 Slump Floss Neural Dinâmico Sentada (Nervo Ciático)",
            "nameEn": "1.1 Seated Dynamic Neural Slump Floss",
            "seriesRepsPt": "2x 8 ciclos / perna",
            "seriesRepsEn": "2x 8 cycles / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Sentada em banco com coluna curvada em slump. À medida que estende o joelho flete a cabeça para trás; ao fletir o joelho encosta o queixo ao peito. Desliza o tecido neural sem estiramento agressivo.",
            "descriptionEn": "Seated slump position. Alternate knee extension with head extension, and knee flexion with chin-to-chest. Restores neural mobility without strain.",
            "imageSrc": "/exercises/hamstring_floss_neural_pro.svg"
          },
          {
            "id": "ex_shb",
            "namePt": "1.2 Alongamento Dinâmico em Decúbito com Banda",
            "nameEn": "1.2 Supine Dynamic Hamstring Flow w/ Band",
            "seriesRepsPt": "2x 30s / perna",
            "seriesRepsEn": "2x 30s / leg",
            "restPt": "20s",
            "restEn": "20s",
            "descriptionPt": "Deitada de costas com banda elástica presa no pé. Eleva a perna esticada até ao limite confortável e desce controlada, bombeando flexão dorsal do tornozelo no topo.",
            "descriptionEn": "Supine holding elastic band on midfoot. Rhythmically raise straight leg to end range and lower smoothly with active dorsiflexion.",
            "imageSrc": "/exercises/supine_hamstring_band_pro.svg"
          }
        ]
      },
      {
        "id": "plan_indiv_ath-27_chelsea_sec02",
        "number": "02",
        "titlePt": "SECÇÃO 2: ATIVAÇÃO NEUROMUSCULAR & FORÇA PREVENTIVA",
        "titleEn": "SECTION 2: NEUROMUSCULAR ACTIVATION & PREVENTIVE STRENGTH",
        "durationMinutes": 8,
        "durationTextPt": "8 MIN",
        "durationTextEn": "8 MIN",
        "exercises": [
          {
            "id": "ex_nc",
            "namePt": "2.2 Nordic Hamstring Curl Excêntrico Assistido com Banda",
            "nameEn": "2.2 Band-Assisted Eccentric Nordic Hamstring Curl",
            "seriesRepsPt": "3x 6 reps (Descida em 4s)",
            "seriesRepsEn": "3x 6 reps (4s slow fall)",
            "restPt": "45s",
            "restEn": "45s",
            "descriptionPt": "Ajoelhada com tornozelos presos e banda de suporte no peito ancorada atrás. Inclina o corpo para a frente mantendo linha reta joelho-anca-ombro. O padrão de ouro contra roturas em sprint.",
            "descriptionEn": "Kneeling with fixed ankles and band assistance on chest. Fall forward maintaining straight hip line. The global gold-standard against sprint tears.",
            "imageSrc": "/exercises/assisted_nordic_curl_band_pro.svg"
          },
          {
            "id": "ex_llb",
            "namePt": "2.1 Ponte Isquiotibial Long-Lever com Pausa Isométrica",
            "nameEn": "2.1 Long-Lever Hamstring Bridge w/ Peak Hold",
            "seriesRepsPt": "3x 8 reps (Pausa 3s)",
            "seriesRepsEn": "3x 8 reps (3s hold)",
            "restPt": "35s",
            "restEn": "35s",
            "descriptionPt": "Deitada de costas com calcanhares no solo afastados das nádegas (joelhos a ~140°). Eleva a bacia contraindo intensamente o bíceps femoral distal com retroversão pélvica.",
            "descriptionEn": "Supine with heels placed far from glutes (knee angle ~140°). Elevate hips with posterior pelvic tilt targeting distal biceps femoris.",
            "imageSrc": "/exercises/long_lever_bridge_dumbbell_pro.svg"
          },
          {
            "id": "ex_plc",
            "namePt": "2.3 Flexão Prone de Isquiotibiais Unipodal com Banda",
            "nameEn": "2.3 Single-Leg Prone Banded Hamstring Curl",
            "seriesRepsPt": "2x 10 reps / perna",
            "seriesRepsEn": "2x 10 reps / leg",
            "restPt": "30s",
            "restEn": "30s",
            "descriptionPt": "Deitada de barriga para baixo com banda elástica presa ao calcanhar e ancorada à frente. Flete o joelho trazendo o calcanhar ao glúteo, corrigindo assimetrias bilaterais.",
            "descriptionEn": "Prone lying with elastic band looped around heel. Curl heel towards glutes with 2s peak squeeze, balancing single-leg strength deficits.",
            "imageSrc": "/exercises/prone_leg_curl_band_pro.svg"
          }
        ]
      }
    ]
  }
];

export const DEFAULT_ANAMNESE_ASSIGNMENTS: Record<string, AthletePlanAssignment> = {
  "athlete_ath-1_plan_indiv_ath-1_carlota": {
    "id": "athlete_ath-1_plan_indiv_ath-1_carlota",
    "targetType": "athlete",
    "targetId": "ath-1",
    "targetName": "CARLOTA",
    "planId": "plan_indiv_ath-1_carlota",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Reforço bilateral de LCA e proteção meniscal pós-dupla cirurgia."
  },
  "athlete_ath-3_plan_indiv_ath-3_cartaxo": {
    "id": "athlete_ath-3_plan_indiv_ath-3_cartaxo",
    "targetType": "athlete",
    "targetId": "ath-3",
    "targetName": "CARTAXO",
    "planId": "plan_indiv_ath-3_cartaxo",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Reforço rotuliano e desenvolvimento de força escapular/membro superior."
  },
  "athlete_ath-4_plan_indiv_ath-4_eva": {
    "id": "athlete_ath-4_plan_indiv_ath-4_eva",
    "targetType": "athlete",
    "targetId": "ath-4",
    "targetName": "EVA",
    "planId": "plan_indiv_ath-4_eva",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil sem lesões: Otimização de estabilidade pélvica, adutores e cadeia posterior."
  },
  "athlete_ath-5_plan_indiv_ath-5_faith": {
    "id": "athlete_ath-5_plan_indiv_ath-5_faith",
    "targetType": "athlete",
    "targetId": "ath-5",
    "targetName": "FAITH",
    "planId": "plan_indiv_ath-5_faith",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Proteção do menisco medial e alinhamento rotuliano em rotação."
  },
  "athlete_ath-6_plan_indiv_ath-6_lara": {
    "id": "athlete_ath-6_plan_indiv_ath-6_lara",
    "targetType": "athlete",
    "targetId": "ath-6",
    "targetName": "LARA",
    "planId": "plan_indiv_ath-6_lara",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Descompressão neural ciática e reforço excêntrico do bíceps femoral."
  },
  "athlete_ath-7_plan_indiv_ath-7_laura_patrício": {
    "id": "athlete_ath-7_plan_indiv_ath-7_laura_patrício",
    "targetType": "athlete",
    "targetId": "ath-7",
    "targetName": "LAURA PATRÍCIO",
    "planId": "plan_indiv_ath-7_laura_patrício",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Estabilidade ligamentar da sindesmose e proteção da cintura escapular/cotovelo."
  },
  "athlete_ath-8_plan_indiv_ath-8_luana_correia": {
    "id": "athlete_ath-8_plan_indiv_ath-8_luana_correia",
    "targetType": "athlete",
    "targetId": "ath-8",
    "targetName": "LUANA CORREIA",
    "planId": "plan_indiv_ath-8_luana_correia",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil profilático: Reforço preventivo de adutores, split squats e controlo anti-rotação."
  },
  "athlete_ath-9_plan_indiv_ath-9_luana_macedo": {
    "id": "athlete_ath-9_plan_indiv_ath-9_luana_macedo",
    "targetType": "athlete",
    "targetId": "ath-9",
    "targetName": "LUANA MACEDO",
    "planId": "plan_indiv_ath-9_luana_macedo",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Descompressão meniscal e estabilidade escapular de guarda-redes."
  },
  "athlete_ath-10_plan_indiv_ath-10_magui": {
    "id": "athlete_ath-10_plan_indiv_ath-10_magui",
    "targetType": "athlete",
    "targetId": "ath-10",
    "targetName": "MAGUI",
    "planId": "plan_indiv_ath-10_magui",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Rigidez da abóbada plantar, estabilidade de médio-pé e peroneais."
  },
  "athlete_ath-11_plan_indiv_ath-11_malta": {
    "id": "athlete_ath-11_plan_indiv_ath-11_malta",
    "targetType": "athlete",
    "targetId": "ath-11",
    "targetName": "MALTA",
    "planId": "plan_indiv_ath-11_malta",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil sem lesões: Core anti-extensão, adutores e reatividade elástica sem fadiga respiratória."
  },
  "athlete_ath-12_plan_indiv_ath-12_manu": {
    "id": "athlete_ath-12_plan_indiv_ath-12_manu",
    "targetType": "athlete",
    "targetId": "ath-12",
    "targetName": "MANU",
    "planId": "plan_indiv_ath-12_manu",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Analgesia fémoro-rotuliana com isometria a 90° e reforço do VMO sem impacto."
  },
  "athlete_ath-13_plan_indiv_ath-13_marthe": {
    "id": "athlete_ath-13_plan_indiv_ath-13_marthe",
    "targetType": "athlete",
    "targetId": "ath-13",
    "targetName": "MARTHE",
    "planId": "plan_indiv_ath-13_marthe",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil norueguês de potência: Adutores dinâmicos, pontes de isquios e estabilidade de prancha."
  },
  "athlete_ath-14_plan_indiv_ath-14_meriva": {
    "id": "athlete_ath-14_plan_indiv_ath-14_meriva",
    "targetType": "athlete",
    "targetId": "ath-14",
    "targetName": "MERIVA",
    "planId": "plan_indiv_ath-14_meriva",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Reforço excêntrico de cadeia posterior e ativação de rotadores de anca."
  },
  "athlete_ath-15_plan_indiv_ath-15_nicole": {
    "id": "athlete_ath-15_plan_indiv_ath-15_nicole",
    "targetType": "athlete",
    "targetId": "ath-15",
    "targetName": "NICOLE",
    "planId": "plan_indiv_ath-15_nicole",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Estabilidade multiarticular joelho-tornozelo e combate a microlesões."
  },
  "athlete_ath-16_plan_indiv_ath-16_ramos": {
    "id": "athlete_ath-16_plan_indiv_ath-16_ramos",
    "targetType": "athlete",
    "targetId": "ath-16",
    "targetName": "RAMOS",
    "planId": "plan_indiv_ath-16_ramos",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Reconstrução dos peroneais, tração articular de retropé e rigidez."
  },
  "athlete_ath-17_plan_indiv_ath-17_ribeiro": {
    "id": "athlete_ath-17_plan_indiv_ath-17_ribeiro",
    "targetType": "athlete",
    "targetId": "ath-17",
    "targetName": "RIBEIRO",
    "planId": "plan_indiv_ath-17_ribeiro",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Excêntrico de isquiotibiais com deslizamento neural e estabilidade de tornozelo."
  },
  "athlete_ath-18_plan_indiv_ath-18_rita_r": {
    "id": "athlete_ath-18_plan_indiv_ath-18_rita_r",
    "targetType": "athlete",
    "targetId": "ath-18",
    "targetName": "RITA R.",
    "planId": "plan_indiv_ath-18_rita_r",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Bloqueio do joelho em ângulos seguros (sem hiperextensão) e proprioceção de tornozelo."
  },
  "athlete_ath-19_plan_indiv_ath-19_sara_alves": {
    "id": "athlete_ath-19_plan_indiv_ath-19_sara_alves",
    "targetType": "athlete",
    "targetId": "ath-19",
    "targetName": "SARA ALVES",
    "planId": "plan_indiv_ath-19_sara_alves",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Proteção máxima do enxerto LCA, co-contração e força adutora pélvica."
  },
  "athlete_ath-20_plan_indiv_ath-20_sara_teixeira": {
    "id": "athlete_ath-20_plan_indiv_ath-20_sara_teixeira",
    "targetType": "athlete",
    "targetId": "ath-20",
    "targetName": "SARA TEIXEIRA",
    "planId": "plan_indiv_ath-20_sara_teixeira",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Controlo de valgo dinâmico, força excêntrica posterior e extensão terminal."
  },
  "athlete_ath-21_plan_indiv_ath-21_serena": {
    "id": "athlete_ath-21_plan_indiv_ath-21_serena",
    "targetType": "athlete",
    "targetId": "ath-21",
    "targetName": "SERENA",
    "planId": "plan_indiv_ath-21_serena",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Screw-home mechanism, força isométrica anterior e cadeia posterior."
  },
  "athlete_ath-22_plan_indiv_ath-22_simães": {
    "id": "athlete_ath-22_plan_indiv_ath-22_simães",
    "targetType": "athlete",
    "targetId": "ath-22",
    "targetName": "SIMÃES",
    "planId": "plan_indiv_ath-22_simães",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Analgesia fémoro-rotuliana, ativação do VMO e cadeia posterior sem impacto."
  },
  "athlete_ath-23_plan_indiv_ath-23_ticha": {
    "id": "athlete_ath-23_plan_indiv_ath-23_ticha",
    "targetType": "athlete",
    "targetId": "ath-23",
    "targetName": "TICHA",
    "planId": "plan_indiv_ath-23_ticha",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil sem lesões: Adutores em alavanca curta, cadeia posterior e estabilidade de anca."
  },
  "athlete_ath-24_plan_indiv_ath-24_tita": {
    "id": "athlete_ath-24_plan_indiv_ath-24_tita",
    "targetType": "athlete",
    "targetId": "ath-24",
    "targetName": "TITA",
    "planId": "plan_indiv_ath-24_tita",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Deslize posterior do astrágalo, eversão de peroneais e força intrínseca do pé."
  },
  "athlete_ath-25_plan_indiv_ath-25_verónica": {
    "id": "athlete_ath-25_plan_indiv_ath-25_verónica",
    "targetType": "athlete",
    "targetId": "ath-25",
    "targetName": "VERÓNICA",
    "planId": "plan_indiv_ath-25_verónica",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Proteção bilateral de LCA, alinhamento axial fémoro-tibial e força excêntrica."
  },
  "athlete_ath-27_plan_indiv_ath-27_chelsea": {
    "id": "athlete_ath-27_plan_indiv_ath-27_chelsea",
    "targetType": "athlete",
    "targetId": "ath-27",
    "targetName": "CHELSEA",
    "planId": "plan_indiv_ath-27_chelsea",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Correção da assimetria bilateral de isquiotibiais e força excêntrica nórdica."
  },
  "athlete_ath-1_prev_joelho_lca_menisco": {
    "id": "athlete_ath-1_prev_joelho_lca_menisco",
    "targetType": "athlete",
    "targetId": "ath-1",
    "targetName": "CARLOTA",
    "planId": "prev_joelho_lca_menisco",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Reforço bilateral de LCA e proteção meniscal pós-dupla cirurgia."
  },
  "athlete_ath-4_prev_adutores_virilha_copenhagen": {
    "id": "athlete_ath-4_prev_adutores_virilha_copenhagen",
    "targetType": "athlete",
    "targetId": "ath-4",
    "targetName": "EVA",
    "planId": "prev_adutores_virilha_copenhagen",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil sem lesões: Otimização de estabilidade pélvica, adutores e cadeia posterior."
  },
  "athlete_ath-6_prev_isquios_quads_excentrico": {
    "id": "athlete_ath-6_prev_isquios_quads_excentrico",
    "targetType": "athlete",
    "targetId": "ath-6",
    "targetName": "LARA",
    "planId": "prev_isquios_quads_excentrico",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Descompressão neural ciática e reforço excêntrico do bíceps femoral."
  },
  "athlete_ath-7_prev_tornozelo_sindesmose_peroneais": {
    "id": "athlete_ath-7_prev_tornozelo_sindesmose_peroneais",
    "targetType": "athlete",
    "targetId": "ath-7",
    "targetName": "LAURA PATRÍCIO",
    "planId": "prev_tornozelo_sindesmose_peroneais",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Estabilidade ligamentar da sindesmose e proteção da cintura escapular/cotovelo."
  },
  "athlete_ath-8_prev_adutores_virilha_copenhagen": {
    "id": "athlete_ath-8_prev_adutores_virilha_copenhagen",
    "targetType": "athlete",
    "targetId": "ath-8",
    "targetName": "LUANA CORREIA",
    "planId": "prev_adutores_virilha_copenhagen",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil profilático: Reforço preventivo de adutores, split squats e controlo anti-rotação."
  },
  "athlete_ath-10_prev_tornozelo_sindesmose_peroneais": {
    "id": "athlete_ath-10_prev_tornozelo_sindesmose_peroneais",
    "targetType": "athlete",
    "targetId": "ath-10",
    "targetName": "MAGUI",
    "planId": "prev_tornozelo_sindesmose_peroneais",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Rigidez da abóbada plantar, estabilidade de médio-pé e peroneais."
  },
  "athlete_ath-12_prev_rotuliano_patelar_bipartida": {
    "id": "athlete_ath-12_prev_rotuliano_patelar_bipartida",
    "targetType": "athlete",
    "targetId": "ath-12",
    "targetName": "MANU",
    "planId": "prev_rotuliano_patelar_bipartida",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Analgesia fémoro-rotuliana com isometria a 90° e reforço do VMO sem impacto."
  },
  "athlete_ath-14_prev_isquios_quads_excentrico": {
    "id": "athlete_ath-14_prev_isquios_quads_excentrico",
    "targetType": "athlete",
    "targetId": "ath-14",
    "targetName": "MERIVA",
    "planId": "prev_isquios_quads_excentrico",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Reforço excêntrico de cadeia posterior e ativação de rotadores de anca."
  },
  "athlete_ath-15_prev_tornozelo_sindesmose_peroneais": {
    "id": "athlete_ath-15_prev_tornozelo_sindesmose_peroneais",
    "targetType": "athlete",
    "targetId": "ath-15",
    "targetName": "NICOLE",
    "planId": "prev_tornozelo_sindesmose_peroneais",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Estabilidade multiarticular joelho-tornozelo e combate a microlesões."
  },
  "athlete_ath-17_prev_isquios_quads_excentrico": {
    "id": "athlete_ath-17_prev_isquios_quads_excentrico",
    "targetType": "athlete",
    "targetId": "ath-17",
    "targetName": "RIBEIRO",
    "planId": "prev_isquios_quads_excentrico",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Excêntrico de isquiotibiais com deslizamento neural e estabilidade de tornozelo."
  },
  "athlete_ath-19_prev_joelho_lca_menisco": {
    "id": "athlete_ath-19_prev_joelho_lca_menisco",
    "targetType": "athlete",
    "targetId": "ath-19",
    "targetName": "SARA ALVES",
    "planId": "prev_joelho_lca_menisco",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Proteção máxima do enxerto LCA, co-contração e força adutora pélvica."
  },
  "athlete_ath-20_prev_joelho_lca_menisco": {
    "id": "athlete_ath-20_prev_joelho_lca_menisco",
    "targetType": "athlete",
    "targetId": "ath-20",
    "targetName": "SARA TEIXEIRA",
    "planId": "prev_joelho_lca_menisco",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Controlo de valgo dinâmico, força excêntrica posterior e extensão terminal."
  },
  "athlete_ath-21_prev_joelho_lca_menisco": {
    "id": "athlete_ath-21_prev_joelho_lca_menisco",
    "targetType": "athlete",
    "targetId": "ath-21",
    "targetName": "SERENA",
    "planId": "prev_joelho_lca_menisco",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Screw-home mechanism, força isométrica anterior e cadeia posterior."
  },
  "athlete_ath-23_prev_adutores_virilha_copenhagen": {
    "id": "athlete_ath-23_prev_adutores_virilha_copenhagen",
    "targetType": "athlete",
    "targetId": "ath-23",
    "targetName": "TICHA",
    "planId": "prev_adutores_virilha_copenhagen",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Perfil sem lesões: Adutores em alavanca curta, cadeia posterior e estabilidade de anca."
  },
  "athlete_ath-24_prev_tornozelo_sindesmose_peroneais": {
    "id": "athlete_ath-24_prev_tornozelo_sindesmose_peroneais",
    "targetType": "athlete",
    "targetId": "ath-24",
    "targetName": "TITA",
    "planId": "prev_tornozelo_sindesmose_peroneais",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Deslize posterior do astrágalo, eversão de peroneais e força intrínseca do pé."
  },
  "athlete_ath-25_prev_joelho_lca_menisco": {
    "id": "athlete_ath-25_prev_joelho_lca_menisco",
    "targetType": "athlete",
    "targetId": "ath-25",
    "targetName": "VERÓNICA",
    "planId": "prev_joelho_lca_menisco",
    "assignedAt": "2026-10-25T00:00:00.000Z",
    "assignedBy": "Sistema (Anamnese)",
    "active": true,
    "notes": "Prioridade Clínica: Proteção bilateral de LCA, alinhamento axial fémoro-tibial e força excêntrica."
  }
};

/**
 * Strict goalkeeper exemption: Carol and Payton must NEVER have automated plans
 */
export function isExcludedFromAutoPlans(athlete: { id: string; name: string }): boolean {
  const upper = (athlete.name || '').toUpperCase().trim();
  return (
    upper === 'CAROL' ||
    upper === 'PAYTON' ||
    upper.includes('CAROL') ||
    upper.includes('PAYTON') ||
    athlete.id === 'ath-2' ||
    athlete.id === 'ath-26'
  );
}
