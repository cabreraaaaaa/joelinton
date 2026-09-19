
    let programRows = [];

    let CPU = {
      A: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0,
      PC: 0, Z: 0, S: 0, isHalted: false,
      memory: {}, labels: {}, instructions: []
    };

    let isRunning = false;
    let executionTimer = null;
    let pendingInputResolve = null;
    let stepDelay = 2000;

    const editorContainer = document.getElementById('editor-container');
    const termLogs = document.getElementById('term-logs');
    const execStatus = document.getElementById('exec-status');

    const chipA = document.getElementById('chip-a');
    const chipB = document.getElementById('chip-b');
    const chipC = document.getElementById('chip-c');
    const chipD = document.getElementById('chip-d');
    const chipE = document.getElementById('chip-e');
    const chipH = document.getElementById('chip-h');
    const chipL = document.getElementById('chip-l');
    const chipZ = document.getElementById('chip-z');
    const chipS = document.getElementById('chip-s');

    const inputContainer = document.getElementById('input-container');
    const userInput = document.getElementById('user-input');
    const btnSubmitVal = document.getElementById('btn-submit-val');
    const promptLabel = document.getElementById('prompt-label');

    const delaySlider = document.getElementById('delay-slider');
    const delayDisplay = document.getElementById('delay-display');
    const projectSelector = document.getElementById('project-selector');

    delaySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      stepDelay = val * 1000;
      delayDisplay.innerText = `⏱ ${val.toFixed(1)}s`;
    });

    const btnRun = document.getElementById('btn-run');
    const btnReset = document.getElementById('btn-reset');

    function renderEditor(focusIndex = null, focusType = null) {
      editorContainer.innerHTML = '';
      programRows.forEach((row, index) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'editor-row';
        rowEl.id = `row-index-${index}`;

        rowEl.innerHTML = `
          <div class="row-num">${index + 1}</div>
          <input type="text" class="row-input row-label-input" id="label-input-${index}" value="${row.label || ''}" placeholder="etiqueta" spellcheck="false">
          <input type="text" class="row-input row-inst-input" id="inst-input-${index}" value="${row.inst || ''}" placeholder="instrucción" spellcheck="false">
        `;

        const labelInp = rowEl.querySelector('.row-label-input');
        const instInp = rowEl.querySelector('.row-inst-input');

        labelInp.addEventListener('input', (e) => {
          programRows[index].label = e.target.value;
        });

        instInp.addEventListener('input', (e) => {
          programRows[index].inst = e.target.value;
        });

        labelInp.addEventListener('keydown', (e) => handleKeyNav(e, index, 'label'));
        instInp.addEventListener('keydown', (e) => handleKeyNav(e, index, 'inst'));

        editorContainer.appendChild(rowEl);
      });

      if (focusIndex !== null && focusType !== null) {
        setTimeout(() => {
          const target = document.getElementById(`${focusType}-input-${focusIndex}`);
          if (target) {
            target.focus();
            target.selectionStart = target.selectionEnd = target.value.length;
          }
        }, 15);
      }
    }

    function handleKeyNav(e, index, type) {
      if (e.key === 'Enter') {
        e.preventDefault();
        programRows.splice(index + 1, 0, { label: '', inst: '' });
        renderEditor(index + 1, type);
      } else if (e.key === 'Backspace') {
        const currentInput = document.getElementById(`${type}-input-${index}`);
        const otherType = (type === 'label') ? 'inst' : 'label';
        const otherInput = document.getElementById(`${otherType}-input-${index}`);

        if (currentInput.value === '' && (!otherInput || otherInput.value === '') && programRows.length > 1) {
          e.preventDefault();
          programRows.splice(index, 1);
          const nextFocus = Math.max(0, index - 1);
          renderEditor(nextFocus, type);
        }
      } else if (e.key === 'ArrowDown') {
        if (index + 1 < programRows.length) {
          e.preventDefault();
          const next = document.getElementById(`${type}-input-${index + 1}`);
          if (next) next.focus();
        }
      } else if (e.key === 'ArrowUp') {
        if (index - 1 >= 0) {
          e.preventDefault();
          const prev = document.getElementById(`${type}-input-${index - 1}`);
          if (prev) prev.focus();
        }
      } else if (e.key === 'ArrowRight' && type === 'label' && e.target.selectionStart === e.target.value.length) {
        const instTarget = document.getElementById(`inst-input-${index}`);
        if (instTarget) instTarget.focus();
      } else if (e.key === 'ArrowLeft' && type === 'inst' && e.target.selectionStart === 0) {
        const labelTarget = document.getElementById(`label-input-${index}`);
        if (labelTarget) labelTarget.focus();
      }
    }

    function refreshProjectsList() {
      const projects = JSON.parse(localStorage.getItem('saved_8085_projects') || '{}');
      projectSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
      for (let name in projects) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        projectSelector.appendChild(opt);
      }
    }

    function saveCurrentProject() {
      const name = prompt("Nombre del proyecto a guardar:");
      if (!name || !name.trim()) return;
      const cleanName = name.trim();
      const projects = JSON.parse(localStorage.getItem('saved_8085_projects') || '{}');
      projects[cleanName] = programRows;
      localStorage.setItem('saved_8085_projects', JSON.stringify(projects));
      refreshProjectsList();
      projectSelector.value = cleanName;
      logTerm(`&gt; Proyecto '<strong>${cleanName}</strong>' guardado.`, 'output');
    }

    projectSelector.addEventListener('change', () => {
      const selected = projectSelector.value;
      if (!selected) return;

      const projects = JSON.parse(localStorage.getItem('saved_8085_projects') || '{}');
      if (projects[selected]) {
        stopAndReset();
        programRows = JSON.parse(JSON.stringify(projects[selected]));
        while (programRows.length < 15) {
          programRows.push({ label: '', inst: '' });
        }
        renderEditor();
        logTerm(`&gt; Proyecto '<strong>${selected}</strong>' cargado con éxito.`, 'info');
      }
    });

    function deleteSelectedProject() {
      const selected = projectSelector.value;
      if (!selected) return;
      if (confirm(`¿Seguro que deseas eliminar el proyecto '${selected}'?`)) {
        const projects = JSON.parse(localStorage.getItem('saved_8085_projects') || '{}');
        delete projects[selected];
        localStorage.setItem('saved_8085_projects', JSON.stringify(projects));
        refreshProjectsList();
        logTerm(`&gt; Proyecto '${selected}' eliminado.`, 'halt');
      }
    }

    function clearCodeEditor() {
      stopAndReset();
      programRows = [];
      for (let i = 0; i < 15; i++) {
        programRows.push({ label: '', inst: '' });
      }
      renderEditor();
      projectSelector.value = "";
      logTerm("&gt; Editor vaciado.", "info");
    }

    function highlightRow(index) {
      document.querySelectorAll('.editor-row').forEach(r => r.classList.remove('active-line'));
      const active = document.getElementById(`row-index-${index}`);
      if (active) {
        active.classList.add('active-line');
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function logTerm(msg, type = '') {
      const div = document.createElement('div');
      div.className = `term-line ${type}`;
      div.innerHTML = msg;
      termLogs.appendChild(div);
      termLogs.scrollTop = termLogs.scrollHeight;
    }

    function parseVal(valStr) {
      if (valStr === undefined || valStr === null) return 0;
      valStr = String(valStr).trim();
      if (valStr === '') return 0;
      if (valStr.toLowerCase().endsWith('h')) {
        const hex = parseInt(valStr.slice(0, -1), 16);
        return isNaN(hex) ? 0 : hex;
      }
      const parsed = parseInt(valStr, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    function updateCPUHeader(affectFlags = false) {
      if (affectFlags) {
        CPU.Z = (CPU.A === 0) ? 1 : 0;
        CPU.S = (CPU.A < 0) ? 1 : 0;
      }

      chipA.innerText = CPU.A;
      chipB.innerText = CPU.B;
      chipC.innerText = CPU.C;
      chipD.innerText = CPU.D;
      chipE.innerText = CPU.E;
      chipH.innerText = CPU.H;
      chipL.innerText = CPU.L;
      chipZ.innerText = CPU.Z;
      chipS.innerText = CPU.S;
    }

    const sleep = (ms) => new Promise(resolve => {
      executionTimer = setTimeout(resolve, ms);
    });

    function promptUserValue(promptText) {
      return new Promise((resolve) => {
        promptLabel.innerText = `> ${promptText}:`;
        inputContainer.classList.add('active');
        userInput.value = '';
        userInput.focus();
        pendingInputResolve = resolve;
      });
    }

    function submitInputValue() {
      if (!pendingInputResolve) return;
      const val = userInput.value.trim();
      const num = parseVal(val);
      
      inputContainer.classList.remove('active');
      logTerm(`&gt; Valor ingresado: <span style="color:var(--jersey-cyan); font-weight:bold;">${num}</span>`, 'info');
      
      const res = pendingInputResolve;
      pendingInputResolve = null;
      res(num);
    }

    btnSubmitVal.addEventListener('click', submitInputValue);
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitInputValue();
    });

    function prepareProgram() {
      CPU = {
        A: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0,
        PC: 0, Z: 0, S: 0, isHalted: false,
        memory: {}, labels: {}, instructions: []
      };

      programRows.forEach((row, i) => {
        const lab = (row.label || '').trim().toLowerCase();
        const inst = (row.inst || '').trim();

        if (lab && lab !== 'etiqueta') {
          CPU.labels[lab] = i;
        }
        CPU.instructions.push(inst);
      });

      updateCPUHeader(false);
    }

    function isRegister(name) {
      return ['A', 'B', 'C', 'D', 'E', 'H', 'L'].includes((name || '').toUpperCase());
    }

    function getReg(r) {
      const reg = (r || '').toUpperCase();
      if (CPU.hasOwnProperty(reg)) return CPU[reg];
      return 0;
    }

    function setReg(r, val) {
      const reg = (r || '').toUpperCase();
      if (CPU.hasOwnProperty(reg)) {
        CPU[reg] = val;
      }
    }

    function getValFromMemOrReg(target) {
      if (!target) return 0;
      const upper = target.toUpperCase();
      if (isRegister(upper)) {
        return getReg(upper);
      }
      const lower = target.toLowerCase();
      return CPU.memory[lower] !== undefined ? CPU.memory[lower] : 0;
    }

    function setValToMemOrReg(target, val) {
      if (!target) return;
      const upper = target.toUpperCase();
      if (isRegister(upper)) {
        setReg(upper, val);
      } else {
        CPU.memory[target.toLowerCase()] = val;
      }
    }

    async function runProgram() {
      if (isRunning) return;
      isRunning = true;
      btnRun.disabled = true;
      execStatus.innerText = "EJECUTANDO...";
      execStatus.style.borderColor = "var(--jersey-gold)";
      execStatus.style.color = "var(--jersey-gold)";
      
      termLogs.innerHTML = "";
      logTerm(`&gt; Iniciando ejecución (delay: ${(stepDelay/1000).toFixed(1)}s)...`, "info");

      prepareProgram();

      while (isRunning && !CPU.isHalted && CPU.PC < CPU.instructions.length) {
        const currentLineNum = CPU.PC + 1;
        const lineText = CPU.instructions[CPU.PC];

        highlightRow(CPU.PC);

        if (!lineText || lineText.startsWith(';')) {
          CPU.PC++;
          continue;
        }

        logTerm(`[Línea ${currentLineNum}] Ejecutando: <strong>${lineText}</strong>`, "executing");

        const clean = lineText.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
        const tokens = clean.split(' ');
        const op = tokens[0].toUpperCase();
        const arg1 = tokens[1];
        const arg2 = tokens[2];

        let nextPC = CPU.PC + 1;

        switch (op) {
          case 'IN': {
            const port = arg1 ? arg1.toUpperCase() : 'PE';
            logTerm(`[Línea ${currentLineNum}] Esperando dato por puerto ${port}...`, "prompt");
            const inputVal = await promptUserValue(`Ingrese dato para ${port}`);
            CPU.A = inputVal;
            updateCPUHeader(true);
            logTerm(`→ Acumulador (A) = ${CPU.A}`);
            break;
          }

          case 'OUT': {
            const port = arg1 ? arg1.toUpperCase() : 'PS';
            logTerm(`[SALIDA ${port}] ➔ Resultado: <strong>${CPU.A}</strong>`, "output");
            break;
          }

          case 'LDA': {
            const val = getValFromMemOrReg(arg1);
            CPU.A = val;
            updateCPUHeader(true);
            logTerm(`→ A = [${arg1}] (${val})`);
            break;
          }

          case 'STA': {
            setValToMemOrReg(arg1, CPU.A);
            updateCPUHeader(false);
            logTerm(`→ Destino '${arg1}' = ${CPU.A}`);
            break;
          }

          case 'MVI': {
            const val = parseVal(arg2);
            if (isRegister(arg1)) {
              setReg(arg1, val);
            } else {
              setValToMemOrReg(arg1, val);
            }
            if (arg1.toUpperCase() === 'A') {
              updateCPUHeader(true);
            } else {
              updateCPUHeader(false);
            }
            logTerm(`→ ${arg1.toUpperCase()} = ${val}`);
            break;
          }

          case 'MOV': {
            const src = arg2.toUpperCase();
            const dest = arg1.toUpperCase();
            const val = getReg(src);
            setReg(dest, val);
            if (dest === 'A') {
              updateCPUHeader(true);
            } else {
              updateCPUHeader(false);
            }
            logTerm(`→ MOV ${dest} ← ${src} (${val})`);
            break;
          }

          case 'ADD': {
            const val = getValFromMemOrReg(arg1);
            CPU.A += val;
            updateCPUHeader(true);
            logTerm(`→ Suma realizada: A = ${CPU.A}`);
            break;
          }

          case 'SUB': {
            const val = getValFromMemOrReg(arg1);
            CPU.A -= val;
            updateCPUHeader(true);
            logTerm(`→ Resta realizada: A = ${CPU.A}`);
            break;
          }

          case 'ADI': {
            const val = parseVal(arg1);
            CPU.A += val;
            updateCPUHeader(true);
            logTerm(`→ ADI ${val}: A = ${CPU.A}`);
            break;
          }

          case 'SUI': {
            const val = parseVal(arg1);
            CPU.A -= val;
            updateCPUHeader(true);
            logTerm(`→ SUI ${val}: A = ${CPU.A}`);
            break;
          }

          case 'JMP': {
            const target = (arg1 || '').toLowerCase();
            if (CPU.labels[target] !== undefined) {
              nextPC = CPU.labels[target];
              logTerm(`→ JMP: Salto a '${arg1}' (Línea ${nextPC + 1})`, "info");
            } else {
              logTerm(`Error: Etiqueta '${arg1}' no existe`, "halt");
            }
            break;
          }

          case 'JZ': {
            const target = (arg1 || '').toLowerCase();
            if (CPU.Z === 1) {
              if (CPU.labels[target] !== undefined) {
                nextPC = CPU.labels[target];
                logTerm(`→ JZ (A=0): Salto a '${arg1}' (Línea ${nextPC + 1})`, "info");
              } else {
                logTerm(`Error: Etiqueta '${arg1}' no existe`, "halt");
              }
            } else {
              logTerm(`→ JZ (A ≠ 0): Condición no cumplida.`);
            }
            break;
          }

          case 'JM': {
            const target = (arg1 || '').toLowerCase();
            if (CPU.S === 1) {
              if (CPU.labels[target] !== undefined) {
                nextPC = CPU.labels[target];
                logTerm(`→ JM (A<0): Salto a '${arg1}' (Línea ${nextPC + 1})`, "info");
              } else {
                logTerm(`Error: Etiqueta '${arg1}' no existe`, "halt");
              }
            } else {
              logTerm(`→ JM (A ≥ 0): Condición no cumplida.`);
            }
            break;
          }

          case 'HLT': {
            CPU.isHalted = true;
            logTerm(`[Línea ${currentLineNum}] HLT: Fin de ejecución.`, "halt");
            break;
          }

          default:
            logTerm(`Instrucción desconocida: ${op}`, "halt");
            break;
        }

        CPU.PC = nextPC;

        if (CPU.isHalted || CPU.PC >= CPU.instructions.length) {
          break;
        }

        await sleep(stepDelay);
      }

      finishExecution();
    }

    function finishExecution() {
      isRunning = false;
      btnRun.disabled = false;
      inputContainer.classList.remove('active');
      document.querySelectorAll('.editor-row').forEach(r => r.classList.remove('active-line'));
      execStatus.innerText = "FINALIZADO";
      execStatus.style.borderColor = "var(--jersey-red)";
      execStatus.style.color = "var(--jersey-red)";
    }

    function stopAndReset() {
      isRunning = false;
      clearTimeout(executionTimer);
      if (pendingInputResolve) {
        pendingInputResolve(0);
        pendingInputResolve = null;
      }
      btnRun.disabled = false;
      inputContainer.classList.remove('active');
      document.querySelectorAll('.editor-row').forEach(r => r.classList.remove('active-line'));
      
      termLogs.innerHTML = `<div class="term-line info">&gt; Consola reseteada. Lista para ejecutar.</div>`;
      execStatus.innerText = "LISTO";
      execStatus.style.borderColor = "var(--jersey-cyan)";
      execStatus.style.color = "var(--jersey-cyan)";

      CPU = { A:0, B:0, C:0, D:0, E:0, H:0, L:0, PC:0, Z:0, S:0, isHalted:false, memory:{}, labels:{}, instructions:[] };
      updateCPUHeader(false);
    }

    btnRun.addEventListener('click', runProgram);
    btnReset.addEventListener('click', stopAndReset);

    programRows = [];
    for (let i = 0; i < 15; i++) {
      programRows.push({ label: '', inst: '' });
    }
    renderEditor();
    refreshProjectsList();
    // MODAL DE AVISO / DISCLAIMER
    const btnOpenDisclaimer = document.getElementById('btn-open-disclaimer');
    const modalDisclaimer = document.getElementById('modal-disclaimer');
    const btnCloseDisclaimer = document.getElementById('btn-close-disclaimer');

    if (btnOpenDisclaimer && modalDisclaimer && btnCloseDisclaimer) {
      btnOpenDisclaimer.addEventListener('click', () => modalDisclaimer.classList.add('active'));
      btnCloseDisclaimer.addEventListener('click', () => modalDisclaimer.classList.remove('active'));
      modalDisclaimer.addEventListener('click', (e) => {
        if (e.target === modalDisclaimer) modalDisclaimer.classList.remove('active');
      });
    }
