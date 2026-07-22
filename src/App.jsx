const { useState } = React;

// Source: canada.ca — 2026 federal and provincial tax rates
const FEDERAL_BRACKETS = [
  { min: 0,       max: 58523,  rate: 0.14 },   // Cut from 15% → 14% for 2026
  { min: 58523,   max: 117045, rate: 0.205 },
  { min: 117045,  max: 181440, rate: 0.26 },
  { min: 181440,  max: 258482, rate: 0.29 },
  { min: 258482,  max: Infinity, rate: 0.33 },
];

// 2026 provincial/territorial brackets from canada.ca
const PROVINCES = {
  AB: { name: "Alberta", brackets: [{min:0,max:61200,rate:0.08},{min:61200,max:154259,rate:0.10},{min:154259,max:185111,rate:0.12},{min:185111,max:246813,rate:0.13},{min:246813,max:370220,rate:0.14},{min:370220,max:Infinity,rate:0.15}] },
  BC: { name: "British Columbia", brackets: [{min:0,max:50363,rate:0.056},{min:50363,max:100728,rate:0.077},{min:100728,max:115648,rate:0.105},{min:115648,max:140430,rate:0.1229},{min:140430,max:190405,rate:0.147},{min:190405,max:265545,rate:0.168},{min:265545,max:Infinity,rate:0.205}] },
  MB: { name: "Manitoba", brackets: [{min:0,max:47564,rate:0.108},{min:47564,max:101200,rate:0.1275},{min:101200,max:Infinity,rate:0.174}] },
  NB: { name: "New Brunswick", brackets: [{min:0,max:52333,rate:0.094},{min:52333,max:104666,rate:0.14},{min:104666,max:193861,rate:0.16},{min:193861,max:Infinity,rate:0.195}] },
  NL: { name: "Newfoundland & Labrador", brackets: [{min:0,max:44678,rate:0.087},{min:44678,max:89354,rate:0.145},{min:89354,max:159528,rate:0.158},{min:159528,max:223340,rate:0.178},{min:223340,max:285319,rate:0.198},{min:285319,max:570638,rate:0.208},{min:570638,max:1141275,rate:0.213},{min:1141275,max:Infinity,rate:0.218}] },
  NS: { name: "Nova Scotia", brackets: [{min:0,max:30995,rate:0.0879},{min:30995,max:61991,rate:0.1495},{min:61991,max:97417,rate:0.1667},{min:97417,max:157124,rate:0.175},{min:157124,max:Infinity,rate:0.21}] },
  NT: { name: "Northwest Territories", brackets: [{min:0,max:53003,rate:0.059},{min:53003,max:106009,rate:0.086},{min:106009,max:172346,rate:0.122},{min:172346,max:Infinity,rate:0.1405}] },
  NU: { name: "Nunavut", brackets: [{min:0,max:55801,rate:0.04},{min:55801,max:111602,rate:0.07},{min:111602,max:181439,rate:0.09},{min:181439,max:Infinity,rate:0.115}] },
  ON: { name: "Ontario", brackets: [{min:0,max:53891,rate:0.0505},{min:53891,max:107785,rate:0.0915},{min:107785,max:150000,rate:0.1116},{min:150000,max:220000,rate:0.1216},{min:220000,max:Infinity,rate:0.1316}] },
  PE: { name: "Prince Edward Island", brackets: [{min:0,max:33928,rate:0.095},{min:33928,max:65820,rate:0.1347},{min:65820,max:106890,rate:0.166},{min:106890,max:142520,rate:0.1762},{min:142520,max:200000,rate:0.19},{min:200000,max:Infinity,rate:0.20}] },
  QC: { name: "Quebec", brackets: [{min:0,max:53810,rate:0.14},{min:53810,max:107780,rate:0.19},{min:107780,max:131230,rate:0.24},{min:131230,max:Infinity,rate:0.2575}] },
  SK: { name: "Saskatchewan", brackets: [{min:0,max:54532,rate:0.105},{min:54532,max:155805,rate:0.125},{min:155805,max:Infinity,rate:0.145}] },
  YT: { name: "Yukon", brackets: [{min:0,max:58523,rate:0.064},{min:58523,max:117045,rate:0.09},{min:117045,max:181440,rate:0.109},{min:181440,max:500000,rate:0.128},{min:500000,max:Infinity,rate:0.15}] },
};

