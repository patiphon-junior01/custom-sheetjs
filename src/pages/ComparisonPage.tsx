import PageHeader from "../components/PageHeader";

/* =========================================================================
   DATA: Feature Comparison (4 Libraries - ไม่มี Glide แล้ว)
   ========================================================================= */

interface FeatureRow {
  criteria: string;
  univer: string;
  fortune: string;
  handsontable: string;
  jspreadsheet: string;
}

const featureComparison: FeatureRow[] = [
  { criteria: "ใช้ component จริงของ library", univer: "ใช่ - Univer engine (canvas)", fortune: "ใช่ - Workbook component (DOM)", handsontable: "ใช่ - HotTable (DOM)", jspreadsheet: "ใช่ - jspreadsheet CE (DOM)" },
  { criteria: "UX คล้าย Spreadsheet", univer: "เต็มรูปแบบ - เหมือน Excel", fortune: "คล้ายมาก - เหมือน Google Sheets", handsontable: "ปานกลาง - คล้าย Excel สำหรับ Data Grid", jspreadsheet: "คล้าย Excel แบบเบาๆ" },
  { criteria: "Multi-cell selection", univer: "ใช่ - native support", fortune: "ใช่ - native support", handsontable: "ใช่ - native support (ลากคลุมได้)", jspreadsheet: "ใช่ - native support" },
  { criteria: "Batch update", univer: "ผ่าน manual row range input", fortune: "ผ่าน manual row range input", handsontable: "ใช้ native drag/copy/paste", jspreadsheet: "ผ่าน manual row range input" },
  { criteria: "Dropdown / Autocomplete", univer: "ใช่ - data validation plugin", fortune: "ใช่ - built-in", handsontable: "ใช่ - built-in (dropdown, autocomplete)", jspreadsheet: "ใช่ - built-in dropdown" },
  { criteria: "Lock cell (Field Level)", univer: "ใช่ - Permission Control API", fortune: "ใช่ - onChange rollback", handsontable: "ใช่ - readOnly properties ใน cells()", jspreadsheet: "ใช่ - onbeforechange event" },
  { criteria: "Lock row (Row Level)", univer: "ใช่ - range protection", fortune: "ใช่ - onChange rollback", handsontable: "ใช่ - readOnly ลูปตรวจสอบแถว", jspreadsheet: "ใช่ - onbeforechange ตรวจสอบแถว" },
  { criteria: "ป้องกันลบ row", univer: "ต้อง implement เอง", fortune: "rollback ผ่าน onChange", handsontable: "ฟิลเตอร์ตอน context menu trigger", jspreadsheet: "ปิด allowDeleteRow + ลบผ่าน panel" },
  { criteria: "Formula / Calculated field", univer: "ใช่ - engine built-in (500+ functions)", fortune: "ใช่ - Luckysheet formulas", handsontable: "มีปลั๊กอิน (HyperFormula) - Pro", jspreadsheet: "มีพื้นฐาน (CE มีบาง formula)" },
  { criteria: "Multiple sheets (tabs)", univer: "ใช่ - native", fortune: "ใช่ - native", handsontable: "ไม่มี", jspreadsheet: "Pro เท่านั้น (CE ไม่มี)" },
  { criteria: "Comment / Note", univer: "ใช่ - Thread Comment plugin", fortune: "ไม่มี built-in", handsontable: "Comments plugin (เฉพาะ Pro)", jspreadsheet: "ใช่ - built-in comments" },
  { criteria: "Copy / Paste จาก Excel", univer: "ใช่ - clipboard plugin", fortune: "ใช่ - native", handsontable: "ใช่ - ยอดเยี่ยม (Excel-grade)", jspreadsheet: "ใช่ - ระดับปานกลาง" },
  { criteria: "Performance (100k+ rows)", univer: "ดี (canvas rendering)", fortune: "ปานกลาง (DOM-based หนัก)", handsontable: "ดี (Virtual DOM Rendering)", jspreadsheet: "ปานกลาง (DOM, ไม่มี virtual)" },
  { criteria: "ความซับซ้อนในการ setup", univer: "สูง (หลาย plugins / presets)", fortune: "ต่ำ (import 1 component)", handsontable: "ต่ำ - ปานกลาง", jspreadsheet: "ต่ำมาก (import + CSS 2 ไฟล์)" },
  { criteria: "Bundle size", univer: "~5MB (gzipped) ใหญ่มาก", fortune: "~500KB ปานกลาง", handsontable: "~300KB ปานกลาง", jspreadsheet: "~50KB เล็กมาก" },
  { criteria: "TypeScript support", univer: "ดี แต่ต้อง skipLibCheck", fortune: "ไม่ครอบคลุม", handsontable: "ดีเยี่ยม", jspreadsheet: "ไม่มี types อย่างเป็นทางการ" },
  { criteria: "เหมาะกับงานแบบไหน", univer: "Enterprise spreadsheet (formula)", fortune: "Prototype / MVP (Google Sheets UX)", handsontable: "Enterprise Data Grid", jspreadsheet: "โปรเจกต์เล็ก-กลาง (ฟรี + เบา)" },
];

