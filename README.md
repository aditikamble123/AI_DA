# 🤖 AI Data Analyst

> A powerful, privacy-first data analysis tool that runs entirely in your browser — no API keys, no server, no internet required after the first load.

🌐 **Live Demo:** [https://aditikamble123.github.io/AI_DA/](https://aditikamble123.github.io/AI_DA/)

---

## ✨ Features

- **📁 CSV Upload** — Drag & drop any `.csv` file to load your dataset instantly
- **📊 Statistics Tab** — Auto-generates mean, median, min, max, std deviation, missing values, and top value frequencies for every column
- **📈 Chart Tab** — Plot interactive bar or line charts for any column combination using Chart.js
- **💬 AI Chat** — Ask plain English questions about your data and get instant, formatted answers
- **🔒 100% Private** — All analysis happens on your device. Your data never leaves your browser.
- **⚡ No Setup** — Pure HTML/CSS/JS. Just open `index.html` and go.

---

## 🚀 Getting Started

### Option 1: Use the Live Version
Visit the live site: **[https://aditikamble123.github.io/AI_DA/](https://aditikamble123.github.io/AI_DA/)**

### Option 2: Run Locally
```bash
git clone https://github.com/aditikamble123/AI_DA.git
cd AI_DA
open index.html   # Mac
# or just double-click index.html in your file explorer
```

No `npm install`. No build step. No terminal required.

---

## 💬 Example Questions You Can Ask

Once a CSV is uploaded, try asking:

| Query | What It Does |
|---|---|
| `Summarize the data` | Full overview: rows, columns, types, missing values |
| `Statistics for Sales` | Mean, median, min, max, std dev for any numeric column |
| `Which row has the highest Revenue?` | Finds and shows the top/bottom rows by any column |
| `Unique values in Category` | Frequency table of all distinct values |
| `How many missing values?` | Missing value report for all columns |
| `Sort by Date descending` | Returns the top 10 rows sorted by any column |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML / CSS / JavaScript | Core application |
| [PapaParse](https://www.papaparse.com/) | Fast, in-browser CSV parsing |
| [Chart.js](https://www.chartjs.org/) | Interactive data visualizations |
| [Marked.js](https://marked.js.org/) | Markdown rendering in chat |
| [Font Awesome](https://fontawesome.com/) | Icons |
| Google Fonts (Inter) | Typography |

> All libraries are loaded via CDN — no package manager needed.

---

## 📁 Project Structure

```
AI_DA/
├── index.html     # Main app structure & layout
├── styles.css     # Glassmorphism design system
├── app.js         # Local AI analysis engine + UI logic
├── CLAUDE.md      # Project config for AI assistant
└── README.md      # This file
```

---

## 🎨 Design

Built with a modern **dark glassmorphism** aesthetic:
- Animated gradient background blobs
- Frosted glass panels with subtle borders
- Purple/indigo/pink brand gradient
- Smooth micro-animations and hover effects
- Fully responsive layout

---

## 🔐 Privacy

This app performs **all data processing locally in your browser** using JavaScript. Your dataset is:
- ❌ Never uploaded to any server
- ❌ Never sent to any AI API
- ✅ Only processed in memory on your own device

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ using Antigravity AI</p>
