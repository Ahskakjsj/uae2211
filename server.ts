import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy-initialize Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `أنت "مساعد الزعابي الذكي" (Alzaabi AI Assistant) - الذكاء الاصطناعي الرسمي المدمج في منصة "محرك الزعابي لفحص التريقرات وتأمين سيرفرات FiveM" (Alzaabi FiveM Security Scanner & Trigger Auditor).

مهمتك الأساسية:
مساعدة أي زائر أو مطور يدخل الموقع، والإجابة عن كافة أسئلته حول الموقع وميزاته، وكيفية استخدامه، وتوضيح مفاهيم أمان FiveM و Lua والسكربتات، وتأمين التريقرات، وصيد الباكدور والهاكرز.

معلومات شاملة عن موقع "محرك الزعابي لفحص التريقرات":
1. ما هو الموقع؟
- منصة أمنية عربية وعالمية احترافية لفحص وتدقيق سكربتات وحزم موارد FiveM (FiveM Resources).
- يقوم بفحص ملفات اللوا (.lua) واستخراج أحداث الشبكة (TriggerServerEvent, TriggerClientEvent, RegisterNetEvent) وتحليل أمانها بدقة، وتصنيف درجة الخطورة (حرجة، عالية، متوسطة، عادية).

2. ما هي الأدوات والميزات المتوفرة في الموقع؟
- **فحص ملفات السيرفر (Scan ZIP)**: رفع حزمة الموارد ZIP وفحص كافة الأكواد دفعة واحدة، واستخراج التريقرات والويب هوكات والباكدورات.
- **عينة تجريبية (Demo Package)**: زر لتجربة فحص حزمة افتراضية واقعية تحوي لوقوهات وأكواد مشفرة وتريقرات خطيرة.
- **فحص كود سريع (Quick Scan)**: لصق أي كود أو دالة معينة لفحصها وتحديد ثغراتها فورياً دون الحاجة لرفع ملف.
- **مختبر فك التشفير (Lua Deobfuscator)**: فك تشفير السكربتات المحمية بتشفيرات Hex و Base64 و Character Codes ومولدات الأكواد وإظهار الكود الأصلي الصريح.
- **صائد الباك دور (Backdoor Hunter)**: أداة متقدمة للكشف عن الأبواب الخلفية الخبيثة، تحميلات الروابط المشبوهة، أكواد RCE، دوال load() و assert() غير الآمنة، وسرقة التوكنات.
- **محاكي وحاقن التريقرات (Payload Injector)**: تجربة استدعاء التريقرات وصياغة بايلودات لاختبار ما إذا كان التريقر يقبل مدخلات مزيفة من جانب اللاعب.
- **مولد الترقيعات الأمنية (Patch Generator)**: توليد كود حماية فوري (Fix Snippet) للتريقرات المصابة للتحقق من المصدر (source) والصلاحيات (Admin / ACE / Framework Permissions).
- **محلل ومحسن الرزمون (Resmon Optimizer)**: فحص الأداء ومشاكل استهلاك الـ ms الناتجة عن تكرارات Citizen.Wait(0) والحلقات اللانهائية.
- **محلل Bytecode**: فحص ملفات اللوا المترجمة مسبقاً (Compiled Lua Bytecode) لاستخراج النصوص والتريقرات المخفية داخلها.
- **مقارنة السكريبتات (Script Diff)**: فحص الفروقات بين نسختين من السكربت لاكتشاف أي كود خبيث أو سطر دخيل أضيف عليه.
- **فاحص Webhooks ديسكورد**: فحص روابط الديسكورد المسربة واختبار ما إذا كانت حية (Active) أو معطلة وإمكانية إرسال تقارير تنبيهية.
- **قواعد الأنتيشيت (Anti-Cheat Rules Matrix)**: إرشادات وقواعد منع جاهزة متوافقة مع أشهر مضادات الغش مثل FiveGuard و WaveShield و Phoenix.
- **استخراج لوجوهات وهوية السيرفر (Server Logos)**: استخراج وحفظ وتنزيل شعارات السيرفر والصور الموجودة في ملفات السكربتات تلقائياً.
- **درع حماية الموقع (Alzaabi Site Protection Shield)**: حماية فائقة لمنع فتح F12 وفحص العناصر (Inspect Element) ومنع نسخ السورس كود للحفاظ على خصوصية المحرك.
- **تصدير التقارير (Export Reports)**: تصدير نتائج الفحص الشاملة بصيغ JSON و CSV و Markdown.

3. أسلوبك في الإجابة:
- ودود، فصيح، محترف، وواضح باللغة العربية (أو باللغة التي يسأل بها الزائر).
- يمكنك تقديم أمثلة كود Lua عند الحاجة لكيفية تأمين السكربتات (مثلاً: التحقق من source، منع تحويل أموال أو سحب أسلحة بدون فحص بالسيرفر، واستخدام ESX / QBCore Player checks).
- اذكر دائماً اسم المنصة بفخر: "محرك الزعابي لفحص التريقرات".
- نسّق إجاباتك بنقاط واضحة وتنسيق Markdown جذاب ومقروء.`;