/* =========================================================================
   DATA: Weighted Scoring
   ========================================================================= */

interface ScoreRow {
  criteria: string;
  weight: number;
  univer: number;
  fortune: number;
  handsontable: number;
  jspreadsheet: number;
  explanation: string;
}

const scores: ScoreRow[] = [
  { criteria: "UX คล้าย Spreadsheet", weight: 25, univer: 5, fortune: 4, handsontable: 4, jspreadsheet: 3, explanation: "Univer ให้ UX เต็มรูปแบบ, Fortune/Handsontable ใกล้เคียง" },
  { criteria: "Lock/Protection", weight: 25, univer: 5, fortune: 3, handsontable: 5, jspreadsheet: 4, explanation: "Univer/Handsontable มี native API, Jspreadsheet ใช้ onbeforechange" },
  { criteria: "ความง่ายในการ implement", weight: 20, univer: 2, fortune: 4, handsontable: 4, jspreadsheet: 5, explanation: "Jspreadsheet setup ง่ายที่สุด, Univer ยากสุด" },
  { criteria: "Performance", weight: 15, univer: 4, fortune: 3, handsontable: 4, jspreadsheet: 3, explanation: "Univer (canvas) / Handsontable (virtual DOM) ดีกว่า" },
  { criteria: "Maintainability", weight: 15, univer: 3, fortune: 3, handsontable: 5, jspreadsheet: 3, explanation: "Handsontable docs ดีที่สุด, TS สมบูรณ์" },
];

/* =========================================================================
   DATA: Pricing & License
   ========================================================================= */

interface LibraryPricing {
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  license: string;
  priceFree: string;
  pricePaid: string;
  priceNote: string;
  freeFeatures: string[];
  paidOnlyFeatures: string[];
  verdict: string;
}

