# FINOPS COPILOT — MODULE 3: PROCUREMENT INTELLIGENCE
## Complete Spec | All Akshay Conversations Consolidated | April 2026
## Upload to Project Files — Claude reads this at thread start

---

## 1. WHAT THIS IS

**Module 3 of FinOps Copilot.** Vendor Allocation Optimizer for packaging supply chain.
NOT a separate project — merges into FinOps as "Procurement Intelligence" module.

**FinOps reframes from** "Tax Compliance Tool" **to** "Financial Operations Intelligence Platform":
- Module 1: Invoice Intelligence (TDS, compliance) — original
- Module 2: Bank Reconciliation — original  
- Module 3: Procurement Intelligence (vendor allocation) — this document

**Build timing:** Week 6-7 of FinOps build. NOT before Modules 1-2.

---

## 2. THE PROBLEM (SIMPLE VERSION)

Blinkit has 41 warehouses across India. They need delivery bags (5 types: Small, Medium, Large, Semi Large, Discreet). 30 vendors supply these bags at different prices, different delivery speeds, different capacities.

**Every quarter, Akshay manually decides:**
- Which vendors supply which warehouses
- At what percentage split (e.g., Vendor A gets 30%, Vendor B gets 25%)
- Across all 5 bag types

**The numbers:**
- 41 warehouses × 5 bag types = **205 allocation decisions** per quarter
- Quarterly volume: **~36.2 crore bags**
- Quarterly spend: **₹81.5 crore**
- Cost per order: **₹2.67**
- Even 1% optimization = **₹81.5 lakh saved per quarter**

**Current process:** Manual Excel. "As per experience and manual lookouts." The person who built the original sheet is from a different team. Even Akshay doesn't fully understand the logic (e.g., doesn't know what "Flag" column means). ₹81.5 crore quarterly decision on tribal knowledge.

---

## 3. THE DATA (Real Blinkit Q1 2026)

**File received:** `Packaging_Bags_Summary_JFM.xlsx`
**9 sheets:**

### Sheet 1: Allocation (REFERENCE ONLY — Akshay said ignore)
- 211 rows × 52 columns
- Current manual allocation output
- "Flag" vs "OK" status — Akshay doesn't know the logic
- "OG Vendor Count" — ignore
- "V1 = 0" pattern — ignore
- Sheet built by PO/procurement team, not Akshay

### Sheets 2-6: Pricing Matrices (CORE INPUT)
- **Small** (42 rows × 22 vendors): ₹0.60 - ₹1.26 per bag
- **Medium** (42 rows × 18 vendors): ₹1.98 - ₹3.33 per bag
- **Large Bag** (42 rows × 29 vendors): ₹4.37 - ₹5.95 per bag
- **Semi Large** (42 rows × 31 vendors): ₹2.34 - ₹3.57 per bag
- **Discreet Bag** (42 rows × 17 vendors): ₹1.00 - ₹1.45 per bag
- NaN = vendor doesn't service that warehouse

### Sheet 7: Delivery Days (MESSY — needs AI cleaning)
- 42 warehouses × 26 vendors
- 10+ formats: "3-4 days", "Next day delivery", "48 hours", "2--3", dates (errors)
- Delivery times are contractual — vendors penalized for delays
- Data is trustworthy (per Akshay)

### Sheet 8: Capacity and Truck Load (CONSTRAINTS)
- Daily production capacity per vendor per bag type
- Full Truck Load (FTL) minimums per vendor per bag type
- FTL varies by truck size (20ft vs 32ft)

### Sheet 9: Summary
- Total Orders: 305,300,000
- Total Bags: 361,794,499  
- Total Cost: ₹815,377,879
- Cost Per Order: ₹2.67

### Data Quality Issues Found:
- Delivery times in 10+ formats (need normalization)
- #ERROR! in JFM Avg columns (broken source formulas)
- Vendor name inconsistencies across sheets:
  - "Pkg P" / "PKG P" → "Pkg P"
  - "Aristo" / "Aristo Eco" → "Aristo"
  - "Osian" / "Osian Eco" → "Osian"
  - "Etiabhn" / "Etibahn" → "Etibahn"
- Capacity data in mixed formats: "150000 nos", "1,75,000 PCS / DAY", "100000-150000"
- 2,397 valid vendor-warehouse-bag combinations out of theoretical 6,150

### Top Vendors by Coverage:
```
VTPL:     205 combos (everywhere but expensive)
Aaum:     205 combos (everywhere but expensive)
Altpac:   202 combos (strong national coverage)
Packart:  176 combos
SA Poly:  169 combos
Rees:     167 combos
KT:       124 combos
Biofriend: 106 combos
Aristo:    85 combos
Pkg P:     82 combos (South India focused)
```

