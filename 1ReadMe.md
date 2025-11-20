# NHIS Fraud Auditor Dashboard

A full-stack web application for analyzing healthcare claims and detecting potential fraud using a custom heuristic-based scoring system.

**Live Demo**: 

## 🎯 Project Overview

The NHIS Fraud Auditor Dashboard is a rapid MVP prototype built to help claims auditors identify potentially fraudulent healthcare claims. The application processes claims data, assigns fraud likelihood scores using a custom heuristic, and provides an intuitive interface for reviewing and filtering claims.

### Key Features

✅ **Automated Fraud Scoring**: Every claim receives a 0-100 fraud likelihood score  
✅ **Dashboard Analytics**: Real-time metrics and visualizations of fraud distribution  
✅ **Advanced Search & Filtering**: Multi-parameter search by diagnosis, patient, provider, score range  
✅ **Paginated Claims Review**: Efficient browsing of large datasets  
✅ **RESTful API**: Clean Django REST Framework backend  
✅ **Modern UI**: React with Tailwind CSS and Chart.js visualizations


## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│                 │         │                  │         │             │
│  React Frontend │────────▶│  Django REST API │────────▶│  SQLite DB  │
│   (Port 5000)   │  HTTP   │   (Port 8000)    │  ORM    │             │
│                 │◀────────│                  │◀────────│             │
└─────────────────┘  JSON   └──────────────────┘         └─────────────┘
       │                              │
       │                              │
       ▼                              ▼
 Tailwind CSS                  Fraud Score Engine
 Chart.js                      (Heuristic Logic)
 React Router                  Pandas (CSV Import)
```


## Component Breakdown

**Backend (Django)**
- `claims/models.py`: Data models for Claims
- `claims/views.py`: REST API viewsets for dashboard and claims
- `claims/serializers.py`: DRF serializers
- `claims/fraud_engine.py`: Fraud likelihood scoring engine
- `claims/management/commands/load_claims.py`: CSV data ingestion

**Frontend (React + Vite)**
- `Dashboard.jsx`: Metrics overview with Chart.js visualizations
- `ClaimsList.jsx`: Paginated table with search/filter
- `api.js`: Axios service layer for API calls

## 🔍 Fraud Likelihood Score Heuristic

### Formula Overview

The fraud score (0-100) is calculated using three weighted components:

```
Final Score = (Amount Variance × 0.40) + 
              (Provider Frequency × 0.30) + 
              (Diagnosis Complexity × 0.30)
```


### Component Details

#### 1. Amount Variance Score (Weight: 40%)

Compares claim amount against average for the same diagnosis:

```python
variance_ratio = claim_amount / avg_diagnosis_amount

if variance_ratio > 3.0:    score = 100  # Extremely high claim
elif variance_ratio > 2.0:  score = 80   # Very high claim
elif variance_ratio > 1.5:  score = 60   # High claim
elif variance_ratio < 0.5:  score = 70   # Suspiciously low
elif variance_ratio < 0.7:  score = 40   # Somewhat low
else:                       score = 20   # Normal range
```

**Rationale**: Claims significantly above or below average for a diagnosis are suspicious.

#### 2. Provider Frequency Score (Weight: 30%)

Analyzes provider behavior patterns:

```python
# Base frequency score
if provider_claim_count > 100:   frequency_score = 40
elif provider_claim_count > 50:  frequency_score = 30
elif provider_claim_count > 20:  frequency_score = 20
else:                            frequency_score = 10

# Add amount deviation penalty
amount_deviation = |claim_amount - provider_avg| / provider_avg

if amount_deviation > 2.0:   frequency_score += 60
elif amount_deviation > 1.0: frequency_score += 30
else:                        frequency_score += 10
```

**Rationale**: High-volume providers with inconsistent claim amounts may indicate fraud patterns.

#### 3. Diagnosis Complexity Score (Weight: 30%)

Evaluates complexity based on diagnosis code length and claim amount:

```python
# Code complexity
if len(diagnosis_code) > 6:    complexity_score = 20
elif len(diagnosis_code) > 4:  complexity_score = 10
else:                          complexity_score = 5