const pricingData: LibraryPricing[] = [
  { name: "Univer Sheets", icon: "fa-solid fa-table-cells-large", color: "text-violet-600", borderColor: "border-violet-200", bgColor: "bg-violet-50/30", license: "Apache-2.0 (Core) + Commercial (Pro)", priceFree: "ฟรี (Core)", pricePaid: "ติดต่อผู้ขาย (Enterprise)", priceNote: "Core Plugins ฟรี, Pro Plugins (Collab, XLSX) ต้องซื้อ", freeFeatures: ["Spreadsheet Engine + Canvas", "Formula Engine (500+)", "Permission Control API", "Thread Comment Plugin"], paidOnlyFeatures: ["Collaborative Editing", "Import/Export .xlsx", "Pivot Table"], verdict: "เหมาะกับองค์กรที่ต้องการ Excel Clone จริงจังและมี Budget" },
  { name: "FortuneSheet", icon: "fa-solid fa-table-list", color: "text-emerald-600", borderColor: "border-emerald-200", bgColor: "bg-emerald-50/30", license: "MIT (ฟรีทั้งหมด)", priceFree: "ฟรี 100%", pricePaid: "ไม่มี", priceNote: "Open Source MIT ใช้ได้ทั้งเชิงพาณิชย์", freeFeatures: ["Google Sheets UI", "Toolbar Formatting", "Multiple Sheets", "Cell Formatting & Merge"], paidOnlyFeatures: [], verdict: "เหมาะกับ Prototype / MVP ที่ต้องการ UX Spreadsheet ฟรี" },
  { name: "Handsontable", icon: "fa-solid fa-table", color: "text-blue-600", borderColor: "border-blue-200", bgColor: "bg-blue-50/30", license: "ฟรีเฉพาะ non-commercial / Commercial ต้องซื้อ", priceFree: "ฟรีเฉพาะ non-commercial", pricePaid: "~$1,150 - $5,500/dev/ปี", priceNote: 'ใช้ key "non-commercial-and-evaluation" ตอน Dev ได้ แต่นำไปทำเงินต้องซื้อ', freeFeatures: ["Data Grid Engine (Virtual)", "Dropdown, Checkbox, Date", "Copy/Paste ระดับ Excel", "readOnly per-cell", "Undo/Redo"], paidOnlyFeatures: ["Gantt Chart", "Multi-column Sorting", "ใช้เชิงพาณิชย์"], verdict: "ดีที่สุดสำหรับ Enterprise Data Grid (ถ้ายอมจ่าย License)" },
  { name: "Jspreadsheet CE", icon: "fa-solid fa-table-cells", color: "text-orange-600", borderColor: "border-orange-200", bgColor: "bg-orange-50/30", license: "MIT (CE ฟรี) / Pro ต้องซื้อ", priceFree: "ฟรี 100% (CE)", pricePaid: "Pro ~$99 - $599/ปี", priceNote: "CE ฟรี MIT License, Pro มี Formula ขั้นสูงและ Sheet Tabs", freeFeatures: ["Spreadsheet Grid (DOM)", "Dropdown, Checkbox, Calendar", "onbeforechange Protection", "Comments built-in"], paidOnlyFeatures: ["Advanced Formula", "Sheet Tabs", "XLSX Import/Export"], verdict: "คุ้มค่าที่สุดสำหรับโปรเจกต์ขนาดเล็ก-กลาง ฟรีและเบามาก" },
];

/* =========================================================================
   HELPERS
   ========================================================================= */

type LibKey = "univer" | "fortune" | "handsontable" | "jspreadsheet";

function calculateWeightedScore(scoreList: ScoreRow[], lib: LibKey): number {
  const totalWeight = scoreList.reduce((sum, s) => sum + s.weight, 0);
  const weighted = scoreList.reduce((sum, s) => sum + s[lib] * s.weight, 0);
  return Math.round((weighted / totalWeight) * 100) / 100;
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : "bg-amber-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-4">{score}</span>
    </div>
  );
}

/* =========================================================================
   COMPONENT
   ========================================================================= */

