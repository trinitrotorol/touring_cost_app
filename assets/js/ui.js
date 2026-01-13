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

  const storageKey = 'touringCostStateV1';
  const storagePrefKey = 'touringCostStorageEnabled';

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
    if (!storageToggle || !storageToggle.checked) {
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const clearStoredState = () => {
    localStorage.removeItem(storageKey);
  };

  const loadStoredState = () => {
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
    render();
    setStatus('初期値に戻しました。');
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
    } else if (storageToggle && storageToggle.checked) {
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

    render();
  };

  fieldMap.forEach(({ id }) => {
    const element = elements[id];
    if (element) {
      element.addEventListener('input', render);
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
        setStatus('保存をオフにしました。');
      } else {
        render();
        setStatus('保存をオンにしました。');
      }
    });
  }

  if (shareButton) {
    shareButton.addEventListener('click', handleShare);
  }

  if (calcButton) {
    calcButton.addEventListener('click', () => {
      render();
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
