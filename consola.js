
        const META_KEYWORDS = [
            'comienza', 'constantes', 'constante', 'entonces', 'escribir', 'escribirln',
            'hacer', 'hasta', 'leer', 'mientras', 'opcion', 'opción', 'de',
            'para', 'repetir', 'si', 'sino', 'termina', 'variables', 'variable',
            'finsi', 'finpara', 'finmientras', 'programa', 'tipos', 'tipo', 'fin',
            'procedimiento', 'funcion', 'función', 'arreglo'
        ];

        const codeInput = document.getElementById('code-input');
        const codeHighlight = document.getElementById('code-highlight');
        const lineNumbers = document.getElementById('line-numbers');
        const terminalOut = document.getElementById('terminal-out');
        const termInput = document.getElementById('term-input');
        const btnRun = document.getElementById('btn-run');
        const btnDiagnostico = document.getElementById('btn-diagnostico');
        const btnClear = document.getElementById('btn-clear');
        const statusBadge = document.getElementById('status-badge');
        const statusText = document.getElementById('status-text');
        const issuesBar = document.getElementById('issues-bar');

        const workspace = document.getElementById('workspace');
        const terminalCard = document.getElementById('terminal-card');
        const workspaceResizer = document.getElementById('workspace-resizer');
        const btnToggleTerminal = document.getElementById('btn-toggle-terminal');
        const toggleTermIcon = document.getElementById('toggle-term-icon');

        const btnOpenProjects = document.getElementById('btn-open-projects');
        const btnNewProject = document.getElementById('btn-new-project');
        const btnCloseDrawer = document.getElementById('btn-close-drawer');
        const drawerOverlay = document.getElementById('drawer-overlay');
        const projectsDrawer = document.getElementById('projects-drawer');
        const projectNameInput = document.getElementById('project-name-input');
        const btnSaveProject = document.getElementById('btn-save-project');
        const projectsList = document.getElementById('projects-list');

        const tabEditorBtn = document.getElementById('tab-editor-btn');
        const tabTerminalBtn = document.getElementById('tab-terminal-btn');
        const mobileNotice = document.getElementById('mobile-notice');
        const btnCloseNotice = document.getElementById('btn-close-notice');

        // LÓGICA DEL MODAL DE AYUDA
        const btnAyuda = document.getElementById('btn-ayuda');
        const modalAyuda = document.getElementById('modal-ayuda');
        const btnCloseAyuda = document.getElementById('btn-close-ayuda');

        if (btnAyuda && modalAyuda && btnCloseAyuda) {
            btnAyuda.addEventListener('click', () => modalAyuda.classList.add('active'));
            btnCloseAyuda.addEventListener('click', () => modalAyuda.classList.remove('active'));
            modalAyuda.addEventListener('click', (e) => { 
                if (e.target === modalAyuda) modalAyuda.classList.remove('active'); 
            });
        }

        btnCloseNotice.addEventListener('click', () => {
            mobileNotice.style.display = 'none';
        });

        function setMobileTab(tab) {
            workspace.setAttribute('data-tab', tab);
            if (tab === 'editor') {
                tabEditorBtn.classList.add('active');
                tabTerminalBtn.classList.remove('active');
            } else {
                tabTerminalBtn.classList.add('active');
                tabEditorBtn.classList.remove('active');
            }
        }

        tabEditorBtn.addEventListener('click', () => setMobileTab('editor'));
        tabTerminalBtn.addEventListener('click', () => setMobileTab('terminal'));

        let currentActiveProject = null;
        let lastTerminalWidth = 420;
        let isResizing = false;

        workspaceResizer.addEventListener('mousedown', (e) => {
            if (terminalCard.classList.contains('collapsed')) return;
            isResizing = true;
            workspace.classList.add('resizing');
            workspaceResizer.classList.add('active');
            document.body.style.cursor = 'col-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const containerRect = workspace.getBoundingClientRect();
            let newTerminalWidth = containerRect.right - e.clientX;
            const minWidth = 180;
            const maxWidth = containerRect.width - 260;

            if (newTerminalWidth < minWidth) newTerminalWidth = minWidth;
            if (newTerminalWidth > maxWidth) newTerminalWidth = maxWidth;

            terminalCard.style.flex = `0 0 ${newTerminalWidth}px`;
            lastTerminalWidth = newTerminalWidth;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                workspace.classList.remove('resizing');
                workspaceResizer.classList.remove('active');
                document.body.style.cursor = '';
            }
        });

        btnToggleTerminal.addEventListener('click', () => {
            const isCollapsed = terminalCard.classList.toggle('collapsed');
            if (isCollapsed) {
                workspaceResizer.style.display = 'none';
                btnToggleTerminal.title = 'Mostrar Consola';
                toggleTermIcon.innerHTML = '<polyline points="15 18 9 12 15 6"></polyline>';
            } else {
                workspaceResizer.style.display = 'flex';
                terminalCard.style.flex = `0 0 ${lastTerminalWidth}px`;
                btnToggleTerminal.title = 'Minimizar Consola';
                toggleTermIcon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
            }
        });

        function openDrawer() {
            projectsDrawer.classList.add('active');
            drawerOverlay.classList.add('active');
        }

        function closeDrawer() {
            projectsDrawer.classList.remove('active');
            drawerOverlay.classList.remove('active');
        }

        btnOpenProjects.addEventListener('click', openDrawer);
        btnCloseDrawer.addEventListener('click', closeDrawer);
        drawerOverlay.addEventListener('click', closeDrawer);

        function getSavedProjects() {
            try {
                return JSON.parse(localStorage.getItem('joelinton_projects')) || {};
            } catch (e) {
                return {};
            }
        }

        function saveProjectsData(projects) {
            localStorage.setItem('joelinton_projects', JSON.stringify(projects));
        }

        function renderProjectsList() {
            const projects = getSavedProjects();
            projectsList.innerHTML = '';
            const names = Object.keys(projects);

            if (names.length === 0) {
                projectsList.innerHTML = '<div style="padding: 0.6rem; color: var(--text-muted); font-size: 0.8rem; text-align: center;">No tienes proyectos guardados.</div>';
                return;
            }

            names.forEach(name => {
                const item = document.createElement('div');
                item.className = 'project-item' + (currentActiveProject === name ? ' active' : '');

                const nameSpan = document.createElement('span');
                nameSpan.className = 'project-name-txt';
                nameSpan.innerText = name;
                nameSpan.title = name;

                item.addEventListener('click', () => {
                    currentActiveProject = name;
                    projectNameInput.value = name;
                    codeInput.value = projects[name];
                    updateEditor();
                    renderProjectsList();
                    closeDrawer();
                    if (window.innerWidth <= 768) setMobileTab('editor');
                    printTerm(`Proyecto cargado: "${name}".`, 'sys');
                });

                const delBtn = document.createElement('button');
                delBtn.className = 'btn-del-proj';
                delBtn.innerHTML = '&times;';
                delBtn.title = 'Eliminar proyecto';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`¿Estás seguro de que deseas eliminar el proyecto "${name}"?`)) {
                        delete projects[name];
                        saveProjectsData(projects);
                        if (currentActiveProject === name) currentActiveProject = null;
                        renderProjectsList();
                        printTerm(`Proyecto "${name}" eliminado.`, 'warn');
                    }
                });

                item.appendChild(nameSpan);
                item.appendChild(delBtn);
                projectsList.appendChild(item);
            });
        }

        btnSaveProject.addEventListener('click', () => {
            const name = projectNameInput.value.trim();
            if (!name) {
                alert('Por favor, escribe un nombre para el proyecto.');
                projectNameInput.focus();
                return;
            }

            const projects = getSavedProjects();
            if (projects.hasOwnProperty(name)) {
                const confirmOverwrite = confirm(`El proyecto "${name}" ya existe. ¿Deseas sobreescribirlo?`);
                if (!confirmOverwrite) return;
            }

            projects[name] = codeInput.value;
            saveProjectsData(projects);
            currentActiveProject = null;
            renderProjectsList();

            codeInput.value = '';
            projectNameInput.value = '';
            updateEditor();
            closeDrawer();
            printTerm(`Proyecto guardado con éxito: "${name}". Editor limpio.`, 'success');
        });

        btnNewProject.addEventListener('click', () => {
            if (codeInput.value.trim() !== '') {
                const confirmNew = confirm('¿Deseas iniciar un nuevo proyecto? Cualquier cambio sin guardar se perderá.');
                if (!confirmNew) return;
            }
            currentActiveProject = null;
            projectNameInput.value = '';
            codeInput.value = '';
            updateEditor();
            clearTerminal();
            if (window.innerWidth <= 768) setMobileTab('editor');
            printTerm('Nuevo proyecto creado. Editor limpio.', 'sys');
        });

        renderProjectsList();

        let currentValidation = { status: 'ok', errors: [], warnings: [], declaredVars: {}, declaredConsts: {}, declaredTypes: {}, subprograms: {} };

        function extractReadVarNames(content) {
            let str = content.trim();
            if (str.startsWith('(') && str.endsWith(')')) {
                str = str.substring(1, str.length - 1).trim();
            }
            return parseArguments(str);
        }

        function parseArguments(str) {
            const args = [];
            let curr = '';
            let inQuotes = false;
            let quoteChar = '';
            let parenCount = 0;

            for (let i = 0; i < str.length; i++) {
                const ch = str[i];
                if ((ch === '"' || ch === "'") && (i === 0 || str[i-1] !== '\\')) {
                    if (!inQuotes) {
                        inQuotes = true;
                        quoteChar = ch;
                    } else if (quoteChar === ch) {
                        inQuotes = false;
                    }
                }
                if (!inQuotes) {
                    if (ch === '(') parenCount++;
                    else if (ch === ')') parenCount--;
                }
                if (ch === ',' && !inQuotes && parenCount === 0) {
                    args.push(curr.trim());
                    curr = '';
                } else {
                    curr += ch;
                }
            }
            if (curr.trim()) args.push(curr.trim());
            return args;
        }

        function parseTypeDefinition(line, constants) {
            const clean = line.replace(/\{[^}]*\}/g, '').trim();
            const parts = clean.split('=');
            if (parts.length !== 2) return null;

            const typeName = parts[0].trim().toLowerCase();
            const def = parts[1].trim();

            const arrMatch = def.match(/^arreglo\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s+de\s+([a-zA-Z0-9_]+)$/i);
            if (arrMatch) {
                let sizeToken = arrMatch[1].trim().toLowerCase();
                let elemType = arrMatch[2].trim().toLowerCase();

                let size = null;
                if (/^\d+$/.test(sizeToken)) {
                    size = parseInt(sizeToken, 10);
                } else if (constants && constants[sizeToken] !== undefined) {
                    size = parseInt(constants[sizeToken], 10);
                }

                return {
                    name: typeName,
                    kind: 'arreglo',
                    sizeToken: sizeToken,
                    size: size,
                    elemType: elemType
                };
            }
            return { name: typeName, kind: 'simple', raw: def };
        }

        function parseSubprogramHeader(line) {
            const clean = line.replace(/\{[^}]*\}/g, '').trim();
            const isFunc = /^funci[oó]n\b/i.test(clean);
            const isProc = /^procedimiento\b/i.test(clean);

            if (!isFunc && !isProc) return null;

            const kind = isFunc ? 'funcion' : 'procedimiento';
            let afterKeyword = clean.replace(/^(procedimiento|funci[oó]n)\s+/i, '').trim();

            let returnType = null;
            if (isFunc) {
                const colonIdx = afterKeyword.lastIndexOf(':');
                if (colonIdx !== -1) {
                    returnType = afterKeyword.substring(colonIdx + 1).trim().toLowerCase();
                    afterKeyword = afterKeyword.substring(0, colonIdx).trim();
                }
            }

            const parenOpen = afterKeyword.indexOf('(');
            const parenClose = afterKeyword.lastIndexOf(')');

            let name = '';
            let rawParams = '';

            if (parenOpen !== -1 && parenClose !== -1 && parenClose > parenOpen) {
                name = afterKeyword.substring(0, parenOpen).trim().toLowerCase();
                rawParams = afterKeyword.substring(parenOpen + 1, parenClose).trim();
            } else {
                name = afterKeyword.trim().toLowerCase();
            }

            const params = [];
            if (rawParams) {
                const paramClauses = rawParams.split(';');
                for (const clause of paramClauses) {
                    const trimmedClause = clause.trim();
                    if (!trimmedClause || !trimmedClause.includes(':')) continue;

                    const cParts = trimmedClause.split(':');
                    let paramNamesPart = cParts[0].trim();
                    let restPart = cParts[1].trim();

                    let mode = 'E';
                    let typeName = restPart;

                    const modeBeforeMatch = paramNamesPart.match(/\b(E\/S|E|S)\b$/i);
                    if (modeBeforeMatch) {
                        mode = modeBeforeMatch[1].toUpperCase();
                        paramNamesPart = paramNamesPart.substring(0, paramNamesPart.length - mode[0].length).trim();
                    } else {
                        const modeAfterMatch = restPart.match(/^(E\/S|E|S)\s+(.+)$/i);
                        if (modeAfterMatch) {
                            mode = modeAfterMatch[1].toUpperCase();
                            typeName = modeAfterMatch[2].trim();
                        }
                    }

                    const names = paramNamesPart.split(',').map(n => n.trim().toLowerCase()).filter(n => n);
                    for (const pName of names) {
                        params.push({
                            name: pName,
                            mode: mode,
                            type: typeName.toLowerCase()
                        });
                    }
                }
            }

            return { kind, name, params, returnType };
        }

    function validateSyntax(code) {
    // Si el editor está vacío o con texto por defecto, no mostrar errores
    if (code.trim() === '' || code.trim() === 'Escribe tu código aquí...') {
        return { status: 'ok', errors: [], warnings: [], declaredVars: {}, declaredConsts: {}, declaredTypes: {}, subprograms: {} };
    }

    const lines = code.split('\n');
    const errors = [];
    const warnings = [];

    const declaredConsts = {};
    const declaredTypes = {};
    const declaredVars = {};
    const subprograms = {};

    let section = 'none';

    // 1. PRIMERA PASADA: Registrar Constantes y Tipos (globales)
    lines.forEach((raw) => {
        let l = raw.trim().replace(/\{[^}]*\}/g, '').trim();
        const cIdx = l.indexOf('//');
        if (cIdx !== -1) l = l.substring(0, cIdx).trim();
        if (!l) return;

        const low = l.toLowerCase();
        if (low === 'constantes' || low === 'constante') { section = 'constantes'; return; }
        if (low === 'tipos' || low === 'tipo') { section = 'tipos'; return; }
        if (low === 'variables' || low === 'variable' || 
            low.startsWith('procedimiento') || low.startsWith('funcion') || low.startsWith('función') || 
            low.startsWith('comienza')) {
            section = 'other';
            return;
        }

        if (section === 'constantes') {
            const sepMatch = l.match(/[:=]/);
            if (sepMatch) {
                const parts = l.split(sepMatch[0]);
                const cName = parts[0].trim().toLowerCase();
                let rawVal = parts[1].trim();
                let parsedVal = rawVal;
                if (/^[+-]?\d+$/.test(rawVal)) parsedVal = parseInt(rawVal, 10);
                else if (/^[+-]?\d+\.\d+$/.test(rawVal)) parsedVal = parseFloat(rawVal);
                declaredConsts[cName] = parsedVal;
            }
        } else if (section === 'tipos') {
            const tDef = parseTypeDefinition(l, declaredConsts);
            if (tDef) declaredTypes[tDef.name] = tDef;
        }
    });

    // 2. SEGUNDA PASADA: Estructura, Variables y Subprogramas
    let currentSubprogram = null;
    let inSubVars = false;
    let inGlobalVars = false;
    let hasMainComienza = false;
    let hasMainTermina = false;

    lines.forEach((raw, idx) => {
        const lineNum = idx + 1;
        let l = raw.trim().replace(/\{[^}]*\}/g, '').trim();
        const cIdx = l.indexOf('//');
        if (cIdx !== -1) l = l.substring(0, cIdx).trim();
        if (!l) return;

        const low = l.toLowerCase();
        if (low.startsWith('programa')) return;

        // Declaraciones de secciones principales
        if (low === 'constantes' || low === 'constante' || low === 'tipos' || low === 'tipo') {
            inGlobalVars = false;
            return;
        }

        if (low === 'variables' || low === 'variable') {
            if (currentSubprogram) {
                inSubVars = true;
            } else {
                inGlobalVars = true;
            }
            return;
        }

        // Subprogramas (procedimientos / funciones)
        if (low.startsWith('procedimiento') || low.startsWith('funcion') || low.startsWith('función')) {
            inGlobalVars = false;
            const sub = parseSubprogramHeader(l);
            if (!sub) {
                errors.push({ line: lineNum, msg: 'Cabecera de subprograma inválida.' });
            } else {
                currentSubprogram = {
                    ...sub,
                    localVars: {},
                    bodyLines: [],
                    startLine: lineNum
                };
                subprograms[sub.name] = currentSubprogram;
                inSubVars = false;
            }
            return;
        }

        // Bloque Comienza / Termina
        if (low.startsWith('comienza')) {
            inGlobalVars = false;
            if (currentSubprogram) {
                inSubVars = false;
            } else {
                hasMainComienza = true;
            }
            return;
        }

        if (low.startsWith('termina')) {
            inGlobalVars = false;
            if (currentSubprogram) {
                currentSubprogram = null;
                inSubVars = false;
            } else {
                hasMainTermina = true;
            }
            return;
        }

        // Captura de variables globales
        if (inGlobalVars && !currentSubprogram) {
            if (l.includes(':')) {
                const parts = l.split(':');
                const vList = parts[0].split(',').map(v => v.trim().toLowerCase());
                const tipo = parts[1].trim().toLowerCase();
                vList.forEach(v => { if (v) declaredVars[v] = tipo; });
            }
            return;
        }

        // Captura de variables locales de subprograma
        if (currentSubprogram && inSubVars) {
            if (l.includes(':')) {
                const parts = l.split(':');
                const vList = parts[0].split(',').map(v => v.trim().toLowerCase());
                const tipo = parts[1].trim().toLowerCase();
                vList.forEach(v => { if (v) currentSubprogram.localVars[v] = tipo; });
            }
            return;
        }
    });

    if (!hasMainComienza) errors.push({ line: lines.length, msg: 'Falta la metapalabra "comienza" del programa principal.' });
    if (!hasMainTermina) errors.push({ line: lines.length, msg: 'Falta la metapalabra "termina" del programa principal.' });

    let status = 'ok';
    if (errors.length > 0) status = 'error';
    else if (warnings.length > 0) status = 'warn';

    return { status, errors, warnings, declaredVars, declaredConsts, declaredTypes, subprograms };
}

        function runDiagnosticReport() {
            const val = validateSyntax(codeInput.value);
            printTerm('--- INFORME DE DIAGNÓSTICO & DEBUG ---', 'debug');

            if (val.status === 'ok') {
                printTerm('✔ Sintaxis y estructura validadas con éxito.', 'success');
                printTerm(`✔ Vectores y tipos registrados: ${Object.keys(val.declaredTypes).length}`, 'sys');
                printTerm(`✔ Procedimientos y funciones registrados: ${Object.keys(val.subprograms).length}`, 'sys');
                printTerm('✔ Algoritmo listo para ejecutar.', 'sys');
            } else {
                val.errors.forEach(err => printTerm(`  [Línea ${err.line}] -> ${err.msg}`, 'error'));
                val.warnings.forEach(w => printTerm(`  [Línea ${w.line}] -> ${w.msg}`, 'warn'));
            }
            if (window.innerWidth <= 768) setMobileTab('terminal');
        }

        btnDiagnostico.addEventListener('click', runDiagnosticReport);

        function updateEditor() {
            const text = codeInput.value;
            const lines = text.split('\n');

            currentValidation = validateSyntax(text);
            updateStatusUI(currentValidation);

            const errLines = new Set(currentValidation.errors.map(e => e.line));
            const warnLines = new Set(currentValidation.warnings.map(w => w.line));

            let linesHtml = '';
            for (let i = 1; i <= lines.length; i++) {
                let dot = '';
                if (errLines.has(i)) dot = '<span class="line-err-dot err" title="Error"></span>';
                else if (warnLines.has(i)) dot = '<span class="line-err-dot warn" title="Aviso"></span>';
                linesHtml += `<div class="line-num-item">${dot}${i}</div>`;
            }
            lineNumbers.innerHTML = linesHtml;
            codeHighlight.innerHTML = highlightSyntax(text) + '\n';
        }

        function updateStatusUI(val) {
            statusBadge.className = 'status-badge';
            if (val.status === 'ok') {
                statusBadge.classList.add('status-ok');
                statusText.innerText = 'Sintaxis Correcta';
                btnRun.disabled = false;
                issuesBar.innerHTML = '<span class="issue-tag ok">✔ Algoritmo listo para ejecutar.</span>';
            } else if (val.status === 'warn') {
                statusBadge.classList.add('status-warn');
                statusText.innerText = `Aviso Leve (${val.warnings.length})`;
                btnRun.disabled = false;
                issuesBar.innerHTML = val.warnings.map(w => `<span class="issue-tag warn">⚠ Lín ${w.line}: ${escapeHTML(w.msg)}</span>`).join(' ');
            } else {
                statusBadge.classList.add('status-error');
                statusText.innerText = `Error Sintáctico (${val.errors.length})`;
                btnRun.disabled = false;
                issuesBar.innerHTML = val.errors.map(e => `<span class="issue-tag err">✖ Lín ${e.line}: ${escapeHTML(e.msg)}</span>`).join(' ');
            }
        }

        function syncScroll() {
            codeHighlight.scrollTop = codeInput.scrollTop;
            codeHighlight.scrollLeft = codeInput.scrollLeft;
            lineNumbers.scrollTop = codeInput.scrollTop;
        }

        function escapeHTML(str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function highlightSyntax(code) {
            const regex = /(\{[^}]*\})|(\/\/.*)|("(?:\\[\s\S]|[^"\\])*")|('(?:\\[\s\S]|[^'\\])*')|(<-|<=|>=|<>|:=|[+\-*\/%=<>,:;()[\]])|(\b\d+(?:\.\d+)?\b)|([a-zA-ZáéíóúÁÉÍÓÚñÑ_][a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)|(\s+)|(.)/g;
            const tokens = [];
            let match;
            while ((match = regex.exec(code)) !== null) {
                const [full, curlyComment, lineComment, str1, str2, op, num, ident, ws, other] = match;
                if (curlyComment || lineComment) tokens.push(`<span class="token-comment">${escapeHTML(curlyComment || lineComment)}</span>`);
                else if (str1 || str2) tokens.push(`<span class="token-str">${escapeHTML(str1 || str2)}</span>`);
                else if (op) tokens.push(`<span class="token-op">${escapeHTML(op)}</span>`);
                else if (num) tokens.push(`<span class="token-num">${escapeHTML(num)}</span>`);
                else if (ident) {
                    if (META_KEYWORDS.includes(ident.toLowerCase())) tokens.push(`<span class="kw-meta">${escapeHTML(ident)}</span>`);
                    else tokens.push(escapeHTML(ident));
                } else if (ws) tokens.push(escapeHTML(ws));
                else if (other) tokens.push(escapeHTML(other));
            }
            return tokens.join('');
        }

        codeInput.addEventListener('input', updateEditor);
        codeInput.addEventListener('scroll', syncScroll);

        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeInput.selectionStart;
                const end = codeInput.selectionEnd;
                codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
                codeInput.selectionStart = codeInput.selectionEnd = start + 4;
                updateEditor();
            } else if (e.key === 'Enter') {
                const start = codeInput.selectionStart;
                const linesBefore = codeInput.value.substring(0, start).split('\n');
                const curLine = linesBefore[linesBefore.length - 1];
                const matchIndent = curLine.match(/^(\s*)/);
                let indent = matchIndent ? matchIndent[1] : '';

                const curTrimmed = curLine.trim().toLowerCase();
                if (curTrimmed === 'comienza' || curTrimmed === 'variables' || curTrimmed === 'constantes' || curTrimmed === 'tipos' ||
                    curTrimmed === 'repetir' || curTrimmed.endsWith('hacer') || curTrimmed.endsWith('entonces') || curTrimmed.endsWith('de')) {
                    indent += '    ';
                }
                if (curTrimmed === 'termina') indent = '';

                e.preventDefault();
                const end = codeInput.selectionEnd;
                codeInput.value = codeInput.value.substring(0, start) + '\n' + indent + codeInput.value.substring(end);
                codeInput.selectionStart = codeInput.selectionEnd = start + 1 + indent.length;
                updateEditor();
            }
        });

        function printTerm(msg, type = 'normal') {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            let prefix = '&gt;';
            let contentClass = '';
            if (type === 'sys') { prefix = '[SYS]'; contentClass = 'terminal-sys'; }
            else if (type === 'error') { prefix = '[ERROR]'; contentClass = 'terminal-error'; }
            else if (type === 'warn') { prefix = '[AVISO]'; contentClass = 'terminal-warn'; }
            else if (type === 'debug') { prefix = '[DEBUG]'; contentClass = 'terminal-debug'; }
            else if (type === 'prompt') { prefix = '[ENTRADA]'; contentClass = 'terminal-prompt'; }
            else if (type === 'success') { prefix = '[SYS]'; contentClass = 'terminal-success'; }
            else if (type === 'input') { prefix = '&gt;'; contentClass = 'terminal-user-input'; }

            line.innerHTML = `<span class="terminal-prefix">${prefix}</span> <span class="${contentClass}">${msg}</span>`;
            terminalOut.appendChild(line);
            terminalOut.scrollTop = terminalOut.scrollHeight;
        }

        function clearTerminal() { terminalOut.innerHTML = ''; }
        btnClear.addEventListener('click', () => { clearTerminal(); printTerm('Consola limpia.', 'sys'); });

        let isRunning = false;
        let waitingForInput = null;
        let executionAbortController = 0;

        function promptConsoleStrict(varName, expectedType, execId) {
            return new Promise((resolve, reject) => {
                const typeLabel = (expectedType && expectedType !== 'general') ? `[Tipo: ${expectedType}]` : '';

                function ask(isRetry = false) {
                    if (execId !== executionAbortController) {
                        reject(new Error("Ejecución cancelada por reinicio."));
                        return;
                    }

                    if (!isRetry) printTerm(`Esperando dato para "${varName}" ${typeLabel}:`, 'prompt');
                    termInput.disabled = false;
                    termInput.placeholder = `Escribe el valor y presiona Enter...`;
                    termInput.focus();

                    waitingForInput = (val) => {
                        if (execId !== executionAbortController) {
                            reject(new Error("Ejecución cancelada por reinicio."));
                            return;
                        }
                        const trimmed = val.trim();

                        if (expectedType === 'entero') {
                            if (!/^[+-]?\d+$/.test(trimmed)) {
                                printTerm(`ERROR DE TIPO: "${val}" no es un número ENTERO válido. Reintente:`, 'error');
                                ask(true);
                                return;
                            }
                            termInput.disabled = true;
                            termInput.value = '';
                            resolve(parseInt(trimmed, 10));
                            return;
                        }

                        if (expectedType === 'real' || expectedType === 'flotante') {
                            const num = Number(trimmed);
                            if (isNaN(num) || trimmed === '') {
                                printTerm(`ERROR DE TIPO: "${val}" no es un número REAL válido. Reintente:`, 'error');
                                ask(true);
                                return;
                            }
                            termInput.disabled = true;
                            termInput.value = '';
                            resolve(num);
                            return;
                        }

             // Tipo general o cadena (convierte a número si es numérico)
                        termInput.disabled = true;
                        termInput.value = '';
                        if (/^[+-]?\d+$/.test(trimmed)) {
                            resolve(parseInt(trimmed, 10));
                        } else if (/^[+-]?\d*(\.\d+)?$/.test(trimmed) && !isNaN(parseFloat(trimmed))) {
                            resolve(parseFloat(trimmed));
                        } else {
                            resolve(trimmed);
                        }
                    };
                }
                ask(false);
            });
        }

        termInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && waitingForInput) {
                const val = termInput.value;
                printTerm(val, 'input');
                const cb = waitingForInput;
                waitingForInput = null;
                cb(val);
            }
        });

        // ---------------- MOTOR DE EJECUCIÓN (INTÉRPRETE) ----------------

        function resolveVariableRef(targetExpr, memory, constants, declaredTypes, subprograms) {
            let clean = targetExpr.trim();
            const parenMatch = clean.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ_][a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)\s*\((.+)\)$/);

            if (parenMatch) {
                const baseName = parenMatch[1].trim().toLowerCase();
                if (subprograms && subprograms[baseName] && subprograms[baseName].kind === 'funcion') {
                    return { isIndexed: false, baseName: baseName, index: null };
                }
                const innerExpr = parenMatch[2].trim();
                const indexVal = Number(evaluateExpressionAdvanced(innerExpr, memory, constants, declaredTypes, subprograms));
                return { isIndexed: true, baseName: baseName, index: Math.trunc(indexVal) };
            }
            return { isIndexed: false, baseName: clean.toLowerCase(), index: null };
        }

        function assignToMemory(targetRef, val, memory, declaredTypes) {
            const base = targetRef.baseName;
            if (targetRef.isIndexed) {
                const idx = targetRef.index;
                if (isNaN(idx) || idx < 1) {
                    throw new Error(`Índice inválido: ${targetRef.index} para el arreglo "${base}". Los índices inician en 1.`);
                }
                if (!memory[base] || !Array.isArray(memory[base])) {
                    memory[base] = [];
                }
                memory[base][idx] = val;
            } else {
                memory[base] = val;
            }
        }

        function evaluateExpressionAdvanced(expr, memory, constants, declaredTypes, subprograms) {
            expr = (expr || '').toString().trim();
            if (!expr) return 0;
            expr = expr.replace(/[“”«»]/g, '"');

            if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
                return expr.slice(1, -1);
            }

            const callPattern = /([a-zA-ZáéíóúÁÉÍÓÚñÑ_][a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)\s*\(([^()]+)\)/g;
            let iter = 0;
            while (callPattern.test(expr)) {
                iter++;
                if (iter > 50) break;
                expr = expr.replace(callPattern, (match, name, argsStr) => {
                    const ident = name.toLowerCase();
                    if (subprograms && subprograms[ident] && subprograms[ident].kind === 'funcion') {
                        const sub = subprograms[ident];
                        const args = parseArguments(argsStr).map(arg => evaluateExpressionAdvanced(arg, memory, constants, declaredTypes, subprograms));
                        const ret = executeSubprogramSync(sub, args, memory, constants, declaredTypes, subprograms);
                        return (typeof ret === 'string') ? JSON.stringify(ret) : ret;
                    }

                    const idxVal = Number(evaluateExpressionAdvanced(argsStr, memory, constants, declaredTypes, subprograms));
                    if (memory[ident] && Array.isArray(memory[ident])) {
                        const elem = memory[ident][Math.trunc(idxVal)];
                        const resolved = (elem !== undefined) ? elem : 0;
                        return (typeof resolved === 'string') ? JSON.stringify(resolved) : resolved;
                    }
                    return match;
                });
            }

            const scope = { ...constants, ...memory };
            let jsExpr = expr
                .replace(/≥/g, '>=')
                .replace(/≤/g, '<=')
                .replace(/≠/g, '!=')
                .replace(/\bdiv\b/gi, '/')
                .replace(/\bmod\b/gi, '%')
                .replace(/\by\b/gi, '&&')
                .replace(/\bo\b/gi, '||')
                .replace(/\bno\b/gi, '!')
                .replace(/<>/g, '!=')
                .replace(/>=/g, '>=')
                .replace(/<=/g, '<=')
                .replace(/(?<![<>!=])=(?!=)/g, '===');

            jsExpr = jsExpr.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ_][a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)/g, (match) => {
                const key = match.toLowerCase();
                if (key in scope) {
                    const val = scope[key];
                    if (typeof val === 'number' || typeof val === 'boolean') return val;
                    if (typeof val === 'string') return JSON.stringify(val);
                }
                return match;
            });

            try {
                return Function(`"use strict"; return (${jsExpr})`)();
            } catch (err) {
                const low = expr.toLowerCase();
                if (low in scope) return scope[low];
                return expr;
            }
        }

        function executeSubprogramSync(sub, actualArgValues, parentMemory, constants, declaredTypes, subprograms) {
            const localMemory = {};
            sub.params.forEach((param, i) => {
                const val = actualArgValues[i];
                localMemory[param.name] = (val !== undefined) ? (Array.isArray(val) ? [...val] : val) : 0;
            });
            Object.keys(sub.localVars).forEach(v => { localMemory[v] = 0; });

            let returnVal = 0;
            for (let lineObj of sub.bodyLines) {
                const raw = lineObj.text;
                const low = raw.toLowerCase();

                if (raw.includes('<-') || raw.includes(':=')) {
                    const sep = raw.includes('<-') ? '<-' : ':=';
                    const parts = raw.split(sep);
                    const targetRef = resolveVariableRef(parts[0], localMemory, constants, declaredTypes, subprograms);
                    const val = evaluateExpressionAdvanced(parts[1].trim(), localMemory, constants, declaredTypes, subprograms);
                    if (!targetRef.isIndexed && targetRef.baseName === sub.name) {
                        returnVal = val;
                    } else {
                        assignToMemory(targetRef, val, localMemory, declaredTypes);
                    }
                }
            }
            return returnVal;
        }

        async function callProcedureAsync(procName, argsRawStr, memory, constants, declaredTypes, subprograms, execId) {
            const sub = subprograms[procName];
            if (!sub) throw new Error(`Procedimiento desconocido: "${procName}".`);

            const rawArgTokens = parseArguments(argsRawStr);
            const localMemory = {};
            const refBindings = [];

            sub.params.forEach((param, idx) => {
                const rawArg = (rawArgTokens[idx] || '').trim();
                const argLow = rawArg.toLowerCase();
                const isOut = (param.mode === 'S' || param.mode === 'E/S');

                if (param.mode === 'E' || param.mode === 'E/S') {
                    if (memory[argLow] !== undefined) {
                        localMemory[param.name] = Array.isArray(memory[argLow]) ? [...memory[argLow]] : memory[argLow];
                    } else {
                        localMemory[param.name] = evaluateExpressionAdvanced(rawArg, memory, constants, declaredTypes, subprograms);
                    }
                } else {
                    localMemory[param.name] = (param.type && param.type.includes('tvec')) ? [] : 0;
                }

                if (isOut) {
                    refBindings.push({ formal: param.name, actual: argLow });
                }
            });

            Object.keys(sub.localVars).forEach(v => { localMemory[v] = 0; });

            await executeSubprogramBlock(sub.bodyLines, 0, sub.bodyLines.length, localMemory, constants, declaredTypes, subprograms, execId);

            refBindings.forEach(binding => {
                if (Array.isArray(localMemory[binding.formal])) {
                    memory[binding.actual] = [...localMemory[binding.formal]];
                } else {
                    const targetRef = resolveVariableRef(binding.actual, memory, constants, declaredTypes, subprograms);
                    assignToMemory(targetRef, localMemory[binding.formal], memory, declaredTypes);
                }
            });
        }

        async function executeSubprogramBlock(lines, start, end, memory, constants, declaredTypes, subprograms, execId) {
            let i = start;
            while (i < end) {
                if (execId !== executionAbortController) return;

                const lineObj = lines[i];
                const raw = lineObj.text;
                const low = raw.toLowerCase();

                if (low.startsWith('escribir') || low.startsWith('escribirln')) {
                    const match = raw.match(/^(escribir|escribirln)\s*\(([\s\S]*)\)$/i);
                    if (match) {
                        const args = parseArguments(match[2]);
                        let out = '';
                        for (const arg of args) {
                            const val = evaluateExpressionAdvanced(arg, memory, constants, declaredTypes, subprograms);
                            out += (val !== undefined ? val : '') + ' ';
                        }
                        printTerm(out.trim());
                    }
                    i++;
                    continue;
                }

                if (low === 'leer' || low.startsWith('leer ') || low.startsWith('leer(')) {
                    const content = raw.substring(4).trim();
                    const varNames = extractReadVarNames(content);
                    for (const item of varNames) {
                        const targetRef = resolveVariableRef(item, memory, constants, declaredTypes, subprograms);
                        const inputVal = await promptConsoleStrict(item, 'general', execId);
                        assignToMemory(targetRef, inputVal, memory, declaredTypes);
                    }
                    i++;
                    continue;
                }

                if (low === 'repetir') {
                    let depth = 1;
                    let j = i + 1;
                    let conditionStr = '';
                    while (j < end && depth > 0) {
                        const curLow = lines[j].text.toLowerCase();
                        if (curLow === 'repetir') depth++;
                        if (curLow.startsWith('hasta ')) {
                            depth--;
                            if (depth === 0) {
                                conditionStr = lines[j].text.replace(/^hasta(\s+que)?\s*/i, '').trim();
                                break;
                            }
                        }
                        j++;
                    }

                    const innerLines = lines.slice(i + 1, j);
                    let condMet = false;
                    let iterCount = 0;
                    do {
                        if (execId !== executionAbortController) return;
                        iterCount++;
                        if (iterCount > 50000) throw new Error("Bucle 'repetir...hasta que' excedió las iteraciones de seguridad.");
                        await executeSubprogramBlock(innerLines, 0, innerLines.length, memory, constants, declaredTypes, subprograms, execId);
                        condMet = Boolean(evaluateExpressionAdvanced(conditionStr, memory, constants, declaredTypes, subprograms));
                    } while (!condMet);

                    i = j + 1;
                    continue;
                }

                if (low.startsWith('para ')) {
                    const matchPara = raw.match(/^para\s+([a-zA-Z0-9_]+)\s*(?:<-|:=)\s*(.*?)\s+hasta\s+(.*?)\s+hacer$/i);
                    if (!matchPara) throw new Error(`Sintaxis inválida en "para" (Línea ${lineObj.lineNum})`);

                    const ctrlVar = matchPara[1].trim().toLowerCase();
                    const startVal = Number(evaluateExpressionAdvanced(matchPara[2], memory, constants, declaredTypes, subprograms));
                    const endVal = Number(evaluateExpressionAdvanced(matchPara[3], memory, constants, declaredTypes, subprograms));

                    let depth = 1;
                    let j = i + 1;
                    while (j < end && depth > 0) {
                        const curLow = lines[j].text.toLowerCase();
                        if (curLow.startsWith('para ')) depth++;
                        if (curLow === 'fin para' || curLow === 'finpara') {
                            depth--;
                            if (depth === 0) break;
                        }
                        j++;
                    }

                    const innerParaLines = lines.slice(i + 1, j);
                    for (let val = startVal; val <= endVal; val++) {
                        if (execId !== executionAbortController) return;
                        memory[ctrlVar] = val;
                        await executeSubprogramBlock(innerParaLines, 0, innerParaLines.length, memory, constants, declaredTypes, subprograms, execId);
                    }
                    i = j + 1;
                    continue;
                }

                if (low.startsWith('mientras ')) {
                    const matchM = raw.match(/^mientras\s+(.*?)\s+hacer$/i);
                    if (!matchM) throw new Error(`Sintaxis inválida en "mientras" (Línea ${lineObj.lineNum})`);
                    const conditionStr = matchM[1].trim();

                    let depth = 1;
                    let j = i + 1;
                    while (j < end && depth > 0) {
                        const curLow = lines[j].text.toLowerCase();
                        if (curLow.startsWith('mientras ')) depth++;
                        if (curLow === 'fin mientras' || curLow === 'finmientras') {
                            depth--;
                            if (depth === 0) break;
                        }
                        j++;
                    }

                    const innerWhileLines = lines.slice(i + 1, j);
                    let whileIter = 0;
                    while (Boolean(evaluateExpressionAdvanced(conditionStr, memory, constants, declaredTypes, subprograms))) {
                        if (execId !== executionAbortController) return;
                        whileIter++;
                        if (whileIter > 50000) throw new Error("Bucle 'mientras' infinito.");
                        await executeSubprogramBlock(innerWhileLines, 0, innerWhileLines.length, memory, constants, declaredTypes, subprograms, execId);
                    }
                    i = j + 1;
                    continue;
                }

                if (low.startsWith('si ')) {
                    const matchSi = raw.match(/^si\s+(.*?)\s+entonces$/i);
                    if (!matchSi) throw new Error(`Sintaxis inválida en "si" (Línea ${lineObj.lineNum})`);
                    const condition = Boolean(evaluateExpressionAdvanced(matchSi[1].trim(), memory, constants, declaredTypes, subprograms));

                    let depth = 1;
                    let j = i + 1;
                    let elseIndex = -1;
                    while (j < end && depth > 0) {
                        const curLow = lines[j].text.toLowerCase();
                        if (curLow.startsWith('si ')) depth++;
                        if (curLow === 'sino' && depth === 1) elseIndex = j;
                        if (curLow === 'fin si' || curLow === 'finsi') {
                            depth--;
                            if (depth === 0) break;
                        }
                        j++;
                    }

                    if (condition) {
                        const thenEnd = (elseIndex !== -1) ? elseIndex : j;
                        await executeSubprogramBlock(lines.slice(i + 1, thenEnd), 0, thenEnd - (i + 1), memory, constants, declaredTypes, subprograms, execId);
                    } else if (elseIndex !== -1) {
                        await executeSubprogramBlock(lines.slice(elseIndex + 1, j), 0, j - (elseIndex + 1), memory, constants, declaredTypes, subprograms, execId);
                    }
                    i = j + 1;
                    continue;
                }

                // Invocación a procedimiento: nombre(arg1, arg2)
                const procCallMatch = raw.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ_][a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)\s*\((.*)\)$/);
                if (procCallMatch && !raw.includes('<-') && !raw.includes(':=')) {
                    const callName = procCallMatch[1].trim().toLowerCase();
                    if (subprograms && subprograms[callName] && subprograms[callName].kind === 'procedimiento') {
                        await callProcedureAsync(callName, procCallMatch[2], memory, constants, declaredTypes, subprograms, execId);
                        i++;
                        continue;
                    }
                }

                // Asignación: variable <- valor o vector(i) <- valor
                if (raw.includes('<-') || raw.includes(':=')) {
                    const sep = raw.includes('<-') ? '<-' : ':=';
                    const parts = raw.split(sep);
                    const targetRef = resolveVariableRef(parts[0], memory, constants, declaredTypes, subprograms);
                    const val = evaluateExpressionAdvanced(parts[1].trim(), memory, constants, declaredTypes, subprograms);
                    assignToMemory(targetRef, val, memory, declaredTypes);
                    i++;
                    continue;
                }

                i++;
            }
        }