export default function ComparisonPage() {
  const libKeys: LibKey[] = ["univer", "fortune", "handsontable", "jspreadsheet"];
  const scoreMap = Object.fromEntries(libKeys.map((k) => [k, calculateWeightedScore(scores, k)])) as Record<LibKey, number>;

  const allScores = [
    { key: "univer" as LibKey, name: "Univer Sheets", score: scoreMap.univer, color: "text-violet-600", border: "border-violet-200", icon: "fa-solid fa-table-cells-large", iconBg: "bg-violet-100", iconColor: "text-violet-600", barColor: "bg-violet-500", subtitle: "Spreadsheet engine เต็มรูปแบบ", summary: "features ครบสุด แต่ซับซ้อน + ใหญ่" },
    { key: "fortune" as LibKey, name: "FortuneSheet", score: scoreMap.fortune, color: "text-emerald-600", border: "border-emerald-200", icon: "fa-solid fa-table-list", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", barColor: "bg-emerald-500", subtitle: "Google Sheets-like UX (ฟรี)", summary: "คุ้นเคยง่าย แต่ document น้อย" },
    { key: "handsontable" as LibKey, name: "Handsontable", score: scoreMap.handsontable, color: "text-blue-600", border: "border-blue-200", icon: "fa-solid fa-table", iconBg: "bg-blue-100", iconColor: "text-blue-600", barColor: "bg-blue-500", subtitle: "Enterprise Data Grid ตัวท็อป", summary: "สมดุลยอดเยี่ยม แต่ Commercial แพง" },
    { key: "jspreadsheet" as LibKey, name: "Jspreadsheet CE", score: scoreMap.jspreadsheet, color: "text-orange-600", border: "border-orange-200", icon: "fa-solid fa-table-cells", iconBg: "bg-orange-100", iconColor: "text-orange-600", barColor: "bg-orange-500", subtitle: "Lightweight Spreadsheet (ฟรี)", summary: "เบา, ฟรี, แก้ไขง่าย" },
  ];

  const ranked = [...allScores].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="เปรียบเทียบ Library" subtitle="เปรียบเทียบ Univer Sheets, FortuneSheet, Handsontable และ Jspreadsheet CE แบบ side-by-side" icon="fa-solid fa-scale-balanced" />

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <i className="fa-solid fa-circle-info mr-2"></i>
        <strong>วิธีการให้คะแนน:</strong> คะแนนแต่ละหมวดให้จาก 1-5 (5 = ดีมาก) แต่ละหมวดมีน้ำหนัก (weight) ตามความสำคัญต่องาน payroll spreadsheet
      </div>

      {/* Score Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allScores.map((lib) => {
          const rank = ranked.findIndex((r) => r.key === lib.key) + 1;
          return (
            <div key={lib.name} className={`bg-white ${lib.border} rounded-2xl p-5 shadow-sm relative overflow-hidden`}>
              {rank === 1 && (
                <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-xl">
                  <i className="fa-solid fa-crown mr-1"></i> No.1
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${lib.iconBg} rounded-xl flex items-center justify-center`}>
                  <i className={`${lib.icon} ${lib.iconColor}`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{lib.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{lib.subtitle}</p>
                </div>
              </div>
              <div className="flex items-end gap-1.5">
                <span className={`text-3xl font-bold ${lib.color}`}>{lib.score.toFixed(2)}</span>
                <span className="text-xs text-slate-400 mb-1">/ 5.00</span>
              </div>
              <div className="mt-2 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${lib.barColor} rounded-full`} style={{ width: `${(lib.score / 5) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{lib.summary}</p>
            </div>
          );
        })}
      </div>

      {/* Pricing & License */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-money-bill-wave text-emerald-600"></i>
            ราคา License และค่าใช้จ่าย
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-slate-100 p-0.5">
          {pricingData.map((lib) => (
            <div key={lib.name} className="bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 ${lib.bgColor} ${lib.borderColor} border rounded-xl flex items-center justify-center`}>
                  <i className={`${lib.icon} ${lib.color} text-sm`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-xs">{lib.name}</h3>
                  <p className="text-[11px] text-slate-500">{lib.license}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                  <i className="fa-solid fa-tag text-[10px]"></i> ฟรี: {lib.priceFree}
                </span>
                {lib.pricePaid !== "ไม่มี" && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                    <i className="fa-solid fa-coins text-[10px]"></i> Pro: {lib.pricePaid}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{lib.priceNote}</p>
              <div className="mb-2">
                <h4 className="text-[11px] font-semibold text-emerald-700 mb-1.5">
                  <i className="fa-solid fa-unlock text-[10px] mr-1"></i>Features ฟรี
                </h4>
                <ul className="space-y-0.5">
                  {lib.freeFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-emerald-500 mt-0.5 shrink-0"><i className="fa-solid fa-check text-[9px]"></i></span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              {lib.paidOnlyFeatures.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-[11px] font-semibold text-amber-700 mb-1.5">
                    <i className="fa-solid fa-lock text-[10px] mr-1"></i>ต้องจ่ายเงิน
                  </h4>
                  <ul className="space-y-0.5">
                    {lib.paidOnlyFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-amber-500 mt-0.5 shrink-0"><i className="fa-solid fa-lock text-[9px]"></i></span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={`mt-3 p-3 ${lib.bgColor} ${lib.borderColor} border rounded-xl`}>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <i className="fa-solid fa-lightbulb text-amber-500 mr-1"></i><strong>สรุป:</strong> {lib.verdict}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Detail Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-star text-amber-500"></i>
            คะแนนถ่วงน้ำหนัก (Weighted Scoring 1-5)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 font-medium text-slate-600 w-32">เกณฑ์</th>
                <th className="text-center py-3 px-2 font-medium text-slate-600 w-14">%</th>
                <th className="text-left py-3 px-4 font-medium text-violet-700 w-28">Univer</th>
                <th className="text-left py-3 px-4 font-medium text-emerald-700 w-28">Fortune</th>
                <th className="text-left py-3 px-4 font-medium text-blue-700 w-28">Handsontable</th>
                <th className="text-left py-3 px-4 font-medium text-orange-700 w-28">Jspreadsheet</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 min-w-[140px]">คำอธิบาย</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.criteria} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-700 text-xs">{s.criteria}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{s.weight}%</span>
                  </td>
                  <td className="py-3 px-4"><ScoreBar score={s.univer} /></td>
                  <td className="py-3 px-4"><ScoreBar score={s.fortune} /></td>
                  <td className="py-3 px-4"><ScoreBar score={s.handsontable} /></td>
                  <td className="py-3 px-4"><ScoreBar score={s.jspreadsheet} /></td>
                  <td className="py-3 px-4 text-xs text-slate-500">{s.explanation}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="py-3 px-4 text-slate-900 text-xs">คะแนนรวม</td>
                <td className="py-3 px-2 text-center text-slate-500 text-xs">100%</td>
                <td className="py-3 px-4 text-violet-700 text-xs">{scoreMap.univer.toFixed(2)}</td>
                <td className="py-3 px-4 text-emerald-700 text-xs">{scoreMap.fortune.toFixed(2)}</td>
                <td className="py-3 px-4 text-blue-700 text-xs">{scoreMap.handsontable.toFixed(2)}</td>
                <td className="py-3 px-4 text-orange-700 text-xs">{scoreMap.jspreadsheet.toFixed(2)}</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-blue-600"></i>
            เปรียบเทียบ Features และการทำงาน
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 font-medium text-slate-600 min-w-[140px]">เกณฑ์</th>
                <th className="text-left py-3 px-4 font-medium text-violet-700 min-w-[180px]">Univer</th>
                <th className="text-left py-3 px-4 font-medium text-emerald-700 min-w-[180px]">FortuneSheet</th>
                <th className="text-left py-3 px-4 font-medium text-blue-700 min-w-[180px]">Handsontable</th>
                <th className="text-left py-3 px-4 font-medium text-orange-700 min-w-[180px]">Jspreadsheet</th>
              </tr>
            </thead>
            <tbody>
              {featureComparison.map((row) => (
                <tr key={row.criteria} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-slate-700 text-xs">{row.criteria}</td>
                  <td className="py-2.5 px-4 text-slate-600 text-xs">{row.univer}</td>
                  <td className="py-2.5 px-4 text-slate-600 text-xs">{row.fortune}</td>
                  <td className="py-2.5 px-4 text-slate-600 text-xs">{row.handsontable}</td>
                  <td className="py-2.5 px-4 text-slate-600 text-xs">{row.jspreadsheet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Protection Methods */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-blue-600"></i>
          วิธีการ implement Protection ของแต่ละ Library
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { name: "Univer Sheets", icon: "fa-solid fa-table-cells-large", color: "text-violet-600", border: "border-violet-200", bg: "bg-violet-50/30", lock: "Permission Control API", prevent: "Command interceptor", how: "Native สั่งตั้งสิทธิ์ระดับ Range/Sheet ล็อกได้สนิท" },
            { name: "FortuneSheet", icon: "fa-solid fa-table-list", color: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50/30", lock: "onChange rollback", prevent: "ตรวจจับ row count", how: "จำค่าเดิมแล้วเซ็ตคืน อาจกะพริบ 1 เฟรม" },
            { name: "Handsontable", icon: "fa-solid fa-table", color: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50/30", lock: "readOnly cells()", prevent: "context menu hook", how: "readOnly: true พิมพ์ไม่ได้เลยตั้งแต่แรก" },
            { name: "Jspreadsheet CE", icon: "fa-solid fa-table-cells", color: "text-orange-600", border: "border-orange-200", bg: "bg-orange-50/30", lock: "onbeforechange event", prevent: "allowDeleteRow: false", how: "ดัก event ก่อนเปลี่ยน return false ไม่กะพริบ" },
          ].map((lib) => (
            <div key={lib.name} className={`${lib.border} border rounded-xl p-4 ${lib.bg}`}>
              <h3 className={`font-semibold text-xs mb-2 flex items-center gap-1.5 ${lib.color}`}>
                <i className={lib.icon}></i> {lib.name}
              </h3>
              <ul className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                <li><strong>Lock:</strong> {lib.lock}</li>
                <li><strong>ป้องกันลบ:</strong> {lib.prevent}</li>
                <li><strong>วิธีทำงาน:</strong> {lib.how}</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Final Recommendation */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg text-white">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-trophy text-amber-400"></i>
          บทสรุปและคำแนะนำ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-file-excel"></i>
              Spreadsheet เต็มรูปแบบ
            </h3>
            <div className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
              <div>
                <p className="text-white font-medium">1. Univer Sheets <span className="text-violet-400">({scoreMap.univer.toFixed(2)})</span></p>
                <p>Excel Clone จริงจัง สูตร 500+ Permission API แต่ยากและหนัก</p>
              </div>
              <div>
                <p className="text-white font-medium">2. FortuneSheet <span className="text-emerald-400">({scoreMap.fortune.toFixed(2)})</span></p>
                <p>Google Sheets UX ฟรี 100% แต่ Document น้อยและ Protection ทำยาก</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-table-columns"></i>
              Data Grid (ตาราง Edit ข้อมูล)
            </h3>
            <div className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
              <div>
                <p className="text-white font-medium">1. Handsontable <span className="text-blue-400">({scoreMap.handsontable.toFixed(2)})</span></p>
                <p>Copy/Paste เหมือน Excel, Protection ง่าย, Document ดี แต่แพง ~$1,150/dev/ปี</p>
              </div>
              <div>
                <p className="text-white font-medium">2. Jspreadsheet CE <span className="text-orange-400">({scoreMap.jspreadsheet.toFixed(2)})</span></p>
                <p>ฟรี 100% เบามาก แก้ไขง่าย Protection ดีผ่าน onbeforechange</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-amber-500/20 border border-amber-400/30 rounded-xl p-4">
          <h3 className="font-semibold text-amber-300 text-sm mb-2 flex items-center gap-2">
            <i className="fa-solid fa-medal"></i>
            สำหรับงาน Payroll โดยเฉพาะ
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            <strong className="text-white">Handsontable</strong> เหมาะที่สุดเพราะมี Copy/Paste, Dropdown, readOnly, Numeric Format ครบ
            หากจำกัด Budget ให้เลือก <strong className="text-white">Jspreadsheet CE</strong> (ฟรี, เบา, แก้ไขง่าย)
            หรือถ้าต้องการ Spreadsheet ครบทุกอย่าง ให้เลือก <strong className="text-white">Univer Sheets</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
