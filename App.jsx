import React, { useEffect, useMemo, useState } from "react";

// ---
// CURBSIDE LUBE CO. — Vite + React Production Build
// * Fixes malformed EmailJS CDN import URL.
// * Includes self‑tests for oil/filter lookup logic.
// * Tailwind for styling.
// ---

// OPTIONAL EmailJS settings (https://www.emailjs.com/)
const EMAILJS_CONFIG = {
  useEmailJS: false, // set true after you add keys below
  service_id: "YOUR_EMAILJS_SERVICE_ID",
  template_id: "YOUR_EMAILJS_TEMPLATE_ID",
  public_key: "YOUR_EMAILJS_PUBLIC_KEY",
};

// Basic oil/filter knowledge base (seeded with common combos). 
// NOTE: Part numbers are common aftermarket references (Fram/Motorcraft/ACDelco/Toyota OE).
// Always confirm equivalents with your supplier.
const OIL_DB = [
  { make: "Honda", models: [
    { model: "Civic", years: [2012,2013,2014,2015,2016], oil: "0W-20", filter: "Fram PH7317" },
    { model: "Civic", years: [2017,2018,2019,2020,2021,2022,2023,2024], oil: "0W-20", filter: "Fram PH7317" },
    { model: "Accord", years: [2013,2014,2015,2016,2017], oil: "0W-20", filter: "Fram PH7317" },
    { model: "Accord", years: [2018,2019,2020,2021,2022,2023,2024], oil: "0W-20", filter: "Fram PH7317" },
  ]},
  { make: "Toyota", models: [
    { model: "Camry", years: [2012,2013,2014,2015,2016,2017], oil: "0W-20", filter: "Toyota 04152-YZZA1" },
    { model: "Camry", years: [2018,2019,2020,2021,2022,2023,2024], oil: "0W-16", filter: "Toyota 04152-YZZA1" },
    { model: "Corolla", years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], oil: "0W-20", filter: "Toyota 04152-YZZA1" },
    { model: "Tundra", years: [2014,2015,2016,2017,2018,2019,2020], oil: "0W-20", filter: "Fram PH4967" },
  ]},
  { make: "Ford", models: [
    { model: "F-150", years: [2011,2012,2013,2014], oil: "5W-20", filter: "Motorcraft FL-500S" },
    { model: "F-150", years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], oil: "5W-30", filter: "Motorcraft FL-500S" },
    { model: "Escape", years: [2013,2014,2015,2016,2017,2018,2019], oil: "5W-20", filter: "Motorcraft FL-910S" },
  ]},
  { make: "Chevrolet", models: [
    { model: "Silverado 1500", years: [2014,2015,2016,2017,2018,2019,2020], oil: "0W-20", filter: "ACDelco PF63E" },
    { model: "Equinox", years: [2018,2019,2020,2021,2022,2023], oil: "0W-20", filter: "ACDelco PF64" },
  ]},
  { make: "Nissan", models: [
    { model: "Altima", years: [2013,2014,2015,2016,2017,2018], oil: "0W-20", filter: "Fram PH6607" },
  ]},
  { make: "Subaru", models: [
    { model: "Outback", years: [2015,2016,2017,2018,2019], oil: "0W-20", filter: "Fram XG7317" },
  ]},
];

function normalize(str = "") { return String(str || "").trim().toLowerCase(); }

function findOilFilter(year, make, model) {
  const y = parseInt(year, 10);
  const m = normalize(make);
  const mdl = normalize(model);
  for (const entry of OIL_DB) {
    if (normalize(entry.make) === m) {
      for (const mm of entry.models) {
        if (normalize(mm.model) === mdl && mm.years.includes(y)) {
          return { oil: mm.oil, filter: mm.filter, certainty: "db" };
        }
      }
    }
  }
  // Heuristic fallback (very rough; verify!):
  if (!Number.isNaN(y)) {
    if (y >= 2018) return { oil: "0W-20", filter: "See supplier", certainty: "rule" };
    if (y >= 2010) return { oil: "5W-20", filter: "See supplier", certainty: "rule" };
  }
  return { oil: "5W-30", filter: "See supplier", certainty: "unknown" };
}