// Pre-packaged fallback responses in case GEMINI_API_KEY is not configured or network issues occur
function generateLocalFallbackAnswer(question: string): string {
  const q = question.toLowerCase();
  
  if (
    q.includes("ما هو") || 
    q.includes("ما هي") || 
    q.includes("وظيفة") || 
    q.includes("ايش هو") || 
    q.includes("ايش يسوي") || 
    q.includes("عن الموقع") || 
    q.includes("شو هذا") || 
    q.includes("شرح") || 
    q.includes("موقعك") || 
    q.includes("الموقع") || 
    q.includes("مميزات") ||
    q.includes("فائدة")
  ) {
    return `مرحباً بك في **محرك الزعابي لفحص التريقرات**! 🛡️⚡

هذا الموقع هو المنصة الأقوى والأشمل لفحص وتدقيق وتأمين سكربتات وموارد **FiveM** وحمايتها من الاختراق والهاكرز.

**أبرز الأدوات والميزات المتاحة لك في الموقع:**
1. **فحص حزم السيرفر (ZIP Scanner)**: ارفع ملف السيرفر أو السكربت المضغوط، وسيقوم المحرك بفحص كافة ملفات Lua واستخراج التريقرات مع تصنيف الخطورة.
2. **صائد الباك دور (Backdoor Hunter)**: رصد الروابط الخارجية، والتحميلات الخبيثة، وأكواد RCE و \`load()\` وسحب الصلاحيات.
3. **مختبر فك التشفير (Lua Deobfuscator)**: فك تشفير السكربتات المشفرة بـ Hex و Base64 و Character tables وإظهار الكود الصريح.
4. **مولد الترقيعات (Patch Generator)**: يولد لك كود حماية فوري للتريقرات المصابة للتحقق من \`source\` والصلاحيات.
5. **محاكي وحاقن التريقرات (Payload Injector)**: اختبار التريقر بمختلف المدخلات والتأكد من أمانه ضد برامج الحقن (Executors).
6. **محسن الرزمون (Resmon Optimizer)**: كشف مسببات اللاق واستهلاك المعالج والحلقات التكرارية غير المنضبطة.
7. **فاحص الـ Webhooks**: التحقق من سلامة روابط ديسكورد وإرسال تقارير تنبيهية.

يمكنك تجربة الموقع فوراً بالضغط على **"عينة تجريبية"** أعلى الصفحة أو سحب أي ملف ZIP!`;
  }

  if (q.includes("باكدور") || q.includes("backdoor") || q.includes("ثغرة") || q.includes("مخترق") || q.includes("هاك")) {
    return `🔒 **صائد الباكدور والثغرات في محرك الزعابي:**

**كيف يكتشف الموقع الباكدور؟**
1. **فحص دوال التنفيذ الديناميكي**: مثل \`load(string)\` و \`loadstring()\` و \`assert()\` المستخدمة لتنفيذ أكواد خفية.
2. **رصد الاتصالات الخارجية**: مثل \`PerformHttpRequest\` التي ترسل بيانات السيرفر أو تستقبل أكواد من سيرفرات خارجية مشبوهة.
3. **كشف سرقة الرتب والأذونات**: رصد محاولات تنفيذ \`ExecuteCommand('add_principal')\` أو حقن أوامر المشرفين.

**نصيحة أمنية**:
افتح زر **"صائد الباك دور"** في الشريط العلوي للاطلاع على تفاصيل أي خطر مكتشف، أو استخدم **"توليد الترقيعات"** لتأمين السكربت فوراً!`;
  }

  if (q.includes("رزمون") || q.includes("resmon") || q.includes("لاق") || q.includes("lag") || q.includes("اداء") || q.includes("أداء")) {
    return `⚡ **تحسين الرزمون والتخلص من اللاق (Resmon Optimizer):**

في سيرفرات FiveM، السكربت الجيد يجب أن يستهلك أقل من \`0.04 ms\` أثناء الاستخدام العادي!

**أهم أسباب اللاق الشائعة التي يرصدها المحرك:**
1. استخدام \`Citizen.Wait(0)\` داخل حلقات تكرارية \`while true do\` مستمرة دون وجود شرط توقف أو شرط مسافة كافية.
2. الاستعلام المتكرر عن إحداثيات اللاعب \`GetEntityCoords(PlayerPedId())\` مئات المرات في الثانية الواحدة.
3. التريقرات الشبكية الكثيفة المتزامنة التي تضغط على شبكة السيرفر.

اضغط على زر **"محسن الرزمون"** في الموقع لمعاينة تحليل استهلاك الأداء لأي سكربت!`;
  }

  if (q.includes("تريقر") || q.includes("trigger") || q.includes("كيف احمي") || q.includes("حماية") || q.includes("امان") || q.includes("أمان")) {
    return `⚡ **كيفية تأمين التريقرات في FiveM:**

أكبر خطأ أمني يقع فيه المطورون هو الوثوق بالبيانات القادمة من جهة اللاعب (Client)!

**القواعد الذهبية لحماية التريقرات:**
1. **لا تعتمد على هوية اللاعب الممررة من الكلاينت**: استخدم دائماً المتغير السيرفري المحمي:
\`\`\`lua
RegisterNetEvent('giveSalary', function()
    local src = source -- 🔒 الهوية الحقيقية للاعب
    -- تحقق من الصلاحيات وقم بإعطاء الراتب
end)
\`\`\`
2. **التحقق من صحة وقيم المعاملات (Validation)**:
\`\`\`lua
RegisterNetEvent('shop:buyItem', function(amount, itemId)
    local src = source
    if type(amount) ~= "number" or amount <= 0 or amount > 50 then
        -- محاولة استغلال وتعديل كمية غير منطقية
        DropPlayer(src, "Exploit Attempt Detected")
        return
    end
end)
\`\`\`
3. اضغط على زر **"توليد الترقيعات"** في محرك الزعابي ليقوم بكتابة كود الحماية المناسب لك تلقائياً!`;
  }

  if (q.includes("فك التشفير") || q.includes("تشفير") || q.includes("obfuscat")) {
    return `✨ **مختبر فك التشفير (Lua Deobfuscator) بمحرك الزعابي:**

يتيح لك الموقع فك وتحليل الأكواد المشفرة بسهولة:
1. انقر على زر **"مختبر فك التشفير"** في الشريط العلوي.
2. الصق الكود المشفر (يدعم فك Hex مثل \`\\x68\\x65\\x6c\\x6c\\x6f\`، و Base64، ومولدات الأرقام \`string.char\`، وسلاسل الدمج).
3. اضغط **"فك التشفير واستخراج التريقرات"** لعرض الكود المقروء بالكامل واستخراج أي روابط أو تريقرات خفية.`;
  }

  if (q.includes("webhook") || q.includes("ويب هوك") || q.includes("ديسكورد") || q.includes("discord")) {
    return `📡 **فاحص ومختبر Discord Webhooks بمحرك الزعابي:**

- يقوم المحرك برصد جميع روابط الويب هوك المسربة داخل السكربتات (والتي قد تُستغل في إرسال سبام أو تسريب بيانات السيرفر).
- يمكنك عبر أداة **"فاحص Webhooks"** التحقق مما إذا كان الرابط حياً وشغالاً (Active) أو معطلاً (Dead)، وإرسال رسالة تجريبية فورية للتأكد من الاتصال.`;
  }

  if (q.includes("anticheat") || q.includes("أنتيشيت") || q.includes("انتشيت") || q.includes("قواعد")) {
    return `🛡️ **قواعد الأنتيشيت (Anti-Cheat Matrix):**

يقدم لك محرك الزعابي ميزة توليد قواعد حماية جاهزة للتصدير المباشر لمضادات الغش مثل **FiveGuard** و **WaveShield** و **Phoenix AC**:
- حظر استدعاء التريقرات المحمية من برامج الحقن (Executors).
- كشف معدلات النقل السريعة (Spam rate limits).
- اضغط على زر **"قواعد الأنتيشيت"** في الشريط العلوي لتوليد التكوين الجاهز لسيرفرك!`;
  }

  return `أهلاً بك في **محرك الزعابي لفحص التريقرات**! 🛡️

أنا مساعدك الذكي الجاهز للإجابة على كل استفساراتك حول هذا الموقع وكيفية استخدامه لحماية سيرفرك:
- يمكنك سؤالي عن: **"ما هي وظيفة هذا الموقع؟"**
- أو: **"كيف أستخدم صائد الباكدور؟"**
- أو: **"كيف أحمي التريقرات الحساسة (فلوس، سيارات، رتب)؟"**
- أو: **"كيف أفك تشفير كود مشبوه؟"**

أخبرني بما تحتاجه وسأساعدك فوراً!`;
}

// AI Assistant Chat Route
app.post("/api/assistant/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getAiClient();

    if (!ai) {
      // Graceful intelligent fallback if GEMINI_API_KEY is not yet populated
      const fallbackReply = generateLocalFallbackAnswer(message);
      return res.json({ reply: fallbackReply, fallback: true });
    }

    // Build context-aware conversation
    const formattedContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    // Add prior history if supplied (up to last 6 messages)
    if (Array.isArray(history)) {
      const recent = history.slice(-6);
      for (const h of recent) {
        if (h && typeof h.text === "string" && (h.role === "user" || h.role === "model")) {
          formattedContents.push({
            role: h.role,
            parts: [{ text: h.text }],
          });
        }
      }
    }

    // Append current user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || generateLocalFallbackAnswer(message);
    return res.json({ reply });
  } catch (error: any) {
    console.error("Assistant API Error:", error?.message || error);
    // Fallback gracefully so visitor always gets a solid answer
    const fallbackReply = generateLocalFallbackAnswer(req.body?.message || "");
    return res.json({ reply: fallbackReply, fallback: true });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", name: "محرك الزعابي لفحص التريقرات" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