---

## 4. AKSHAY'S ANSWERS (Complete Record)

### Priority & Weights
- **Cost vs Delivery:** Both matter. "Minimize cost but not at cost of disrupting operations." → Default weights: Cost 50%, Delivery 35%, Reliability 15%

### Vendors Per Warehouse
- **4-5 vendors per WAREHOUSE** (not per bag type)
- Same vendor gets same % across all bag types they supply
- Reason: easy tracking + vendor's truck load fills up with mixed bag types
- Can't map more than 4-5 because "truck offloading ka scene hota hai"

### Two Vendor Categories
- **Category A: Full-Range Vendors** — supply all 5 bag types. Get same % across all types. One truck carries mixed bags. These are primary allocation.
- **Category B: Specialist Vendors** — supply 1-2 bag types only. Get allocated independently for their specific types. Gap-fillers.

### Full Truck Load (FTL)
- **HARD constraint** — allocation must ensure vendor gets enough volume for FTL
- **Combined truck:** All bag types go in one truck. 1 lakh each of 5 types = 5 lakh = full load
- **FTL checked at:** monthly demand × vendor % (orders are monthly)
- If vendor can't hit FTL → either increase their share or drop them

### Order Frequency
- **Monthly.** PO raised in advance (April PO for May estimation)
- FTL math: quarterly demand ÷ 3 = monthly demand per warehouse

### Truck Consolidation (Multi-Warehouse)
- **"Can be both. Depends on situation."**
- Not mandated but can be proposed
- **Solution:** Toggleable feature. Default OFF. Akshay manually groups warehouses into clusters. Checkbox ON → FTL checks against combined cluster volume.
- Pre-built clusters: NCR (Noida, Dasna, Farukhnagar, Faridabad, Kundli), Mumbai (M10, M11, M12), Bengaluru (B3, B4, B5)

### Local Vendors
- **Last resort.** Local = small, less reliable
- Only use if cheaper AND faster
- Exception: emergency orders — prefer local for same-day delivery

### Contracts & Pricing
- **No annual commitments.** Fresh decision every quarter
- **No volume discounts** in current data (negotiation-dependent)
- **GST: flat 18%, NOT included in prices.** Same across intra/inter-state — doesn't affect vendor comparison
- **Payment terms:** Akshay not aware. Not a factor for v1

### Quality & Reliability  
- Quality variance exists, random QC happens, vendors penalized for test failures
- No structured defect rate data available → can't build into v1 scoring
- Delivery times mostly accurate per contract, penalties for delays

### Demand Patterns
- Seasonal variation: **festive quarters can be 1.5x to 2x**
- AMJ (April-May-June) is low on festive
- **Solution:** Demand multiplier input (1.0x to 2.5x) in UI