async function decodeVIN(vin) {
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const row = data?.Results?.[0] || {};
    return {
      year: row.ModelYear || "",
      make: row.Make || "",
      model: row.Model || row.Series || "",
      engine: row.EngineModel || row.EngineCylinders || row.DisplacementL || "",
      body: row.BodyClass || "",
    };
  } catch (e) {
    console.error("VIN decode failed", e);
    return null;
  }
}

function Droplet({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2C12 2 5 10 5 14.5C5 18.09 8.134 21 12 21C15.866 21 19 18.09 19 14.5C19 10 12 2 12 2Z"/>
    </svg>
  );
}

function LogoWordmark() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl p-2 bg-yellow-400 text-black shadow">
        <Droplet className="w-6 h-6" />
      </div>
      <div className="font-extrabold tracking-tight text-2xl md:text-3xl">Curbside Lube Co.</div>
    </div>
  );
}

function LogoGrid() {
  // Replace src values with your real files (e.g., /logos/logo1.png ...)
  const logos = [
    { src: "/logos/logo1.png", alt: "Curbside Lube Co. — Wordmark" },
    { src: "/logos/logo2.png", alt: "Curbside Lube Co. — Badge" },
    { src: "/logos/logo3.png", alt: "Curbside Lube Co. — Monogram" },
    { src: "/logos/logo4.png", alt: "Curbside Lube Co. — Pin" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {logos.map((l, i) => (
        <div key={i} className="relative aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shadow">
          <img src={l.src} alt={l.alt} className="object-contain w-full h-full p-6" onError={(e)=>{e.currentTarget.style.display='none';}} />
          {/* Fallback if image missing */}
          <div className="absolute inset-0 hidden items-center justify-center text-sm text-neutral-500" aria-hidden>
            Upload {`logo${i+1}.png`}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Simple self-tests for core logic ---
function runSelfTests() {
  const tests = [];
  function t(name, fn) {
    try { tests.push({ name, pass: !!fn() }); }
    catch (e) { tests.push({ name, pass: false, err: String(e) }); }
  }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Test cases
  t("Toyota Camry 2019 uses 0W-16, YZZA1", () => {
    const r = findOilFilter(2019, "Toyota", "Camry");
    return eq(r, { oil: "0W-16", filter: "Toyota 04152-YZZA1", certainty: "db" });
  });
  t("Honda Civic 2015 uses 0W-20, PH7317", () => {
    const r = findOilFilter(2015, "Honda", "Civic");
    return eq(r, { oil: "0W-20", filter: "Fram PH7317", certainty: "db" });
  });
  t("Unknown 2011 falls back to 5W-20 rule", () => {
    const r = findOilFilter(2011, "Foo", "Bar");
    return eq(r, { oil: "5W-20", filter: "See supplier", certainty: "rule" });
  });
  t("Unknown 2005 falls back to 5W-30 unknown", () => {
    const r = findOilFilter(2005, "Foo", "Bar");
    return eq(r, { oil: "5W-30", filter: "See supplier", certainty: "unknown" });
  });

  const allPass = tests.every(x => x.pass);
  return { allPass, tests };
}

function CurbsideLubeSite() {
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [notes, setNotes] = useState("");
  const [decoding, setDecoding] = useState(false);
  const [specs, setSpecs] = useState({ engine: "", body: "" });
  const [testReport, setTestReport] = useState(null);

  const { oil, filter, certainty } = useMemo(() => findOilFilter(year, make, model), [year, make, model]);

  useEffect(() => {
    // Run self-tests once on mount
    const rep = runSelfTests();
    setTestReport(rep);
  }, []);

  useEffect(() => {
    // Try to pre-fill location via browser geolocation (permission-based)
    if (typeof navigator !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation((prev) => prev || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      });
    }
  }, []);

  async function handleVINDecode(e) {
    e?.preventDefault();
    if (!vin || vin.trim().length < 8) return;
    setDecoding(true);
    const res = await decodeVIN(vin.trim());
    setDecoding(false);
    if (res) {
      if (res.year) setYear(String(res.year));
      if (res.make) setMake(res.make);
      if (res.model) setModel(res.model);
      setSpecs({ engine: res.engine || "", body: res.body || "" });
    }
  }

  function buildEmail() {
    const subject = `Curbside Lube Co. Request — ${make} ${model} ${year || "(Year?)"}`;
    const bodyLines = [
      `LOCATION: ${location || "(not provided)"}`,
      `VEHICLE: ${year || "?"} ${make || "?"} ${model || "?"}`,
      vin ? `VIN: ${vin}` : undefined,
      specs.engine ? `ENGINE: ${specs.engine}` : undefined,
      specs.body ? `BODY: ${specs.body}` : undefined,
      `\nRECOMMENDED (verify before service):`,
      `Oil: ${oil}`,
      `Filter: ${filter}`,
      certainty ? `Source: ${certainty === "db" ? "Curbside DB" : certainty === "rule" ? "Rule-of-thumb" : "Unknown"}` : undefined,
      notes ? `\nNOTES: ${notes}` : undefined,
      `\n— Submitted from website form`,
    ].filter(Boolean);
    return {
      subject: encodeURIComponent(subject),
      body: encodeURIComponent(bodyLines.join("\n")),
      raw: { subject, body: bodyLines.join("\n") }
    };
  }

  async function sendWithEmailJS() {
    if (!EMAILJS_CONFIG.useEmailJS) return alert("Enable EmailJS in config first.");
    try {
      // Lazy import EmailJS (FIXED URL)
      // @ts-ignore
      const emailjs = (await import("https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm")).default;
      const payload = {
        to_email: "clearyourwoods@gmail.com",
        location,
        year,
        make,
        model,
        vin,
        engine: specs.engine,
        oil,
        filter,
        notes,
      };
      const res = await emailjs.send(
        EMAILJS_CONFIG.service_id,
        EMAILJS_CONFIG.template_id,
        payload,
        { publicKey: EMAILJS_CONFIG.public_key }
      );
      alert("Email sent! (EmailJS)");
      return res;
    } catch (err) {
      console.error(err);
      alert("EmailJS send failed. Check console / keys.");
    }
  }

  const email = buildEmail();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white text-neutral-900">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <LogoWordmark />
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <a href="#how" className="hover:opacity-70">How it works</a>
          <a href="#form" className="hover:opacity-70">Book now</a>
          <a href="#faq" className="hover:opacity-70">FAQ</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-2 pb-8 md:pb-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Oil changes, <span className="text-yellow-600">right at your curb</span>.
          </h1>
          <p className="mt-4 text-lg text-neutral-700">
            We come to your driveway, office, or jobsite. No waiting room, no hassle. 
            Enter your details and we’ll bring the right oil and filter for your vehicle.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a href="#form" className="inline-flex items-center rounded-xl px-5 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow">
              Book your oil change
            </a>
            <a href="#how" className="inline-flex items-center rounded-xl px-5 py-3 bg-black text-white hover:opacity-90 font-semibold shadow">
              How it works
            </a>
          </div>
          <LogoGrid />
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-yellow-200/40 blur-2xl" aria-hidden></div>
          <div className="relative rounded-3xl border border-yellow-300/60 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Droplet className="w-5 h-5"/> Fast booking</h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li>• We decode your VIN (optional) to confirm specs</li>
              <li>• We bring the oil and filter you need</li>
              <li>• Service at your curb in ~30–45 minutes</li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-amber-50 text-xs text-amber-900 border border-amber-300">
              <strong>Heads‑up:</strong> Oil and filter suggestions are best‑effort from our database and rules. We always verify before servicing.
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-4 py-10">
        <h3 className="text-2xl font-bold mb-4">How it works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {title:"Tell us where", body:"Give your driveway, office, or a map pin."},
            {title:"Tell us your vehicle", body:"Enter year/make/model or just the VIN."},
            {title:"We handle the rest", body:"We bring the right oil & filter and service on‑site."},
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-white border p-5 shadow">
              <div className="flex items-center gap-2 font-semibold"><Droplet className="w-4 h-4"/>{s.title}</div>
              <p className="text-sm text-neutral-700 mt-2">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Developer self-test indicator */}
        {testReport && (
          <details className="mt-6 text-xs text-neutral-600">
            <summary>Developer self‑tests: {testReport.allPass ? "✅ All passed" : "⚠️ Some failed"}</summary>
            <ul className="list-disc pl-5 mt-2">
              {testReport.tests.map((t,i)=> (
                <li key={i}>{t.pass ? "✅" : "❌"} {t.name}</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Booking form */}
      <section id="form" className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-3xl bg-white border shadow-xl p-6 md:p-8">
          <h3 className="text-2xl font-bold mb-1">Book now</h3>
          <p className="text-sm text-neutral-600 mb-6">Enter your info. We’ll prepare an email with your details and the oil/filter we believe your vehicle needs.</p>

          <form className="grid md:grid-cols-2 gap-5" onSubmit={(e)=>e.preventDefault()}>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Service location (address, business, or GPS)</label>
              <input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="123 Main St, Rochester, MN or 44.02, -92.85" className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-yellow-500"/>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Vehicle year</label>
              <input value={year} onChange={(e)=>setYear(e.target.value)} placeholder="e.g., 2019" className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-yellow-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <input value={make} onChange={(e)=>setMake(e.target.value)} placeholder="e.g., Toyota" className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-yellow-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input value={model} onChange={(e)=>setModel(e.target.value)} placeholder="e.g., Camry" className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-yellow-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">VIN (optional, improves accuracy)</label>
              <div className="flex gap-2">
                <input value={vin} onChange={(e)=>setVin(e.target.value)} placeholder="17 characters" className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-yellow-500"/>
                <button type="button" onClick={handleVINDecode} className="rounded-xl px-4 py-2 bg-black text-white font-semibold hover:opacity-90 disabled:opacity-50" disabled={!vin || decoding}>
                  {decoding ? "Decoding…" : "Decode"}
                </button>
              </div>
              {specs.engine && (
                <p className="text-xs text-neutral-600 mt-1">Engine/Trim: {specs.engine} — Body: {specs.body}</p>
              )}
            </div>

            <div className="md:col-span-2 grid md:grid-cols-3 gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div>
                <div className="text-xs text-neutral-500">Suggested oil</div>
                <div className="font-semibold">{oil}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Suggested filter</div>
                <div className="font-semibold">{filter}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Source</div>
                <div className="font-semibold capitalize">{certainty}</div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes (parking info, time window, special requests)</label>
              <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-yellow-500"/>
            </div>

            <div className="col-span-2 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:clearyourwoods@gmail.com?subject=${email.subject}&body=${email.body}`}
                className="inline-flex items-center rounded-xl px-5 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow"
                target="_blank" rel="noreferrer"
              >
                Send via Mail App
              </a>
              <button type="button" onClick={()=>navigator.clipboard?.writeText(email.raw.body)} className="inline-flex items-center rounded-xl px-4 py-3 bg-neutral-900 text-white hover:opacity-90 font-semibold">
                Copy details
              </button>
              <button type="button" onClick={sendWithEmailJS} className="inline-flex items-center rounded-xl px-4 py-3 bg-white border font-semibold hover:bg-neutral-50">
                Send with EmailJS (optional)
              </button>
              <span className="text-xs text-neutral-600">Emails go to <span className="font-semibold">clearyourwoods@gmail.com</span></span>
            </div>

            <div className="col-span-2 text-xs text-neutral-500 mt-2">
              <p>
                <strong>Disclaimer:</strong> Oil viscosity and filter part numbers shown are best‑effort suggestions based on a small database and heuristics. 
                Always verify against OEM specs (owner’s manual or supplier catalog) before service. By submitting, you consent to be contacted about scheduling.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold mb-4">FAQ</h3>
        <div className="space-y-4">
          <details className="rounded-2xl bg-white border p-5">
            <summary className="cursor-pointer font-semibold">Do I have to provide a VIN?</summary>
            <p className="mt-2 text-sm text-neutral-700">No. VIN helps us confirm the exact engine so we bring the correct oil and filter. You can also enter year/make/model manually.</p>
          </details>
          <details className="rounded-2xl bg-white border p-5">
            <summary className="cursor-pointer font-semibold">What oil brands do you use?</summary>
            <p className="mt-2 text-sm text-neutral-700">We stock major-brand full‑synthetic oils meeting API/ILSAC specs. We’ll match viscosity to your manufacturer recommendation.</p>
          </details>
          <details className="rounded-2xl bg-white border p-5">
            <summary className="cursor-pointer font-semibold">How long does service take?</summary>
            <p className="mt-2 text-sm text-neutral-700">Most curbside oil changes are completed in 30–45 minutes depending on your vehicle and site setup.</p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-neutral-600">
          <LogoWordmark />
          <div>© {new Date().getFullYear()} Curbside Lube Co. — All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <CurbsideLubeSite />;
}
