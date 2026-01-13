(function () {
  const app = document.querySelector('[data-app="touring-cost"]');
  if (!app || !window.TouringCostCalc) {
    return;
  }

  const { compute, formatYen, formatNumber } = window.TouringCostCalc;

  const fieldMap = [
    { id: 'distance', key: 'd', defaultValue: 200 },
    { id: 'fuelEfficiency', key: 'f', defaultValue: 25 },
    { id: 'gasPrice', key: 'p', defaultValue: 170 },
    { id: 'highway', key: 'h', defaultValue: 0 },
    { id: 'meals', key: 'm', defaultValue: 2000 },
    { id: 'lodging', key: 'l', defaultValue: 0 },
    { id: 'sightseeing', key: 's', defaultValue: 1000 },
    { id: 'other', key: 'o', defaultValue: 0 },
    { id: 'people', key: 'n', defaultValue: 1 },
  ];

  const elements = {};
  fieldMap.forEach(({ id }) => {
    elements[id] = document.getElementById(id);
  });

  const totalEl = document.getElementById('totalCost');
  const perPersonEl = document.getElementById('perPersonCost');
  const fuelCostEl = document.getElementById('fuelCost');
  const highwayCostEl = document.getElementById('highwayCost');
  const mealsCostEl = document.getElementById('mealsCost');
  const lodgingCostEl = document.getElementById('lodgingCost');
  const sightseeingCostEl = document.getElementById('sightseeingCost');
  const otherCostEl = document.getElementById('otherCost');
  const fuelLitersEl = document.getElementById('fuelLiters');
  const distanceDeltaEl = document.getElementById('distanceDelta');
  const fuelDeltaEl = document.getElementById('fuelDelta');
  const priceDeltaEl = document.getElementById('priceDelta');

  const storageToggle = document.getElementById('storageToggle');
  const shareButton = document.getElementById('shareButton');
  const shareCopyButton = document.getElementById('shareCopyButton');
  const shareUrl = document.getElementById('shareUrl');
  const calcButton = document.getElementById('calcButton');
  const copyButton = document.getElementById('copyBreakdown');
  const csvButton = document.getElementById('downloadCsv');
  const resetButton = document.getElementById('resetButton');
  const statusMessage = document.getElementById('statusMessage');

  const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));
  const scenarioNameInput = document.getElementById('scenarioName');
  const saveScenarioButton = document.getElementById('saveScenario');
  const clearScenariosButton = document.getElementById('clearScenarios');
  const scenarioList = document.getElementById('scenarioList');
  const scenarioHint = document.getElementById('scenarioHint');
  const scenarioCompareTable = document.getElementById('scenarioCompare');
  const scenarioCompareEmpty = document.getElementById('scenarioCompareEmpty');

  const storageKey = 'touringCostStateV1';
  const storagePrefKey = 'touringCostStorageEnabled';
  const scenarioStorageKey = 'touringCostScenariosV1';
  const maxScenarios = 5;

  let scenarios = [];

  const presetMap = {
    day200: {
      distance: 200,
      fuelEfficiency: 25,
      gasPrice: 170,
      highway: 2000,
      meals: 2500,
      lodging: 0,
      sightseeing: 1500,
      other: 500,
      people: 1,
    },
    overnight350: {
      distance: 350,
      fuelEfficiency: 23,
      gasPrice: 170,
      highway: 5500,
      meals: 4500,
      lodging: 9500,
      sightseeing: 3000,
      other: 1200,
      people: 1,
    },
    split2: {
      distance: 300,
      fuelEfficiency: 25,
      gasPrice: 170,
      highway: 4000,
      meals: 5000,
      lodging: 0,
      sightseeing: 2000,
      other: 800,
      people: 2,
    },
    camping1n: {
      distance: 280,
      fuelEfficiency: 24,
      gasPrice: 170,
      highway: 1500,
      meals: 3000,
      lodging: 3500,
      sightseeing: 1500,
      other: 1500,
      people: 1,
    },
  };

  const setStatus = (message) => {
    if (!statusMessage) {
      return;
    }
    statusMessage.textContent = message;
    statusMessage.classList.add('is-active');
    window.setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.classList.remove('is-active');
    }, 2400);
  };

  const setScenarioHint = (message) => {
    if (!scenarioHint) {
      return;
    }
    scenarioHint.textContent = message || '';
  };

  const isStorageEnabled = () => !storageToggle || storageToggle.checked;

  const readInputs = () => {
    const state = {};
    fieldMap.forEach(({ id }) => {
      state[id] = elements[id] ? elements[id].value : '';
    });
    return state;
  };

  const applyState = (state) => {
    fieldMap.forEach(({ id, defaultValue }) => {
      if (!elements[id]) {
        return;
      }
      const value = state && state[id] !== undefined ? state[id] : defaultValue;
      elements[id].value = value;
    });
  };

  const saveState = (state) => {
    if (!isStorageEnabled()) {
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const clearStoredState = () => {
    localStorage.removeItem(storageKey);
  };

  const loadStoredState = () => {
    if (!isStorageEnabled()) {
      return null;
    }
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return null;
    }
    try {
      return JSON.parse(saved);
    } catch (error) {
      return null;
    }
  };

  const decodeStateFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) {
      return null;
    }
    const state = {};
    fieldMap.forEach(({ id, key }) => {
      if (params.has(key)) {
        state[id] = params.get(key);
      }
    });
    return Object.keys(state).length ? state : null;
  };

  const buildShareUrl = (state) => {
    const url = new URL(window.location.href);
    url.search = '';
    const params = new URLSearchParams();
    fieldMap.forEach(({ id, key, defaultValue }) => {
      const rawValue = Number(state[id]);
      if (!Number.isFinite(rawValue)) {
        return;
      }
      if (rawValue === defaultValue) {
        return;
      }
      if (rawValue === 0 && defaultValue === 0) {
        return;
      }
      params.set(key, String(rawValue));
    });
    const query = params.toString();
    url.search = query;
    return url.toString();
  };

  const formatDelta = (value) => {
    if (value === null || !Number.isFinite(value)) {
      return '—';
    }
    const rounded = Math.round(value);
    const sign = rounded >= 0 ? '+' : '';
    return `${sign}${formatYen(rounded)}円`;
  };

  const render = () => {
    const state = readInputs();
    const result = compute(state);

    if (totalEl) {
      totalEl.textContent = `${formatYen(result.total)}円`;
    }
    if (perPersonEl) {
      perPersonEl.textContent = `${formatYen(result.perPerson)}円`;
    }
    if (fuelCostEl) {
      fuelCostEl.textContent = `${formatYen(result.fuelCost)}円`;
    }
    if (highwayCostEl) {
      highwayCostEl.textContent = `${formatYen(result.inputs.highway)}円`;
    }
    if (mealsCostEl) {
      mealsCostEl.textContent = `${formatYen(result.inputs.meals)}円`;
    }
    if (lodgingCostEl) {
      lodgingCostEl.textContent = `${formatYen(result.inputs.lodging)}円`;
    }
    if (sightseeingCostEl) {
      sightseeingCostEl.textContent = `${formatYen(result.inputs.sightseeing)}円`;
    }
    if (otherCostEl) {
      otherCostEl.textContent = `${formatYen(result.inputs.other)}円`;
    }
    if (fuelLitersEl) {
      fuelLitersEl.textContent = `${formatNumber(result.fuelLiters, 2)} L`;
    }
    if (distanceDeltaEl) {
      distanceDeltaEl.textContent = formatDelta(result.sensitivity.distancePlus10);
    }
    if (fuelDeltaEl) {
      fuelDeltaEl.textContent = formatDelta(result.sensitivity.fuelEfficiencyMinus1);
    }
    if (priceDeltaEl) {
      priceDeltaEl.textContent = formatDelta(result.sensitivity.pricePlus10);
    }

    saveState(state);
  };

  let renderTimer = null;
  const scheduleRender = (immediate = false) => {
    if (renderTimer) {
      window.clearTimeout(renderTimer);
    }
    if (immediate) {
      render();
      return;
    }
    renderTimer = window.setTimeout(render, 160);
  };

  const generateBreakdownText = () => {
    const state = readInputs();
    const result = compute(state);
    return [
      'ツーリング費用の内訳',
      `距離: ${formatNumber(result.inputs.distance, 1)} km`,
      `燃費: ${formatNumber(result.inputs.fuelEfficiency, 1)} km/L`,
      `ガソリン単価: ${formatYen(result.inputs.gasPrice)}円/L`,
      `ガソリン: ${formatYen(result.fuelCost)}円`,
      `高速料金: ${formatYen(result.inputs.highway)}円`,
      `食事: ${formatYen(result.inputs.meals)}円`,
      `宿泊: ${formatYen(result.inputs.lodging)}円`,
      `観光/温泉: ${formatYen(result.inputs.sightseeing)}円`,
      `その他: ${formatYen(result.inputs.other)}円`,
      `合計: ${formatYen(result.total)}円`,
      `1人あたり: ${formatYen(result.perPerson)}円`,
    ].join('\n');
  };

  const downloadCsv = () => {
    const state = readInputs();
    const result = compute(state);
    const lines = [
      '項目,金額(円)',
      `ガソリン,${Math.round(result.fuelCost)}`,
      `高速料金,${Math.round(result.inputs.highway)}`,
      `食事,${Math.round(result.inputs.meals)}`,
      `宿泊,${Math.round(result.inputs.lodging)}`,
      `観光/温泉,${Math.round(result.inputs.sightseeing)}`,
      `その他,${Math.round(result.inputs.other)}`,
      `合計,${Math.round(result.total)}`,
      `1人あたり,${Math.round(result.perPerson)}`,
    ];
    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'touring_cost.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatus('CSVを保存しました。');
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  };

  const handleShare = () => {
    const url = buildShareUrl(readInputs());
    if (shareUrl) {
      shareUrl.value = url;
    }
    setStatus('共有リンクを更新しました。');
  };

  const handleShareCopy = () => {
    if (!shareUrl || !shareUrl.value) {
      handleShare();
    }
    const url = shareUrl ? shareUrl.value : buildShareUrl(readInputs());
    copyToClipboard(url).then(() => {
      setStatus('共有リンクをコピーしました。');
    });
  };

  const handleBreakdownCopy = () => {
    copyToClipboard(generateBreakdownText()).then(() => {
      setStatus('内訳をコピーしました。');
    });
  };

  const handleReset = () => {
    const defaults = {};
    fieldMap.forEach(({ id, defaultValue }) => {
      defaults[id] = defaultValue;
    });
    applyState(defaults);
    scheduleRender(true);
    setStatus('初期値に戻しました。');
  };

  const sanitizeName = (name) =>
    String(name || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 24);

  const createScenarioId = () =>
    `scn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const loadScenarios = () => {
    if (!isStorageEnabled()) {
      return [];
    }
    const saved = localStorage.getItem(scenarioStorageKey);
    if (!saved) {
      return [];
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((item) => item && item.name && item.state);
    } catch (error) {
      return [];
    }
  };

  const persistScenarios = () => {
    if (!isStorageEnabled()) {
      return;
    }
    localStorage.setItem(scenarioStorageKey, JSON.stringify(scenarios));
  };

  const buildScenarioSummary = (scenario) => {
    const result = compute(scenario.state || {});
    return {
      id: scenario.id,
      name: scenario.name,
      total: result.total,
      perPerson: result.perPerson,
      fuel: result.fuelCost,
      highway: result.inputs.highway,
      meals: result.inputs.meals,
      lodging: result.inputs.lodging,
      sightseeing: result.inputs.sightseeing,
      other: result.inputs.other,
    };
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (match) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return map[match] || match;
    });

  const updateScenarioControls = () => {
    const enabled = isStorageEnabled();
    if (scenarioNameInput) {
      scenarioNameInput.disabled = !enabled;
    }
    if (saveScenarioButton) {
      saveScenarioButton.disabled = !enabled;
    }
    if (clearScenariosButton) {
      clearScenariosButton.disabled = !enabled;
    }
    if (!enabled) {
      setScenarioHint('保存OFFのためシナリオは端末に保存されません。');
    }
  };

  const updateScenarioList = () => {
    if (!scenarioList) {
      return;
    }
    scenarioList.innerHTML = '';

    if (!isStorageEnabled()) {
      setScenarioHint('保存OFFのためシナリオは表示されません。');
      return;
    }

    if (!scenarios.length) {
      setScenarioHint('保存したシナリオがまだありません。');
      return;
    }

    setScenarioHint(`保存済み ${scenarios.length}/${maxScenarios}`);

    scenarios.forEach((scenario) => {
      const summary = buildScenarioSummary(scenario);
      const li = document.createElement('li');
      li.className = 'scenario-item';
      li.innerHTML = `
        <div>
          <span class="scenario-name">${escapeHtml(summary.name)}</span>
          <span class="scenario-meta">合計 ${formatYen(summary.total)}円 / 1人あたり ${formatYen(summary.perPerson)}円</span>
        </div>
        <div class="inline">
          <button class="button ghost" type="button" data-action="load" data-scenario-id="${escapeHtml(summary.id)}" aria-label="${escapeHtml(summary.name)}を呼び出す">呼び出す</button>
          <button class="button secondary" type="button" data-action="delete" data-scenario-id="${escapeHtml(summary.id)}" aria-label="${escapeHtml(summary.name)}を削除">削除</button>
        </div>
      `;
      scenarioList.appendChild(li);
    });
  };

  const updateScenarioComparison = () => {
    if (!scenarioCompareTable) {
      return;
    }
    const tableHead =
      scenarioCompareTable.querySelector('thead') ||
      scenarioCompareTable.createTHead();
    const tableBody =
      scenarioCompareTable.querySelector('tbody') ||
      scenarioCompareTable.createTBody();

    if (!isStorageEnabled()) {
      tableHead.innerHTML = '<tr><th scope="col">項目</th></tr>';
      tableBody.innerHTML = '';
      if (scenarioCompareEmpty) {
        scenarioCompareEmpty.textContent = '保存OFFのため比較表は表示されません。';
      }
      return;
    }

    if (!scenarios.length) {
      tableHead.innerHTML = '<tr><th scope="col">項目</th></tr>';
      tableBody.innerHTML = '';
      if (scenarioCompareEmpty) {
        scenarioCompareEmpty.textContent = '保存したシナリオがありません。';
      }
      return;
    }

    if (scenarioCompareEmpty) {
      scenarioCompareEmpty.textContent = '';
    }

    const summaries = scenarios.map(buildScenarioSummary);
    const compareRows = [
      { label: '合計', key: 'total' },
      { label: '1人あたり', key: 'perPerson' },
      { label: 'ガソリン', key: 'fuel' },
      { label: '高速料金', key: 'highway' },
      { label: '食事', key: 'meals' },
      { label: '宿泊', key: 'lodging' },
      { label: '観光/温泉', key: 'sightseeing' },
      { label: 'その他', key: 'other' },
    ];

    tableHead.innerHTML = `
      <tr>
        <th scope="col">項目</th>
        ${summaries
          .map(
            (summary) =>
              `<th scope="col">${escapeHtml(summary.name)}</th>`
          )
          .join('')}
      </tr>
    `;

    tableBody.innerHTML = compareRows
      .map(
        (row) => `
          <tr>
            <th scope="row">${row.label}</th>
            ${summaries
              .map(
                (summary) =>
                  `<td>${formatYen(summary[row.key])}円</td>`
              )
              .join('')}
          </tr>
        `
      )
      .join('');
  };

  const handleSaveScenario = () => {
    if (!isStorageEnabled()) {
      setStatus('保存がオフのためシナリオは保存されません。');
      return;
    }
    if (!scenarioNameInput) {
      return;
    }
    const name = sanitizeName(scenarioNameInput.value);
    if (!name) {
      setStatus('シナリオ名を入力してください。');
      scenarioNameInput.focus();
      return;
    }

    const state = readInputs();
    const existingIndex = scenarios.findIndex((item) => item.name === name);

    if (existingIndex >= 0) {
      const updated = {
        ...scenarios[existingIndex],
        state,
        updatedAt: Date.now(),
      };
      scenarios.splice(existingIndex, 1);
      scenarios.unshift(updated);
      setStatus('同名シナリオを更新しました。');
    } else {
      if (scenarios.length >= maxScenarios) {
        setStatus('最大5件まで保存できます。不要なシナリオを削除してください。');
        return;
      }
      scenarios.unshift({
        id: createScenarioId(),
        name,
        state,
        updatedAt: Date.now(),
      });
      setStatus('シナリオを保存しました。');
    }

    persistScenarios();
    updateScenarioList();
    updateScenarioComparison();
  };

  const handleClearScenarios = () => {
    if (!isStorageEnabled()) {
      setStatus('保存がオフのためシナリオは削除されません。');
      return;
    }
    scenarios = [];
    localStorage.removeItem(scenarioStorageKey);
    updateScenarioList();
    updateScenarioComparison();
    setStatus('保存シナリオを全削除しました。');
  };

  const handleScenarioAction = (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    const action = button.getAttribute('data-action');
    const scenarioId = button.getAttribute('data-scenario-id');
    const index = scenarios.findIndex((item) => item.id === scenarioId);
    if (index < 0) {
      return;
    }

    if (action === 'load') {
      applyState(scenarios[index].state);
      scheduleRender(true);
      setStatus(`「${scenarios[index].name}」を呼び出しました。`);
      return;
    }

    if (action === 'delete') {
      const removed = scenarios.splice(index, 1);
      persistScenarios();
      updateScenarioList();
      updateScenarioComparison();
      if (removed.length) {
        setStatus(`「${removed[0].name}」を削除しました。`);
      }
    }
  };

  const applyPreset = (key, button) => {
    const preset = presetMap[key];
    if (!preset) {
      return;
    }
    applyState(preset);
    if (elements.distance) {
      elements.distance.focus();
    }
    scheduleRender(true);
    presetButtons.forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });
    setStatus('プリセットを反映しました。');
  };

  const applyInitialState = () => {
    let initial = null;
    const queryState = decodeStateFromQuery();

    if (storageToggle) {
      const storedPref = localStorage.getItem(storagePrefKey);
      const enabled = storedPref !== 'off';
      storageToggle.checked = enabled;
    }

    if (queryState) {
      initial = queryState;
    } else if (isStorageEnabled()) {
      initial = loadStoredState();
    }

    if (initial) {
      applyState(initial);
    } else {
      const defaults = {};
      fieldMap.forEach(({ id, defaultValue }) => {
        defaults[id] = defaultValue;
      });
      applyState(defaults);
    }

    scenarios = loadScenarios();
    updateScenarioControls();
    updateScenarioList();
    updateScenarioComparison();
    render();
  };

  fieldMap.forEach(({ id }) => {
    const element = elements[id];
    if (element) {
      element.addEventListener('input', () => scheduleRender());
    }
  });

  if (storageToggle) {
    storageToggle.addEventListener('change', () => {
      localStorage.setItem(
        storagePrefKey,
        storageToggle.checked ? 'on' : 'off'
      );
      if (!storageToggle.checked) {
        clearStoredState();
        scenarios = [];
        updateScenarioControls();
        updateScenarioList();
        updateScenarioComparison();
        setStatus('保存をオフにしました。');
      } else {
        scenarios = loadScenarios();
        updateScenarioControls();
        updateScenarioList();
        updateScenarioComparison();
        render();
        setStatus('保存をオンにしました。');
      }
    });
  }

  if (presetButtons.length) {
    presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        applyPreset(button.getAttribute('data-preset'), button);
      });
    });
  }

  if (scenarioList) {
    scenarioList.addEventListener('click', handleScenarioAction);
  }

  if (scenarioNameInput) {
    scenarioNameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSaveScenario();
      }
    });
  }

  if (saveScenarioButton) {
    saveScenarioButton.addEventListener('click', handleSaveScenario);
  }

  if (clearScenariosButton) {
    clearScenariosButton.addEventListener('click', handleClearScenarios);
  }

  if (shareButton) {
    shareButton.addEventListener('click', handleShare);
  }

  if (calcButton) {
    calcButton.addEventListener('click', () => {
      scheduleRender(true);
      setStatus('計算結果を更新しました。');
    });
  }

  if (shareCopyButton) {
    shareCopyButton.addEventListener('click', handleShareCopy);
  }

  if (copyButton) {
    copyButton.addEventListener('click', handleBreakdownCopy);
  }

  if (csvButton) {
    csvButton.addEventListener('click', downloadCsv);
  }

  if (resetButton) {
    resetButton.addEventListener('click', handleReset);
  }

  applyInitialState();
})();
