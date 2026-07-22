const { useState } = React;

const FEDERAL_BRACKETS = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 154906, rate: 0.26 },
  { min: 154906, max: 220000, rate: 0.29 },
  { min: 220000, max: Infinity, rate: 0.33 },
];

const PROVINCES = {
  AB: { name: "Alberta", brackets: [{ min:0,max:148269,rate:0.10},{min:148269,max:177922,rate:0.12},{min:177922,max:237230,rate:0.13},{min:237230,max:355845,rate:0.14},{min:355845,max:Infinity,rate:0.15}] },
  BC: { name: "British Columbia", brackets: [{ min:0,max:45654,rate:0.0506},{min:45654,max:91310,rate:0.077},{min:91310,max:104835,rate:0.105},{min:104835,max:127299,rate:0.1229},{min:127299,max:172602,rate:0.147},{min:172602,max:240716,rate:0.168},{min:240716,max:Infinity,rate:0.205}] },
  MB: { name: "Manitoba", brackets: [{ min:0,max:36842,rate:0.108},{min:36842,max:79625,rate:0.1275},{min:79625,max:Infinity,rate:0.174}] },
  NB: { name: "New Brunswick", brackets: [{ min:0,max:47715,rate:0.094},{min:47715,max:95431,rate:0.14},{min:95431,max:176756,rate:0.16},{min:176756,max:Infinity,rate:0.195}] },
  NL: { name: "Newfoundland & Labrador", brackets: [{ min:0,max:43198,rate:0.087},{min:43198,max:86395,rate:0.145},{min:86395,max:154244,rate:0.158},{min:154244,max:215943,rate:0.178},{min:215943,max:275870,rate:0.198},{min:275870,max:Infinity,rate:0.213}] },
  NS: { name: "Nova Scotia", brackets: [{ min:0,max:29590,rate:0.0879},{min:29590,max:59180,rate:0.1495},{min:59180,max:93000,rate:0.1667},{min:93000,max:150000,rate:0.175},{min:150000,max:Infinity,rate:0.21}] },
  NT: { name: "Northwest Territories", brackets: [{ min:0,max:50597,rate:0.059},{min:50597,max:101198,rate:0.086},{min:101198,max:164525,rate:0.122},{min:164525,max:Infinity,rate:0.1405}] },
  NU: { name: "Nunavut", brackets: [{ min:0,max:53268,rate:0.04},{min:53268,max:106537,rate:0.07},{min:106537,max:173205,rate:0.09},{min:173205,max:Infinity,rate:0.115}] },
  ON: { name: "Ontario", brackets: [{ min:0,max:51446,rate:0.0505},{min:51446,max:102894,rate:0.0915},{min:102894,max:150000,rate:0.1116},{min:150000,max:220000,rate:0.1216},{min:220000,max:Infinity,rate:0.1316}] },
  PE: { name: "Prince Edward Island", brackets: [{ min:0,max:32656,rate:0.096},{min:32656,max:64313,rate:0.1337},{min:64313,max:105000,rate:0.167},{min:105000,max:140000,rate:0.18},{min:140000,max:Infinity,rate:0.187}] },
  QC: { name: "Quebec", brackets: [{ min:0,max:51780,rate:0.14},{min:51780,max:103545,rate:0.19},{min:103545,max:126000,rate:0.24},{min:126000,max:Infinity,rate:0.2575}] },
  SK: { name: "Saskatchewan", brackets: [{ min:0,max:49720,rate:0.105},{min:49720,max:142058,rate:0.125},{min:142058,max:Infinity,rate:0.145}] },
  YT: { name: "Yukon", brackets: [{ min:0,max:55867,rate:0.064},{min:55867,max:111733,rate:0.09},{min:111733,max:154906,rate:0.109},{min:154906,max:500000,rate:0.128},{min:500000,max:Infinity,rate:0.15}] },
};

function calcTax(income, brackets) {
  const BPA = 15705;
  const taxable = Math.max(0, income - BPA);
  let tax = 0;
  for (const b of brackets) {
    if (taxable <= b.min) break;
    tax += (Math.min(taxable, b.max) - b.min) * b.rate;
  }
  return tax;
}

function calcProvincialTax(income, prov) {
  const taxable = Math.max(0, income - 10000);
  let tax = 0;
  for (const b of prov.brackets) {
    if (taxable <= b.min) break;
    tax += (Math.min(taxable, b.max) - b.min) * b.rate;
  }
  return tax;
}

function calcCPP(income) {
  const exemption = 3500, max = 68500, rate = 0.0595;
  return Math.min(Math.max(0, income - exemption), max - exemption) * rate;
}

function calcEI(income) {
  return Math.min(income, 63200) * 0.0166;
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
    const federalTax = calcTax(annualIncome, FEDERAL_BRACKETS);
    const provincialTax = calcProvincialTax(annualIncome, prov);
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
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: 16 }}>Federal + Provincial tax, CPP & EI — 2024 tax year</p>
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
                  { label: "EI Premiums (1.66%)", value: `−${fmt(result.ei)}`, color: "#0369a1" },
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0369a1", marginBottom: 6 }}>2024 Contribution Limits</div>
                  <div style={{ fontSize: 12, color: "#555" }}>CPP max: $3,867.50 | EI max: $1,049.12</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Federal BPA: $15,705 | RRSP: 18% of income</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 12, padding: 16, fontSize: 13, color: "#664d03" }}>
              <strong>Estimate only.</strong> Provincial tax uses simplified bracket calculation. Does not include provincial surtaxes (ON, PEI), or Quebec-specific deductions (QPP, QPIP). Consult the CRA for precise figures.
            </div>
          </>
        )}

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginTop: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>📊 2024 Federal Tax Brackets (Canada)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f0f9ff" }}>{["Taxable Income", "Federal Rate"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#333" }}>{h}</th>)}</tr></thead>
            <tbody>
              {[["Up to $55,867","15%"],["$55,868 – $111,733","20.5%"],["$111,734 – $154,906","26%"],["$154,907 – $220,000","29%"],["Over $220,000","33%"]].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f3f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", color: "#333" }}>{row[0]}</td>
                  <td style={{ padding: "10px 14px", color: "#dc2626", fontWeight: 600 }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#888" }}>Basic Personal Amount (BPA) of $15,705 deducted before federal tax. Plus provincial/territorial tax on top.</p>
        </div>
      </div>
    </div>
  );
}
