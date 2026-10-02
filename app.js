/**
 * iPhone 16 Pro Max - USC to THB Currency Converter
 * Core Application Logic
 */

(function () {
  'use strict';

  // --- Constants & Defaults ---
  const DEFAULT_RATE = 4995.26 / 14773; // 0.3381344344412103
  const APPROX_RATE = 0.34;
  const STANDARD_RATE = 0.3381;

  // --- App State ---
  let state = {
    mode: 'USC_TO_THB', // 'USC_TO_THB' or 'THB_TO_USC'
    rate: DEFAULT_RATE,
    soundEnabled: true,
    keypadVisible: true,
    history: []
  };

  // --- Web Audio Click Synthesizer ---
  let audioCtx = null;
  function playClickSound(freq = 1200, type = 'sine') {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      // Audio not supported or restricted
    }
  }

  // --- Haptic Feedback ---
  function triggerHaptic(duration = 12) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  }

  // --- DOM Elements ---
  const deviceFrame = document.getElementById('deviceFrame');
  const btnFrameMode = document.getElementById('btnFrameMode');
  const btnFullMode = document.getElementById('btnFullMode');

  const currentTimeEl = document.getElementById('currentTime');
  const dynamicIsland = document.getElementById('dynamicIsland');
  const diRateText = document.getElementById('diRateText');

  const currentRateBanner = document.getElementById('currentRateBanner');
  const openRateModalBtn = document.getElementById('openRateModalBtn');
  const openRateFinderBtn = document.getElementById('openRateFinderBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');

  const modeUscToThb = document.getElementById('modeUscToThb');
  const modeThbToUsc = document.getElementById('modeThbToUsc');

  const inputFieldLabel = document.getElementById('inputFieldLabel');
  const inputCurrencyBadge = document.getElementById('inputCurrencyBadge');
  const amountInput = document.getElementById('amountInput');
  const inputUnitSymbol = document.getElementById('inputUnitSymbol');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const presetsContainer = document.getElementById('presetsContainer');

  const swapDirectionBtn = document.getElementById('swapDirectionBtn');
  const resultFieldLabel = document.getElementById('resultFieldLabel');
  const resultValue = document.getElementById('resultValue');
  const resultUnit = document.getElementById('resultUnit');
  const copyResultBtn = document.getElementById('copyResultBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const formulaText = document.getElementById('formulaText');
  const approxCompareText = document.getElementById('approxCompareText');

  const toggleKeypadBtn = document.getElementById('toggleKeypadBtn');
  const toggleKeypadLabel = document.getElementById('toggleKeypadLabel');
  const iosKeypad = document.getElementById('iosKeypad');
  const saveHistoryBtn = document.getElementById('saveHistoryBtn');

  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Modal Elements
  const rateModal = document.getElementById('rateModal');
  const closeRateModalBtn = document.getElementById('closeRateModalBtn');
  const calcThbInput = document.getElementById('calcThbInput');
  const calcUscInput = document.getElementById('calcUscInput');
  const calcDerivedFormula = document.getElementById('calcDerivedFormula');
  const ratePresetExact = document.getElementById('ratePresetExact');
  const ratePresetStandard = document.getElementById('ratePresetStandard');
  const ratePresetRounded = document.getElementById('ratePresetRounded');
  const customRateManualInput = document.getElementById('customRateManualInput');
  const applyRateBtn = document.getElementById('applyRateBtn');

  // Toast
  const toastMsg = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastText');

  // --- Preset Definitions ---
  const USC_PRESETS = [
    { label: '500', value: '500' },
    { label: '1,000', value: '1000' },
    { label: '5,000', value: '5000' },
    { label: '10,000', value: '10000' },
    { label: '14,773', value: '14773' },
    { label: '20,000', value: '20000' },
    { label: '50,000', value: '50000' }
  ];

  const THB_PRESETS = [
    { label: '100 ฿', value: '100' },
    { label: '500 ฿', value: '500' },
    { label: '1,000 ฿', value: '1000' },
    { label: '2,000 ฿', value: '2000' },
    { label: '4,995.26 ฿', value: '4995.26' },
    { label: '5,000 ฿', value: '5000' },
    { label: '10,000 ฿', value: '10000' }
  ];

  // --- Helper Functions ---
  function showToast(msg) {
    toastText.textContent = msg;
    toastMsg.classList.add('show');
    setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 2000);
  }

  function formatNumber(num, maxDecimals = 2, minDecimals = 2) {
    if (isNaN(num) || num === null) return '0.00';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    });
  }

  function cleanNumberString(str) {
    if (!str) return '';
    return str.toString().replace(/,/g, '').trim();
  }

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    currentTimeEl.textContent = `${hours}:${minutes}`;
  }

  // --- Storage (Local Device Storage) ---
  function loadSavedState() {
    try {
      const savedRate = localStorage.getItem('usc_rate');
      if (savedRate && !isNaN(parseFloat(savedRate))) {
        state.rate = parseFloat(savedRate);
      }
      const savedSound = localStorage.getItem('usc_sound');
      if (savedSound !== null) {
        state.soundEnabled = savedSound === 'true';
      }
      const savedMode = localStorage.getItem('usc_mode');
      if (savedMode && (savedMode === 'USC_TO_THB' || savedMode === 'THB_TO_USC')) {
        state.mode = savedMode;
      }
      const savedHistory = localStorage.getItem('usc_history');
      if (savedHistory) {
        state.history = JSON.parse(savedHistory);
      }
    } catch (e) {
      console.warn('Could not read device localStorage', e);
    }
  }

  function saveStateToStorage() {
    try {
      localStorage.setItem('usc_rate', state.rate.toString());
      localStorage.setItem('usc_sound', state.soundEnabled.toString());
      localStorage.setItem('usc_mode', state.mode);
      localStorage.setItem('usc_history', JSON.stringify(state.history));
      const rawVal = cleanNumberString(amountInput.value);
      if (rawVal) {
        localStorage.setItem('usc_last_amount', rawVal);
      }
    } catch (e) {
      console.warn('Could not save to device localStorage', e);
    }
  }

  // --- Presets Rendering ---
  function renderPresets() {
    presetsContainer.innerHTML = '';
    const presets = state.mode === 'USC_TO_THB' ? USC_PRESETS : THB_PRESETS;
    
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'preset-pill';
      btn.type = 'button';
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        playClickSound(1400);
        triggerHaptic(15);
        amountInput.value = formatNumber(p.value, p.value.includes('.') ? 2 : 0, 0);
        calculate();
      });
      presetsContainer.appendChild(btn);
    });
  }

  // --- History Management ---
  function addHistoryItem(sourceVal, sourceUnit, targetVal, targetUnit, rateVal) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = {
      id: Date.now(),
      time: timeStr,
      mode: state.mode,
      source: sourceVal,
      sourceUnit: sourceUnit,
      target: targetVal,
      targetUnit: targetUnit,
      rate: rateVal
    };
    state.history.unshift(item);
    if (state.history.length > 20) state.history.pop();
    saveStateToStorage();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (state.history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">ยังไม่มีประวัติการคำนวณ</div>';
      return;
    }

    state.history.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <div class="history-left">
          <span class="history-calc">${formatNumber(item.source, 2, 0)} ${item.sourceUnit} = <strong>${formatNumber(item.target, 2, 2)} ${item.targetUnit}</strong></span>
          <span class="history-time">${item.time}</span>
        </div>
        <div class="history-rate-tag">
          เรท: ${Number(item.rate).toFixed(4)}
        </div>
      `;
      row.addEventListener('click', () => {
        playClickSound(1000);
        triggerHaptic(10);
        if (item.mode !== state.mode) {
          setMode(item.mode);
        }
        amountInput.value = item.source;
        calculate();
        showToast('โหลดรายการจากประวัติแล้ว');
      });
      historyList.appendChild(row);
    });
  }

  // --- Main Calculation Core ---
  function calculate(saveToHistory = false) {
    const rawVal = cleanNumberString(amountInput.value);
    const amount = parseFloat(rawVal);

    if (isNaN(amount) || amount <= 0) {
      resultValue.textContent = '0.00';
      if (state.mode === 'USC_TO_THB') {
        resultUnit.textContent = '฿';
        formulaText.textContent = `0 USC × ${state.rate.toFixed(6)} = 0.00 ฿`;
        approxCompareText.textContent = `≈ 0.00 ฿ (เรท 0.34)`;
      } else {
        resultUnit.textContent = 'USC';
        formulaText.textContent = `0.00 ฿ ÷ ${state.rate.toFixed(6)} = 0.00 USC`;
        approxCompareText.textContent = `≈ 0.00 USC (เรท 0.34)`;
      }
      return;
    }

    if (state.mode === 'USC_TO_THB') {
      // USC -> THB: THB = USC * rate
      const thbResult = amount * state.rate;
      const thbApprox = amount * APPROX_RATE;
      const diff = thbResult - thbApprox;

      resultValue.textContent = formatNumber(thbResult, 2, 2);
      resultUnit.textContent = '฿';
      formulaText.textContent = `${formatNumber(amount, 0, 0)} USC × ${state.rate.toFixed(6)} = ${formatNumber(thbResult, 2, 2)} ฿`;
      approxCompareText.textContent = `≈ ${formatNumber(thbApprox, 2, 2)} ฿ (เรท 0.34, ต่าง ${diff >= 0 ? '+' : ''}${formatNumber(diff, 2, 2)} ฿)`;

      if (saveToHistory) {
        addHistoryItem(amount, 'USC', thbResult, 'THB', state.rate);
      }
    } else {
      // THB -> USC: USC = THB / rate
      const uscResult = amount / state.rate;
      const uscApprox = amount / APPROX_RATE;
      const diff = uscResult - uscApprox;

      resultValue.textContent = formatNumber(uscResult, 2, 2);
      resultUnit.textContent = 'USC';
      formulaText.textContent = `${formatNumber(amount, 2, 2)} ฿ ÷ ${state.rate.toFixed(6)} = ${formatNumber(uscResult, 2, 2)} USC`;
      approxCompareText.textContent = `≈ ${formatNumber(uscApprox, 2, 2)} USC (เรท 0.34, ต่าง ${diff >= 0 ? '+' : ''}${formatNumber(diff, 2, 2)})`;

      if (saveToHistory) {
        addHistoryItem(amount, 'THB', uscResult, 'USC', state.rate);
      }
    }
  }

  // --- Mode Switching ---
  function setMode(newMode) {
    if (state.mode === newMode) return;
    state.mode = newMode;

    if (state.mode === 'USC_TO_THB') {
      modeUscToThb.classList.add('active');
      modeThbToUsc.classList.remove('active');

      inputFieldLabel.innerHTML = 'จำนวนที่ต้องการคำนวณ <span class="field-currency-tag" id="inputCurrencyBadge">USC</span>';
      inputUnitSymbol.textContent = 'USC';
      resultFieldLabel.textContent = 'ผลลัพธ์ (บาทไทย THB)';
      resultUnit.textContent = '฿';
      amountInput.value = '0';
    } else {
      modeUscToThb.classList.remove('active');
      modeThbToUsc.classList.add('active');

      inputFieldLabel.innerHTML = 'จำนวนเงินบาท <span class="field-currency-tag thb" id="inputCurrencyBadge">THB</span>';
      inputUnitSymbol.textContent = '฿';
      resultFieldLabel.textContent = 'ผลลัพธ์ (จำนวน USC ที่ได้รับ)';
      resultUnit.textContent = 'USC';
      amountInput.value = '0';
    }

    renderPresets();
    calculate();
  }

  // --- Rate Updates ---
  function updateRateDisplays() {
    const formattedShort = state.rate.toFixed(4);
    const formattedExact = state.rate.toFixed(8);

    diRateText.textContent = `1 USC = ${formattedShort} ฿`;
    currentRateBanner.textContent = formattedExact;

    // Update modal inputs
    customRateManualInput.value = formattedExact;
    updateModalRateFormula();
    calculate();
    saveStateToStorage();
  }

  function updateModalRateFormula() {
    const thb = parseFloat(calcThbInput.value) || 0;
    const usc = parseFloat(calcUscInput.value) || 0;

    if (thb > 0 && usc > 0) {
      const derived = thb / usc;
      calcDerivedFormula.textContent = `${formatNumber(thb, 2, 2)} ฿ ÷ ${formatNumber(usc, 0, 0)} = ${derived.toFixed(8)} บาท/USC`;
      customRateManualInput.value = derived.toFixed(8);
    } else {
      calcDerivedFormula.textContent = `ระบุจำนวนเงินบาทและ USC ให้ครบถ้วน`;
    }
  }

  // --- Setup Event Listeners ---
  function initEvents() {
    // Mode Segment buttons
    modeUscToThb.addEventListener('click', () => {
      playClickSound(900);
      triggerHaptic(15);
      setMode('USC_TO_THB');
    });

    modeThbToUsc.addEventListener('click', () => {
      playClickSound(900);
      triggerHaptic(15);
      setMode('THB_TO_USC');
    });

    // Swap Direction button
    swapDirectionBtn.addEventListener('click', () => {
      playClickSound(1100);
      triggerHaptic(20);
      setMode(state.mode === 'USC_TO_THB' ? 'THB_TO_USC' : 'USC_TO_THB');
    });

    // Realtime Input calculation
    amountInput.addEventListener('input', (e) => {
      calculate();
    });

    clearInputBtn.addEventListener('click', () => {
      playClickSound(700);
      triggerHaptic(10);
      amountInput.value = '0';
      amountInput.focus();
      amountInput.select();
      calculate();
    });

    amountInput.addEventListener('focus', () => {
      if (amountInput.value === '0') {
        amountInput.select();
      }
    });

    amountInput.addEventListener('blur', () => {
      if (!amountInput.value.trim()) {
        amountInput.value = '0';
        calculate();
      }
    });

    // Copy Result
    copyResultBtn.addEventListener('click', async () => {
      playClickSound(1500);
      triggerHaptic(25);
      const textToCopy = `${resultValue.textContent} ${resultUnit.textContent}`;
      try {
        await navigator.clipboard.writeText(resultValue.textContent.replace(/,/g, ''));
        copyResultBtn.classList.add('copied');
        copyBtnText.textContent = 'คัดลอกแล้ว!';
        showToast(`คัดลอก ${textToCopy} เรียบร้อย!`);
        setTimeout(() => {
          copyResultBtn.classList.remove('copied');
          copyBtnText.textContent = 'คัดลอก';
        }, 1500);
      } catch (e) {
        showToast('คัดลอกไม่สำเร็จ');
      }
    });

    // Desktop Controls Frame vs Fullscreen
    btnFrameMode.addEventListener('click', () => {
      playClickSound(1000);
      btnFrameMode.classList.add('active');
      btnFullMode.classList.remove('active');
      deviceFrame.classList.remove('full-mode');
      deviceFrame.classList.add('frame-mode');
    });

    btnFullMode.addEventListener('click', () => {
      playClickSound(1000);
      btnFullMode.classList.add('active');
      btnFrameMode.classList.remove('active');
      deviceFrame.classList.remove('frame-mode');
      deviceFrame.classList.add('full-mode');
    });

    // Sound Toggle
    soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      triggerHaptic(15);
      saveStateToStorage();
      if (state.soundEnabled) {
        soundIcon.innerHTML = `
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        `;
        playClickSound(1200);
        showToast('เปิดเสียงเอฟเฟกต์แล้ว');
      } else {
        soundIcon.innerHTML = `
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
        showToast('ปิดเสียงเอฟเฟกต์แล้ว');
      }
    });

    // Dynamic Island Click
    dynamicIsland.addEventListener('click', () => {
      playClickSound(1400);
      triggerHaptic(20);
      dynamicIsland.classList.toggle('expanded');
      setTimeout(() => dynamicIsland.classList.remove('expanded'), 1200);
      openRateModal();
    });

    // Keypad Toggle
    toggleKeypadBtn.addEventListener('click', () => {
      playClickSound(900);
      triggerHaptic(10);
      state.keypadVisible = !state.keypadVisible;
      iosKeypad.style.display = state.keypadVisible ? 'grid' : 'none';
      toggleKeypadLabel.textContent = state.keypadVisible ? 'ซ่อนแป้นตัวเลข iOS' : 'แสดงแป้นตัวเลข iOS';
    });

    // Save History Manual Button
    saveHistoryBtn.addEventListener('click', () => {
      playClickSound(1300);
      triggerHaptic(25);
      calculate(true);
      showToast('บันทึกรายการคำนวณแล้ว');
    });

    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('คุณต้องการล้างประวัติการคำนวณทั้งหมดใช่หรือไม่?')) {
        playClickSound(800);
        triggerHaptic(20);
        state.history = [];
        saveStateToStorage();
        renderHistory();
        showToast('ล้างประวัติเรียบร้อย');
      }
    });

    // Keypad button handling
    iosKeypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.keypad-btn');
      if (!btn) return;

      playClickSound(1000);
      triggerHaptic(12);

      const key = btn.dataset.key;
      const action = btn.dataset.action;
      let current = cleanNumberString(amountInput.value);

      if (key !== undefined) {
        if (key === '.' && current.includes('.')) return;
        if ((current === '0' || current === '') && key !== '.') {
          current = key;
        } else {
          current += key;
        }
        amountInput.value = current;
        calculate();
      } else if (action === 'backspace') {
        current = current.slice(0, -1);
        if (current === '' || current === '-') current = '0';
        amountInput.value = current;
        calculate();
      } else if (action === 'clear') {
        amountInput.value = '0';
        calculate();
      } else if (action === 'swap') {
        setMode(state.mode === 'USC_TO_THB' ? 'THB_TO_USC' : 'USC_TO_THB');
      } else if (action === 'calc') {
        calculate(true);
        showToast('คำนวณและบันทึกประวัติแล้ว');
      }
    });

    // Rate Modal Handlers
    function openRateModal() {
      rateModal.classList.add('active');
      calcThbInput.value = '4995.26';
      calcUscInput.value = '14773';
      updateModalRateFormula();
    }

    function closeRateModal() {
      rateModal.classList.remove('active');
    }

    openRateModalBtn.addEventListener('click', () => {
      playClickSound(1100);
      triggerHaptic(15);
      openRateModal();
    });

    openRateFinderBtn.addEventListener('click', () => {
      playClickSound(1100);
      triggerHaptic(15);
      openRateModal();
    });

    closeRateModalBtn.addEventListener('click', () => {
      playClickSound(900);
      closeRateModal();
    });

    rateModal.addEventListener('click', (e) => {
      if (e.target === rateModal) closeRateModal();
    });

    // Modal Inputs
    calcThbInput.addEventListener('input', updateModalRateFormula);
    calcUscInput.addEventListener('input', updateModalRateFormula);

    // Preset Rate Buttons
    [ratePresetExact, ratePresetStandard, ratePresetRounded].forEach(b => {
      b.addEventListener('click', () => {
        playClickSound(1200);
        triggerHaptic(15);
        document.querySelectorAll('.preset-rate-btn').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        customRateManualInput.value = parseFloat(b.dataset.rate).toFixed(8);
      });
    });

    // Apply Rate Button
    applyRateBtn.addEventListener('click', () => {
      const newRate = parseFloat(customRateManualInput.value);
      if (isNaN(newRate) || newRate <= 0) {
        alert('กรุณาระบุอัตราแลกเปลี่ยนที่ถูกต้อง');
        return;
      }
      playClickSound(1600);
      triggerHaptic(30);
      state.rate = newRate;
      updateRateDisplays();
      closeRateModal();
      showToast(`ปรับอัตราแลกเปลี่ยนเป็น 1 USC = ${state.rate.toFixed(4)} ฿`);
    });
  }

  // --- Initializer ---
  function init() {
    loadSavedState();
    updateClock();
    setInterval(updateClock, 1000);

    renderPresets();
    updateRateDisplays();
    renderHistory();
    initEvents();

    // Default amount is 0
    amountInput.value = '0';
    calculate();
  }

  // Start app on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
