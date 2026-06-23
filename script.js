// ⬇ АДРЕС СЕРВЕРА ⬇
const PROXY_URL = 'https://sql-proxy-bd.onrender.com/query';

// CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('sqlQuery'), {
    mode: 'text/x-sql',
    lineNumbers: true,
    indentWithTabs: true,
    smartIndent: true,
    matchBrackets: true,
    lineWrapping: true,
    viewportMargin: Infinity,
    extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Tab': 'autocomplete'
    },
    hintOptions: {
        tables: {
            characters: ['char_id', 'fname', 'lname', 'age', 'faculty', 'patronus', 'book_id'],
            library: ['lib_id', 'char_id', 'book_name', 'start_date', 'end_date', 'book_id']
        }
    }
});

function setQuery(sql) {
    editor.setValue(sql);
}

async function executeQuery() {
    const sql = editor.getValue().trim();
    if (!sql) { alert('Введите SQL-запрос'); return; }

    const btn = document.getElementById('runBtn');
    const loading = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const rowCount = document.getElementById('rowCount');

    btn.disabled = true;
    loading.style.display = 'inline';
    resultDiv.innerHTML = '';
    rowCount.textContent = '';

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Ошибка сервера');
        }

        const data = result.data;

        if (!data || data.length === 0) {
            resultDiv.innerHTML = `<div class="success">✅ Запрос выполнен. Результатов не найдено.</div>`;
            rowCount.textContent = '0 строк';
        } else {
            resultDiv.innerHTML = buildTable(data);
            rowCount.textContent = `${data.length} строк${getDeclension(data.length)}`;
        }

    } catch (err) {
        resultDiv.innerHTML = `<div class="error">❌ Ошибка: ${err.message}</div>`;
    } finally {
        btn.disabled = false;
        loading.style.display = 'none';
    }
}

function buildTable(data) {
    const keys = Object.keys(data[0]);
    let html = `<div class="table-wrapper"><table><thead><tr>`;
    keys.forEach(k => html += `<th>${k}</th>`);
    html += `</tr></thead><tbody>`;
    data.forEach(row => {
        html += `<tr>`;
        keys.forEach(k => {
            let val = row[k];
            if (val === null || val === undefined) val = 'NULL';
            if (typeof val === 'string' && val.length > 50) val = val.substring(0, 50) + '…';
            html += `<td>${val}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}

function getDeclension(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'а';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'и';
    return '';
}

// ===== АККОРДЕОН =====
function initAccordion() {
    document.querySelectorAll('.accordion-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            content.style.display = isExpanded ? 'none' : 'block';
            // Меняем иконку
            const icon = this.querySelector('.accordion-icon');
            if (icon) {
                icon.textContent = isExpanded ? '▶' : '▼';
            }
        });
    });
}

// Автозапуск при загрузке
window.onload = function() {
    initAccordion();
    setTimeout(() => {
        executeQuery();
    }, 300);
};