# Amount-based addition
if claim_amount > 50000:       complexity_score += 60
elif claim_amount > 20000:     complexity_score += 40
elif claim_amount > 10000:     complexity_score += 20
else:                          complexity_score += 10
```

**Rationale**: Complex diagnoses with high amounts warrant closer scrutiny.

### Risk Categories

- **Low Risk (0-25)**: Normal claims, standard processing
- **Medium Risk (26-75)**: Flag for review if other indicators present
- **High Risk (76-100)**: Priority review required

---


## 🛠️ Tech Stack

### Backend
- **Python 3.11** - Primary language
- **Django 5.2** - Web framework
- **Django REST Framework 3.16** - RESTful API
- **Pandas 2.3** - CSV processing & data analysis
- **NumPy 2.3** - Statistical calculations
- **Gunicorn 23.0** - Production WSGI server
- **SQLite3** - Database (file-based, included with Python)

### Frontend
- **React 18** - UI framework
- **Vite 7.2** - Build tool & dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Chart.js 4.x** - Data visualization
- **React-ChartJS-2** - Chart.js React wrapper
- **Tailwind CSS 3.4** - Utility-first CSS


## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nhis-fraud-auditor
```

2. **Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
```

### Load Sample Data

```bash
cd backend
python manage.py load_claims ../data/sample_claims.csv
```

Access the application at: `http://localhost:5000`

---

## 🗄️ Database Schema

### Claims Table

```sql
CREATE TABLE claims_claim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id VARCHAR(100) UNIQUE NOT NULL,
    patient_id VARCHAR(100) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    diagnosis_code VARCHAR(50) NOT NULL,
    diagnosis_description TEXT,
    procedure_code VARCHAR(50),
    procedure_description TEXT,
    claim_amount DECIMAL(12, 2) NOT NULL,
    claim_date DATE NOT NULL,
    service_date DATE,
    fraud_score INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_fraud_score ON claims_claim(fraud_score);
CREATE INDEX idx_claim_date ON claims_claim(claim_date);
CREATE INDEX idx_patient_claim ON claims_claim(patient_id, claim_date);
CREATE INDEX idx_provider_claim ON claims_claim(provider_id, claim_date);
CREATE INDEX idx_diagnosis ON claims_claim(diagnosis_code);
```

### Key Queries

**Get Dashboard Metrics:**
```sql
SELECT 
    COUNT(*) as total_claims,
    AVG(claim_amount) as avg_amount,
    COUNT(CASE WHEN fraud_score > 75 THEN 1 END) as high_risk_count,
    COUNT(CASE WHEN fraud_score <= 25 THEN 1 END) as low_risk_count,
    COUNT(CASE WHEN fraud_score > 25 AND fraud_score <= 75 THEN 1 END) as medium_risk_count
FROM claims_claim;
```

**Filter Claims by Score Range:**
```sql
SELECT * FROM claims_claim
WHERE fraud_score BETWEEN 76 AND 100
ORDER BY fraud_score DESC, claim_date DESC
LIMIT 20 OFFSET 0;
```

**Search Claims:**
```sql
SELECT * FROM claims_claim
WHERE 
    claim_id LIKE '%search%' OR
    patient_id LIKE '%search%' OR
    diagnosis_code LIKE '%search%'
ORDER BY fraud_score DESC;
```

---

## 🎨 System Design

### Design Principles

1. **Separation of Concerns**: Backend handles business logic, frontend handles presentation
2. **RESTful Design**: Stateless API with standard HTTP methods
3. **Component-Based UI**: Reusable React components
4. **Responsive Design**: Mobile-first approach with Tailwind CSS

### Key Design Decisions

**Why SQLite?**
- ✅ Zero configuration for MVP
- ✅ File-based (easy deployment on Replit)
- ✅ Sufficient for prototype with <100K claims
- ⚠️ Needs migration to PostgreSQL for production scale

**Why Django REST Framework?**
- ✅ Built-in pagination, filtering, serialization
- ✅ Automatic API documentation (Browsable API)
- ✅ Easy to extend with authentication later

**Why React with Vite?**
- ✅ Fast HMR (Hot Module Replacement)
- ✅ Modern build tooling
- ✅ Component reusability

### Logging & Debugging

The application includes comprehensive logging:

**Console Logs:**
- All API requests/responses
- Fraud score calculation details
- Data ingestion progress

**File Logs:**
- Location: `backend/debug.log`
- Levels: INFO, DEBUG, WARNING, ERROR
- Format: `{levelname} {asctime} {module} {message}`






#### 2. Fraud Heuristic Logic
**Prompt:**
> "Create a Python class for calculating healthcare claim fraud likelihood scores (0-100) using three factors: (1) claim amount variance from diagnosis average, (2) provider claim frequency patterns, and (3) diagnosis complexity based on code length and amount. Weight the factors 40%, 30%, 30% respectively. Include detailed component scoring logic and return the final weighted score."

**Output Used For:**
Built `claims/fraud_engine.py` with the `FraudScoreEngine` class. Refined scoring thresholds based on sample data testing.