// 2026 federal Basic Personal Amount (BPA) — estimated ~$16,600 (CRA adjusts annually for inflation)
const BPA_FEDERAL = 16600;
// Provincial basic personal exemptions are simplified; varies by province
const PROV_EXEMPTION = 10000;

function calcTax(income, brackets, exemption) {
  const taxable = Math.max(0, income - exemption);
  let tax = 0;
  for (const b of brackets) {
    if (taxable <= b.min) break;
    tax += (Math.min(taxable, b.max) - b.min) * b.rate;
  }
  return tax;
}

// CPP 2026: rate 5.95%, max pensionable earnings ~$73,200, basic exemption $3,500
function calcCPP(income) {
  const exemption = 3500, maxPensionable = 73200, rate = 0.0595;
  return Math.min(Math.max(0, income - exemption), maxPensionable - exemption) * rate;
}

// EI 2026: max insurable ~$67,700, rate 1.64%
function calcEI(income) {
  return Math.min(income, 67700) * 0.0164;
}

const fmt = n => "$" + Math.round(n).toLocaleString();
const pct = n => (n * 100).toFixed(1) + "%";
const PERIODS = { annual: 1, monthly: 12, biweekly: 26, weekly: 52 };

export default function CanadianTaxCalculator() {
  const [income, setIncome] = useState("80000");
  const [province, setProvince] = useState("ON");
  const [period, setPeriod] = useState("biweekly");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const annualIncome = parseFloat(income) || 0;
    const prov = PROVINCES[province];
    const federalTax = calcTax(annualIncome, FEDERAL_BRACKETS, BPA_FEDERAL);
    const provincialTax = calcTax(annualIncome, prov.brackets, PROV_EXEMPTION);
    const cpp = calcCPP(annualIncome);
    const ei = calcEI(annualIncome);
    const totalDeductions = federalTax + provincialTax + cpp + ei;
    const netAnnual = annualIncome - totalDeductions;
    const effectiveRate = annualIncome > 0 ? (federalTax + provincialTax) / annualIncome : 0;
    const periods = PERIODS[period];
    setResult({
      annualIncome, federalTax, provincialTax, cpp, ei, totalDeductions, netAnnual, effectiveRate, prov, periods,
      perPeriod: { gross: annualIncome/periods, net: netAnnual/periods, federal: federalTax/periods, provincial: provincialTax/periods, cpp: cpp/periods, ei: ei/periods }
    });
  };

  const inputStyle = { width: "100%", padding: "12px", border: "2px solid #bae6fd", borderRadius: 10, fontSize: 16, boxSizing: "border-box", outline: "none" };
  const labelStyle = { display: "block", fontWeight: 600, marginBottom: 6, color: "#333" };
  const pl = { annual: "Annual", monthly: "Monthly", biweekly: "Bi-weekly", weekly: "Weekly" }[period];

  return (
    <div style={{ fontFamily: "'Segoe UI',Arial,sans-serif", background: "#f0f9ff", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🇨🇦</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#1a1a2e" }}>Canadian Tax Calculator</h1>
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: 16 }}>Federal + Provincial tax, CPP & EI — 2026 tax year</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            <div>
              <label style={labelStyle}>Annual Income (CAD)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666", fontWeight: 600 }}>$</span>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Province / Territory</label>
              <select value={province} onChange={e => setProvince(e.target.value)} style={inputStyle}>
                {Object.entries(PROVINCES).sort((a,b) => a[1].name.localeCompare(b[1].name)).map(([code, p]) => (
                  <option key={code} value={code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pay Frequency</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle}>
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly (26×)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <button onClick={calculate} style={{ width: "100%", marginTop: 24, padding: "16px", background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", border: "none", borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
            Calculate Take-Home Pay
          </button>
        </div>

        {result && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: `${pl} Gross`, value: fmt(result.perPeriod.gross), color: "#dc2626", bg: "#fff5f5" },
                { label: `${pl} Take-Home`, value: fmt(result.perPeriod.net), color: "#059669", bg: "#f0fdf4" },
                { label: `${pl} Tax`, value: fmt((result.federalTax + result.provincialTax)/result.periods), color: "#7c3aed", bg: "#f5f3ff" },
                { label: "Effective Tax Rate", value: pct(result.effectiveRate), color: "#d97706", bg: "#fffbeb" },
              ].map((item, i) => (
                <div key={i} style={{ background: item.bg, borderRadius: 14, padding: 20, textAlign: "center", border: `2px solid ${item.color}22` }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 4, fontWeight: 500 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Annual Breakdown</h3>
                {[
                  { label: "Gross Salary", value: fmt(result.annualIncome), bold: true },
                  { label: "Federal Income Tax", value: `−${fmt(result.federalTax)}`, color: "#dc2626" },
                  { label: `${result.prov.name} Provincial Tax`, value: `−${fmt(result.provincialTax)}`, color: "#dc2626" },
                  { label: "CPP Contributions (5.95%)", value: `−${fmt(result.cpp)}`, color: "#7c3aed" },
                  { label: "EI Premiums (1.64%)", value: `−${fmt(result.ei)}`, color: "#0369a1" },
                  { label: "Total Deductions", value: `−${fmt(result.totalDeductions)}`, color: "#dc2626", bold: true },
                  { label: "Annual Take-Home", value: fmt(result.netAnnual), bold: true, color: "#059669", border: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: row.border ? "2px solid #e9ecef" : "1px solid #f1f3f5" }}>
                    <span style={{ fontSize: 14, color: "#444", fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: row.bold ? 700 : 600, color: row.color || "#222" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{pl} Paycheck</h3>
                {[
                  { label: "Gross Pay", value: fmt(result.perPeriod.gross), bold: true },
                  { label: "Federal Tax", value: `−${fmt(result.perPeriod.federal)}`, color: "#dc2626" },
                  { label: "Provincial Tax", value: `−${fmt(result.perPeriod.provincial)}`, color: "#dc2626" },
                  { label: "CPP", value: `−${fmt(result.perPeriod.cpp)}`, color: "#7c3aed" },
                  { label: "EI", value: `−${fmt(result.perPeriod.ei)}`, color: "#0369a1" },
                  { label: "Net Take-Home", value: fmt(result.perPeriod.net), bold: true, color: "#059669", border: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: row.border ? "2px solid #e9ecef" : "1px solid #f1f3f5" }}>
                    <span style={{ fontSize: 14, color: "#444", fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: row.bold ? 700 : 600, color: row.color || "#222" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: 14, background: "#f0f9ff", borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0369a1", marginBottom: 6 }}>2026 Contribution Limits</div>
                  <div style={{ fontSize: 12, color: "#555" }}>CPP max pensionable: ~$73,200 | EI max insurable: ~$67,700</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Federal BPA: ~$16,600 | RRSP: 18% of prior year income</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 12, padding: 16, fontSize: 13, color: "#664d03" }}>
              <strong>Estimate only.</strong> Provincial tax uses simplified bracket calculation. Does not include provincial surtaxes (ON, PEI) or Quebec-specific deductions (QPP, QPIP). CPP/EI limits are estimates pending final CRA confirmation. Consult the CRA for precise figures.
            </div>
          </>
        )}

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginTop: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>📊 2026 Federal Tax Brackets (Canada)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f0f9ff" }}>{["Taxable Income", "Federal Rate"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#333" }}>{h}</th>)}</tr></thead>
            <tbody>
              {[["Up to $58,523","14% ↓ (was 15%)"],["$58,524 – $117,045","20.5%"],["$117,046 – $181,440","26%"],["$181,441 – $258,482","29%"],["Over $258,482","33%"]].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f3f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", color: "#333" }}>{row[0]}</td>
                  <td style={{ padding: "10px 14px", color: "#dc2626", fontWeight: 600 }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#888" }}>Basic Personal Amount (BPA) of ~$16,600 deducted before federal tax. Plus provincial/territorial tax on top. Source: canada.ca</p>
        </div>
      </div>
    </div>
  );
}
