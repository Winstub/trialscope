// Bundled fallback knowledge for target search (works offline / when Open Targets + ChEMBL are unreachable).
// Curated by hand from public INN / trade-name lists; runtime resolution (targetResolve.js) merges more drugs on top.
//
//  aliases    names for the target itself (gene symbols, protein names). First entry is the display name.
//  drugs      agents that act ON the target: antibodies, ADCs, bispecifics, TKIs, CAR-T / cell therapies, codes, trade names.
//  neighbors  ligand / receptor / paralog "neighbours": text about these must NOT be counted as the target.
//             { name, aliases: [...], drugs: [...] }  (drugs acting on the neighbour only => label "Unclear", with explanation)

export const SEED_TARGETS = [
  {
    id: 'PD-1', symbol: 'PDCD1', name: 'programmed cell death protein 1',
    aliases: ['PD-1', 'PD1', 'PDCD1', 'CD279', 'PD-(L)1', 'programmed cell death protein 1', 'programmed cell death 1', 'programmed death-1', 'programmed death 1'],
    drugs: ['pembrolizumab', 'nivolumab', 'cemiplimab', 'dostarlimab', 'toripalimab', 'tislelizumab', 'sintilimab', 'camrelizumab', 'penpulimab',
      'retifanlimab', 'zimberelimab', 'serplulimab', 'spartalizumab', 'balstilimab', 'cetrelimab', 'pucotenlimab', 'finotonlimab', 'prolgolimab',
      'ezabenlimab', 'sasanlimab', 'nofazinlimab', 'geptanolimab', 'budigalimab', 'enlonstobart', 'iparomlimab', 'tuvonralimab', 'pidilizumab', 'rulonilimab',
      'cadonilimab', 'ivonescimab', 'tebotelimab', 'volrustomig', 'rilvegostomig', 'tobemstomig', 'lorigerlimab', 'zeluvalimab', 'sabestomig', 'MEDI0680', 'AMP-224',
      'Keytruda', 'Opdivo', 'Opdualag', 'Libtayo', 'Jemperli', 'Loqtorzi', 'Tevimbra', 'Tyvyt', 'Zynyz', 'Qlex', 'MK-3475', 'MK-3475A', 'BMS-936558', 'ONO-4538', 'REGN2810', 'TSR-042',
      'SHR-1210', 'IBI308', 'BGB-A317', 'JS001', 'AK105', 'AK104', 'AK112', 'SMT112', 'HLX10', 'PDR001', 'INCMGA00012', 'GLS-010', 'QL1706', 'MEDI5752', 'AZD2936', 'RO7247669', 'HX008', 'CS1003', 'LZM009', 'F520', 'SG001', ],
    neighbors: [{
      name: 'PD-L1 / PD-L2 (ligands of PD-1)',
      aliases: ['PD-L1', 'PDL1', 'CD274', 'B7-H1', 'PD-L2', 'PDL2', 'PDCD1LG2', 'CD273', 'programmed death-ligand 1', 'programmed cell death ligand 1', 'programmed death ligand 1'],
      drugs: ['atezolizumab', 'durvalumab', 'avelumab', 'envafolimab', 'sugemalimab', 'adebrelimab', 'benmelstobart', 'socazolimab', 'cosibelimab', 'tagitanlimab', 'garivulimab', 'lodapolimab', 'envafolimab',
        'Tecentriq', 'Imfinzi', 'Bavencio', 'MPDL3280A', 'MEDI4736', 'MSB0010718C', 'KN035', 'SHR-1316', 'CS1001', 'TQB2450', 'BNT327', 'PM8002', 'pumitamig', 'acasunlimab', 'retlirafusp'],
    }],
  },
  {
    id: 'PD-L1', symbol: 'CD274', name: 'programmed cell death 1 ligand 1',
    aliases: ['PD-L1', 'PDL1', 'CD274', 'B7-H1', 'PD-(L)1', 'programmed death-ligand 1', 'programmed cell death ligand 1', 'programmed death ligand 1'],
    drugs: ['atezolizumab', 'durvalumab', 'avelumab', 'envafolimab', 'sugemalimab', 'adebrelimab', 'benmelstobart', 'socazolimab', 'cosibelimab', 'tagitanlimab', 'garivulimab', 'lodapolimab',
      'Tecentriq', 'Imfinzi', 'Bavencio', 'MPDL3280A', 'MEDI4736', 'MSB0010718C', 'KN035', 'SHR-1316', 'CS1001', 'TQB2450', 'BNT327', 'PM8002', 'pumitamig', 'acasunlimab', 'retlirafusp', 'TQB2858', 'bintrafusp'],
    neighbors: [{ name: 'PD-1 (receptor of PD-L1)', aliases: ['PD-1', 'PD1', 'PDCD1', 'CD279'], drugs: ['pembrolizumab', 'nivolumab', 'cemiplimab', 'dostarlimab', 'toripalimab', 'tislelizumab', 'sintilimab', 'camrelizumab', 'penpulimab', 'retifanlimab', 'serplulimab', 'zimberelimab'] }],
  },
  {
    id: 'CTLA-4', symbol: 'CTLA4', name: 'cytotoxic T-lymphocyte associated protein 4',
    aliases: ['CTLA-4', 'CTLA4', 'CD152', 'cytotoxic T-lymphocyte antigen 4', 'cytotoxic T-lymphocyte-associated protein 4'],
    drugs: ['ipilimumab', 'tremelimumab', 'zalifrelimab', 'quavonlimab', 'botensilimab', 'cadonilimab', 'volrustomig', 'abatacept', 'belatacept', 'Yervoy', 'Imjudo', 'Orencia', 'Nulojix', 'MDX-010', 'BMS-734016', 'AGEN1884', 'AGEN1181', 'MK-1308', 'KN046', 'AK104', 'QL1706', 'MEDI5752', 'ONC-392', 'gotistobart', 'BMS-986218', 'BMS-986249', 'HBM4003', 'ADU-1604'],
    neighbors: [{ name: 'CD80/CD86 (ligands) / CD28', aliases: ['CD80', 'CD86', 'B7-1', 'B7-2', 'CD28'], drugs: [] }],
  },
  {
    id: 'LAG-3', symbol: 'LAG3', name: 'lymphocyte activating 3',
    aliases: ['LAG-3', 'LAG3', 'CD223', 'lymphocyte-activation gene 3', 'lymphocyte activation gene 3'],
    drugs: ['relatlimab', 'favezelimab', 'fianlimab', 'ieramilimab', 'tebotelimab', 'eftilagimod', 'miptenalimab', 'tuparstobart', 'Opdualag', 'BMS-986016', 'MK-4280', 'REGN3767', 'LAG525', 'IMP321', 'INCAGN02385', 'RO7247669', 'IBI110', 'XmAb841'],
    neighbors: [],
  },
  {
    id: 'TIGIT', symbol: 'TIGIT', name: 'T cell immunoreceptor with Ig and ITIM domains',
    aliases: ['TIGIT', 'T cell immunoreceptor with Ig and ITIM domains', 'VSIG9', 'VSTM3'],
    drugs: ['tiragolumab', 'vibostolimab', 'ociperlimab', 'domvanalimab', 'belrestotug', 'etigilimab', 'rilvegostomig', 'tobemstomig', 'MK-7684', 'MK-7684A', 'RG6058', 'MTIG7192A', 'BGB-A1217', 'AB154', 'EOS-448', 'COM902', 'AZD2936', 'M6223', 'IBI939'],
    neighbors: [{ name: 'CD226 / CD155 (PVR)', aliases: ['CD226', 'DNAM-1', 'CD155', 'PVR'], drugs: [] }],
  },
  {
    id: 'VEGF', symbol: 'VEGFA', aliasExclude: '[-\\s]?(?:[B-F]\\b|PlGF|receptors?\\b)', name: 'vascular endothelial growth factor A',
    aliases: ['VEGF', 'VEGF-A', 'VEGFA', 'VEGF165', 'vascular endothelial growth factor', 'vascular endothelial growth factor A'],
    drugs: ['bevacizumab', 'ranibizumab', 'aflibercept', 'ziv-aflibercept', 'brolucizumab', 'faricimab', 'conbercept', 'pegaptanib', 'tarcocimab', 'navicixizumab', 'vanucizumab', 'ivonescimab', 'pumitamig', 'efdamrofusp', 'revakinagene', 'Avastin', 'Mvasi', 'Zirabev', 'Alymsys', 'Vegzelma', 'Abevmy', 'Avzivi', 'Lytenava', 'ONS-5010', 'Lucentis', 'Byooviz', 'Cimerli', 'Susvimo', 'Xlucane', 'Eylea', 'Zaltrap', 'Yesafili', 'Opuviz', 'Ahzantive', 'Enzeevu', 'Pavblu', 'Beovu', 'Vabysmo', 'Lumitin', 'Macugen',
      'KSI-301', 'IBI305', 'BAT1706', 'MIL60', 'QL1101', 'LY01008', 'HLX04', 'TAB008', 'BEVZ92', 'MB02', 'FKB238', 'SB8', 'CT-P16', 'BI 695502', 'ABP 215', 'PF-06439535', 'HD204', 'TRS003', 'MYL-1402O', 'MIL60', 'GB222', 'BP102', 'WBP264',
      'SB15', 'MYL-1701P', 'ABP 938', 'CT-P42', 'FYB203', 'SOK583', 'AK112', 'SMT112', 'SSGJ-707', 'BNT327', 'PM8002', 'MHB039A', 'HB0025', 'LM-299', 'RC28', 'IBI302', 'RGX-314', 'ABBV-RGX-314', '4D-150', 'ADVM-022', 'ixoberogene', 'BI 836880', 'RO6867461', 'sevacizumab', 'HLX04-O', 'QL1207'],
    neighbors: [{
      name: 'VEGFR / KDR / FLT1 (receptors) and other VEGF family ligands',
      aliases: ['VEGFR', 'VEGFR1', 'VEGFR2', 'VEGFR3', 'VEGFR-1', 'VEGFR-2', 'VEGFR-3', 'KDR', 'FLT1', 'FLT4', 'VEGF-B', 'VEGF-C', 'VEGF-D', 'PlGF', 'vascular endothelial growth factor receptor', 'VEGF receptor'],
      drugs: ['ramucirumab', 'sunitinib', 'sorafenib', 'pazopanib', 'axitinib', 'cabozantinib', 'lenvatinib', 'regorafenib', 'apatinib', 'rivoceranib', 'anlotinib', 'fruquintinib', 'surufatinib', 'tivozanib', 'vandetanib', 'nintedanib', 'famitinib', 'donafenib', 'vorolanib', 'lucitanib', 'sozinibercept', 'OPT-302', 'tanibirumab', 'icrucumab', 'olinvacimab',
        'Sutent', 'Nexavar', 'Votrient', 'Inlyta', 'Cabometyx', 'Cometriq', 'Lenvima', 'Stivarga', 'Cyramza', 'Fotivda', 'Fruzaqla', 'EYP-1901', 'OTX-TKI', 'Ofev', 'Caprelsa', 'Elunate', 'Aitan'],
    }],
  },
  {
    id: 'HER2', symbol: 'ERBB2', name: 'erb-b2 receptor tyrosine kinase 2',
    aliases: ['HER2', 'HER-2', 'ERBB2', 'ErbB2', 'HER2/neu', 'HER-2/neu', 'c-erbB-2', 'CD340', 'human epidermal growth factor receptor 2', 'receptor tyrosine-protein kinase erbB-2'],
    drugs: ['trastuzumab', 'pertuzumab', 'ado-trastuzumab', 'trastuzumab emtansine', 'trastuzumab deruxtecan', 'trastuzumab duocarmazine', 'trastuzumab rezetecan', 'margetuximab', 'zanidatamab', 'zenocutuzumab', 'disitamab', 'lapatinib', 'neratinib', 'tucatinib', 'pyrotinib', 'afatinib', 'zongertinib', 'sevabertinib', 'poziotinib', 'mobocertinib', 'tesevatinib', 'varlitinib', 'inetetamab', 'anbenitamab', 'izalontamab', 'T-DM1', 'T-DXd', 'DS-8201', 'DS8201', 'SHR-A1811', 'RC48', 'DB-1303', 'BNT323', 'A166', 'ARX788', 'MRG002', 'FS-1502', 'JSKN003', 'TAA013', 'BAT8001', 'GQ1001', 'TQB2102', 'DP303c', 'SYSA1501', 'ZW25', 'ZW49', 'KN026', 'MCLA-128', 'HLX02', 'CT-P6', 'SB3', 'ABP 980', 'PF-05280014', 'BCD-022', 'HD201', 'EG12014', 'TX05', 'Herceptin', 'Perjeta', 'Kadcyla', 'Enhertu', 'Phesgo', 'Herzuma', 'Ogivri', 'Kanjinti', 'Trazimera', 'Ontruzant', 'Hercessi', 'Tykerb', 'Nerlynx', 'Tukysa', 'Margenza', 'Ziihera', 'Bizengri', 'Hernexeos', 'Zercepac', 'Herclon', 'Biocad trastuzumab', 'HER2 CAR', 'HER2-CAR'],
    neighbors: [{ name: 'HER3 / HER4 / EGFR(HER1) (ErbB family paralogs)', aliases: ['HER3', 'HER-3', 'ERBB3', 'ErbB3', 'HER4', 'ERBB4', 'HER1'], drugs: ['patritumab', 'seribantumab', 'lumretuzumab', 'HER3-DXd'] }],
  },
  {
    id: 'EGFR', symbol: 'EGFR', name: 'epidermal growth factor receptor',
    aliases: ['EGFR', 'EGF-R', 'ErbB1', 'HER1', 'EGFRvIII', 'epidermal growth factor receptor'],
    drugs: ['cetuximab', 'panitumumab', 'necitumumab', 'nimotuzumab', 'amivantamab', 'erlotinib', 'gefitinib', 'afatinib', 'osimertinib', 'dacomitinib', 'icotinib', 'lazertinib', 'almonertinib', 'aumolertinib', 'furmonertinib', 'befotertinib', 'rezivertinib', 'sunvozertinib', 'mobocertinib', 'zipalertinib', 'firmonertinib', 'oritinib', 'rilertinib', 'abivertinib', 'naquotinib', 'olmutinib', 'lapatinib', 'neratinib', 'poziotinib', 'vandetanib', 'depatuxizumab', 'serclutamab', 'imgatuzumab', 'zalutumumab', 'sym004', 'futuximab', 'tomuzotuximab', 'becotatug', 'izalontamab', 'BL-B01D1', 'iza-bren',
      'Erbitux', 'Vectibix', 'Portrazza', 'Rybrevant', 'Tarceva', 'Iressa', 'Gilotrif', 'Tagrisso', 'Vizimpro', 'Lazcluze', 'Aumolertinib', 'Ameile', 'Aiyoute', 'Conmana', 'Exkivity', 'Zegfrovy', 'AZD9291', 'AZD3759', 'BPI-7711', 'TQB3804', 'JMT101', 'CK-101', 'EGFR CAR', 'EGFR-CAR', 'EGFRvIII CAR', 'CART-EGFR', 'MM-151', 'AMG 595', 'ABT-414', 'ABBV-321', 'HLX07', 'SCT200', 'CMAB009', 'CDP1', 'GC1118', 'TY-9591', 'ASK120067', 'DZD9008', 'ZN-e4'],
    neighbors: [{ name: 'EGF ligands / other ErbB receptors (HER2, HER3)', aliases: ['HER2', 'ERBB2', 'HER3', 'ERBB3', 'ERBB4', 'TGF-alpha', 'amphiregulin'], drugs: [] }],
  },
  {
    id: 'CD19', symbol: 'CD19', name: 'CD19 molecule',
    aliases: ['CD19', 'B-lymphocyte antigen CD19', 'CD-19'],
    drugs: ['tisagenlecleucel', 'axicabtagene', 'lisocabtagene', 'brexucabtagene', 'obecabtagene', 'relmacabtagene', 'zamtocabtagene', 'varnimcabtagene', 'inaticabtagene', 'rapcabtagene', 'anbalcabtagene', 'tafasitamab', 'loncastuximab', 'blinatumomab', 'inebilizumab', 'coltuximab', 'denintuzumab', 'obexelimab', 'taplitumomab', 'dalnicabtagene',
      'Kymriah', 'Yescarta', 'Breyanzi', 'Tecartus', 'Aucatzyl', 'Monjuvi', 'Minjuvi', 'Zynlonta', 'Blincyto', 'Uplizna', 'CTL019', 'KTE-C19', 'KTE-X19', 'JCAR017', 'JCAR015', 'JCAR014', 'liso-cel', 'axi-cel', 'tisa-cel', 'brexu-cel', 'obe-cel', 'relma-cel', 'zamto-cel', 'AUTO1', 'MOR208', 'XmAb5574', 'ADCT-402', 'MEDI-551', 'SAR3419', 'SGN-CD19A', 'AMG 103', 'MT103', 'CNCT19', 'ALLO-501', 'ALLO-501A', 'CTX112', 'FT819', 'FT596', 'TAK-007', 'huCART19', 'MB-CART2019.1', 'CAR-20/19-T', 'YTB323', 'IM19', 'CD19 CAR', 'CD19-CAR', 'CD19CAR', 'CART19', 'CAR19', 'CAR-19', 'anti-CD19 CAR', 'CD19 chimeric antigen receptor', 'KYV-101', 'CABA-201', 'BMS-986353', 'CC-97540', 'azer-cel', 'GC007g', 'pCAR-19B', 'ssCART-19', 'JWCAR029', 'PBCAR0191', 'UCART19', 'ALLO-501'],
    neighbors: [{ name: 'CD20 / CD22 (other B-cell antigens)', aliases: ['CD20', 'CD22', 'CD79b', 'CD79a', 'BCMA'], drugs: ['rituximab', 'obinutuzumab', 'ofatumumab', 'ocrelizumab', 'mosunetuzumab', 'glofitamab', 'epcoritamab', 'odronextamab', 'inotuzumab', 'moxetumomab', 'polatuzumab', 'idecabtagene', 'ciltacabtagene'] }],
  },
  {
    id: 'CD20', symbol: 'MS4A1', name: 'membrane spanning 4-domains A1',
    aliases: ['CD20', 'MS4A1', 'CD-20', 'B-lymphocyte antigen CD20'],
    drugs: ['rituximab', 'obinutuzumab', 'ofatumumab', 'ocrelizumab', 'ublituximab', 'ibritumomab', 'tositumomab', 'veltuzumab', 'ocaratuzumab', 'mosunetuzumab', 'glofitamab', 'epcoritamab', 'odronextamab', 'imvotamab', 'zamtocabtagene', 'Rituxan', 'MabThera', 'Truxima', 'Ruxience', 'Riabni', 'Gazyva', 'Gazyvaro', 'Arzerra', 'Kesimpta', 'Ocrevus', 'Briumvi', 'Zevalin', 'Lunsumio', 'Columvi', 'Epkinly', 'Rixathon', 'CT-P10', 'GP2013', 'PF-05280586', 'ABP 798', 'HLX01', 'RO5072759', 'GA101', 'CD20 CAR', 'CD20-CAR', 'CAR-20/19-T', 'LV20.19'],
    neighbors: [{ name: 'CD19 / CD22 (other B-cell antigens)', aliases: ['CD19', 'CD22', 'CD79b'], drugs: ['tafasitamab', 'loncastuximab', 'blinatumomab', 'inotuzumab', 'polatuzumab', 'tisagenlecleucel', 'axicabtagene', 'lisocabtagene'] }],
  },
  {
    id: 'BCMA', symbol: 'TNFRSF17', name: 'TNF receptor superfamily member 17',
    aliases: ['BCMA', 'TNFRSF17', 'CD269', 'B-cell maturation antigen', 'B cell maturation antigen'],
    drugs: ['idecabtagene', 'ciltacabtagene', 'teclistamab', 'elranatamab', 'linvoseltamab', 'belantamab', 'alnuctamab', 'equecabtagene', 'zevorcabtagene', 'anitocabtagene', 'pavurutamab', 'etentamig', 'Abecma', 'Carvykti', 'Tecvayli', 'Elrexfio', 'Lynozyfic', 'Blenrep', 'ide-cel', 'cilta-cel', 'ABBV-383', 'REGN5458', 'PF-06863135', 'GSK2857916', 'bb2121', 'JNJ-68284528', 'LCAR-B38M', 'CT053', 'CT103A', 'orva-cel', 'orvacabtagene', 'bb21217', 'CC-93269', 'AMG 701', 'BCMA CAR', 'BCMA-CAR', 'CAR-BCMA', 'anti-BCMA CAR', 'ALLO-715', 'P-BCMA-101', 'CART-BCMA', 'KITE-585', 'MCARH171', 'GC012F', 'AZD0120'],
    neighbors: [{ name: 'GPRC5D / CD38 / SLAMF7 (other myeloma antigens)', aliases: ['GPRC5D', 'CD38', 'SLAMF7', 'CS1', 'FcRH5'], drugs: ['talquetamab', 'daratumumab', 'isatuximab', 'elotuzumab', 'cevostamab'] }],
  },
  {
    id: 'CD38', symbol: 'CD38', name: 'CD38 molecule',
    aliases: ['CD38', 'CD-38', 'ADP-ribosyl cyclase 1'],
    drugs: ['daratumumab', 'isatuximab', 'felzartamab', 'mezagitamab', 'Darzalex', 'Sarclisa', 'Faspro', 'HuMax-CD38', 'MOR202', 'TAK-079', 'SAR650984', 'CD38 CAR', 'CD38-CAR', 'TAK-079', 'MOR202', 'felzartamab'],
    neighbors: [{ name: 'BCMA / SLAMF7', aliases: ['BCMA', 'SLAMF7'], drugs: [] }],
  },
  {
    id: 'TNF', symbol: 'TNF', aliasExclude: '[-\\s]?(?:beta|β|receptors?\\b|R[12]\\b)', name: 'tumor necrosis factor',
    aliases: ['TNF', 'TNF-alpha', 'TNF-α', 'TNFα', 'TNFa', 'TNF alpha', 'tumor necrosis factor', 'tumour necrosis factor', 'tumor necrosis factor alpha', 'tumor necrosis factor-alpha'],
    drugs: ['infliximab', 'adalimumab', 'etanercept', 'golimumab', 'certolizumab', 'Remicade', 'Humira', 'Enbrel', 'Simponi', 'Cimzia', 'Inflectra', 'Renflexis', 'Remsima', 'Avsola', 'Amjevita', 'Cyltezo', 'Hyrimoz', 'Hadlima', 'Hulio', 'Yusimry', 'Idacio', 'Yuflyma', 'Hukyndra', 'Erelzi', 'Eticovo', 'CT-P13', 'SB2', 'SB4', 'SB5', 'ABP 501', 'BI 695501', 'GP2017', 'MSB11022', 'PF-06410293', 'CT-P17', 'AVT02', 'GP2015', 'ozoralizumab', 'onercept', 'lenercept', 'pegsunercept', 'anti-TNF', 'anti TNF', 'TNF inhibitor', 'TNF blocker', 'TNFi'],
    neighbors: [{ name: 'TNF receptors / other TNF superfamily ligands', aliases: ['TNFR1', 'TNFR2', 'TNFRSF1A', 'TNFRSF1B', 'TNF-beta', 'lymphotoxin'], drugs: [] }],
  },
  {
    id: 'IL-6', symbol: 'IL6', name: 'interleukin 6',
    aliases: ['IL-6', 'IL6', 'interleukin-6', 'interleukin 6'],
    drugs: ['siltuximab', 'clazakizumab', 'olokizumab', 'sirukumab', 'ziltivekimab', 'pacibekitug', 'tocilizumab', 'sarilumab', 'satralizumab', 'Sylvant', 'Actemra', 'RoActemra', 'Kevzara', 'Enspryng', 'Tofidence', 'Tyenne', 'Avtozma', 'CNTO 136', 'CNTO 328', 'REGN88', 'ALD518', 'BMS-945429', 'CDP6038', 'MSB11456', 'CT-P47', 'BAT1806'],
    neighbors: [{ name: 'IL-6 receptor / JAK-STAT', aliases: ['IL-6R', 'IL6R', 'IL-6 receptor', 'gp130', 'JAK1', 'JAK2', 'STAT3'], drugs: [] }],
  },
  {
    id: 'IL-17A', symbol: 'IL17A', name: 'interleukin 17A',
    aliases: ['IL-17A', 'IL17A', 'IL-17', 'IL17', 'interleukin-17A', 'interleukin 17A', 'interleukin-17', 'interleukin 17'],
    drugs: ['secukinumab', 'ixekizumab', 'bimekizumab', 'netakimab', 'sonelokimab', 'izokibep', 'brodalumab', 'vunakizumab', 'xeligekimab', 'gumokimab', 'Cosentyx', 'Taltz', 'Bimzelx', 'Siliq', 'AIN457', 'LY2439821', 'CJM112', 'BCD-085', 'M1095', 'ALX-0761', 'SHR-1314', 'GR1501', 'AK111', 'QX002N', 'HB0017', 'JS005'],
    neighbors: [{ name: 'IL-17 receptor / IL-23 axis', aliases: ['IL-17RA', 'IL17RA', 'IL-23', 'IL23', 'IL-17F', 'IL17F'], drugs: ['ustekinumab', 'guselkumab', 'risankizumab', 'tildrakizumab', 'mirikizumab'] }],
  },
  {
    id: 'IL-23', symbol: 'IL23A', name: 'interleukin 23 subunit alpha',
    aliases: ['IL-23', 'IL23', 'IL-23p19', 'IL23A', 'IL-23A', 'interleukin-23', 'interleukin 23'],
    drugs: ['guselkumab', 'risankizumab', 'tildrakizumab', 'mirikizumab', 'brazikumab', 'ustekinumab', 'briakinumab', 'Tremfya', 'Skyrizi', 'Ilumya', 'Omvoh', 'Stelara', 'Wezlana', 'Selarsdi', 'Pyzchiva', 'Otulfi', 'Imuldosa', 'Yesintek', 'Steqeyma', 'CNTO 1959', 'BI 655066', 'MK-3222', 'LY3074828', 'MEDI2070', 'AMG 139', 'ABT-874', 'CNTO 1275', 'AVT04', 'CT-P43', 'ABP 654', 'SB17', 'DMB-3115', 'picankibart'],
    neighbors: [{ name: 'IL-12 / IL-17 / IL-23 receptor', aliases: ['IL-12', 'IL12', 'IL-23R', 'IL23R', 'IL-17A', 'IL17A'], drugs: ['secukinumab', 'ixekizumab', 'bimekizumab'] }],
  },
  {
    id: 'CD47', symbol: 'CD47', name: 'CD47 molecule',
    aliases: ['CD47', 'CD-47', 'integrin associated protein'],
    drugs: ['magrolimab', 'evorpacept', 'lemzoparlimab', 'letaplimab', 'ligufalimab', 'ALX148', 'Hu5F9-G4', 'TTI-621', 'TTI-622', 'IBI188', 'AK117', 'SGN-CD47M', 'CC-90002', 'AO-176', 'ZL-1201', 'IMM01', 'HX009', 'maplirpacept', 'SRF231', 'TJC4', 'lemzoparlimab', 'anti-CD47', 'CD47 antibody'],
    neighbors: [{ name: 'SIRPα (receptor of CD47)', aliases: ['SIRPa', 'SIRPα', 'SIRP-alpha', 'SIRP alpha', 'SIRPA'], drugs: ['BI 765063', 'ADU-1805', 'GS-0189'] }],
  },
  {
    id: 'Claudin 18.2', symbol: 'CLDN18', name: 'claudin 18 isoform 2',
    aliases: ['Claudin 18.2', 'Claudin18.2', 'CLDN18.2', 'CLDN 18.2', 'CLDN18', 'claudin-18.2', 'CLDN-18.2'],
    drugs: ['zolbetuximab', 'osemitamab', 'givastomig', 'arcotatug', 'satricabtagene', 'Vyloy', 'IMAB362', 'TST001', 'AZD0901', 'CMG901', 'SYSA1801', 'LM-302', 'ATG-022', 'IBI343', 'SOT102', 'ASKB589', 'CT041', 'CLDN18.2 CAR', 'CLDN18.2-CAR', 'CAR-CLDN18.2', 'claudin18.2 CAR', 'XNW27011', 'RC118', 'FG-M108', 'SHR-A1904', 'QLS31905', 'TORL-2-307', 'LB4330', 'IBI389'],
    neighbors: [{ name: 'Claudin 18.1 / Claudin 6 / other claudins', aliases: ['Claudin 18.1', 'CLDN18.1', 'Claudin 6', 'CLDN6', 'CLDN6'], drugs: [] }],
  },
  {
    id: 'TROP2', symbol: 'TACSTD2', name: 'tumor associated calcium signal transducer 2',
    aliases: ['TROP2', 'TROP-2', 'Trop 2', 'TACSTD2', 'trophoblast cell surface antigen 2', 'trophoblast antigen 2'],
    drugs: ['sacituzumab', 'datopotamab', 'sacituzumab tirumotecan', 'sacituzumab govitecan', 'datopotamab deruxtecan', 'puxitatug', 'Trodelvy', 'Datroway', 'IMMU-132', 'DS-1062', 'MK-2870', 'SKB264', 'ESG401', 'FDA018', 'JS108', 'DB-1305', 'BAT8008', 'TROP2 CAR', 'TROP2-CAR', 'anti-TROP2', 'TROP2 ADC', 'TROP2-ADC', 'TROP2-targeted', 'sac-TMT', 'Dato-DXd', 'SG'],
    neighbors: [{ name: 'Nectin-4 / HER3 / other ADC antigens', aliases: ['Nectin-4', 'NECTIN4', 'HER3', 'ERBB3', 'B7-H3', 'CD276'], drugs: ['enfortumab', 'patritumab', 'ifinatamab'] }],
  },
  {
    id: 'KRAS', symbol: 'KRAS', name: 'KRAS proto-oncogene, GTPase',
    aliases: ['KRAS', 'K-RAS', 'KRAS G12C', 'KRAS G12D', 'KRAS G12V', 'KRASG12C', 'KRASG12D', 'KRAS-G12C', 'KRAS-G12D', 'Kirsten rat sarcoma', 'Kirsten rat sarcoma viral oncogene', 'pan-RAS', 'RAS(ON)', 'RAS(ON) inhibitor'],
    drugs: ['sotorasib', 'adagrasib', 'divarasib', 'glecirasib', 'garsorasib', 'fulzerasib', 'olomorasib', 'opnurasib', 'calderasib', 'elironrasib', 'daraxonrasib', 'zoldonrasib', 'zoldonrasib', 'MRTX1133', 'MRTX849', 'MRTX1133', 'AMG 510', 'AMG510', 'LY3537982', 'LY3499446', 'GDC-6036', 'JDQ443', 'D-1553', 'MK-1084', 'BI 1701963', 'BI 3706674', 'HRS-4642', 'GFH925', 'IBI351', 'JAB-21822', 'RMC-6236', 'RMC-6291', 'RMC-9805', 'RMC-6236', 'ASP3082', 'INCB161734', 'QTX3034', 'HRS-7535', 'Lumakras', 'Lumykras', 'Krazati', 'ELI-002', 'mRNA-5671', 'KRAS vaccine', 'KRAS TCR', 'anti-KRAS TCR', 'KRAS G12D TCR', 'KRAS-specific T cell', 'KRAS mutant-specific TCR'],
    neighbors: [{ name: 'RAS pathway (SHP2 / SOS1 / MEK / EGFR / NRAS / HRAS)', aliases: ['NRAS', 'HRAS', 'SHP2', 'SOS1', 'BRAF', 'MEK'], drugs: ['TNO155', 'RMC-4630', 'BI-3406', 'trametinib', 'cobimetinib', 'binimetinib', 'selumetinib', 'avutometinib', 'tunlametinib', 'mirdametinib'] }],
  },
  {
    id: 'PCSK9', symbol: 'PCSK9', name: 'proprotein convertase subtilisin/kexin type 9',
    aliases: ['PCSK9', 'proprotein convertase subtilisin/kexin type 9', 'proprotein convertase subtilisin kexin type 9', 'NARC-1'],
    drugs: ['evolocumab', 'alirocumab', 'inclisiran', 'bococizumab', 'tafolecimab', 'ebronucimab', 'ongericimab', 'recaticimab', 'lerodalcibep', 'enlicitide', 'MK-0616', 'AZD0780', 'VERVE-101', 'VERVE-102', 'Repatha', 'Praluent', 'Leqvio', 'AMG 145', 'REGN727', 'SAR236553', 'PF-04950615', 'ALN-PCS', 'ALN-PCSsc', 'LIB003', 'SHR-1209', 'IBI306', 'AK102', 'JS002', 'CM-X', 'Pcsk9 vaccine', 'AT04A', 'laroprovstat', 'PCSK9 inhibitor', 'PCSK9 inhibitors', 'PCSK9i', 'PCSK9-i'],
    neighbors: [{ name: 'LDL receptor / other lipid targets (ANGPTL3, Lp(a), CETP)', aliases: ['LDLR', 'LDL receptor', 'ANGPTL3', 'Lp(a)', 'CETP', 'APOC3'], drugs: ['evinacumab', 'olpasiran', 'pelacarsen', 'obicetrapib', 'zerlasiran', 'bempedoic acid'] }],
  },
  {
    id: 'CGRP', symbol: 'CALCA', name: 'calcitonin related polypeptide alpha',
    aliases: ['CGRP', 'CGRP receptor', 'calcitonin gene-related peptide', 'calcitonin gene related peptide', 'CALCA', 'CALCRL'],
    drugs: ['erenumab', 'fremanezumab', 'galcanezumab', 'eptinezumab', 'rimegepant', 'ubrogepant', 'atogepant', 'zavegepant', 'olcegepant', 'telcagepant', 'Aimovig', 'Ajovy', 'Emgality', 'Vyepti', 'Nurtec', 'Ubrelvy', 'Qulipta', 'Zavzpret', 'AMG 334', 'TEV-48125', 'LY2951742', 'ALD403', 'BMS-927711', 'MK-1602', 'MK-8031', 'MK-3207', 'BI 44370', 'BHV-3000', 'BHV-3500', 'AGN-241689', 'anti-CGRP', 'CGRP antagonist', 'CGRP antagonists', 'CGRP monoclonal antibody', 'CGRP mAb', 'gepant', 'gepants'],
    neighbors: [{ name: 'PACAP / amylin / adrenomedullin (related peptides & receptors)', aliases: ['PACAP', 'PAC1', 'amylin', 'adrenomedullin', 'AMY1', 'RAMP1'], drugs: [].filter(d => !d.endsWith('-x')) }],
  },
]

export const SEED_INDEX = (() => {
  const m = new Map()
  // ids / symbols / names claim their key first, so "PD-L1" resolves to the PD-L1 profile even though PD-1 lists "PD-(L)1" as an alias.
  for (const pass of [t => [t.id, t.symbol, t.name], t => t.aliases]) {
    for (const t of SEED_TARGETS) for (const a of pass(t)) { const k = normKey(a); if (k && !m.has(k)) m.set(k, t) }
  }
  return m
})()

/** "PD-1" / "pd 1" / "PD‑1" → "pd1"; used for alias lookups. */
export function normKey(s) {
  return String(s ?? '').toLowerCase().replace(/α/g, 'alpha').replace(/β/g, 'beta').replace(/[^a-z0-9]+/g, '')
}