### Current Process Origin
- Allocation sheet built by **PO/procurement team** (different from Akshay's team)
- They interact with vendors, raise POs, track demand
- "Allocation was as per experience and manual lookouts" — gut feeling
- No documented optimization logic

---

## 5. ALGORITHM SPEC (FINAL LOCKED)

### Two-Pass Allocation

**PASS 1: Full-Range Vendors (Warehouse Level)**
- For each warehouse, find vendors with valid pricing across ALL 5 bag types
- Score each vendor (composite across all types)
- Select top 3-4
- Same % applied across all bag types
- FTL check: monthly combined qty (all types) >= FTL minimum

**PASS 2: Specialist Gap-Fill (Bag-Type Level)**
- For bag types where full-range vendors are expensive or missing
- Add 1-2 specialists with independent allocation %
- FTL checked independently for their specific bag type

### Scoring Formula

```
CompositeScore = (0.50 × CostScore) + (0.35 × DeliveryScore) + (0.15 × ReliabilityScore)

CostScore = 1.0 - ((vendorPrice - minPrice) / (maxPrice - minPrice))
DeliveryScore = 1.0 - ((vendorDays - minDays) / (maxDays - minDays))
ReliabilityScore = f(capacity headroom, FTL feasibility)

Weights are user-adjustable via sliders (must sum to 100%)
```

### For Full-Range Vendors, CostScore aggregates across bag types:
```
CostScore = weighted average of CostScore per bag type
            (weighted by demand proportion of each bag type at that warehouse)
```

### Hard Constraints
1. 4-5 vendors per warehouse (configurable)
2. No single vendor > 40% at any warehouse
3. No single vendor < 10% (not worth the overhead)
4. Monthly allocated qty (all bag types combined) >= vendor's FTL
5. Vendor quarterly capacity across ALL warehouses not exceeded
6. Allocations sum to 100%

### Processing Order
- Warehouses processed in DESCENDING order of total demand
- High-volume warehouses get first pick of vendor capacity

### FTL Calculation
```
monthly_demand = quarterly_demand / 3
vendor_monthly_qty = monthly_demand × vendor_allocation_pct
combined_qty = sum(vendor_monthly_qty across all bag types at this warehouse)
MUST: combined_qty >= vendor_ftl_minimum
```

### Cluster Consolidation (Toggleable)
```
IF cluster_enabled:
  combined_qty = sum(vendor_monthly_qty across all warehouses in cluster, all bag types)
  MUST: combined_qty >= vendor_ftl_minimum
```

---

## 6. AI INTEGRATION (Honest Mapping)

### WHERE AI GENUINELY ADDS VALUE:

**A. Data Ingestion & Cleaning**
- Parse 10+ delivery time formats → normalized days
- Parse capacity strings → numbers
- Handle vendor name inconsistencies
- "3-4 days" → 3.5, "Next day" → 1, "48 hours" → 2, "1900-06-01" → null (error)

**B. Post-Optimization Reasoning (Claude)**
- Concentration risk: "Altpac allocated to 18/41 warehouses — single point of failure"
- Cost anomalies: "Bengaluru paying 40% premium because only 2 vendors service it"
- Capacity strain: "SA Poly at 87% quarterly capacity across all allocations"

**C. What-If Scenarios (Claude + Tool Use)**
- "What if Altpac raises prices 15%?" → rerun → explain impact
- "What if Mumbai volume doubles?" → show capacity constraints
- "What if we drop vendor X?" → reallocation + cost impact
- Claude CALLS optimization function as a tool, interprets results

**D. Natural Language Queries**
- "Which vendor has best cost-to-delivery ratio for South India?"
- "Show me warehouses paying more than ₹0.70 per small bag"

### WHERE AI DOES NOT ADD VALUE (don't pretend):
- Scoring calculation → pure math
- Sorting/ranking → array.sort()
- Percentage allocation → arithmetic
- Excel export → SheetJS
- Visualization → Chart.js

### AI CONCEPTS THIS TEACHES (for interviews):
- Prompt engineering for structured data tasks ✅
- Tool use / function calling (Claude calls optimizer as tool) ✅
- LLM-as-reasoning-engine pattern ✅
- Structured output parsing & validation ✅
- Judgment: when AI adds value vs when algorithms are better ✅
- Multi-step agent workflows (what-if) ✅

### AI CONCEPTS THIS DOES NOT TEACH:
- Fine-tuning, embeddings/vector search (Module 1-2 covers these)
- Training data curation, model evaluation at scale (Outlier covers story)

---

## 7. TECH STACK

```
Data Parsing:      SheetJS (read/write Excel)
AI Cleaning:       Claude API (normalize messy formats)
Scoring Engine:    Pure JavaScript (weighted scoring)
Optimization:      Custom greedy with constraint satisfaction
                   (v2: javascript-lp-solver for true LP)
AI Reasoning:      Claude API with tool use
Visualization:     Chart.js (cost charts, vendor distribution)
Export:            SheetJS (allocation Excel) + jsPDF (summary)
```

---

## 8. FILE STRUCTURE (within FinOps Copilot)

```
src/modules/procurement/
  components/
    ProcurementUpload.jsx       // Excel upload + config sliders
    ProcurementDashboard.jsx    // Results overview
    AllocationTable.jsx         // Warehouse-level detail
    VendorAnalysis.jsx          // Vendor-centric view
    WhatIfPanel.jsx             // Scenario engine
    RiskFlags.jsx               // Alert cards
    ClusterConfig.jsx           // Warehouse grouping toggles
  utils/
    dataIngestion.js            // SheetJS → raw tables
    dataCleaner.js              // Normalize delivery/capacity/names
    scoringEngine.js            // CompositeScore calculation
    allocationEngine.js         // Two-pass allocation algorithm
    constraintChecker.js        // FTL, capacity, concentration
    scenarioEngine.js           // What-if parameter adjustments
    exportAllocation.js         // Generate allocation Excel
  prompts/
    cleaningPrompt.js           // AI data normalization
    analysisPrompt.js           // Post-optimization reasoning
    whatIfPrompt.js             // Scenario explanation
  data/
    vendorNameMap.js            // Name normalization lookup
    regionMap.js                // Warehouse → region mapping
    warehouseClusters.js        // Pre-built cluster definitions
    sampleData.js               // Demo mode cached data
```

---

## 9. BUILD PLAN (Week 6-7)

```
Day 1: Data Ingestion + Cleaning (4-5 hrs)
  - SheetJS parsing for all 9 sheets
  - dataCleaner.js (delivery days, capacity, vendor names)
  - AI-assisted cleaning for edge cases
  - Unit tests with real data

Day 2: Scoring + Allocation Engine (5-6 hrs)
  - scoringEngine.js (3 score components)
  - allocationEngine.js (two-pass: full-range → specialist)
  - constraintChecker.js (FTL combined, capacity, concentration)
  - Cluster consolidation toggle

Day 3: UI — Upload + Dashboard (4-5 hrs)
  - Upload + weight sliders + demand multiplier
  - Dashboard (summary cards, risk flags)
  - Allocation table (expandable warehouse rows)

Day 4: AI Layer + What-If (4-5 hrs)
  - Claude post-optimization analysis
  - What-if panel (natural language + quick scenarios)
  - Tool use: adjustPrices, runAllocation, compareAllocations

Day 5: Export + Polish (3-4 hrs)
  - Excel export matching Blinkit format
  - Chart.js visualizations
  - Demo mode with cached responses
  - Bug fixes
```

---

## 10. INTERVIEW STORY

### 60-Second Pitch:
"My platform's procurement module optimizes vendor allocation for a quick-commerce supply chain — 41 warehouses, 30 vendors, 5 product types, ₹81 crore quarterly spend. Currently this ₹81 crore decision is made manually based on tribal knowledge — the person who built the original allocation logic left, and no one fully understands it. My tool uses multi-objective scoring across cost, delivery time, and supply resilience, with constraint satisfaction for production capacity and truck load minimums. The AI layer adds genuine value in three places: parsing messy real-world data, detecting cross-warehouse concentration risks, and natural language what-if scenarios. My domain validator at Blinkit confirmed this reduces quarterly allocation from hours to minutes."

### Key Interview Lines:
- "₹81.5 crore quarterly decision on gut feeling → one-click optimization"
- "I knew the core problem was classical optimization, not AI. I added AI only where it genuinely helped."
- "Knowing where NOT to use AI is as important as knowing where to use it."
- "Even 1% optimization = ₹81.5 lakh saved per quarter. That's the business case."
- "Real data, real user, real problem — not a toy demo."

---

## 11. VALIDATION PLAN

### Akshay Beta Tests:
- Tool produces allocation → Akshay compares with his manual output
- Within 5% of his manually-optimized cost = pass
- All constraint violations flagged automatically = pass
- What-if in <10 seconds vs hours manually = pass
- Excel export usable directly = pass
- PO/procurement team can also validate ("does this make sense?")

### Acceptance Criteria:
- [ ] All 205 allocation decisions produced
- [ ] FTL constraints satisfied (combined, monthly)
- [ ] No vendor exceeds quarterly capacity
- [ ] 4-5 vendors per warehouse enforced
- [ ] Risk flags catch concentration issues
- [ ] What-if scenarios work for price changes
- [ ] Excel export matches Blinkit format
- [ ] Akshay says "this is useful"

---

## 12. FUTURE (Month 2+)

- Historical tracking: actual delivery time vs quoted → vendor reliability scores
- Quality scoring: if defect rate data becomes available
- LP solver: replace greedy with true linear programming
- RAG: "How did we allocate Noida last quarter?"
- Payment terms integration: if data becomes available
- Warehouse storage/DOI optimization: if capacity data becomes available
- Vendor onboarding simulator: "If we add a vendor in Bengaluru..."
- Seasonal demand modeling from historical trends

---

## 13. PROTOTYPE ALREADY BUILT

Interactive React prototype exists with real Blinkit data:
- 10 warehouses, Small bags
- Adjustable weight sliders
- What-if scenario panel
- Warehouse and Vendor views
- Score breakdown per allocation

---

## 14. DATA FILES

- `Packaging_Bags_Summary_JFM.xlsx` — Akshay's real Blinkit data (received Apr 3, 2026)
- `PROCUREMENT_INTELLIGENCE_DESIGN.md` — Full technical design doc
- `procurement_optimizer_prototype.jsx` — Working prototype with real data

---

## 15. CRITICAL REMINDERS

1. This is MODULE 3, build AFTER Modules 1-2 (Week 6-7)
2. Akshay is beta tester — show him working output, not more questions
3. FTL is HARD constraint, combined truck, monthly check
4. Two-pass algorithm: full-range first, specialists second
5. Weights adjustable but default 50/35/15 (cost/delivery/reliability)
6. Demand multiplier for seasonal variation (1.0x - 2.5x)
7. Cluster consolidation is toggleable, not default
8. "Flag" column in original sheet — unknown logic, don't try to replicate
9. Local vendors = last resort, not preferred
10. No annual contracts, no volume discounts in current data

---

**ॐ RADHA RANI KI KRIPA SE 🙏🏽**
