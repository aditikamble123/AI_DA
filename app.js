/**
 * AI Data Analyst — 100% Local, No API Required
 * All analysis runs in the browser using pure JavaScript statistics.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── State ────────────────────────────────────────────────────────────────
    let state = {
        data: [],           // array of row objects
        headers: [],        // column names
        types: {},          // { col: 'numeric' | 'string' }
        filename: '',
        rowCount: 0,
        chartInstance: null
    };

    // ── Element References ───────────────────────────────────────────────────
    const $ = id => document.getElementById(id);
    const el = {
        fileInput:      $('file-input'),
        uploadSection:  $('upload-section'),
        previewSection: $('data-preview-section'),
        tableHead:      $('table-head'),
        tableBody:      $('table-body'),
        rowCountBadge:  $('row-count'),
        fileInfo:       $('file-info'),
        statsGrid:      $('stats-grid'),
        chatMessages:   $('chat-messages'),
        chatInput:      $('chat-input'),
        sendBtn:        $('send-btn'),
        resetBtn:       $('reset-btn'),
        chartX:         $('chart-x'),
        chartY:         $('chart-y'),
        chartType:      $('chart-type'),
        renderChartBtn: $('render-chart-btn'),
        mainChart:      $('main-chart'),
    };

    marked.setOptions({ breaks: true, gfm: true });

    // ── Tabs ─────────────────────────────────────────────────────────────────
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
        });
    });

    // ── File Upload ───────────────────────────────────────────────────────────
    el.fileInput.addEventListener('change', e => {
        if (e.target.files[0]) loadFile(e.target.files[0]);
    });

    el.uploadSection.addEventListener('dragover', e => {
        e.preventDefault();
        el.uploadSection.classList.add('drag-active');
    });
    el.uploadSection.addEventListener('dragleave', () => {
        el.uploadSection.classList.remove('drag-active');
    });
    el.uploadSection.addEventListener('drop', e => {
        e.preventDefault();
        el.uploadSection.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.csv')) loadFile(file);
        else alert('Please drop a valid .csv file');
    });

    function loadFile(file) {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: results => {
                state.data     = results.data;
                state.headers  = results.meta.fields;
                state.filename  = file.name;
                state.rowCount = results.data.length;
                state.types    = detectTypes(results.data, results.meta.fields);

                renderTable();
                renderStats();
                populateChartSelectors();

                el.uploadSection.classList.add('hidden');
                el.previewSection.classList.remove('hidden');

                el.chatInput.disabled = false;
                el.sendBtn.disabled   = false;
                el.chatInput.placeholder = `Ask about ${file.name}...`;

                addBotMessage(generateAutoSummary());
            }
        });
    }

    // ── Type Detection ────────────────────────────────────────────────────────
    function detectTypes(data, headers) {
        const types = {};
        headers.forEach(h => {
            const sample = data.slice(0, 20).map(r => r[h]).filter(v => v !== null && v !== undefined && v !== '');
            const numericCount = sample.filter(v => typeof v === 'number' && !isNaN(v)).length;
            types[h] = numericCount >= sample.length * 0.7 ? 'numeric' : 'string';
        });
        return types;
    }

    // ── Table Rendering ───────────────────────────────────────────────────────
    function renderTable() {
        el.tableHead.innerHTML = `<tr>${state.headers.map(h =>
            `<th>${h}<span class="col-type">${state.types[h] === 'numeric' ? '#' : 'Aa'}</span></th>`
        ).join('')}</tr>`;

        const rows = state.data.slice(0, 100);
        el.tableBody.innerHTML = rows.map(row =>
            `<tr>${state.headers.map(h => {
                const v = row[h];
                return `<td>${v !== null && v !== undefined ? v : '<span class="null-val">—</span>'}</td>`;
            }).join('')}</tr>`
        ).join('');

        el.rowCountBadge.textContent = `${state.rowCount} rows`;
        el.fileInfo.textContent = state.filename;
    }

    // ── Statistics ────────────────────────────────────────────────────────────
    function getColumnStats(col) {
        const values = state.data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
        const missing = state.rowCount - values.length;

        if (state.types[col] === 'numeric') {
            const nums = values.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
            const sum  = nums.reduce((s, n) => s + n, 0);
            const mean = sum / nums.length;
            const mid  = Math.floor(nums.length / 2);
            const median = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
            const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
            return {
                type: 'numeric', count: nums.length, missing,
                min: nums[0], max: nums[nums.length - 1],
                mean: round(mean), median: round(median),
                std: round(Math.sqrt(variance)),
                sum: round(sum)
            };
        } else {
            const freq = {};
            values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
            return {
                type: 'string', count: values.length, missing,
                unique: Object.keys(freq).length,
                topValues: sorted.slice(0, 5)
            };
        }
    }

    function renderStats() {
        el.statsGrid.innerHTML = state.headers.map(col => {
            const s = getColumnStats(col);
            if (s.type === 'numeric') {
                return `<div class="stat-card">
                    <div class="stat-col-name">${col} <span class="col-type-tag numeric">#</span></div>
                    <div class="stat-rows">
                        <div class="stat-item"><span>Count</span><strong>${s.count}</strong></div>
                        <div class="stat-item"><span>Missing</span><strong>${s.missing}</strong></div>
                        <div class="stat-item"><span>Min</span><strong>${s.min}</strong></div>
                        <div class="stat-item"><span>Max</span><strong>${s.max}</strong></div>
                        <div class="stat-item"><span>Mean</span><strong>${s.mean}</strong></div>
                        <div class="stat-item"><span>Median</span><strong>${s.median}</strong></div>
                        <div class="stat-item"><span>Std Dev</span><strong>${s.std}</strong></div>
                        <div class="stat-item"><span>Sum</span><strong>${s.sum}</strong></div>
                    </div>
                </div>`;
            } else {
                const topHtml = s.topValues.map(([v, c]) =>
                    `<div class="freq-row"><span>${v}</span><span class="freq-count">${c}</span></div>`
                ).join('');
                return `<div class="stat-card">
                    <div class="stat-col-name">${col} <span class="col-type-tag string">Aa</span></div>
                    <div class="stat-rows">
                        <div class="stat-item"><span>Count</span><strong>${s.count}</strong></div>
                        <div class="stat-item"><span>Missing</span><strong>${s.missing}</strong></div>
                        <div class="stat-item"><span>Unique</span><strong>${s.unique}</strong></div>
                    </div>
                    <div class="freq-label">Top Values</div>
                    <div class="freq-list">${topHtml}</div>
                </div>`;
            }
        }).join('');
    }

    // ── Charts ────────────────────────────────────────────────────────────────
    function populateChartSelectors() {
        const opts = state.headers.map(h => `<option value="${h}">${h}</option>`).join('');
        el.chartX.innerHTML = `<option value="">— X Axis —</option>${opts}`;
        el.chartY.innerHTML = `<option value="">— Y Axis (numeric) —</option>${
            state.headers.filter(h => state.types[h] === 'numeric').map(h => `<option value="${h}">${h}</option>`).join('')
        }`;
    }

    el.renderChartBtn.addEventListener('click', () => {
        const xCol = el.chartX.value;
        const yCol = el.chartY.value;
        const type = el.chartType.value;

        if (!xCol || !yCol) { alert('Please select both X and Y axes.'); return; }

        const labels = state.data.slice(0, 50).map(r => String(r[xCol]));
        const values = state.data.slice(0, 50).map(r => Number(r[yCol]));

        if (state.chartInstance) state.chartInstance.destroy();

        const gradient = el.mainChart.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(168,85,247,0.8)');
        gradient.addColorStop(1, 'rgba(99,102,241,0.1)');

        state.chartInstance = new Chart(el.mainChart, {
            type,
            data: {
                labels,
                datasets: [{
                    label: yCol,
                    data: values,
                    backgroundColor: gradient,
                    borderColor: '#a855f7',
                    borderWidth: 2,
                    borderRadius: 4,
                    tension: 0.4,
                    fill: type === 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#f8fafc' } } },
                scales: {
                    x: { ticks: { color: '#94a3b8', maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    });

    // ── Reset ─────────────────────────────────────────────────────────────────
    el.resetBtn.addEventListener('click', () => {
        state = { data: [], headers: [], types: {}, filename: '', rowCount: 0, chartInstance: null };
        el.tableHead.innerHTML = '';
        el.tableBody.innerHTML = '';
        el.statsGrid.innerHTML = '';
        el.chatMessages.innerHTML = '';
        el.chatInput.disabled = true;
        el.sendBtn.disabled = true;
        el.chatInput.value = '';
        el.chatInput.placeholder = 'Upload data first...';
        el.fileInput.value = '';
        el.uploadSection.classList.remove('hidden');
        el.previewSection.classList.add('hidden');
        addBotMessage('Data cleared. Upload a new CSV to begin.');
    });

    // ── Auto Summary ──────────────────────────────────────────────────────────
    function generateAutoSummary() {
        const numCols = state.headers.filter(h => state.types[h] === 'numeric');
        const strCols = state.headers.filter(h => state.types[h] === 'string');

        let msg = `✅ **Dataset loaded:** \`${state.filename}\`\n\n`;
        msg += `| Property | Value |\n|---|---|\n`;
        msg += `| Rows | ${state.rowCount} |\n`;
        msg += `| Columns | ${state.headers.length} |\n`;
        msg += `| Numeric Columns | ${numCols.join(', ') || 'None'} |\n`;
        msg += `| Text Columns | ${strCols.join(', ') || 'None'} |\n`;

        // Missing values
        const missingCols = state.headers.map(h => {
            const missing = state.data.filter(r => r[h] === null || r[h] === undefined || r[h] === '').length;
            return missing > 0 ? `${h} (${missing})` : null;
        }).filter(Boolean);

        msg += missingCols.length > 0
            ? `| Missing Values | ${missingCols.join(', ')} |\n`
            : `| Missing Values | None |\n`;

        msg += `\n💡 **Quick insights:**\n`;
        numCols.slice(0, 3).forEach(col => {
            const s = getColumnStats(col);
            msg += `- **${col}**: min \`${s.min}\`, max \`${s.max}\`, mean \`${s.mean}\`\n`;
        });

        msg += `\nAsk me anything about this dataset! 🔍`;
        return msg;
    }

    // ── Query Engine (100% Local) ─────────────────────────────────────────────
    function analyzeQuery(query) {
        const q = query.toLowerCase().trim();

        // "summarize" / "overview" / "describe"
        if (/\b(summar|overview|describe|about|what is this|tell me about)\b/.test(q)) {
            return generateAutoSummary();
        }

        // "how many rows" / "row count"
        if (/\b(how many rows|row count|count of rows|number of rows)\b/.test(q)) {
            return `The dataset has **${state.rowCount} rows** and **${state.headers.length} columns**.`;
        }

        // "columns" / "fields"
        if (/\b(column|field|header)\b/.test(q)) {
            const cols = state.headers.map(h =>
                `| ${h} | ${state.types[h] === 'numeric' ? 'Numeric' : 'Text'} |`
            ).join('\n');
            return `**Columns (${state.headers.length}):**\n\n| Column | Type |\n|---|---|\n${cols}`;
        }

        // "missing values" / "null values"
        if (/\b(missing|null|empty|blank)\b/.test(q)) {
            const report = state.headers.map(h => {
                const missing = state.data.filter(r => r[h] === null || r[h] === undefined || r[h] === '').length;
                return `| ${h} | ${missing} | ${round((missing / state.rowCount) * 100)}% |`;
            }).join('\n');
            return `**Missing Values Report:**\n\n| Column | Missing | % |\n|---|---|---|\n${report}`;
        }

        // "statistics for [col]" / "stats for [col]"
        const statsMatch = q.match(/\b(stat|statistic|average|mean|median|min|max|std|summary)\b.*?\b(for|of|on|in)\b\s+([\w\s]+)/i);
        if (statsMatch) {
            const colName = findColumn(statsMatch[3].trim());
            if (colName) return formatColStats(colName);
        }

        // "show stats" with a column mentioned
        const colMentioned = findColumnInQuery(q);
        if (colMentioned && /\b(stat|analyze|info|detail|summary|average|mean|max|min)\b/.test(q)) {
            return formatColStats(colMentioned);
        }

        // "highest / lowest [col]" or "which row has max [col]"
        const extremeMatch = q.match(/\b(highest|lowest|maximum|minimum|max|min|top|bottom)\b.*?\b([\w\s]+)/i);
        if (extremeMatch) {
            const direction = /highest|maximum|max|top/.test(extremeMatch[1]) ? 'max' : 'min';
            const colGuess = findColumnInQuery(q);
            if (colGuess && state.types[colGuess] === 'numeric') {
                return findExtreme(colGuess, direction);
            }
        }

        // "unique values in [col]"
        const uniqueMatch = q.match(/\b(unique|distinct|values|categories)\b.*?\b(in|of|for)\b\s+([\w\s]+)/i);
        if (uniqueMatch) {
            const col = findColumn(uniqueMatch[3].trim());
            if (col) return getUniqueValues(col);
        }

        // "sort by [col]"
        const sortMatch = q.match(/\b(sort|order|rank)\b.*?\b(by)\b\s+([\w\s]+)/i);
        if (sortMatch) {
            const col = findColumn(sortMatch[3].trim());
            if (col) return sortByColumn(col, q);
        }

        // "how many [col]" / "count of [col]"
        const countMatch = q.match(/\b(how many|count of|number of)\b\s+([\w\s]+)/i);
        if (countMatch) {
            const col = findColumn(countMatch[2].trim());
            if (col && state.types[col] === 'string') return getUniqueValues(col);
        }

        // Fallback: if a column is mentioned, give its stats
        if (colMentioned) {
            return formatColStats(colMentioned);
        }

        // Generic fallback
        return `I understand you're asking: *"${query}"*\n\nI can answer questions like:\n- **"Summarize the data"**\n- **"Statistics for [column name]"**\n- **"Which row has the highest [column]?"**\n- **"Unique values in [column]"**\n- **"How many missing values?"**\n\nYour columns are: \`${state.headers.join('`, `')}\``;
    }

    // ── Query Helpers ─────────────────────────────────────────────────────────
    function findColumn(text) {
        if (!text) return null;
        const t = text.toLowerCase().trim();
        return state.headers.find(h => h.toLowerCase() === t)
            || state.headers.find(h => h.toLowerCase().includes(t))
            || state.headers.find(h => t.includes(h.toLowerCase()));
    }

    function findColumnInQuery(query) {
        // find the best matching column name in the query
        let best = null, bestLen = 0;
        state.headers.forEach(h => {
            if (query.includes(h.toLowerCase()) && h.length > bestLen) {
                best = h; bestLen = h.length;
            }
        });
        return best;
    }

    function formatColStats(col) {
        const s = getColumnStats(col);
        if (s.type === 'numeric') {
            return `**Statistics for \`${col}\`:**\n\n| Metric | Value |\n|---|---|\n| Count | ${s.count} |\n| Missing | ${s.missing} |\n| Min | ${s.min} |\n| Max | ${s.max} |\n| Mean | ${s.mean} |\n| Median | ${s.median} |\n| Std Dev | ${s.std} |\n| Sum | ${s.sum} |`;
        } else {
            const topRows = s.topValues.map(([v, c]) => `| ${v} | ${c} |`).join('\n');
            return `**Profile for \`${col}\`** (text column)\n\n| Metric | Value |\n|---|---|\n| Count | ${s.count} |\n| Missing | ${s.missing} |\n| Unique Values | ${s.unique} |\n\n**Top values:**\n\n| Value | Count |\n|---|---|\n${topRows}`;
        }
    }

    function findExtreme(col, direction) {
        const sorted = [...state.data].sort((a, b) =>
            direction === 'max' ? b[col] - a[col] : a[col] - b[col]
        );
        const top = sorted.slice(0, 5);
        let msg = `**${direction === 'max' ? 'Top' : 'Bottom'} 5 rows by \`${col}\`:**\n\n`;
        const cols = state.headers.slice(0, 5); // show first 5 cols for brevity
        msg += `| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|\n`;
        msg += top.map(row => `| ${cols.map(h => row[h] ?? '—').join(' | ')} |`).join('\n');
        return msg;
    }

    function getUniqueValues(col) {
        const freq = {};
        state.data.forEach(r => { const v = r[col]; freq[v] = (freq[v] || 0) + 1; });
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        const unique = sorted.length;
        const top = sorted.slice(0, 10);
        let msg = `**Unique values in \`${col}\`:** ${unique} distinct values\n\n| Value | Count | % |\n|---|---|---|\n`;
        msg += top.map(([v, c]) => `| ${v} | ${c} | ${round((c / state.rowCount) * 100)}% |`).join('\n');
        if (unique > 10) msg += `\n\n*(showing top 10 of ${unique})*`;
        return msg;
    }

    function sortByColumn(col, query) {
        const asc = /asc|low|small|ascending/.test(query);
        const sorted = [...state.data].sort((a, b) =>
            state.types[col] === 'numeric'
                ? (asc ? a[col] - b[col] : b[col] - a[col])
                : String(a[col]).localeCompare(String(b[col]))
        );
        const top = sorted.slice(0, 10);
        const cols = state.headers.slice(0, 5);
        let msg = `**Top 10 rows sorted by \`${col}\` (${asc ? 'ascending' : 'descending'}):**\n\n`;
        msg += `| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|\n`;
        msg += top.map(row => `| ${cols.map(h => row[h] ?? '—').join(' | ')} |`).join('\n');
        return msg;
    }

    // ── Chat Functions ────────────────────────────────────────────────────────
    function addBotMessage(mdText) {
        const div = document.createElement('div');
        div.className = 'message system-msg anim';
        div.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-content">${marked.parse(mdText)}</div>
        `;
        el.chatMessages.appendChild(div);
        scrollChat();
    }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user-msg anim';
        div.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
            <div class="msg-content"><p>${text}</p></div>
        `;
        el.chatMessages.appendChild(div);
        scrollChat();
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'message system-msg anim';
        div.id = 'typing-indicator';
        div.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-content"><div class="typing"><span></span><span></span><span></span></div></div>
        `;
        el.chatMessages.appendChild(div);
        scrollChat();
        return div;
    }

    function scrollChat() {
        el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
    }

    // ── Send Message ──────────────────────────────────────────────────────────
    function handleSend() {
        const text = el.chatInput.value.trim();
        if (!text || !state.data.length) return;

        addUserMessage(text);
        el.chatInput.value = '';
        el.chatInput.style.height = '50px';

        const typingEl = showTyping();

        // Simulate a tiny "thinking" delay for better UX
        setTimeout(() => {
            typingEl.remove();
            const answer = analyzeQuery(text);
            addBotMessage(answer);
        }, 400);
    }

    el.sendBtn.addEventListener('click', handleSend);
    el.chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    // Auto-resize textarea
    el.chatInput.addEventListener('input', function () {
        this.style.height = '50px';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    // ── Utilities ─────────────────────────────────────────────────────────────
    function round(n, d = 2) {
        return Math.round(n * 10 ** d) / 10 ** d;
    }
});