async function executeCode() {
    updateEditor();

    if (window.innerWidth <= 768) setMobileTab('terminal');
    else if (terminalCard.classList.contains('collapsed')) {
        terminalCard.classList.remove('collapsed');
        workspaceResizer.style.display = 'flex';
        terminalCard.style.flex = `0 0 ${lastTerminalWidth}px`;
        btnToggleTerminal.title = 'Minimizar Consola';
        toggleTermIcon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
    }

    executionAbortController++;
    const currentExecId = executionAbortController;
    waitingForInput = null;

    const check = validateSyntax(codeInput.value);
    if (check.status === 'error') {
        clearTerminal();
        printTerm('NO SE PUEDE EJECUTAR: Existen errores de sintaxis.', 'error');
        check.errors.forEach(err => printTerm(`Línea ${err.line}: ${err.msg}`, 'error'));
        btnRun.disabled = false;
        isRunning = false;
        return;
    }

    isRunning = true;
    btnRun.disabled = false;
    clearTerminal();
    printTerm('Iniciando ejecución...', 'sys');

    const source = codeInput.value;
    const rawLines = source.split('\n');

    const memory = {};
    const constants = check.declaredConsts;
    const declaredTypes = check.declaredTypes;
    const subprograms = check.subprograms;

    // Resetear cuerpos de subprogramas
    Object.keys(subprograms).forEach(k => {
        subprograms[k].bodyLines = [];
    });

    let currentSub = null;
    let inSubVars = false;
    let mainStarted = false;
    const mainBodyLines = [];

    for (let i = 0; i < rawLines.length; i++) {
        let l = rawLines[i].trim().replace(/\{[^}]*\}/g, '').trim();
        const cIdx = l.indexOf('//');
        if (cIdx !== -1) l = l.substring(0, cIdx).trim();
        if (!l) continue;

        const low = l.toLowerCase();

        // 1. Detectar cabecera de subprograma
        if (low.startsWith('procedimiento') || low.startsWith('funcion') || low.startsWith('función')) {
            const parsedHeader = parseSubprogramHeader(l);
            if (parsedHeader && subprograms[parsedHeader.name]) {
                currentSub = subprograms[parsedHeader.name];
            }
            continue;
        }

        // 2. Líneas dentro de un subprograma
        if (currentSub) {
            if (low.startsWith('termina')) {
                currentSub = null;
                inSubVars = false;
            } else if (low.startsWith('variables') || low.startsWith('variable')) {
                inSubVars = true;
            } else if (low.startsWith('comienza')) {
                inSubVars = false;
            } else if (!inSubVars) {
                currentSub.bodyLines.push({ text: l, lineNum: i + 1 });
            }
            continue;
        }

        // 3. Detectar 'comienza' del Programa Principal
        if (!mainStarted && low.startsWith('comienza')) {
            mainStarted = true;
            continue;
        }

        // 4. Fin del programa principal
        if (mainStarted && low.startsWith('termina')) {
            break;
        }

        // 5. Líneas del cuerpo principal
        if (mainStarted) {
            mainBodyLines.push({ text: l, lineNum: i + 1 });
        }
    }

    try {
        await executeSubprogramBlock(mainBodyLines, 0, mainBodyLines.length, memory, constants, declaredTypes, subprograms, currentExecId);
        if (currentExecId === executionAbortController) {
            printTerm('Ejecución finalizada con éxito.', 'success');
        }
    } catch (err) {
        if (currentExecId === executionAbortController) {
            printTerm(`Error en ejecución: ${err.message}`, 'error');
        }
    } finally {
        if (currentExecId === executionAbortController) {
            isRunning = false;
            btnRun.disabled = false;
            termInput.disabled = true;
            termInput.placeholder = "Esperando ejecución...";
        }
    }
}

        btnRun.addEventListener('click', executeCode);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                executeCode();
            }
        });

        codeInput.value = '';
        updateEditor();