#### 3. React Dashboard Component
**Prompt:**
> "Create a React component for a healthcare claims fraud dashboard. It should fetch metrics from an API endpoint (/api/claims/dashboard_metrics/), display three metric cards (total claims, average amount, high-risk percentage), and show a Chart.js pie chart and bar chart visualizing fraud score distribution by risk category (Low: 0-25, Medium: 26-75, High: 76-100). Use Tailwind CSS for styling."

**Output Used For:**
Generated `Dashboard.jsx` with complete Chart.js integration. Added responsive grid layout and loading states.

**Impact:** Full-featured dashboard UI delivered in one iteration with professional styling.

---




## 👔 Management Deliverables

### 1. Motivating Teams Under High Pressure with Legacy Systems

**Situation:** High-pressure delivery with technical debt in legacy codebase.

**Approach:**
- **Transparent Communication**: Regular stand-ups to surface blockers early. Celebrate small wins daily.
- **Incremental Modernization**: Don't boil the ocean. Identify high-impact modules and refactor in sprints.
- **Skill Development**: Pair junior devs with seniors on legacy code. Knowledge transfer reduces bus factor.
- **Autonomy & Ownership**: Let team members lead specific legacy module refactors. Ownership drives motivation.

**Example:**
On a recent project migrating a monolithic PHP app, I broke the work into two-week sprints with clear deliverables. We celebrated each microservice extraction. Morale improved when the team saw tangible progress vs. endless refactoring.

---

### 2. Managing Poor Performance

**Framework:** Diagnose → Support → Decide

**Step 1: Diagnose Root Cause**
- Is it skill gap, misaligned role, personal issues, or team dynamics?
- Conduct 1:1 to understand their perspective

**Step 2: Provide Support**
- **Skill Gap**: Create learning plan with milestones (courses, pair programming)
- **Role Misalignment**: Explore lateral moves or task reassignment
- **Personal Issues**: Offer flexibility, EAP resources, temporary workload adjustment

**Step 3: Set Clear Expectations**
- Document performance improvement plan (PIP) with:
  - Specific, measurable goals
  - 30/60/90 day checkpoints
  - Support resources available

**Step 4: Decide**
- If improvement: Continue with monitoring
- If no improvement: Transition plan (exit or role change)



### 3. Ensuring On-Time Delivery & Managing Competing Priorities

**Frameworks Used:**

**Priority Matrix (Eisenhower):**
```
 High Impact
     │
     │  [DO NOW]     │  [SCHEDULE]
     │  Ship MVP     │  Scalability
     │  Fix P0 bugs  │  Documentation
─────┼───────────────┼─────────────
     │  [DELEGATE]   │  [ELIMINATE]
     │  UI polish    │  Nice-to-haves
     │  Monitoring   │  
     │
 Low Impact
```

**Tactics:**

1. **Ruthless Prioritization**
   - Weekly priority review with stakeholders
   - Kill features that don't move the needle
   - "What's the worst that happens if we skip this?"

2. **Time-Boxing**
   - Set hard deadlines for research/spikes (4 hours max)
   - Use Parkinson's Law: Work expands to fill time

3. **Dependency Mapping**
   - Identify critical path items
   - Parallelize independent work streams
   - Address blockers in daily stand-ups

4. **Buffer Management**
   - Build 20% buffer for unknowns
   - Front-load risky items (spike early)

**Example from This Project:**
- **Competing Priorities**: Full fraud ML model vs. simple heuristic
- **Decision**: MVP with heuristic (2 hours) over ML (2 weeks)
- **Outcome**: Delivered working system in 8 hours, validated approach before investing in ML

---

### 4. Stakeholder Communication & Engagement

**Communication Cadence:**

| Stakeholder | Frequency | Format | Content |
|-------------|-----------|--------|---------|
| Executive Sponsors | Weekly | Email summary | Progress %, risks, decisions needed |
| Product Owners | Daily | Slack/Teams | Completed work, blockers |
| End Users | Bi-weekly | Demo | New features, gather feedback |
| Developers | Daily | Stand-up | Technical blockers, pair opportunities |

**Engagement Strategies:**

1. **Show, Don't Tell**
   - Live demos > PowerPoint
   - Working prototypes > mockups
   - Data-driven updates > status reports

2. **Manage Expectations**
   - Be honest about risks and trade-offs
   - "We can have X or Y by Friday, not both"
   - No surprises: Escalate issues early

3. **Create Feedback Loops**
   - Invite stakeholders to sprint reviews
   - User testing sessions (watch them struggle)
   - Analytics dashboards for metrics-driven decisions

4. **Translate Technical to Business**
   - Instead of: "We need to refactor the fraud engine"
   - Say: "Improving scoring accuracy to reduce false positives by 30%, saving 10 hours/week of manual review"

