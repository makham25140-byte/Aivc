import { ProductionBlueprint } from '../types/director';

export const SAMPLE_BLUEPRINT_SCIENCE: ProductionBlueprint = {
  id: 'sample-black-hole-60s',
  systemVersion: 'AIVC-CORE-V3.3',
  createdAt: '2026-10-08T10:00:00.000Z',
  projectTitle: 'ทำไมแม้แต่ "แสง" ถึงหนีออกจากหลุมดำไม่ได้? (60 วินาที สาระอวกาศ)',
  originalIdea: 'อธิบายว่าทำไมแสงที่มีความเร็วสูงที่สุดในจักรวาล ถึงถูกหลุมดำกลืนกินได้ ในเวลา 60 วินาที สำหรับ TikTok/Shorts ให้เข้าใจง่ายและภาพอลังการ',
  mediaToolsConfig: {
    imageGeneratorUrl: 'https://labs.google/flow',
    imageGeneratorName: 'Google Flow (labs.google/flow)',
    videoGeneratorUrl: 'https://labs.google/flow',
    videoGeneratorName: 'Google Flow (AI Studio)',
    preferredImageProvider: 'google-gemini',
    preferredVideoProvider: 'google-flow',
  },
  analysis: {
    genre: 'สารคดีวิชาการย่อยง่าย (Edutainment / Sci-Facts)',
    targetAudience: 'ผู้ใช้งาน TikTok/Reels/Shorts อายุ 15-40 ปี ที่ชอบความรู้รอบตัว ดาราศาสตร์ และภาพยนตร์ไซไฟ',
    objective: 'อธิบายทฤษฎีสัมพัทธภาพทั่วไปของไอน์สไตน์ให้คนทั่วไปเข้าใจอย่างเห็นภาพภายใน 60 วินาที',
    coreMessage: 'หลุมดำไม่ได้ "ดูด" แสงด้วยแรงดึงดูดธรรมดา แต่บิดกาลอวกาศจนเส้นทางตรงกลายเป็นทางตันที่ชี้เข้าสู่จุดศูนย์กลาง',
    toneAndMood: 'ตื่นตาตื่นใจ ลึกลับ อลังการ (Epic Cinematic, Inspiring, Mysterious)',
    estimatedTotalDurationSec: 60,
    aspectRatio: '9:16',
    platformRecommendation: 'TikTok / YouTube Shorts / IG Reels (9:16 Vertical Video)',
    hookStrategy: 'เปิดคำถามขัดแย้ง: "แสงไม่มีมวล แล้วทำไมหลุมดำถึงดูดมันได้?" ภายใน 3 วินาทีแรก พร้อมภาพลำแสงเลเซอร์ถูกโค้งงออย่างน่าทึ่ง'
  },
  scriptFlow: [
    {
      section: 'Hook (0-5s)',
      timestamp: '00:00 - 00:05',
      thaiScript: 'คุณเคยสงสัยมั้ยครับ... แสงไม่มีมวล แล้วทำไมหลุมดำถึงดูดมันได้?',
      visualIntent: 'ภาพลำแสงความเร็วสูงวิ่งผ่านอวกาศมืดมิด แล้วเริ่มโค้งงอเข้าหาเงามืดทรงกลมขนาดยักษ์',
      emotionalBeat: 'กระตุกความสงสัยและทลายความเชื่อเดิม'
    },
    {
      section: 'Intro & Problem',
      timestamp: '00:05 - 00:15',
      thaiScript: 'ตามฟิสิกส์ทั่วไป วัตถุที่จะถูกแรงโน้มถ่วงดูดต้องมีมวล แต่แสงคือโฟตอนที่ไม่มีน้ำหนัก แล้วมันตกลงไปได้ยังไง?',
      visualIntent: 'นักฟิสิกส์รุ่นใหม่ในห้องทดลองโฮโลแกรม ฉายภาพโลก เปรียบเทียบกับมวลของหลุมดำ',
      emotionalBeat: 'ตั้งโจทย์ปัญหาที่ชวนคิด'
    },
    {
      section: 'Core Content 1',
      timestamp: '00:15 - 00:30',
      thaiScript: 'คำตอบที่แท้จริงมาจาก ไอน์สไตน์! มวลมหาศาลของหลุมดำไม่ได้ดูดแสงโดยตรง แต่บิด "ผืนผ้าแห่งกาลอวกาศ" จนบิดเบี้ยวขั้นรุนแรง',
      visualIntent: 'กราฟิก 3 มิติ จำลองตาข่ายกาลอวกาศ (Spacetime Grid) ถูกหลุมดำทิ้งตัวลงจนลึกเป็นกรวยลึกไร้ก้น',
      emotionalBeat: 'เผยความจริงทางวิทยาศาสตร์อันตื่นตา'
    },
    {
      section: 'Core Content 2',
      timestamp: '00:30 - 00:45',
      thaiScript: 'แสงยังคงเดินทางเป็นเส้นตรงตามความเร็วของมันเสมอ... แต่ "เส้นทางตรง" ในกาลอวกาศแถวนั้น ถูกบิดให้มุ่งหน้าลงสู่จุดศูนย์กลางเท่านั้น!',
      visualIntent: 'ลำแสงเลเซอร์พยายามพุ่งเป็นเส้นตรง แต่พื้นผิวที่มันวิ่งอยู่ถูกบิดหมุนวนลงไปในหลุมดำ',
      emotionalBeat: 'Eureka Moment - คนดูร้องอ๋อ'
    },
    {
      section: 'Climax / Revelation',
      timestamp: '00:45 - 00:55',
      thaiScript: 'เมื่อก้าวข้าม "ขอบฟ้าเหตุการณ์" (Event Horizon) ความเร็วในการหลบหนีจะสูงกว่าความเร็วแสง และในจักรวาลนี้... ไม่มีอะไรเร็วไปกว่าแสงอีกแล้ว!',
      visualIntent: 'ภาพจานพอกพูนมวล (Accretion Disk) สว่างจ้าเรืองแสงสีทองหมุนวนรอบเงาดำสนิทอย่างยิ่งใหญ่',
      emotionalBeat: 'จุดพีคของพลังจักรวาลที่น่าเกรงขาม'
    },
    {
      section: 'Call to Action & Outro',
      timestamp: '00:55 - 01:00',
      thaiScript: 'ถ้าคุณชอบความลับของจักรวาล กดติดตาม แล้วมาท่องอวกาศไปด้วยกันครับ!',
      visualIntent: 'นักดาราศาสตร์หันมาสบตากล้อง พร้อมขึ้นกราฟิกปุ่มกดติดตามและคำถามชวนคอมเมนต์',
      emotionalBeat: 'สร้างความผูกพันและกระตุ้นยอด Engagement'
    }
  ],
  characters: [
    {
      id: 'char-astrophysicist',
      name: 'ดร. นภันต์ (Dr. Napan)',
      role: 'ผู้ดำเนินรายการ / นักฟิสิกส์ดาราศาสตร์รุ่นใหม่',
      ageAndGender: 'ชายไทย อายุประมาณ 28-30 ปี',
      visualIdentity: {
        faceAndHair: 'ใบหน้าคมคาย ผิวสองสี ทรงผมอันเดอร์คัทจัดทรงเรียบร้อย สวมแว่นตากรอบไทเทเนียมบางเรียบหรู สายตามุ่งมั่นเปี่ยมความรู้',
        clothing: 'เสื้อยืดคอกลมสีดำสนิท สวมทับด้วยแจ็กเก็ตบอมเบอร์สีน้ำเงินเข้มเนวีบลูสไตล์มินิมอลโมเดิร์น',
        accessoriesAndTraits: 'สมาร์ทวอทช์สีดำด้านที่ข้อมือซ้าย ไม่มีเครื่องประดับฉูดฉาด บุคลิกน่าเชื่อถือแต่เข้าถึงง่าย',
        expressionBaseline: 'รอยยิ้มบางๆ ที่มุมปาก ดวงตาเป็นประกายเมื่อพูดถึงวิทยาศาสตร์'
      },
      consistencyLockPrompt: 'A 29-year-old Thai male astrophysicist with neat short black undercut hair, wearing minimalist thin titanium eyeglasses, dressed in a plain matte black crewneck shirt under a sleek navy-blue bomber jacket, sharp intelligent dark eyes, friendly modern scientific educator demeanor',
      negativePrompt: 'deformed facial features, western appearance, blonde hair, changing eyeglasses frame, changing jacket color, goofy expressions, cartoon style',
      isLocked: true,
      canonicalDescription: 'A 29-year-old Thai male astrophysicist with neat short black undercut hair, wearing minimalist thin titanium eyeglasses, sharp intelligent dark eyes, friendly modern scientific educator demeanor',
      canonicalClothing: 'Plain matte black crewneck shirt under a sleek navy-blue bomber jacket, matte black smartwatch on left wrist',
      referenceImageNotes: 'Portrait with warm golden rim light and subtle cyan key light, minimalist thin titanium eyeglasses'
    }
  ],
  environments: [
    {
      locationName: 'Deep Space Observational Deck & Digital Lab',
      visualStyle: 'ห้องแล็บสังเกตการณ์อวกาศไฮเทคมินิมอล แสงไฟสีน้ำเงินนีออนอ่อนและสีอำพัน กระจกพาโนรามามองเห็นอวกาศลึก',
      lightingSetup: 'Cinematic rim lighting, soft ambient cyan fill, dramatic key light on subject face',
      consistencyPromptLock: 'High-tech modern minimalist astrophysics observatory laboratory, sleek glass holographic displays floating, background panoramic space window overlooking distant stars and nebulas, moody deep cyan and warm amber accent lighting'
    }
  ],
  shots: [
    {
      sceneId: 'SC-01',
      shotNumber: 1,
      sceneNumber: 1,
      characterIds: ['char-astrophysicist'],
      promptConsistencyStatus: 'CONSISTENT',
      selectedVideoWorkflowProvider: 'google-flow',
      generationStatus: 'PROMPT_READY',
      referenceImage: '',
      generatedImage: '',
      generatedVideo: '',
      mediaNotes: 'พร้อมนำ Positive Prompt ไปสร้างภาพนิ่งตั้งต้นใน Bing / SeaArt',
      timeRange: '00:00 - 00:05',
      durationSec: 5,
      shotType: 'Close-Up',
      cameraMovement: 'Slow Zoom In',
      compositionAndLighting: 'มุมมองระดับสายตา กึ่งกลางเฟรม แสงขอบสีส้มทองสะท้อนบนแว่นตา ฉากหลังเป็นอวกาศมืด',
      actionDescription: 'ดร. นภันต์ สบตากับกล้องด้วยแววตาสงสัย ปลายนิ้วแตะอากาศเสมือนสัมผัสลำแสงโฮโลแกรม',
      imagePrompt: {
        positivePromptEn: 'Cinematic close-up of a 29-year-old Thai male astrophysicist with neat black undercut hair and thin titanium glasses, wearing a sleek navy-blue bomber jacket, intense questioning gaze directly into camera, holding a luminous golden photon laser beam hovering between his fingers, dark observatory background with starry void, 8k resolution, photorealistic, 35mm lens, f/1.8, shallow depth of field --ar 9:16',
        styleTags: 'Cinematic, Hyper-realistic, 8k, Sci-Fi Film Still, Unreal Engine 5 aesthetic',
        aspectRatio: '9:16',
        lightingAndLens: 'Warm golden edge light, subtle cyan key light, 35mm cinema prime lens',
        negativePrompt: 'blurry, distorted face, duplicate limbs, anime, plastic skin, low resolution',
        thaiExplanation: 'ภาพโคลสอัพ ดร. นภันต์ มองกล้องพร้อมลำแสงสีทองลอยอยู่ระหว่างนิ้ว สร้างความสงสัยทันที'
      },
      motionPrompt: {
        videoPromptEn: 'Smooth slow push-in camera toward the male scientist, subtle gentle floating dust particles, luminous golden light beam pulsing with soft radiant energy between his fingers, cinematic 24fps motion, realistic facial micro-expressions',
        cameraMotionDirective: 'Camera slow push-in, static character position with natural breathing',
        motionIntensity: 'Low (1-3)',
        recommendedTools: ['Kling 1.5 Free', 'Runway Gen-3', 'Luma Dream Machine'],
        thaiExplanation: 'กล้องซูมเข้าใบหน้าช้าๆ ลำแสงส่องประกายวูบวาบเบาๆ สีหน้าดูจริงจังชวนติดตาม'
      },
      audioDesign: {
        thaiVoiceover: 'คุณเคยสงสัยมั้ยครับ... แสงไม่มีมวล แล้วทำไมหลุมดำถึงดูดมันได้?',
        voiceToneAndPacing: 'น้ำเสียงทุ้ม ชัดถ้อยชัดคำ เน้นคำว่า "ไม่มีมวล" และ "ดูดมันได้"',
        sfx: 'เสียง Whoosh พุ่งของลำแสงความเร็วสูง ตามด้วยเสียง Bass Drop ความถี่ต่ำแบบลึกลับ',
        bgmCue: 'เสียงดนตรี Ambient Synth อวกาศลึกลับ ค่อยๆ ดังขึ้นช้าๆ'
      },
      editingDirection: {
        cutType: 'Hard Cut',
        thaiSubtitleOverlay: 'แสงไม่มีมวล... แล้ว "หลุมดำ" ดูดมันได้ไง?',
        visualEffectOrSticker: 'ตัวหนังสือสีเหลืองนีออน ปรากฏแบบ Pop-up ดึงดูดสายตา',
        pacingNote: 'ตัดเข้าสู่ช็อตที่ 2 ทันทีที่ประโยคคำถามจบ เพื่อไม่ให้เสียความลื่นไหล'
      },
      continuityTag: 'จุดเชื่อมต่อ: แว่นตาและชุดของ ดร. นภันต์ ต้องตรงกับช็อตที่ 2'
    },
    {
      sceneId: 'SC-02',
      shotNumber: 2,
      sceneNumber: 1,
      characterIds: ['char-astrophysicist'],
      promptConsistencyStatus: 'CONSISTENT',
      selectedVideoWorkflowProvider: 'google-flow',
      generationStatus: 'PROMPT_READY',
      referenceImage: 'SC-01 (ภาพใบหน้าและชุดของ ดร. นภันต์)',
      generatedImage: '',
      generatedVideo: '',
      mediaNotes: 'ต้องใช้ภาพจาก SC-01 เป็น Reference Image ในการเจนภาพ',
      timeRange: '00:05 - 00:15',
      durationSec: 10,
      shotType: 'Medium Shot',
      cameraMovement: 'Pan Left/Right',
      compositionAndLighting: 'ด้านข้าง 45 องศา โฮโลแกรมโลกสีน้ำเงินลอยอยู่ข้างตัว ดร. นภันต์ แสงสะท้อนสีฟ้าครามบนใบหน้า',
      actionDescription: 'ดร. นภันต์ ผายมือไปยังลูกโลกจำลองที่กำลังหมุน แล้วเปรียบเทียบกับภาพจำลองหลุมดำ',
      imagePrompt: {
        positivePromptEn: 'Medium shot of a 29-year-old Thai male scientist in navy jacket and thin glasses standing in futuristic digital laboratory, gesturing toward a floating translucent blue holographic Earth and an equation tensor hologram, deep navy and cyan ambient lighting, cinematic, photorealistic, octanerender, 50mm portrait lens --ar 9:16',
        styleTags: 'Photorealistic, High-tech, Science Documentary Style, Clean composition',
        aspectRatio: '9:16',
        lightingAndLens: 'Bioluminescent cyan glow from hologram, soft studio fill light',
        negativePrompt: 'extra arms, deformed fingers, low poly, noisy, cartoonish',
        thaiExplanation: 'ภาพครึ่งตัว ดร. นภันต์ กับโมเดลโฮโลแกรมโลกสีฟ้า อธิบายมวลและแรงโน้มถ่วง'
      },
      motionPrompt: {
        videoPromptEn: 'Slow camera pan to the right, scientist hands gesturing smoothly toward holographic globe rotating gently in mid-air, particle dust shimmering, smooth natural gestures, cinematic depth',
        cameraMotionDirective: 'Camera slow pan right, character moves hand smoothly',
        motionIntensity: 'Low (1-3)',
        recommendedTools: ['Kling 1.5', 'Haiper 2.0 Free'],
        thaiExplanation: 'กล้องแพนไปทางขวาช้าๆ มือขยับอธิบาย โฮโลแกรมหมุนสมูท'
      },
      audioDesign: {
        thaiVoiceover: 'ตามฟิสิกส์ทั่วไป วัตถุที่จะถูกแรงโน้มถ่วงดูดต้องมีมวล แต่แสงคือโฟตอนที่ไม่มีน้ำหนัก แล้วมันตกลงไปได้ยังไง?',
        voiceToneAndPacing: 'น้ำเสียงเล่าเรื่องแบบมืออาชีพ จังหวะมั่นคง ชัดเจน',
        sfx: 'เสียงโฮโลแกรมกริ๊กแบบ UI Futuristic เบาๆ',
        bgmCue: 'เสียงจังหวะ Tick-tock ดิจิทัลคลอเบาๆ บิ้วด์ให้ตั้งใจฟัง'
      },
      editingDirection: {
        cutType: 'Cross Dissolve',
        thaiSubtitleOverlay: 'แสงไม่มีมวล = ไม่มีน้ำหนัก!',
        visualEffectOrSticker: 'ไฮไลต์คำว่า "ไม่มีมวล" ด้วยกรอบสีแดงแจ้งเตือน',
        pacingNote: 'ช็อตนี้ 10 วิ แบ่งเป็น 2 จังหวะพูดต่อเนื่อง'
      },
      continuityTag: 'คงระดับความสูงสายตาของ ดร. นภันต์'
    },
    {
      sceneId: 'SC-03',
      shotNumber: 3,
      sceneNumber: 2,
      characterIds: [],
      promptConsistencyStatus: 'CONSISTENT',
      selectedVideoWorkflowProvider: 'google-flow',
      generationStatus: 'PROMPT_READY',
      referenceImage: '',
      generatedImage: '',
      generatedVideo: '',
      mediaNotes: 'เน้นสีของ Spacetime Grid เป็นสีม่วงนีออนตาม Visual Bible',
      timeRange: '00:15 - 00:30',
      durationSec: 15,
      shotType: 'Wide Shot',
      cameraMovement: 'Tilt Up/Down',
      compositionAndLighting: 'Bird-eye view กึ่งเอียง 45 องศา แสดงผืนผ้าตารางกาลอวกาศสีม่วงนีออนถูกทับจนบุ๋มลงไปเป็นกรวยลึก',
      actionDescription: 'ตาข่ายกาลอวกาศ 3D Grid ถูกวัตถุมวลมหาศาลทับจนยืดโค้งงออย่างรุนแรงเป็นมิติหลุมลึก',
      imagePrompt: {
        positivePromptEn: 'Spectacular wide visualization of Einstein general relativity spacetime fabric, 3D luminous neon grid bending sharply downward under immense invisible gravitational well, warped space grid curved into a funnel, cosmic purple and electric blue lines, photorealistic scientific CGI, NASA style visualization --ar 9:16',
        styleTags: 'Scientific CGI, Quantum Physics Visualization, 8k, Christopher Nolan Interstellar vibe',
        aspectRatio: '9:16',
        lightingAndLens: 'Glowing neon grid lines, deep obsidian void shadows, wide anamorphic angle',
        negativePrompt: '2D flat drawing, messy lines, oversaturated rainbow colors',
        thaiExplanation: 'ภาพกราฟิก 3D ตาข่ายกาลอวกาศถูกบิดงอเป็นกรวยลึกตามทฤษฎีไอน์สไตน์'
      },
      motionPrompt: {
        videoPromptEn: 'Camera tilts downward into the gravitational well, neon spacetime grid stretching and warping dynamically downward in high tension, cosmic energy ripple flowing across the distorted grid',
        cameraMotionDirective: 'Camera slow tilt down following the funnel curve',
        motionIntensity: 'Medium (4-6)',
        recommendedTools: ['Kling 1.5 Free', 'Runway Gen-3', 'Luma'],
        thaiExplanation: 'กล้องทิลต์ก้มลงตามรอยบุ๋มของกาลอวกาศ เส้นตารางขยับบิดเบี้ยวต่อเนื่อง'
      },
      audioDesign: {
        thaiVoiceover: 'คำตอบที่แท้จริงมาจาก ไอน์สไตน์! มวลมหาศาลของหลุมดำไม่ได้ดูดแสงโดยตรง แต่บิด "ผืนผ้าแห่งกาลอวกาศ" จนบิดเบี้ยวขั้นรุนแรง',
        voiceToneAndPacing: 'เพิ่มพลังเสียงให้ตื่นเต้น เน้นชื่อ "ไอน์สไตน์" และคำว่า "บิดผืนผ้าแห่งกาลอวกาศ"',
        sfx: 'เสียง Warp sound effect หนักแน่น และเสียงแรงดึงมวลอวกาศลึก',
        bgmCue: 'เสียงเชลโล่หรือออร์แกนซาวด์แทร็กสไตล์ Interstellar ขึ้นมาเสริมอารมณ์'
      },
      editingDirection: {
        cutType: 'Zoom Blur',
        thaiSubtitleOverlay: 'หลุมดำบิด "กาลอวกาศ" ไม่ใช่แค่ดูดวัตถุ!',
        visualEffectOrSticker: 'กราฟิก 3D Arrow ชี้แนวโน้มความโค้ง',
        pacingNote: 'จังหวะเพลง Interstellar สอดรับกับการซูมเข้ากรวย'
      },
      continuityTag: 'รักษาโทนสีน้ำเงินม่วงของกาลอวกาศให้ตรงกับช็อตที่ 4'
    },
    {
      sceneId: 'SC-04',
      shotNumber: 4,
      sceneNumber: 2,
      characterIds: [],
      promptConsistencyStatus: 'CONSISTENT',
      selectedVideoWorkflowProvider: 'google-flow',
      generationStatus: 'PROMPT_READY',
      referenceImage: '',
      generatedImage: '',
      generatedVideo: '',
      mediaNotes: 'ลำแสงสีทอง (Amber Gold Photons) ต้องตรงกับ SC-01',
      timeRange: '00:30 - 00:45',
      durationSec: 15,
      shotType: 'Point of View (POV)',
      cameraMovement: 'Tracking Shot',
      compositionAndLighting: 'มุมมองติดตามลำแสงเลเซอร์สีทองที่กำลังพุ่งไปข้างหน้า แต่เส้นทางรอบตัวโค้งงอลงสู่วังวนมืด',
      actionDescription: 'ลำแสงเดินทางเป็นเส้นตรงในมุมมองของตัวมันเอง แต่ผืนอวกาศที่มันอยู่กำลังถูกดูดหมุนวนลงไป',
      imagePrompt: {
        positivePromptEn: 'First-person perspective tracking a high-velocity golden beam of light moving forward through heavily warped curved spacetime corridor, bent geometry of space spiraling toward an ominous black void, hyper-detailed cosmic distortion, gravitational lensing effect, photorealistic ray tracing --ar 9:16',
        styleTags: 'Cinematic VFX, Gravitational Lensing, Hyper-speed, Photorealistic',
        aspectRatio: '9:16',
        lightingAndLens: 'Extreme gravitational light bending, chromatic aberration at edges, fisheye effect',
        negativePrompt: 'flat texture, motionless, cartoon, low quality',
        thaiExplanation: 'มุมมองเกาะติดลำแสงที่พุ่งตรง แต่ทางวิ่งถูกบิดโค้งวนลงสู่หลุมดำ'
      },
      motionPrompt: {
        videoPromptEn: 'Rapid smooth forward tracking motion along the bending golden light path, spacetime bending around the camera with swirling gravitational lensing, hyper-smooth cosmic motion blur',
        cameraMotionDirective: 'Fast forward camera tracking with rotational curvature',
        motionIntensity: 'High (7-10)',
        recommendedTools: ['Kling 1.5', 'Runway Gen-3'],
        thaiExplanation: 'กล้องพุ่งตามลำแสงไปข้างหน้าอย่างรวดเร็ว ภาพรอบข้างบิดเป็นวงแหวนแรงโน้มถ่วง'
      },
      audioDesign: {
        thaiVoiceover: 'แสงยังคงเดินทางเป็นเส้นตรงตามความเร็วของมันเสมอ... แต่ "เส้นทางตรง" ในกาลอวกาศแถวนั้น ถูกบิดให้มุ่งหน้าลงสู่จุดศูนย์กลางเท่านั้น!',
        voiceToneAndPacing: 'น้ำเสียงคลี่คลายปริศนา เน้นจังหวะเว้นวรรค "...แต่เส้นทางตรงแถวนั้น ถูกบิดลงจุดศูนย์กลาง"',
        sfx: 'เสียงเลเซอร์พุ่งแหลมสูง ผสมกับเสียงแรงเหวี่ยงอวกาศ',
        bgmCue: 'ดนตรีค่อยๆ เร่งเทมโปเข้าสู่จุดพีค'
      },
      editingDirection: {
        cutType: 'Match Cut',
        thaiSubtitleOverlay: 'แสงวิ่งตรงเสมอ... แต่ถนนมันโค้ง!',
        visualEffectOrSticker: 'ข้อความเน้นไฮไลต์ "ถนนมันโค้ง"',
        pacingNote: 'ตัดต่อแบบเร็วตามความเร็วแสง'
      },
      continuityTag: 'สีของลำแสงสีทองต้องเป็นเฉดเดียวกับช็อตที่ 1'
    },
    {
      sceneId: 'SC-05',
      shotNumber: 5,
      sceneNumber: 3,
      characterIds: [],
      promptConsistencyStatus: 'CONSISTENT',
      selectedVideoWorkflowProvider: 'google-flow',
      generationStatus: 'PROMPT_READY',
      referenceImage: '',
      generatedImage: '',
      generatedVideo: '',
      mediaNotes: 'จานพอกพูนมวลสีส้มทองหมุนวนรอบดวงตาดำสนิท สไตล์ Interstellar',
      timeRange: '00:45 - 00:55',
      durationSec: 10,
      shotType: 'Extreme Wide Shot',
      cameraMovement: 'Orbit 360',
      compositionAndLighting: 'ภาพหลุมดำยักษ์สมบูรณ์แบบ Gargantua-style จานพอกพูนมวลสีส้มทองหมุนวนรอบดวงตาดำมืดสนิท',
      actionDescription: 'จานพอกพูนมวลรอบขอบฟ้าเหตุการณ์ (Event Horizon) เรืองแสงระยิบระยับ แสงบางส่วนโค้งพาดข้ามหัวหลุมดำ',
      imagePrompt: {
        positivePromptEn: 'Breathtaking cinematic mastershot of a gargantuan supermassive black hole with glowing fiery golden accretion disk, Einstein gravitational lensing bending the light above and below the event horizon, pitch-black shadow silhouette in center, surrounded by deep stellar cosmos, photorealistic 8k IMAX fidelity, Interstellar movie visual style --ar 9:16',
        styleTags: 'IMAX Masterpiece, Photorealistic, Astrophysical Accuracy, High Dynamic Range',
        aspectRatio: '9:16',
        lightingAndLens: 'Blinding golden photon ring glow, deep ink-black event horizon, IMAX 70mm lens',
        negativePrompt: 'blurry, fake flames, amateur art, cartoon, low contrast',
        thaiExplanation: 'ภาพมุมกว้างอลังการของหลุมดำยักษ์พร้อมจานแสงสีทองหมุนวน สไตล์หนัง Interstellar'
      },
      motionPrompt: {
        videoPromptEn: 'Majestic slow orbital rotation around the supermassive black hole, accretion disk swirling smoothly at high relativistic speeds, light bending dynamically around the black sphere event horizon, epic cinematic grandeur',
        cameraMotionDirective: 'Slow circular orbital camera rotation',
        motionIntensity: 'Medium (4-6)',
        recommendedTools: ['Kling 1.5 Free', 'Luma Dream Machine', 'Runway Gen-3'],
        thaiExplanation: 'กล้องโคจรหมุนรอบหลุมดำช้าๆ แผ่นก๊าซร้อนหมุนวนด้วยความเร็วสูง แสงโค้งพาดผ่าน'
      },
      audioDesign: {
        thaiVoiceover: 'เมื่อก้าวข้าม "ขอบฟ้าเหตุการณ์" (Event Horizon) ความเร็วในการหลบหนีจะสูงกว่าความเร็วแสง และในจักรวาลนี้... ไม่มีอะไรเร็วไปกว่าแสงอีกแล้ว!',
        voiceToneAndPacing: 'น้ำเสียงทรงพลัง เข้มขลัง หนักแน่นสะกดอารมณ์',
        sfx: 'เสียง Sub-bass ครางกระหึ่มลึก เสียงสะท้อนแห่งความเงียบสงัดในอวกาศ',
        bgmCue: 'เสียงดนตรีประสานเสียงวงออร์เคสตราสว่างวาบถึงขีดสุด'
      },
      editingDirection: {
        cutType: 'Cross Dissolve',
        thaiSubtitleOverlay: 'Event Horizon: ไม่มีสิ่งใดเร็วไปกว่าแสง!',
        visualEffectOrSticker: 'วงแหวนเรืองแสงล้อมรอบคำว่า Event Horizon',
        pacingNote: 'ปล่อยให้ภาพหลุมดำฉายเต็มตา 2-3 วินาทีก่อนตัดไปที่บทสรุป'
      },
      continuityTag: 'ความสว่างของแสงหลุมดำเป็นจุดจำสายตาหลัก'
    },
    {
      sceneId: 'SC-06',
      shotNumber: 6,
      sceneNumber: 3,
      characterIds: ['char-astrophysicist'],
      promptConsistencyStatus: 'CONSISTENT',
      selectedVideoWorkflowProvider: 'google-flow',
      generationStatus: 'PROMPT_READY',
      referenceImage: 'SC-01 (ดร. นภันต์ ใบหน้าและชุดหลัก)',
      generatedImage: '',
      generatedVideo: '',
      mediaNotes: 'ต้องใช้ภาพจาก SC-01 เป็น Reference Image เพื่อล็อคหน้าตาและชุด',
      timeRange: '00:55 - 01:00',
      durationSec: 5,
      shotType: 'Medium Shot',
      cameraMovement: 'Static',
      compositionAndLighting: 'ดร. นภันต์ ในชุดเดิม สวมแว่นตาเดิม หันมายิ้มอย่างเป็นมิตร แสงสีทองจากหลุมดำส่องเป็น Rim light ด้านหลัง',
      actionDescription: 'ดร. นภันต์ พยักหน้าเบาๆ ชี้ไปที่ปุ่มติดตาม และยิ้มทิ้งท้าย',
      imagePrompt: {
        positivePromptEn: 'Medium shot of 29-year-old Thai male astrophysicist with neat black undercut hair and thin titanium eyeglasses, dressed in navy bomber jacket, smiling warmly and confidently at camera, futuristic observatory window with faint golden nebula in background, professional lighting, cinematic, photorealistic --ar 9:16',
        styleTags: 'Cinematic, Professional Host, Warm and Engaging, 8k',
        aspectRatio: '9:16',
        lightingAndLens: 'Warm backlight, soft key light on face, 50mm lens',
        negativePrompt: 'deformed face, different glasses, yellow teeth, distorted eyes',
        thaiExplanation: 'ดร. นภันต์ ยิ้มอย่างอบอุ่นให้ผู้ชม ชวนกดติดตามและคอมเมนต์'
      },
      motionPrompt: {
        videoPromptEn: 'Gentle nod and warm smile from the Thai scientist looking into lens, subtle natural head movement, clean warm lighting, stable camera',
        cameraMotionDirective: 'Locked static camera, subtle subject movement',
        motionIntensity: 'Low (1-3)',
        recommendedTools: ['Kling 1.5 Free', 'Haiper 2.0'],
        thaiExplanation: 'ดร. นภันต์ พยักหน้ายิ้มเบาๆ ท่าทางเป็นมิตร'
      },
      audioDesign: {
        thaiVoiceover: 'ถ้าคุณชอบความลับของจักรวาล กดติดตาม แล้วมาท่องอวกาศไปด้วยกันครับ!',
        voiceToneAndPacing: 'น้ำเสียงเป็นกันเอง ยิ้มแย้ม ชวนคุย',
        sfx: 'เสียงกระดิ่ง Ping ใสๆ ของการกดไลก์/กดติดตาม',
        bgmCue: 'ดนตรีค่อยๆ Fade out ลงอย่างนุ่มนวล'
      },
      editingDirection: {
        cutType: 'Fade to Black',
        thaiSubtitleOverlay: 'กดติดตามท่องจักรวาลไปด้วยกัน 🚀',
        visualEffectOrSticker: 'ปุ่มกด Follow และหัวใจลอยขึ้นมาเบาๆ',
        pacingNote: 'ตัดจบตรงวินาทีที่ 60 พอดีเป๊ะ'
      },
      continuityTag: 'ตรวจเช็คแว่นตา เสื้อผ้า ให้ตรงกับช็อตที่ 1 และ 2'
    }
  ],
  assemblyMasterPlan: {
    timelineSummary: 'ลำดับช็อต 1 ถึง 6 รวม 60 วินาที โดยเน้นตัดต่อให้ตรงกับ Beat เสียงพากย์และซาวด์เอฟเฟกต์ใน CapCut',
    bgmTrackRecommendation: 'เพลงฟรีแนว "Space Cinematic Tension to Triumph" หรือ "Deep Ambient Synthwave" จังหวะประมาณ 95 BPM',
    colorGradingLut: 'Sci-Fi Teal & Gold (เพิ่มความอิ่มสีของจานแสงสีทอง และคุมโทนเงามืดให้เป็นสี Deep Obsidian Cyan)',
    capcutAssemblySteps: [
      '1. เปิดแอปพลิเคชัน CapCut (Desktop หรือ Mobile) กด New Project และตั้งค่า Format เป็น 9:16',
      '2. นำเข้าคลิปวิดีโอทั้ง 6 ช็อตที่ดาวน์โหลดมาจาก Kling / Haiper / Luma เรียงลำดับจากช็อต 1 ถึง 6',
      '3. นำเข้าไฟล์เสียงพากย์ภาษาไทย หรือใช้ฟังก์ชัน "Text to Speech" ของ CapCut เลือกเสียงภาษาไทยธรรมชาติ',
      '4. ปรับ Speed หรือ Trim คลิปวิดีโอให้ความยาวของแต่ละช็อตซิงค์พอดีกับประโยคพากย์ (Shot 1: 5s, Shot 2: 10s, Shot 3: 15s, Shot 4: 15s, Shot 5: 10s, Shot 6: 5s)',
      '5. ใส่ Transition: Shot 1->2 (Hard Cut), Shot 2->3 (Zoom Blur), Shot 3->4 (Camera Shake / Match Cut), Shot 4->5 (Cross Dissolve 0.5s)',
      '6. กดปุ่ม "Auto Captions" (คำบรรยายอัตโนมัติ) ภาษาไทย เลือกฟอนต์อ่านง่าย เช่น Sukhumvit หรือ Kanit ใส่สีเหลืองสลับขาว',
      '7. ดึงไฟล์ BGM เข้าไทม์ไลน์ ลดระดับเสียง BGM ลงเหลือ -18dB เพื่อไม่ให้กลบเสียงพูด',
      '8. ใส่ Sound Effects (Whoosh, Sub-bass drop, Ping) ในจุดจังหวะเปลี่ยนช็อต',
      '9. Export เป็นความละเอียด 1080p, 60fps หรือ 30fps พร้อมอัปโหลดขึ้น TikTok / Reels / Shorts ได้ทันที'
    ],
    freeExportWorkflow: [
      '1. สร้างภาพนิ่งต้นฉบับฟรี: ใช้ Bing Image Creator (copilot.microsoft.com) หรือ SeaArt.ai (มีเครดิตฟรีทุกวัน) นำ Positive Prompt ของแต่ละช็อตไปวาง',
      '2. ขยับภาพเป็นวิดีโอฟรี: ใช้ Kling AI (klingai.com ให้เครดิตฟรีวันละ 66 เครดิต) นำภาพจากขั้นตอนที่ 1 ไปใส่ในโหมด Image to Video และวาง Motion Prompt',
      '3. เจนเสียงพากย์ฟรี: ใช้เครื่องมือ Text-to-Speech ในตัวของ CapCut หรือ Edge-TTS ฟรี ไม่จำกัดจำนวนคำ',
      '4. ตัดต่อฟรี: ใช้ CapCut ฟรี 100% ไม่ติดลายน้ำเมื่อกดลบตอนท้ายคลิป'
    ]
  },
  audit: {
    characterConsistencyStatus: 'สมบูรณ์',
    characterAuditNotes: [
      'ตัวละคร ดร. นภันต์ ปรากฏในช็อตที่ 1, 2 และ 6 ทุกช็อตใช้ Consistency Lock Prompt ล็อคแว่นตาไทเทเนียม ทรงผม และแจ็กเก็ตสีน้ำเงินตัวเดิม',
      'คำแนะนำ: ให้เจนภาพช็อตที่ 1 ให้สวยที่สุดก่อน แล้วนำภาพใบหน้าของ ดร. นภันต์ ในช็อตที่ 1 ไปใช้เป็น Character Reference Image (--cref ใน Midjourney หรือ Face Lock ใน SeaArt) สำหรับช็อตที่ 2 และ 6'
    ],
    wardrobeAndPropsCheck: [
      'ช็อต 1: เสื้อยืดดำ + แจ็กเก็ตบอมเบอร์เนวีบลู + แว่นตาไทเทเนียม',
      'ช็อต 2: เสื้อยืดดำ + แจ็กเก็ตบอมเบอร์เนวีบลู + แว่นตาไทเทเนียม (คงที่สมบูรณ์)',
      'ช็อต 6: เสื้อยืดดำ + แจ็กเก็ตบอมเบอร์เนวีบลู + แว่นตาไทเทเนียม (คงที่สมบูรณ์)'
    ],
    lightingContinuityCheck: [
      'ช็อตในห้องสังเกตการณ์คุมแสงคีย์ไลต์สีฟ้าคราม ผสมแสงขอบสีทองส้มอย่างต่อเนื่อง',
      'ช็อตในอวกาศ (ช็อต 3, 4, 5) คุมโทนสีทองของจานแสงและตาข่ายกาลอวกาศสีม่วง/น้ำเงิน ไม่หลุดธีม'
    ],
    factCheckVerification: {
      isFactualOrEducational: true,
      verificationNotes: [
        'ทฤษฎีถูกต้องตามหลักฟิสิกส์: แสงเป็นอนุภาคโฟตอนไม่มีมวลหยุดนิ่ง (Zero rest mass) แต่เคลื่อนที่ตามเส้น Geodesic (เส้นทางที่สั้นที่สุด) บนกาลอวกาศที่โค้งงอตามสมการสนามไอน์สไตน์ (Einstein Field Equations)',
        'ขอบฟ้าเหตุการณ์ (Event Horizon) คือจุดที่ความเร็วหลุดพ้นเท่ากับความเร็วแสงจริง วัตถุหรือคลื่นแม่เหล็กไฟฟ้าใดๆ ภายในขอบฟ้าเหตุการณ์จะไม่สามารถส่งสัญญาณออกมาภายนอกได้',
        'ไม่มีการแต่งเติมความเท็จทางวิทยาศาสตร์'
      ],
      potentialHallucinationAlerts: [],
      sourcesOrCheckpoints: [
        'Albert Einstein (1915) - The Foundation of the General Theory of Relativity',
        'NASA Black Hole Fact Sheet & Event Horizon Telescope Collaboration (2019/2022)'
      ]
    },
    editingPacingCheck: [
      'แบ่งเวลาได้กระชับ: 5s -> 10s -> 15s -> 15s -> 10s -> 5s รวม 60 วินาทีพอดี เหมาะสมกับพฤติกรรมการดูคลิปสั้นบนมือถือ'
    ],
    directorActionItems: [
      '1. อย่าลืมตั้งค่า Aspect Ratio ใน Kling หรือเครื่องมือสร้างภาพเป็น 9:16 แนวตั้งตั้งแต่แรก จะได้ไม่ต้อง Crop ภาพภายหลัง',
      '2. ในช็อตที่ 4 (POV ลำแสง) ให้ใช้ Motion Strength ปานกลางค่อนข้างสูง (ระดับ 6-7) เพื่อสร้างความรู้สึกพุ่งทะยาน',
      '3. ตรวจสอบให้แน่ใจว่าเสียงพากย์ใน CapCut อ่านคำว่า "โฟตอน" และ "กาลอวกาศ" ถูกต้องตามอักขรวิธี'
    ]
  },
  productionStatusNotice: 'สถานะ: แผนการผลิตวิดีโอระดับมืออาชีพ (Production Blueprint Ready) - เอกสารวางแผนพร้อมใช้งานจริง ไม่ใช่ไฟล์วิดีโอสำเร็จรูป คุณสามารถคัดลอก Prompts ไปสร้างภาพ วิดีโอ และเสียงตามขั้นตอนเครื่องมือฟรีได้ทันที'
};
