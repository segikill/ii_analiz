(() => {
  "use strict";

  const scriptUrl = new URL(document.currentScript.src, window.location.href);
  const siteRoot = new URL("../", scriptUrl);
  const path = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");

  const pages = [
    { match: "/sakhalin/index.html", region: "Сахалинская область", regionPath: "sakhalin/index.html", label: "Раздел региона", period: "2016–2025", kind: "Каталог" },
    { match: "/amur/index.html", region: "Амурская область", regionPath: "amur/index.html", label: "Раздел региона", period: "2023–2025", kind: "Каталог" },
    { match: "/sakhalin/full_report.html", region: "Сахалинская область", regionPath: "sakhalin/index.html", label: "Полный аналитический отчёт", period: "2016–2025", kind: "Общий отчёт" },
    { match: "/amur/full_report.html", region: "Амурская область", regionPath: "amur/index.html", label: "Полный аналитический отчёт", period: "2023–2025", kind: "Общий отчёт" },
    { match: "/sakhalin/icd_age_atlas/index.html", region: "Сахалинская область", regionPath: "sakhalin/index.html", label: "Возраст × МКБ-10", period: "2016–2025", kind: "Атлас" },
    { match: "/amur/icd_age_atlas/index.html", region: "Амурская область", regionPath: "amur/index.html", label: "Возраст × МКБ-10", period: "2023–2025", kind: "Атлас" },
    { match: "/sakhalin/icd_treemap/index.html", region: "Сахалинская область", regionPath: "sakhalin/index.html", label: "Интерактивный атлас смертности", period: "2016–2025", kind: "Интерактивный отчёт" },
    { match: "/amur/icd_treemap/index.html", region: "Амурская область", regionPath: "amur/index.html", label: "Интерактивный атлас смертности", period: "2023–2025", kind: "Интерактивный отчёт" },
    { match: "/icd_classes/icd_class_report.html", region: "Сахалинская область", regionPath: "sakhalin/index.html", label: "Классы МКБ-10", period: "2016–2025", kind: "Специальный анализ" },
    { match: "/icd_age_standardized/icd_age_standardized_report.html", region: "Сахалинская область", regionPath: "sakhalin/index.html", label: "Возрастная стандартизация", period: "2016–2025", kind: "Специальный анализ" },
    { match: "/mortality_cause_chains/report.html", region: "Сахалинская область", regionPath: "sakhalin/index.html", label: "Алкоголь-ассоциированная смертность", period: "2016–2025", kind: "Специальный анализ" }
  ];

  const page = pages.find((item) => path.endsWith(item.match));
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main-content";

  const skip = document.createElement("a");
  skip.className = "site-skip-link";
  skip.href = main ? `#${main.id}` : "#top";
  skip.textContent = "Перейти к содержанию";
  document.body.prepend(skip);

  if (page) {
    const shell = document.createElement("header");
    shell.className = "site-shell";
    shell.setAttribute("aria-label", "Навигация по аналитическим отчётам");

    const rootHref = new URL("index.html", siteRoot).href;
    const regionHref = new URL(page.regionPath, siteRoot).href;
    shell.innerHTML = `
      <div class="site-shell__inner">
        <nav class="site-shell__breadcrumbs" aria-label="Хлебные крошки">
          <a href="${rootHref}">Главная</a>
          <span class="site-shell__separator" aria-hidden="true">›</span>
          <a href="${regionHref}">${page.region}</a>
          ${page.label === "Раздел региона" ? "" : `<span class="site-shell__separator" aria-hidden="true">›</span><span class="site-shell__current" aria-current="page">${page.label}</span>`}
        </nav>
        <div class="site-shell__meta" aria-label="Параметры отчёта">
          <span class="site-shell__pill">${page.kind}</span>
          <span class="site-shell__pill">${page.period}</span>
        </div>
      </div>`;
    document.body.insertBefore(shell, skip.nextSibling);
    document.body.classList.add("site-has-shell");
  }

  document.querySelectorAll(".table-wrap").forEach((wrap, index) => {
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "region");
    if (!wrap.hasAttribute("aria-label")) {
      const sectionTitle = wrap.closest("section")?.querySelector("h2, h3")?.textContent?.trim();
      wrap.setAttribute("aria-label", sectionTitle ? `Таблица: ${sectionTitle}` : `Прокручиваемая таблица ${index + 1}`);
    }
  });

  const selectWheelTimes = new Map();
  document.addEventListener("wheel", (event) => {
    const select = event.target instanceof Element ? event.target.closest("select") : null;
    if (!select || select.disabled || select.multiple || select.size > 1 || event.deltaY === 0) return;
    event.preventDefault();
    const key = select.id || select.name || "anonymous-select";
    const now = performance.now();
    const previous = selectWheelTimes.get(key);
    if (previous !== undefined && now - previous < 350) return;
    selectWheelTimes.set(key, now);
    const direction = event.deltaY > 0 ? 1 : -1;
    let nextIndex = select.selectedIndex + direction;
    while (nextIndex >= 0 && nextIndex < select.options.length && select.options[nextIndex].disabled) {
      nextIndex += direction;
    }
    if (nextIndex < 0 || nextIndex >= select.options.length) return;
    select.focus({ preventScroll: true });
    select.selectedIndex = nextIndex;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, { passive: false });

  const improveTreemapContrast = () => {
    document.querySelectorAll(".tile").forEach((tile) => {
      tile.style.setProperty("color", "#ffffff", "important");
      tile.querySelectorAll(".tile-code, .tile-label, .tile-value").forEach((part) => {
        part.style.setProperty("color", "#ffffff", "important");
      });
    });
  };

  improveTreemapContrast();
  const chartRoot = document.getElementById("viz");
  if (chartRoot) {
    new MutationObserver(improveTreemapContrast).observe(chartRoot, { childList: true, subtree: true });
  }

  const enhanceAtlas = () => {
    if (!page || !page.match.endsWith("/icd_treemap/index.html")) return;
    if (typeof state === "undefined" || typeof render !== "function" || typeof DATA === "undefined") return;

    const exportPrefix = DATA.regionKey || (page.match.includes("/amur/") ? "amur" : "sakhalin");
    if (state.treeColor === undefined || state.treeColor === "change") state.treeColor = "count";
    if (state.mapLabels === undefined || state.mapLabels === "key") state.mapLabels = "auto";
    if (state.mapPalette === undefined) state.mapPalette = "teal";
    if (state.mapColorLow === undefined) state.mapColorLow = "#e5f2f4";
    if (state.mapColorHigh === undefined) state.mapColorHigh = "#115b70";
    if (state.mapBreaks === undefined) state.mapBreaks = "";
    if (state.dotLabels === undefined) state.dotLabels = "outliers";

    const defaults = { ...state };
    const enumValues = {
      view: ["treemap", "heatmap", "arrow", "pyramid", "plot", "map", "dotogram"],
      sex: ["all", "1", "2"],
      age: ["all", "0_14", "15_44", "45_64", "65_79", "80P"],
      treeType: ["root", "class", "block"],
      treeMetric: ["n", "share", "pgpzh"],
      treeColor: ["count", "change", "age"],
      heatUnit: ["mo", "settlement"],
      heatMetric: ["share", "n", "per1k", "per10k", "per100k"],
      heatLimit: ["25", "50", "all"],
      arrowMode: ["time", "sex", "region"],
      pyramidMetric: ["n", "share"],
      plotLevel: ["class", "code"],
      mapUnit: ["settlement", "mo"],
      mapMetric: ["n", "share", "per1k", "per10k", "per100k"],
      mapLabels: ["auto", "centers", "off"],
      mapPalette: ["teal", "blue", "purple", "orange", "green", "rose", "custom"],
      dotUnit: ["settlement", "mo"],
      dotMetric: ["n", "share", "median", "pgpzh", "per1k", "per10k", "per100k"],
      dotLabels: ["outliers", "top", "off"]
    };
    const classKeys = new Set(["pyramidClass", "plotClass", "mapClass", "dotClass"]);
    const urlKeys = Object.keys(defaults);
    let restoringHistory = false;
    let searchTarget = null;
    let suppressSmallValues = false;
    let mapViewport = [0, 0, 760, 790];
    const debugMap = new URLSearchParams(window.location.search).get("debug") === "1";
    const filteredCache = new Map();
    const geoAggregateCache = new Map();
    const mapScaleCache = new Map();
    const mapPerformance = { filterMiss: false, aggregateMiss: false, filterMs: 0, aggregateMs: 0 };
    const originalFiltered = filtered;
    const cachePut = (cache, key, value, maximum = 16) => {
      if (cache.has(key)) cache.delete(key);
      cache.set(key, value);
      while (cache.size > maximum) cache.delete(cache.keys().next().value);
      return value;
    };
    const filterStateKey = () => `${state.year}|${state.sex}|${state.age}`;
    filtered = (options = {}) => {
      if (Object.keys(options).length) return originalFiltered(options);
      const key = filterStateKey();
      if (filteredCache.has(key)) return filteredCache.get(key);
      const started = performance.now();
      const result = originalFiltered();
      mapPerformance.filterMiss = true;
      mapPerformance.filterMs = performance.now() - started;
      return cachePut(filteredCache, key, result, 12);
    };
    geoValues = (unit, classKey) => {
      const key = `${filterStateKey()}|${unit}`;
      let aggregate = geoAggregateCache.get(key);
      if (!aggregate) {
        const started = performance.now();
        const definitions = unit === "mo" ? DATA.municipalities : DATA.settlements;
        const position = unit === "mo" ? 4 : 5;
        const table = new Map();
        filtered().forEach((row) => {
          const index = row[position];
          if (index < 0) return;
          if (!table.has(index)) {
            table.set(index, {
              idx: index,
              total: 0,
              selected: 0,
              ages: [],
              pgpzh: 0,
              classes: new Array(DATA.classes.length).fill(0)
            });
          }
          const value = table.get(index);
          const classIndex = classOf(row);
          value.total += 1;
          if (row[2] >= 0) {
            value.ages.push(row[2]);
            value.pgpzh += Math.max(75 - row[2], 0);
          }
          if (classIndex >= 0) value.classes[classIndex] += 1;
        });
        aggregate = cachePut(geoAggregateCache, key, { defs: definitions, table }, 24);
        mapPerformance.aggregateMiss = true;
        mapPerformance.aggregateMs = performance.now() - started;
      }
      const map = new Map();
      aggregate.table.forEach((value, index) => {
        map.set(index, {
          ...value,
          selected: classKey === "all" ? value.total : value.classes[+classKey] || 0
        });
      });
      return { defs: aggregate.defs, map };
    };

    const isValid = (key, value) => {
      if (enumValues[key]) return enumValues[key].includes(value);
      if (key === "year") return value === "all" || DATA.years.map(String).includes(value);
      if (classKeys.has(key)) return value === "all" || (Number.isInteger(+value) && +value >= 0 && +value < DATA.classes.length);
      if (key === "treeIndex") return Number.isInteger(+value) && +value >= -1 && +value < Math.max(DATA.classes.length, DATA.blocks.length);
      if (key === "mapScaleMax") return value === "" || (Number.isFinite(+value) && +value >= 0 && +value <= 1e9);
      if (key === "mapBreaks") {
        if (value === "") return true;
        const breaks = value.split(",").map(Number);
        return breaks.length === 4
          && breaks.every((item) => Number.isFinite(item) && item > 0 && item <= 1e9)
          && breaks.every((item, index) => index === 0 || item > breaks[index - 1]);
      }
      if (key === "mapColorLow" || key === "mapColorHigh") return /^#[0-9a-f]{6}$/i.test(value);
      return false;
    };

    const readUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      urlKeys.forEach((key) => {
        const value = params.get(key);
        if (value !== null && isValid(key, value)) state[key] = value;
      });
    };

    const writeUrlState = () => {
      if (restoringHistory) return;
      const url = new URL(window.location.href);
      urlKeys.forEach((key) => {
        const value = String(state[key]);
        if (value === String(defaults[key])) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
      });
      history.replaceState(null, "", url);
    };

    const syncGlobalControls = () => {
      const year = document.getElementById("yearSelect");
      const age = document.getElementById("ageSelect");
      if (year) year.value = state.year;
      if (age) age.value = state.age;
      document.querySelectorAll("#sexSeg button").forEach((button) => button.classList.toggle("active", button.dataset.value === state.sex));
      document.querySelectorAll(".viz-btn").forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
    };

    const paletteDefinitions = {
      teal: { label: "Сине-бирюзовая", colors: ["#e5f2f4", "#79b4bf", "#115b70"] },
      blue: { label: "Синяя", colors: ["#eff6ff", "#78aee8", "#174a8b"] },
      purple: { label: "Фиолетовая", colors: ["#f5f1fb", "#b69bd6", "#5b2a86"] },
      orange: { label: "Оранжевая", colors: ["#fff4e6", "#f2a65a", "#a94712"] },
      green: { label: "Зелёная", colors: ["#edf8ef", "#7fc392", "#176b3a"] },
      rose: { label: "Розово-бордовая", colors: ["#fff0f3", "#df8ca1", "#8f2444"] },
      custom: { label: "Своя палитра", colors: [] }
    };

    const paletteColors = () => state.mapPalette === "custom"
      ? [state.mapColorLow, state.mapColorHigh]
      : paletteDefinitions[state.mapPalette]?.colors || paletteDefinitions.teal.colors;

    const rgbFromHex = (hex) => {
      const value = String(hex).replace("#", "");
      return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
    };

    const continuousPaletteColor = (value) => {
      const colors = paletteColors();
      const bounded = Math.max(0, Math.min(1, Number(value) || 0));
      const position = bounded * (colors.length - 1);
      const index = Math.min(Math.floor(position), colors.length - 2);
      const fraction = position - index;
      const start = rgbFromHex(colors[index]);
      const end = rgbFromHex(colors[index + 1]);
      const mixed = start.map((channel, channelIndex) => Math.round(channel + (end[channelIndex] - channel) * fraction));
      return `rgb(${mixed.join(",")})`;
    };

    const paletteClassColors = () => Array.from(
      { length: 5 },
      (_, index) => continuousPaletteColor(index / 4)
    );

    let activeMapBreakFractions = [0, .2, .4, .6, .8, 1];

    const mapBreakInputValue = (value) => {
      const rounded = Math.round(Number(value) * 100) / 100;
      return Number.isFinite(rounded) ? String(rounded) : "";
    };

    const equalIntervalBreaks = (scaleMaximum) => {
      const raw = Array.from({ length: 4 }, (_, index) => scaleMaximum * (index + 1) / 5);
      const precision = state.mapMetric === "n" && scaleMaximum >= 5 ? 0 : scaleMaximum >= 100 ? 1 : 2;
      const rounded = raw.map((value) => Number(value.toFixed(precision)));
      return rounded.every((value, index) => value > (index === 0 ? 0 : rounded[index - 1]) && value < scaleMaximum)
        ? rounded
        : raw;
    };

    const jenksBreaks = (source, classCount) => {
      const data = source.filter(Number.isFinite).sort((left, right) => left - right);
      const length = data.length;
      if (!length || classCount < 2) return [data[0] || 0, data[length - 1] || 0];
      const lower = Array.from({ length: length + 1 }, () => new Float64Array(classCount + 1));
      const variance = Array.from({ length: length + 1 }, () => new Float64Array(classCount + 1).fill(Infinity));
      for (let index = 1; index <= classCount; index += 1) {
        lower[1][index] = 1;
        variance[1][index] = 0;
      }
      for (let end = 2; end <= length; end += 1) {
        let sum = 0, sumSquares = 0, weight = 0, currentVariance = 0;
        for (let offset = 1; offset <= end; offset += 1) {
          const start = end - offset + 1;
          const value = data[start - 1];
          weight += 1;
          sum += value;
          sumSquares += value * value;
          currentVariance = sumSquares - sum * sum / weight;
          const previous = start - 1;
          if (previous > 0) {
            for (let group = 2; group <= classCount; group += 1) {
              const candidate = currentVariance + variance[previous][group - 1];
              if (candidate < variance[end][group]) {
                lower[end][group] = start;
                variance[end][group] = candidate;
              }
            }
          }
        }
        lower[end][1] = 1;
        variance[end][1] = currentVariance;
      }
      const result = new Array(classCount + 1).fill(0);
      result[0] = data[0];
      result[classCount] = data[length - 1];
      let end = length;
      for (let group = classCount; group > 1; group -= 1) {
        const index = Math.max(0, Math.round(lower[end][group]) - 2);
        result[group - 1] = data[index];
        end = Math.max(1, Math.round(lower[end][group]) - 1);
      }
      return result;
    };

    const automaticMapBreaks = (metricValues, scaleMaximum) => {
      const positive = metricValues
        .filter((value) => Number.isFinite(value) && value > 0 && value <= scaleMaximum);
      const unique = [...new Set(positive)];
      if (unique.length < 5) return equalIntervalBreaks(scaleMaximum);
      const raw = jenksBreaks([...positive, scaleMaximum], 5).slice(1, -1);
      const valid = raw.length === 4
        && raw.every((value, index) => Number.isFinite(value)
          && value > (index === 0 ? 0 : raw[index - 1])
          && value < scaleMaximum);
      return valid ? raw : equalIntervalBreaks(scaleMaximum);
    };

    const mapScaleContext = () => {
      const cacheKey = [
        filterStateKey(), state.mapUnit, state.mapClass, state.mapMetric,
        state.mapScaleMax, state.mapBreaks
      ].join("|");
      if (mapScaleCache.has(cacheKey)) return mapScaleCache.get(cacheKey);
      const { defs, map } = geoValues(state.mapUnit, state.mapClass);
      const totalRows = filtered().length;
      const metric = (value) => territoryMetric(state.mapMetric, value, defs[value.idx], state.mapClass, totalRows);
      const metricValues = [...map.values()].map(metric).filter(Number.isFinite);
      const manualMaximum = Number(state.mapScaleMax);
      const scaleMaximum = manualMaximum > 0 ? manualMaximum : Math.max(1, ...metricValues);
      const automatic = automaticMapBreaks(metricValues, scaleMaximum);
      const requested = String(state.mapBreaks || "").split(",").map(Number);
      const manual = requested.length === 4
        && requested.every((value, index) => Number.isFinite(value)
          && value > (index === 0 ? 0 : requested[index - 1])
          && value < scaleMaximum);
      if (state.mapBreaks && !manual) state.mapBreaks = "";
      const innerBreaks = manual ? requested : automatic;
      const boundaries = [0, ...innerBreaks, scaleMaximum];
      return cachePut(mapScaleCache, cacheKey, {
        boundaries, innerBreaks, manual, metricValues, scaleMaximum,
        algorithm: manual ? "manual" : "jenks",
        manualScale: manualMaximum > 0
      }, 24);
    };

    const mapClassIndex = (value, boundaries) => {
      for (let index = 1; index < boundaries.length - 1; index += 1) {
        if (value <= boundaries[index]) return index - 1;
      }
      return 4;
    };

    const syncActiveMapBreaks = () => {
      const context = mapScaleContext();
      activeMapBreakFractions = context.boundaries.map((value) => value / context.scaleMaximum);
      return context;
    };

    const paletteColor = (value) => {
      const bounded = Math.max(0, Math.min(1, Number(value) || 0));
      const classIndex = mapClassIndex(bounded, activeMapBreakFractions);
      return paletteClassColors()[classIndex];
    };

    window.mapRamp = paletteColor;

    const addSupplementalControls = () => {
      const controls = document.getElementById("localControls");
      if (!controls) return;
      if (state.view === "treemap") {
        const color = document.getElementById("treeColor");
        if (color && !color.querySelector('option[value="count"]')) {
          color.insertAdjacentHTML("afterbegin", '<option value="count">Количество · пастельная градация</option>');
        }
        if (color) color.value = state.treeColor;
      }
      if (state.view === "map") {
        const mapUnit = document.getElementById("mapUnit");
        if (mapUnit) {
          mapUnit.onchange = () => {
            const nextUnit = mapUnit.value;
            if (nextUnit === state.mapUnit) return;
            state.mapUnit = nextUnit;
            state.mapBreaks = "";
            state.mapScaleMax = "";
            render();
          };
        }
        const paletteOptions = Object.entries(paletteDefinitions)
          .map(([value, definition]) => `<option value="${value}">${definition.label}</option>`)
          .join("");
        const customColors = state.mapPalette === "custom" ? `
          <div class="site-map-palette-colors">
            <label><span>Минимум <output>${state.mapColorLow.toUpperCase()}</output></span><input id="mapColorLow" type="color" value="${state.mapColorLow}"></label>
            <label><span>Максимум <output>${state.mapColorHigh.toUpperCase()}</output></span><input id="mapColorHigh" type="color" value="${state.mapColorHigh}"></label>
          </div>` : "";
        const classificationSource = state.mapUnit === "settlement"
          ? "по значениям населённых пунктов текущего фильтра"
          : "по значениям муниципалитетов текущего фильтра";
        const paletteHint = `Цвет всегда показывает выбранный числовой показатель. Автоматические границы пяти классов рассчитываются методом Дженкса отдельно ${classificationSource}.`;
        controls.insertAdjacentHTML("beforeend", `
          <div class="field"><label for="mapPalette">Палитра числовой шкалы</label>
          <select id="mapPalette">${paletteOptions}</select>
          <div class="site-map-palette-preview" aria-label="Пять цветовых классов">${paletteClassColors().map((color) => `<span style="background:${color}"></span>`).join("")}</div>
          ${customColors}<p class="site-map-palette-hint">${paletteHint}</p></div>`);
        const palette = document.getElementById("mapPalette");
        palette.value = state.mapPalette;
        palette.onchange = () => { state.mapPalette = palette.value; render(); };
        ["mapColorLow", "mapColorHigh"].forEach((key) => {
          const input = document.getElementById(key);
          if (input) input.onchange = () => { state[key] = input.value.toLowerCase(); render(); };
        });
        controls.insertAdjacentHTML("beforeend", `
          <div class="field"><label for="mapLabels">Подписи на карте</label>
          <select id="mapLabels"><option value="auto">Авто по масштабу</option><option value="centers">Только ключевые центры</option><option value="off">Без подписей</option></select></div>`);
        const labels = document.getElementById("mapLabels");
        labels.value = state.mapLabels;
        labels.onchange = () => { state.mapLabels = labels.value; render(); };
        const privacy = document.createElement("div");
        privacy.className = "field";
        privacy.innerHTML = `<label class="site-map-privacy"><input type="checkbox" ${suppressSmallValues ? "checked" : ""}>Скрывать малые значения n &lt; 5</label>`;
        privacy.querySelector("input").onchange = (event) => {
          suppressSmallValues = event.target.checked;
          render();
        };
        controls.appendChild(privacy);
      }
      if (state.view === "dotogram" && state.dotUnit === "settlement") {
        controls.insertAdjacentHTML("beforeend", `
          <div class="field"><label for="dotLabels">Подписи точек</label>
          <select id="dotLabels"><option value="outliers">Статистические выбросы</option><option value="top">Топ-10 значений</option><option value="off">Без подписей</option></select></div>`);
        const labels = document.getElementById("dotLabels");
        labels.value = state.dotLabels;
        labels.onchange = () => { state.dotLabels = labels.value; render(); };
      }
    };

    const pastelVolumeColor = (hex, ratio) => {
      const value = String(hex || "#607d9d").replace("#", "");
      const source = value.length === 3
        ? value.split("").map((part) => parseInt(part + part, 16))
        : [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
      const intensity = Math.sqrt(Math.max(0, Math.min(1, ratio || 0)));
      const white = 0.38 - intensity * 0.24;
      const muted = source.map((channel) => Math.round(channel * (1 - white) + 242 * white));
      return `rgb(${muted.join(",")})`;
    };

    const enhanceTreemap = () => {
      if (state.view !== "treemap") return;
      const items = treeItems();
      const byCode = new Map(items.map((item) => [String(item.code), item]));
      const maximum = Math.max(...items.map((item) => item.n), 1);
      document.querySelectorAll(".tile").forEach((tile) => {
        const item = byCode.get(tile.querySelector(".tile-code")?.textContent.trim());
        if (item && state.treeColor === "count") {
          tile.style.background = pastelVolumeColor(item.color, item.n / maximum);
        }
        tile.style.setProperty("color", "#ffffff", "important");
      });
      improveTreemapContrast();
      if (state.treeColor === "count") {
        document.getElementById("methodText").textContent = "Площадь показывает выбранный показатель, а насыщенность пастельного цвета — число смертей внутри текущего уровня. Чем темнее плитка, тем больше наблюдений.";
      }
    };

    const enhanceMapPaletteLegend = () => {
      if (state.view !== "map") return;
      const ramp = document.querySelector(".legend-ramp");
      if (!ramp) return;
      const colors = paletteClassColors();
      const paletteName = paletteDefinitions[state.mapPalette]?.label || paletteDefinitions.teal.label;
      const { boundaries, innerBreaks, manual, metricValues, scaleMaximum } = syncActiveMapBreaks();
      const counts = new Array(5).fill(0);
      metricValues.forEach((value) => { counts[mapClassIndex(value, boundaries)] += 1; });
      ramp.style.background = "none";
      ramp.classList.add("site-map-discrete-ramp");
      ramp.innerHTML = colors.map((color) => `<span style="background:${color}"></span>`).join("");
      ramp.setAttribute("role", "img");
      ramp.setAttribute("aria-label", `Палитра ${paletteName}, пять интервальных классов`);
      const caption = document.createElement("div");
      caption.className = "site-map-palette-caption";
      caption.textContent = state.mapPalette === "custom"
        ? `5 классов Дженкса · ${state.mapColorLow.toUpperCase()} → ${state.mapColorHigh.toUpperCase()}`
        : `5 классов Дженкса · ${paletteName}`;
      const range = ramp.nextElementSibling;
      range?.insertAdjacentElement("afterend", caption);
      const breaks = document.createElement("div");
      breaks.className = "site-map-class-breaks";
      breaks.innerHTML = colors.map((color, index) => {
        const rawLower = boundaries[index];
        const lower = state.mapMetric === "n" && index > 0 ? Math.floor(rawLower) + 1 : rawLower;
        const upper = boundaries[index + 1];
        const input = index < 4
          ? `<input class="site-map-break-input" type="number" min="0" max="${scaleMaximum}" step="any" value="${mapBreakInputValue(innerBreaks[index])}" data-map-break="${index}" aria-label="Верхняя граница класса ${index + 1}">`
          : '<span class="site-map-break-auto">авто</span>';
        return `<div class="site-map-class-row"><i style="background:${color}"></i><span class="site-map-class-label"><span>${formatTerritoryMetric(state.mapMetric, lower)}–${formatTerritoryMetric(state.mapMetric, upper)}</span><small>(${counts[index]} шт.)</small></span>${input}</div>`;
      }).join("");
      const classificationSource = state.mapUnit === "settlement" ? "по НП" : "по муниципалитетам";
      breaks.insertAdjacentHTML("beforeend", `<div class="site-map-break-actions"><span>${manual ? "границы настроены вручную" : `автоматические интервалы Дженкса · ${classificationSource}`}</span><button type="button" id="mapBreaksReset"${manual ? "" : " disabled"}>Сбросить в авто</button></div>`);
      caption.insertAdjacentElement("afterend", breaks);
      const inputs = [...breaks.querySelectorAll(".site-map-break-input")];
      const applyBreaks = () => {
        const values = inputs.map((input) => Number(input.value));
        const valid = values.every((value, index) => Number.isFinite(value)
          && value > (index === 0 ? 0 : values[index - 1])
          && value < scaleMaximum);
        inputs.forEach((input) => {
          input.classList.toggle("invalid", !valid);
          input.setCustomValidity(valid ? "" : "Границы должны возрастать и находиться между 0 и максимумом шкалы");
        });
        if (!valid) {
          inputs.find((input) => !input.checkValidity())?.reportValidity();
          return;
        }
        state.mapBreaks = values.join(",");
        render();
      };
      inputs.forEach((input) => {
        input.addEventListener("change", applyBreaks);
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") applyBreaks();
        });
      });
      breaks.querySelector("#mapBreaksReset")?.addEventListener("click", () => {
        state.mapBreaks = "";
        render();
      });
    };

    const dotMetricValue = (value, definition) => rateBase(state.dotMetric)
      ? rateValue(value.selected, definition, state.dotMetric)
      : state.dotMetric === "share"
      ? (state.dotClass === "all" ? value.total / Math.max(filtered().length, 1) * 100 : value.selected / value.total * 100)
      : state.dotMetric === "median" ? quantile(value.ages, .5)
        : state.dotMetric === "pgpzh" ? value.pgpzh : value.selected;

    const formatDotValue = (value) => state.dotMetric === "share"
      ? pct(value) : state.dotMetric === "median" || rateBase(state.dotMetric) ? DF.format(value) : fmt(value);

    const dotColor = (value) => {
      if (state.dotClass !== "all") return DATA.classes[+state.dotClass]?.color || "#356ae6";
      const leading = value.classes.indexOf(Math.max(...value.classes));
      return DATA.classes[leading]?.color || "#667085";
    };

    const drawDotAxis = (chart, scale, domainMin, domainMax, width, height, left, top, bottom) => {
      const rootScaled = state.dotMetric === "n" || state.dotMetric === "pgpzh" || Boolean(rateBase(state.dotMetric));
      for (let index = 0; index <= 5; index += 1) {
        const fraction = index / 5;
        const value = domainMin + (domainMax - domainMin) * (rootScaled ? fraction ** 2 : fraction);
        const x = scale(value);
        chart.appendChild(svg("line", { x1: x, y1: top, x2: x, y2: height - bottom, class: "gridline" }));
        textNode(chart, x, height - 23, formatDotValue(value), "axis-label", "middle");
      }
      const median = quantile(window.__dotValuesForAxis || [], .5);
      if (median != null) {
        const x = scale(median);
        chart.appendChild(svg("line", { x1: x, y1: top, x2: x, y2: height - bottom, class: "dot-median-line" }));
        textNode(chart, x + 5, top + 12, `медиана ${formatDotValue(median)}`, "dot-median-label", "start");
      }
    };

    const drawNonOverlappingLabels = (chart, candidates, width, height, top, bottom) => {
      const boxes = [];
      candidates.forEach((candidate) => {
        const short = candidate.label.length > 22 ? `${candidate.label.slice(0, 21)}…` : candidate.label;
        const label = `${short} · ${formatDotValue(candidate.value)}`;
        const boxWidth = Math.min(168, Math.max(76, label.length * 5.5 + 14));
        const boxHeight = 17;
        const attempts = [
          [10, -19], [10, 5], [-boxWidth - 10, -19], [-boxWidth - 10, 5],
          [14, -38], [14, 24], [-boxWidth - 14, -38], [-boxWidth - 14, 24]
        ];
        let chosen = null;
        for (const [dx, dy] of attempts) {
          const box = { x: candidate.x + dx, y: candidate.y + dy, w: boxWidth, h: boxHeight };
          const inside = box.x >= 3 && box.x + box.w <= width - 3 && box.y >= top && box.y + box.h <= height - bottom;
          const overlaps = boxes.some((other) => !(box.x + box.w + 3 < other.x || other.x + other.w + 3 < box.x || box.y + box.h + 3 < other.y || other.y + other.h + 3 < box.y));
          if (inside && !overlaps) { chosen = box; break; }
        }
        if (!chosen) return;
        boxes.push(chosen);
        const edgeX = chosen.x > candidate.x ? chosen.x : chosen.x + chosen.w;
        const edgeY = chosen.y + chosen.h / 2;
        chart.appendChild(svg("line", { x1: candidate.x, y1: candidate.y, x2: edgeX, y2: edgeY, class: "dot-label-leader" }));
        chart.appendChild(svg("rect", { x: chosen.x, y: chosen.y, width: chosen.w, height: chosen.h, rx: 5, class: "dot-label-bg" }));
        textNode(chart, chosen.x + 6, chosen.y + 12, label, "dot-label", "start");
      });
    };

    const enhanceDotogram = () => {
      if (state.view !== "dotogram") return;
      const { defs, map } = geoValues(state.dotUnit, state.dotClass);
      const values = [...map.values()].map((value) => ({ ...value, value: dotMetricValue(value, defs[value.idx]) })).filter((value) => value.value != null && Number.isFinite(value.value));
      if (!values.length) {
        document.getElementById("viz").innerHTML = '<div class="empty">Нет данных для выбранных фильтров.</div>';
        return;
      }
      const rawValues = values.map((value) => value.value);
      const observedMin = Math.min(...rawValues);
      const observedMax = Math.max(...rawValues);
      const domainMin = state.dotMetric === "median" ? Math.max(0, observedMin - 5) : 0;
      const domainMax = observedMax > domainMin ? observedMax * 1.08 : domainMin + 1;
      window.__dotValuesForAxis = rawValues;
      const scaleFraction = (value) => {
        const fraction = Math.max(0, Math.min(1, (value - domainMin) / (domainMax - domainMin || 1)));
        return state.dotMetric === "n" || state.dotMetric === "pgpzh" || Boolean(rateBase(state.dotMetric)) ? Math.sqrt(fraction) : fraction;
      };

      if (state.dotUnit === "mo") {
        values.sort((left, right) => right.value - left.value);
        const width = 1080, rowHeight = 27, top = 35, bottom = 50, left = 250, right = 80;
        const height = Math.max(560, values.length * rowHeight + top + bottom);
        const scale = (value) => left + scaleFraction(value) * (width - left - right);
        const chart = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "svg-chart dotogram-ranked" });
        drawDotAxis(chart, scale, domainMin, domainMax, width, height, left, top, bottom);
        values.forEach((value, index) => {
          const definition = defs[value.idx];
          const y = top + index * rowHeight + 15;
          chart.appendChild(svg("line", { x1: left, y1: y, x2: width - right, y2: y, class: "dot-row-guide" }));
          textNode(chart, left - 12, y + 4, definition.name, "row-label", "end");
          chart.appendChild(svg("line", { x1: scale(domainMin), y1: y, x2: scale(value.value), y2: y, stroke: dotColor(value), "stroke-width": 3, opacity: .42 }));
          const point = svg("circle", { cx: scale(value.value), cy: y, r: 7, fill: dotColor(value), stroke: "#fff", "stroke-width": 1.5 });
          chart.appendChild(point);
          const anchor = scale(value.value) > width - right - 65 ? "end" : "start";
          textNode(chart, scale(value.value) + (anchor === "end" ? -10 : 10), y + 4, formatDotValue(value.value), "dot-value-label", anchor);
          addTip(point, `<b>${esc(definition.name)}</b><div class="tip-grid"><span>${territoryMetricLabel(state.dotMetric)}</span><strong>${formatDotValue(value.value)}</strong>${rateBase(state.dotMetric) ? `<span>Расчёт</span><strong>${rateFormula(value.selected, definition, state.dotMetric)}</strong>` : ""}<span>Население ${DATA.populationYear}</span><strong>${populationValue(definition) ? fmt(populationValue(definition)) : "н/д"}</strong><span>Всего смертей</span><strong>${fmt(value.total)}</strong><span>Выбранная причина</span><strong>${fmt(value.selected)}</strong><span>Структура</span><strong>${esc(topClasses(value))}</strong></div>`);
        });
        document.getElementById("viz").innerHTML = "";
        document.getElementById("viz").appendChild(chart);
        document.getElementById("viz").insertAdjacentHTML("beforeend", '<div class="chart-note">Муниципалитеты отсортированы по значению. Линия и точка показывают одновременно ранг и величину показателя; вертикальный пунктир — медиану.</div>');
      } else {
        const groupTotals = new Map();
        values.forEach((value) => {
          const municipality = defs[value.idx].municipalityIndex;
          groupTotals.set(municipality, (groupTotals.get(municipality) || 0) + value.total);
        });
        const groups = [...groupTotals].sort((left, right) => right[1] - left[1]).map(([index]) => index);
        const groupPosition = new Map(groups.map((index, position) => [index, position]));
        const width = 1120, rowHeight = 28, top = 45, bottom = 58, left = 190, right = 165;
        const height = Math.max(670, groups.length * rowHeight + top + bottom);
        const scale = (value) => left + scaleFraction(value) * (width - left - right);
        const chart = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "svg-chart dotogram-groups" });
        drawDotAxis(chart, scale, domainMin, domainMax, width, height, left, top, bottom);
        groups.forEach((municipality, index) => {
          const y = top + index * rowHeight + 15;
          chart.appendChild(svg("line", { x1: left, y1: y, x2: width - right, y2: y, class: "dot-row-guide" }));
          textNode(chart, left - 12, y + 4, DATA.municipalities[municipality]?.name || "Не указан", "row-label", "end");
        });
        const points = [];
        values.forEach((value) => {
          const definition = defs[value.idx];
          const row = groupPosition.get(definition.municipalityIndex);
          const y = top + row * rowHeight + 15 + (hashJitter(value.idx) - .5) * 10;
          const x = scale(value.value);
          const point = svg("circle", { cx: x, cy: y, r: 5.5, fill: dotColor(value), opacity: .82, stroke: "#fff", "stroke-width": 1.2 });
          chart.appendChild(point);
          points.push({ x, y, label: definition.name, value: value.value, source: value });
          addTip(point, `<b>${esc(definition.name)}</b><div class="tip-grid"><span>Муниципалитет</span><strong>${esc(definition.municipality)}</strong><span>${territoryMetricLabel(state.dotMetric)}</span><strong>${formatDotValue(value.value)}</strong>${rateBase(state.dotMetric) ? `<span>Расчёт</span><strong>${rateFormula(value.selected, definition, state.dotMetric)}</strong>` : ""}<span>Население ${DATA.populationYear}</span><strong>${populationValue(definition) ? fmt(populationValue(definition)) : "н/д"}</strong><span>Всего смертей</span><strong>${fmt(value.total)}</strong><span>Выбранная причина</span><strong>${fmt(value.selected)}</strong><span>Структура</span><strong>${esc(topClasses(value))}</strong></div>`);
        });
        let labelled = [];
        if (state.dotLabels === "top") labelled = [...points].sort((left, right) => right.value - left.value).slice(0, 10);
        if (state.dotLabels === "outliers") {
          const q1 = quantile(rawValues, .25), q3 = quantile(rawValues, .75), threshold = q3 + 1.5 * (q3 - q1);
          labelled = points.filter((point) => point.value > threshold).sort((left, right) => right.value - left.value).slice(0, 12);
          if (labelled.length < 5) {
            const existing = new Set(labelled.map((point) => point.source.idx));
            labelled.push(...[...points].sort((left, right) => right.value - left.value).filter((point) => !existing.has(point.source.idx)).slice(0, 5 - labelled.length));
          }
        }
        drawNonOverlappingLabels(chart, labelled, width, height, top, bottom);
        document.getElementById("viz").innerHTML = "";
        document.getElementById("viz").appendChild(chart);
        document.getElementById("viz").insertAdjacentHTML("beforeend", `<div class="chart-note">Каждая строка — муниципальная территория, каждая точка — НП. ${state.dotLabels === "outliers" ? "Подписаны выбросы по правилу Q3 + 1,5×IQR и несколько крупнейших значений." : state.dotLabels === "top" ? "Подписаны десять крупнейших значений." : "Подписи точек отключены."} Вертикальный пунктир — медиана.</div>`);
      }
      delete window.__dotValuesForAxis;
      document.getElementById("methodText").textContent = `Dotogram показывает территориальный контекст: НП сгруппированы по муниципалитетам, а муниципалитеты отображаются ранжированным точечным графиком. Подписи выделяют только статистически необычные или крупнейшие значения.${rateBase(state.dotMetric) ? ` Показатель рассчитан как смерти в текущем фильтре / (население ${DATA.populationYear} × ${rateYearsLabel()}) × ${fmt(rateBase(state.dotMetric))}; результат приведён к среднему за один год.${state.sex !== "all" || state.age !== "all" ? " Знаменатель — общая численность населения, а не выбранная половозрастная группа." : ""}` : state.dotMetric === "n" || state.dotMetric === "pgpzh" ? " Для абсолютных значений применяется корневая шкала, чтобы крупнейший центр не сжимал остальные территории у нуля." : ""}`;
    };

    const MAP_WIDTH = 760;
    const MAP_HEIGHT = 790;
    let mapRuntime = null;
    let labelTimer = 0;
    let viewportFrame = 0;
    let selectedMapObject = null;
    const centerByMunicipality = new Map();
    DATA.settlements.forEach((definition, index) => {
      const municipality = definition.municipalityIndex;
      const population = populationValue(definition) || 0;
      const current = centerByMunicipality.get(municipality);
      if (!current || population > current.population) {
        centerByMunicipality.set(municipality, { index, population });
      }
    });
    const centerSettlementIndexes = new Set([...centerByMunicipality.values()].map((item) => item.index));
    const regionalCapitalIndex = DATA.settlements.reduce((best, definition, index) =>
      (populationValue(definition) || 0) > (populationValue(DATA.settlements[best]) || 0) ? index : best, 0);

    const settlementVisual = (definition) => {
      const population = populationValue(definition);
      if (!population) return { diameter: 7, ring: 0, missing: true, label: "нет данных" };
      if (population <= 1000) return { diameter: 6, ring: 0, label: "до 1 тыс." };
      if (population <= 2500) return { diameter: 8, ring: 0, label: "1–2,5 тыс." };
      if (population <= 5000) return { diameter: 12, ring: 0, label: "2,5–5 тыс." };
      if (population <= 10000) return { diameter: 17, ring: 0, label: "5–10 тыс." };
      if (population <= 20000) return { diameter: 21, ring: 0, label: "10–20 тыс." };
      if (population <= 40000) return { diameter: 26, ring: 0, label: "20–40 тыс." };
      if (population <= 200000) return { diameter: 42, ring: 8, label: "40–200 тыс." };
      return { diameter: 62, ring: 11, label: "свыше 200 тыс." };
    };

    const populationLegendHtml = () => {
      const ranges = [
        { label: "до 1 тыс.", test: (value) => value > 0 && value <= 1000, visual: { diameter: 6, ring: 0 } },
        { label: "1–2,5 тыс.", test: (value) => value > 1000 && value <= 2500, visual: { diameter: 8, ring: 0 } },
        { label: "2,5–5 тыс.", test: (value) => value > 2500 && value <= 5000, visual: { diameter: 12, ring: 0 } },
        { label: "5–10 тыс.", test: (value) => value > 5000 && value <= 10000, visual: { diameter: 17, ring: 0 } },
        { label: "10–20 тыс.", test: (value) => value > 10000 && value <= 20000, visual: { diameter: 21, ring: 0 } },
        { label: "20–40 тыс.", test: (value) => value > 20000 && value <= 40000, visual: { diameter: 26, ring: 0 } },
        { label: "40–200 тыс.", test: (value) => value > 40000 && value <= 200000, visual: { diameter: 42, ring: 8 } },
        { label: "> 200 тыс.", test: (value) => value > 200000, visual: { diameter: 62, ring: 11 } }
      ];
      const rows = ranges.map((range) => {
        const count = DATA.settlements.filter((definition) => range.test(populationValue(definition) || 0)).length;
        const kind = range.visual.ring ? " donut" : "";
        const displaySize = range.visual.diameter === 42 ? 24 : range.visual.diameter === 62 ? 30 : range.visual.diameter;
        return `<span class="site-population-size-item"><i class="site-population-symbol${kind}" style="--symbol-size:${displaySize}px;--ring-size:${Math.max(3, Math.min(range.visual.ring, 7))}px"></i><span>${range.label}</span><small>${count} шт.</small></span>`;
      }).join("");
      const missing = DATA.settlements.filter((definition) => !populationValue(definition)).length;
      return `<div class="site-population-size-legend"><b>Размер · население ${DATA.populationYear}</b><div>${rows}</div><p>Пунктир — численность не указана (${missing} шт.). Размер не меняется при выборе показателя.</p></div>`;
    };

    const settlementLabelLegendHtml = () => `
      <div class="site-settlement-label-legend">
        <b>Подписи · тип НП и масштаб</b>
        <div>
          <span class="city">Город</span>
          <span class="settlement">Остальные НП</span>
        </div>
        <p>Города — полужирный шрифт 15 px. Остальные НП — обычный шрифт 10–11 px в зависимости от масштаба.</p>
      </div>`;

    const municipalityLabelLegendHtml = () => `
      <div class="site-settlement-label-legend">
        <b>Подписи · ключевые города</b>
        <div><span class="city">● Городской центр</span></div>
        <p>Опорные точки и названия городов сохраняются поверх муниципальных полигонов; размер подписей — 15 px.</p>
      </div>`;

    const syncMapPanelHeight = () => {
      if (!mapRuntime?.root?.isConnected) return;
      const height = Math.round(mapRuntime.svg.getBoundingClientRect().height);
      if (!height) return;
      mapRuntime.side.style.height = `${height}px`;
      mapRuntime.side.style.maxHeight = `${height}px`;
    };

    const createMapRuntime = () => {
      mapRuntime?.panelResizeObserver?.disconnect();
      const root = document.createElement("div");
      root.className = "map-layout site-optimized-map";
      const stage = document.createElement("div");
      stage.className = "site-map-canvas site-map-stage";
      const mapSvg = svg("svg", {
        viewBox: mapViewport.join(" "),
        class: "svg-chart site-map-svg",
        "aria-label": "Интерактивная карта населённых пунктов и муниципальных территорий",
        preserveAspectRatio: "xMidYMid meet"
      });
      const polygonLayer = svg("g", { class: "site-map-polygon-layer" });
      const markerLayer = svg("g", { class: "site-map-marker-layer" });
      const labelLayer = svg("g", { class: "site-map-label-layer", "aria-hidden": "true" });
      const polygonEntries = DATA.municipalities.map((definition, index) => {
        const path = svg("path", {
          d: geoPath(definition.geometry, MAP_WIDTH, MAP_HEIGHT),
          fill: "#e8eff5",
          stroke: "#fff",
          "stroke-width": 1.2,
          "stroke-linejoin": "round",
          "stroke-linecap": "round",
          "vector-effect": "non-scaling-stroke",
          "data-map-kind": "mo",
          "data-index": index
        });
        polygonLayer.appendChild(path);
        return { path, definition, index };
      });
      const settlementOrder = DATA.settlements
        .map((definition, index) => ({ definition, index, population: populationValue(definition) || 0 }))
        .sort((left, right) => right.population - left.population);
      const markerEntries = new Array(DATA.settlements.length);
      settlementOrder.forEach(({ definition, index }) => {
        const [x, y] = project(definition.x3857, definition.y3857, MAP_WIDTH, MAP_HEIGHT);
        const visual = settlementVisual(definition);
        const group = svg("g", {
          class: "site-map-marker",
          "data-map-kind": "settlement",
          "data-index": index,
          role: "button",
          tabindex: "0"
        });
        const halo = svg("circle", { cx: x, cy: y, fill: "none", stroke: "#f4b400", display: "none", "pointer-events": "none" });
        group.appendChild(halo);
        let main, outer, inner;
        if (visual.ring) {
          main = svg("circle", { cx: x, cy: y, fill: "none", stroke: "#61758a", "pointer-events": "none" });
          outer = svg("circle", { cx: x, cy: y, fill: "none", stroke: "#25344a", "pointer-events": "none" });
          inner = svg("circle", { cx: x, cy: y, fill: "none", stroke: "#25344a", "pointer-events": "none" });
          group.append(main, outer, inner);
        } else {
          main = svg("circle", { cx: x, cy: y, fill: "#61758a", stroke: "#25344a", "pointer-events": "none" });
          if (visual.missing) main.setAttribute("stroke-dasharray", "2 1.5");
          group.appendChild(main);
        }
        const hit = svg("circle", { cx: x, cy: y, fill: "transparent", stroke: "none", class: "site-map-hit" });
        group.appendChild(hit);
        markerLayer.appendChild(group);
        markerEntries[index] = { group, main, outer, inner, halo, hit, visual, definition, x, y, index };
      });
      mapSvg.append(polygonLayer, markerLayer, labelLayer);
      stage.appendChild(mapSvg);
      const controls = document.createElement("div");
      controls.className = "site-map-controls";
      controls.setAttribute("aria-label", "Управление масштабом карты");
      controls.innerHTML = '<button type="button" data-map-zoom="in" aria-label="Приблизить карту">+</button><button type="button" data-map-zoom="out" aria-label="Отдалить карту">−</button><button type="button" data-map-zoom="reset">Сброс</button><output data-map-zoom-level>1×</output>';
      stage.appendChild(controls);
      const side = document.createElement("aside");
      side.className = "map-side";
      side.innerHTML = '<div class="map-legend"></div><h3>Наибольшие значения</h3><div class="rank-list"></div>';
      root.append(stage, side);
      els.viz.innerHTML = "";
      els.viz.appendChild(root);
      mapRuntime = {
        root, stage, svg: mapSvg, controls, side,
        legend: side.querySelector(".map-legend"),
        rank: side.querySelector(".rank-list"),
        polygonLayer, markerLayer, labelLayer, polygonEntries, markerEntries,
        defs: [], values: new Map(), unit: null, context: null, lastUpdateMs: 0,
        drag: null, dragMoved: false, panelResizeObserver: null
      };
      if (typeof ResizeObserver !== "undefined") {
        mapRuntime.panelResizeObserver = new ResizeObserver(() => syncMapPanelHeight());
        mapRuntime.panelResizeObserver.observe(mapSvg);
      }
      requestAnimationFrame(syncMapPanelHeight);

      controls.querySelector('[data-map-zoom="in"]').onclick = () => zoomMap(0.8);
      controls.querySelector('[data-map-zoom="out"]').onclick = () => zoomMap(1.25);
      controls.querySelector('[data-map-zoom="reset"]').onclick = () => {
        mapViewport = [0, 0, MAP_WIDTH, MAP_HEIGHT];
        applyMapViewport();
        setStatus("Охват карты сброшен.");
      };
      mapSvg.addEventListener("wheel", (event) => {
        if (event.target.closest("select")) return;
        event.preventDefault();
        const bounds = mapSvg.getBoundingClientRect();
        const centerX = mapViewport[0] + (event.clientX - bounds.left) / bounds.width * mapViewport[2];
        const centerY = mapViewport[1] + (event.clientY - bounds.top) / bounds.height * mapViewport[3];
        zoomMap(event.deltaY > 0 ? 1.16 : 0.86, centerX, centerY);
      }, { passive: false });
      mapSvg.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        mapRuntime.dragMoved = false;
        mapRuntime.drag = { x: event.clientX, y: event.clientY, view: [...mapViewport], moved: false };
        mapSvg.setPointerCapture(event.pointerId);
        mapSvg.classList.add("is-panning");
        mapRuntime.labelLayer.classList.add("is-moving");
      });
      mapSvg.addEventListener("pointermove", (event) => {
        if (!mapRuntime.drag) {
          const target = event.target.closest("[data-map-kind]");
          if (target) showMapTooltip(event, target);
          else hideTip();
          return;
        }
        const bounds = mapSvg.getBoundingClientRect();
        const dx = (event.clientX - mapRuntime.drag.x) / bounds.width * mapRuntime.drag.view[2];
        const dy = (event.clientY - mapRuntime.drag.y) / bounds.height * mapRuntime.drag.view[3];
        if (Math.abs(dx) + Math.abs(dy) > 1) mapRuntime.drag.moved = true;
        mapViewport = [mapRuntime.drag.view[0] - dx, mapRuntime.drag.view[1] - dy, mapRuntime.drag.view[2], mapRuntime.drag.view[3]];
        applyMapViewport();
      });
      const finishDrag = () => {
        mapRuntime.dragMoved = Boolean(mapRuntime.drag?.moved);
        mapRuntime.drag = null;
        mapSvg.classList.remove("is-panning");
        scheduleMapLabels(40);
      };
      mapSvg.addEventListener("pointerup", finishDrag);
      mapSvg.addEventListener("pointercancel", finishDrag);
      mapSvg.addEventListener("pointerleave", (event) => {
        if (!mapRuntime.drag) hideTip();
      });
      mapSvg.addEventListener("click", (event) => {
        if (mapRuntime.dragMoved) {
          mapRuntime.dragMoved = false;
          return;
        }
        const target = event.target.closest("[data-map-kind]");
        if (!target) {
          selectedMapObject = null;
          syncMapSelection();
          return;
        }
        selectMapObject(target.dataset.mapKind, +target.dataset.index);
      });
      mapSvg.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const target = event.target.closest("[data-map-kind]");
        if (!target) return;
        event.preventDefault();
        selectMapObject(target.dataset.mapKind, +target.dataset.index);
      });
      return mapRuntime;
    };

    const clampMapViewport = () => {
      const [x, y, width, height] = mapViewport;
      const marginX = width * .08, marginY = height * .08;
      const minX = -marginX, maxX = MAP_WIDTH - width + marginX;
      const minY = -marginY, maxY = MAP_HEIGHT - height + marginY;
      mapViewport = [
        Math.max(minX, Math.min(maxX, x)),
        Math.max(minY, Math.min(maxY, y)),
        width,
        height
      ];
    };

    const mapUserUnitsPerPixel = () => {
      const width = mapRuntime?.svg.getBoundingClientRect().width || MAP_WIDTH;
      return mapViewport[2] / Math.max(width, 1);
    };

    const syncMapSymbolSizes = () => {
      if (!mapRuntime) return;
      const unit = mapUserUnitsPerPixel();
      mapRuntime.markerEntries.forEach((entry) => {
        const outerRadius = entry.visual.diameter / 2;
        const haloRadius = outerRadius + 3;
        entry.halo.setAttribute("r", haloRadius * unit);
        entry.halo.setAttribute("stroke-width", 2.2 * unit);
        entry.hit.setAttribute("r", Math.max(8, outerRadius + 2) * unit);
        if (entry.visual.ring) {
          const innerRadius = outerRadius - entry.visual.ring;
          entry.main.setAttribute("r", (outerRadius - entry.visual.ring / 2) * unit);
          entry.main.setAttribute("stroke-width", entry.visual.ring * unit);
          entry.outer.setAttribute("r", outerRadius * unit);
          entry.outer.setAttribute("stroke-width", 1.25 * unit);
          entry.inner.setAttribute("r", innerRadius * unit);
          entry.inner.setAttribute("stroke-width", 1.25 * unit);
        } else {
          entry.main.setAttribute("r", outerRadius * unit);
          entry.main.setAttribute("stroke-width", 1.25 * unit);
          if (entry.visual.missing) entry.main.setAttribute("stroke-dasharray", `${2 * unit} ${1.5 * unit}`);
        }
      });
      const zoom = MAP_WIDTH / mapViewport[2];
      const output = mapRuntime.controls.querySelector("[data-map-zoom-level]");
      if (output) output.textContent = `${DF.format(zoom)}×`;
    };

    const scheduleMapLabels = (delay = 110) => {
      window.clearTimeout(labelTimer);
      labelTimer = window.setTimeout(renderMapLabels, delay);
    };

    const applyMapViewport = () => {
      if (!mapRuntime) return;
      clampMapViewport();
      mapRuntime.labelLayer.classList.add("is-moving");
      if (viewportFrame) return;
      viewportFrame = requestAnimationFrame(() => {
        viewportFrame = 0;
        if (!mapRuntime) return;
        mapRuntime.svg.setAttribute("viewBox", mapViewport.join(" "));
        syncMapSymbolSizes();
        scheduleMapLabels();
      });
    };

    const zoomMap = (factor, centerX = mapViewport[0] + mapViewport[2] / 2, centerY = mapViewport[1] + mapViewport[3] / 2) => {
      const nextWidth = Math.max(MAP_WIDTH / 10, Math.min(MAP_WIDTH, mapViewport[2] * factor));
      const nextHeight = nextWidth * MAP_HEIGHT / MAP_WIDTH;
      const ratioX = (centerX - mapViewport[0]) / mapViewport[2];
      const ratioY = (centerY - mapViewport[1]) / mapViewport[3];
      mapViewport = [centerX - nextWidth * ratioX, centerY - nextHeight * ratioY, nextWidth, nextHeight];
      applyMapViewport();
    };

    const labelPopulationThreshold = (zoom) => {
      if (zoom < 1.5) return 40000;
      if (zoom < 2.2) return 20000;
      if (zoom < 3.2) return 10000;
      if (zoom < 4.8) return 5000;
      if (zoom < 6.5) return 1000;
      return 0;
    };

    const labelFontSize = (definition, zoom) => {
      const zoomProgress = Math.log2(Math.max(1, Math.min(10, zoom))) / Math.log2(10);
      if (definition.isCity) return 15;
      return 10 + zoomProgress;
    };

    const renderMapLabels = () => {
      if (!mapRuntime) return;
      const layer = mapRuntime.labelLayer;
      layer.innerHTML = "";
      layer.classList.remove("is-moving");
      const settlementMode = state.mapUnit === "settlement";
      if (!settlementMode && state.mapUnit !== "mo") return;
      if (state.mapLabels === "off") return;
      const bounds = mapRuntime.svg.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const zoom = MAP_WIDTH / mapViewport[2];
      const threshold = labelPopulationThreshold(zoom);
      const selectedIndex = settlementMode && selectedMapObject?.kind === "settlement" ? selectedMapObject.index : -1;
      const candidates = mapRuntime.markerEntries
        .filter((entry) => settlementMode ? entry.group.style.display !== "none" : Boolean(entry.definition.isCity))
        .filter((entry) => {
          if (!settlementMode) return true;
          if (entry.index === selectedIndex) return true;
          const center = centerSettlementIndexes.has(entry.index);
          if (state.mapLabels === "centers") return center;
          return entry.definition.isCity || center || (populationValue(entry.definition) || 0) >= threshold;
        })
        .sort((left, right) => {
          const selectedDelta = Number(right.index === selectedIndex) - Number(left.index === selectedIndex);
          if (selectedDelta) return selectedDelta;
          const capitalDelta = Number(right.index === regionalCapitalIndex) - Number(left.index === regionalCapitalIndex);
          if (capitalDelta) return capitalDelta;
          const cityDelta = Number(Boolean(right.definition.isCity)) - Number(Boolean(left.definition.isCity));
          if (cityDelta) return cityDelta;
          const centerDelta = Number(centerSettlementIndexes.has(right.index)) - Number(centerSettlementIndexes.has(left.index));
          if (centerDelta) return centerDelta;
          return (populationValue(right.definition) || 0) - (populationValue(left.definition) || 0);
        });
      const placed = [];
      const unit = mapUserUnitsPerPixel();
      const toScreen = (x, y) => [
        (x - mapViewport[0]) / mapViewport[2] * bounds.width,
        (y - mapViewport[1]) / mapViewport[3] * bounds.height
      ];
      const toWorld = (x, y) => [
        mapViewport[0] + x / bounds.width * mapViewport[2],
        mapViewport[1] + y / bounds.height * mapViewport[3]
      ];
      const markerObstacles = (settlementMode
        ? mapRuntime.markerEntries.filter((entry) => entry.group.style.display !== "none")
        : candidates)
        .map((entry) => {
          const [x, y] = toScreen(entry.x, entry.y);
          const radius = settlementMode ? Math.max(3, entry.visual.diameter / 2) : 3.2;
          return { index: entry.index, x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 };
        });
      candidates.forEach((entry) => {
        const [screenX, screenY] = toScreen(entry.x, entry.y);
        if (screenX < -40 || screenX > bounds.width + 40 || screenY < -40 || screenY > bounds.height + 40) return;
        const isCity = Boolean(entry.definition.isCity);
        const font = labelFontSize(entry.definition, zoom);
        const label = entry.definition.name.length > 28 ? `${entry.definition.name.slice(0, 27)}…` : entry.definition.name;
        const widthFactor = isCity ? .6 : .54;
        const width = Math.max(isCity ? 48 : 38, label.length * font * widthFactor + 7);
        const height = font + 5;
        const radius = settlementMode ? entry.visual.diameter / 2 : 3.2;
        const gap = radius + 6;
        const attempts = [
          [gap, -height / 2], [-gap - width, -height / 2],
          [-width / 2, -gap - height], [-width / 2, gap],
          [gap * .72, -gap * .72 - height], [-gap * .72 - width, -gap * .72 - height],
          [gap * .72, gap * .72], [-gap * .72 - width, gap * .72]
        ];
        if (!settlementMode) {
          const far = gap + font + 8;
          const farther = far + font * 1.8 + 8;
          attempts.push(
            [far, -height / 2], [-far - width, -height / 2],
            [-width / 2, -far - height], [-width / 2, far],
            [far * .72, -far * .72 - height], [-far * .72 - width, -far * .72 - height],
            [far * .72, far * .72], [-far * .72 - width, far * .72],
            [farther, -height / 2], [-farther - width, -height / 2],
            [-width / 2, -farther - height], [-width / 2, farther],
            [farther * .72, -farther * .72 - height], [-farther * .72 - width, -farther * .72 - height],
            [farther * .72, farther * .72], [-farther * .72 - width, farther * .72]
          );
        }
        let box = null;
        for (const [dx, dy] of attempts) {
          const candidate = { x: screenX + dx, y: screenY + dy, w: width, h: height };
          const inside = candidate.x >= 3 && candidate.x + candidate.w <= bounds.width - 3
            && candidate.y >= 3 && candidate.y + candidate.h <= bounds.height - 3;
          const overlaps = placed.some((other) => !(candidate.x + candidate.w + 4 < other.x
            || other.x + other.w + 4 < candidate.x
            || candidate.y + candidate.h + 3 < other.y
            || other.y + other.h + 3 < candidate.y));
          const coversMarker = markerObstacles.some((other) => other.index !== entry.index
            && !(candidate.x + candidate.w + 2 < other.x
              || other.x + other.w + 2 < candidate.x
              || candidate.y + candidate.h + 2 < other.y
              || other.y + other.h + 2 < candidate.y));
          if (inside && !overlaps && !coversMarker) {
            box = candidate;
            break;
          }
        }
        if (!box && entry.index === selectedIndex) {
          box = {
            x: Math.max(3, Math.min(bounds.width - width - 3, screenX + gap)),
            y: Math.max(3, Math.min(bounds.height - height - 3, screenY - height / 2)),
            w: width,
            h: height
          };
        }
        if (!box) return;
        placed.push(box);
        if (!settlementMode) {
          const anchorX = Math.max(box.x, Math.min(screenX, box.x + box.w));
          const anchorY = Math.max(box.y, Math.min(screenY, box.y + box.h));
          if (Math.hypot(anchorX - screenX, anchorY - screenY) > gap + 4) {
            const [leaderX, leaderY] = toWorld(anchorX, anchorY);
            layer.appendChild(svg("line", {
              x1: entry.x,
              y1: entry.y,
              x2: leaderX,
              y2: leaderY,
              class: "map-center-leader",
              "vector-effect": "non-scaling-stroke"
            }));
          }
          const marker = svg("circle", {
            cx: entry.x,
            cy: entry.y,
            r: 3.2 * unit,
            class: "map-center-marker",
            "stroke-width": 1.25 * unit,
            "data-city-center": entry.index
          });
          layer.appendChild(marker);
        }
        const [worldX, worldY] = toWorld(box.x + 3, box.y + font);
        const text = textNode(layer, worldX, worldY, label, `map-center-label ${isCity ? "city" : "settlement"}${entry.index === selectedIndex ? " selected" : ""}`, "start");
        text.setAttribute("font-size", font * unit);
        text.setAttribute("stroke-width", 3.5 * unit);
        text.setAttribute("paint-order", "stroke");
        text.setAttribute("data-label-kind", isCity ? "city" : "settlement");
        text.setAttribute("data-font-px", font.toFixed(2));
      });
    };

    const syncMapSelection = () => {
      if (!mapRuntime) return;
      mapRuntime.polygonEntries.forEach((entry) => {
        const selected = selectedMapObject?.kind === "mo" && selectedMapObject.index === entry.index;
        entry.path.classList.toggle("site-atlas-highlight", selected);
      });
      mapRuntime.markerEntries.forEach((entry) => {
        const selected = selectedMapObject?.kind === "settlement" && selectedMapObject.index === entry.index;
        entry.group.classList.toggle("site-atlas-highlight", selected);
        entry.halo.setAttribute("display", selected ? "" : "none");
        if (selected) entry.group.parentNode.appendChild(entry.group);
      });
      scheduleMapLabels(0);
    };

    const selectMapObject = (kind, index) => {
      if ((kind === "mo" && state.mapUnit !== "mo") || (kind === "settlement" && state.mapUnit !== "settlement")) return;
      selectedMapObject = { kind, index };
      syncMapSelection();
      const definition = kind === "mo" ? DATA.municipalities[index] : DATA.settlements[index];
      setStatus(`Объект закреплён: ${definition?.name || "не указан"}`);
    };

    const mapTooltipHtml = (kind, index) => {
      if (!mapRuntime || kind !== (state.mapUnit === "mo" ? "mo" : "settlement")) return "";
      const definition = mapRuntime.defs[index];
      const value = mapRuntime.values.get(index);
      if (!definition || !value) return "";
      const metricValue = value.metricValue;
      return `<b>${esc(definition.name)}${kind === "settlement" ? ` · ID слоя ${definition.id}` : ""}</b><div class="tip-grid">
        ${kind === "settlement" ? `<span>Муниципалитет</span><strong>${esc(definition.municipality)}</strong>` : ""}
        <span>${territoryMetricLabel(state.mapMetric)}</span><strong>${formatTerritoryMetric(state.mapMetric, metricValue)}</strong>
        ${rateBase(state.mapMetric) ? `<span>Расчёт</span><strong>${rateFormula(value.selected, definition, state.mapMetric)}</strong>` : ""}
        <span>Население ${DATA.populationYear}</span><strong>${populationValue(definition) ? fmt(populationValue(definition)) : "н/д"}</strong>
        <span>Всего смертей</span><strong>${fmt(value.total)}</strong>
        <span>Выбрано</span><strong>${fmt(value.selected)}</strong>
        <span>Доля класса</span><strong>${pct(value.total ? value.selected / value.total * 100 : 0)}</strong>
        <span>Структура</span><strong>${esc(topClasses(value))}</strong>
      </div>`;
    };

    const showMapTooltip = (event, target) => {
      const html = mapTooltipHtml(target.dataset.mapKind, +target.dataset.index);
      if (html) showTip(event, html);
    };

    const updateOptimizedMap = (context) => {
      const started = performance.now();
      if (!mapRuntime || !mapRuntime.root.isConnected) createMapRuntime();
      const { defs, map } = geoValues(state.mapUnit, state.mapClass);
      const totalRows = filtered().length;
      const values = [...map.values()];
      values.forEach((value) => {
        value.metricValue = territoryMetric(state.mapMetric, value, defs[value.idx], state.mapClass, totalRows);
      });
      mapRuntime.defs = defs;
      mapRuntime.values = map;
      mapRuntime.unit = state.mapUnit;
      mapRuntime.context = context;
      const colors = paletteClassColors();
      const colorFor = (value) => Number.isFinite(value?.metricValue)
        ? colors[mapClassIndex(value.metricValue, context.boundaries)]
        : "#98a2b3";
      mapRuntime.polygonEntries.forEach((entry) => {
        const value = map.get(entry.index);
        const active = state.mapUnit === "mo" && Boolean(value);
        entry.path.style.pointerEvents = state.mapUnit === "mo" ? "" : "none";
        entry.path.setAttribute("fill", state.mapUnit === "mo" ? (active ? colorFor(value) : "#e5e7eb") : "#e8eff5");
        entry.path.setAttribute("tabindex", active ? "0" : "-1");
        if (active) {
          entry.path.setAttribute("role", "button");
          entry.path.setAttribute("aria-label", `${entry.definition.name}: ${formatTerritoryMetric(state.mapMetric, value.metricValue)}`);
        } else {
          entry.path.removeAttribute("role");
          entry.path.removeAttribute("aria-label");
        }
        entry.path.classList.toggle("site-map-suppressed", active && suppressSmallValues && value.selected < 5);
      });
      mapRuntime.markerEntries.forEach((entry) => {
        const value = map.get(entry.index);
        const active = state.mapUnit === "settlement" && Boolean(value);
        entry.group.style.display = active ? "" : "none";
        entry.group.setAttribute("tabindex", active ? "0" : "-1");
        if (!active) return;
        const color = colorFor(value);
        if (entry.visual.ring) entry.main.setAttribute("stroke", color);
        else entry.main.setAttribute("fill", color);
        entry.group.setAttribute("aria-label", `${entry.definition.name}: ${formatTerritoryMetric(state.mapMetric, value.metricValue)}, население ${populationValue(entry.definition) ? fmt(populationValue(entry.definition)) : "не указано"}`);
        entry.group.classList.toggle("site-map-suppressed", suppressSmallValues && value.selected < 5);
      });
      const ranked = values
        .filter((value) => Number.isFinite(value.metricValue))
        .sort((left, right) => right.metricValue - left.metricValue)
        .slice(0, 15);
      mapRuntime.rank.innerHTML = ranked.map((value, index) =>
        `<div class="rank-item${suppressSmallValues && value.selected < 5 ? " site-map-suppressed" : ""}"><span>${index + 1}. ${esc(defs[value.idx].name)}</span><b>${formatTerritoryMetric(state.mapMetric, value.metricValue)}</b></div>`
      ).join("");
      const unitLabel = state.mapMetric === "share" ? "%" : rateBase(state.mapMetric) ? "" : "смертей";
      const rateNote = rateBase(state.mapMetric)
        ? `<div class="site-map-legend-note">Среднегодовой расчёт: смерти / население ${DATA.populationYear} / ${rateYearsLabel()}. Серый цвет — нет положительного знаменателя.${state.sex !== "all" || state.age !== "all" ? "<br><strong>Знаменатель — общая численность населения.</strong>" : ""}</div>`
        : "";
      mapRuntime.legend.innerHTML = `<b>Проекция · EPSG:3857</b>
        <b>Цвет · ${territoryMetricLabel(state.mapMetric)}</b>
        <div class="legend-ramp"></div>
        <div class="legend-range"><span>0 ${unitLabel}</span><span>${formatTerritoryMetric(state.mapMetric, context.scaleMaximum)}</span></div>
        ${rateNote}
        ${state.mapUnit === "settlement" ? populationLegendHtml() : ""}
        ${state.mapUnit === "settlement" ? settlementLabelLegendHtml() : ""}
        ${state.mapUnit === "mo" ? municipalityLabelLegendHtml() : ""}
        ${suppressSmallValues ? '<div class="site-map-legend-note">Малые значения n &lt; 5 скрыты</div>' : ""}
        <div class="legend-range"><span>${context.manualScale ? "шкала задана вручную" : "автомасштаб по фильтру · Дженкс"}</span><span>Web Mercator</span></div>`;
      syncMapSymbolSizes();
      syncMapSelection();
      applyMapViewport();
      requestAnimationFrame(syncMapPanelHeight);
      mapRuntime.lastUpdateMs = performance.now() - started;
      if (debugMap) {
        let debug = mapRuntime.side.querySelector(".site-map-debug");
        if (!debug) {
          debug = document.createElement("div");
          debug.className = "site-map-debug";
          mapRuntime.side.appendChild(debug);
        }
        debug.textContent = `filter ${mapPerformance.filterMiss ? DF.format(mapPerformance.filterMs) + " мс" : "cache"} · aggregate ${mapPerformance.aggregateMiss ? DF.format(mapPerformance.aggregateMs) + " мс" : "cache"} · paint ${DF.format(mapRuntime.lastUpdateMs)} мс · ${values.length} объектов`;
      }
    };

    const renderOptimizedMapView = () => {
      mapPerformance.filterMiss = false;
      mapPerformance.aggregateMiss = false;
      localControls();
      renderKpis();
      els.title.textContent = VIEWS.map[0];
      els.subtitle.textContent = VIEWS.map[1];
      els.method.textContent = state.mapUnit === "settlement"
        ? "Размер знака НП определяется населением переписи 2021 года и не меняется при фильтрации. Цвет показывает выбранный показатель по пяти классам Дженкса. Города подписаны полужирным шрифтом 15 px, остальные НП — обычным шрифтом 10–11 px. Колесо масштабирует карту, перетаскивание изменяет охват."
        : "Муниципальные полигоны окрашены по выбранному показателю и пяти классам Дженкса. Поверх районов сохраняются опорные точки и подписи ключевых городов размером 15 px; переключатель подписей позволяет их скрыть. Колесо масштабирует карту, перетаскивание изменяет охват.";
      els.meta.innerHTML = `<span class="chip">${state.year === "all" ? (DATA.years.length > 1 ? `${DATA.years[0]}–${DATA.years[DATA.years.length - 1]}` : DATA.years[0]) : state.year}</span><span class="chip">${state.sex === "all" ? "оба пола" : state.sex === "1" ? "мужчины" : "женщины"}</span><span class="chip">${document.querySelector(`#ageSelect option[value="${state.age}"]`)?.textContent || "все возрасты"}</span><span class="chip">EPSG:3857 · Web Mercator</span>`;
      const context = syncActiveMapBreaks();
      updateOptimizedMap(context);
    };

    const highlightSearchTarget = () => {
      document.querySelectorAll(".site-atlas-highlight").forEach((element) => element.classList.remove("site-atlas-highlight"));
      if (!searchTarget) return;
      let target = null;
      if (searchTarget.type === "code") {
        target = [...document.querySelectorAll(".tile")].find((tile) => tile.querySelector(".tile-code")?.textContent.trim() === searchTarget.code);
      } else if (searchTarget.type === "class") {
        target = [...document.querySelectorAll(".tile")].find((tile) => tile.querySelector(".tile-code")?.textContent.trim() === DATA.classes[searchTarget.index].roman);
      } else if (searchTarget.type === "block") {
        target = [...document.querySelectorAll(".tile")].find((tile) => tile.querySelector(".tile-code")?.textContent.trim() === DATA.blocks[searchTarget.index].code);
      } else if (searchTarget.type === "municipality" && state.view === "map") {
        target = document.querySelector(`#viz [data-map-kind="mo"][data-index="${searchTarget.index}"]`);
      } else if (searchTarget.type === "settlement" && state.view === "map") {
        target = document.querySelector(`#viz [data-map-kind="settlement"][data-index="${searchTarget.index}"]`);
      }
      if (target) {
        target.classList.add("site-atlas-highlight");
        target.scrollIntoView({ block: "center", inline: "center" });
      }
    };

    const actionBox = document.createElement("div");
    actionBox.innerHTML = `
      <div class="atlas-actions" aria-label="Действия с текущим срезом">
        <button type="button" data-atlas-action="share">Скопировать ссылку</button>
        <button type="button" data-atlas-action="svg">Скачать SVG</button>
        <button type="button" data-atlas-action="csv">Скачать сводку CSV</button>
      </div>
      <p class="atlas-action-status" role="status" aria-live="polite"></p>`;
    document.querySelector(".chart-head")?.appendChild(actionBox);

    const status = actionBox.querySelector(".atlas-action-status");
    const setStatus = (message) => {
      status.textContent = message;
      window.clearTimeout(setStatus.timer);
      setStatus.timer = window.setTimeout(() => { status.textContent = ""; }, 3200);
    };

    const downloadBlob = (content, type, filename) => {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const exportSvg = () => {
      const source = document.querySelector("#viz svg");
      if (!source) return;
      const clone = source.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = ".axis{stroke:#aeb9ca}.gridline{stroke:#e5eaf2}.axis-label{fill:#68758a;font:11px Arial}.row-label{fill:#344054;font:11px Arial}";
      clone.prepend(style);
      downloadBlob(new XMLSerializer().serializeToString(clone), "image/svg+xml;charset=utf-8", `${exportPrefix}-${state.view}.svg`);
      setStatus("SVG текущего графика подготовлен.");
    };

    const exportClassCsv = () => {
      const rows = filtered();
      const grouped = DATA.classes.map((definition, index) => {
        const selected = rows.filter((row) => classOf(row) === index);
        const summary = stats(selected);
        return [definition.roman, definition.short, summary.n, rows.length ? summary.n / rows.length * 100 : 0, summary.median, summary.pgpzh];
      }).filter((row) => row[2] > 0);
      const header = ["Класс", "Название", "Смертей", "Доля выборки, %", "Медианный возраст", "ПГПЖ-75"];
      const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csv = "\uFEFF" + [header, ...grouped].map((row) => row.map(quote).join(";")).join("\r\n");
      downloadBlob(csv, "text/csv;charset=utf-8", `${exportPrefix}-current-filter-class-summary.csv`);
      setStatus("Агрегированная сводка по классам подготовлена; перечень НП в неё не включён.");
    };

    actionBox.querySelector('[data-atlas-action="share"]').addEventListener("click", async () => {
      writeUrlState();
      try {
        await navigator.clipboard.writeText(window.location.href);
        setStatus("Ссылка на текущий срез скопирована.");
      } catch {
        const field = document.createElement("textarea");
        field.value = window.location.href;
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
        setStatus("Ссылка на текущий срез скопирована.");
      }
    });
    actionBox.querySelector('[data-atlas-action="svg"]').addEventListener("click", exportSvg);
    actionBox.querySelector('[data-atlas-action="csv"]').addEventListener("click", exportClassCsv);

    const searchItems = [];
    DATA.classes.forEach((item, index) => searchItems.push({ type: "class", index, label: `Класс ${item.roman} — ${item.short}` }));
    DATA.blocks.forEach((item, index) => searchItems.push({ type: "block", index, label: `Блок ${item.code} — ${item.label}` }));
    DATA.codes.forEach((item, index) => searchItems.push({ type: "code", index, code: item.code, block: item.block, label: `Код ${item.code} — ${item.label}` }));
    DATA.municipalities.forEach((item, index) => searchItems.push({ type: "municipality", index, label: `МО — ${item.name}` }));
    DATA.settlements.forEach((item, index) => searchItems.push({ type: "settlement", index, label: `НП — ${item.name} · ${item.municipality}` }));
    const searchMap = new Map(searchItems.map((item) => [item.label.toLocaleLowerCase("ru-RU"), item]));

    const searchBox = document.createElement("div");
    searchBox.className = "atlas-search";
    searchBox.innerHTML = `
      <label for="atlasSearchInput">Поиск по МКБ и территории</label>
      <div class="atlas-search__row"><input id="atlasSearchInput" list="atlasSearchOptions" placeholder="Например: I21, Южно-Сахалинск"><button type="button">Найти</button></div>
      <datalist id="atlasSearchOptions"></datalist>
      <p class="atlas-search__hint">Класс, блок, трёхзначный код, муниципалитет или НП</p>`;
    document.querySelector(".filters")?.insertAdjacentElement("beforebegin", searchBox);
    const datalist = searchBox.querySelector("datalist");
    searchItems.forEach((item) => datalist.insertAdjacentHTML("beforeend", `<option value="${item.label.replace(/"/g, "&quot;")}"></option>`));

    const activateSearch = () => {
      const input = searchBox.querySelector("input");
      const query = input.value.trim().toLocaleLowerCase("ru-RU");
      const found = searchMap.get(query) || searchItems.find((item) => item.label.toLocaleLowerCase("ru-RU").includes(query));
      if (!found || !query) {
        setStatus("Совпадение не найдено. Уточните код или название.");
        return;
      }
      input.value = found.label;
      searchTarget = found;
      if (found.type === "class") {
        state.view = "treemap";
        state.treeType = "class";
        state.treeIndex = found.index;
      } else if (found.type === "block") {
        state.view = "treemap";
        state.treeType = "block";
        state.treeIndex = found.index;
      } else if (found.type === "code") {
        state.view = "treemap";
        state.treeType = "block";
        state.treeIndex = found.block;
      } else {
        state.view = "map";
        state.mapUnit = found.type === "municipality" ? "mo" : "settlement";
        mapViewport = [0, 0, 760, 790];
      }
      render();
      setStatus(`Показано: ${found.label}`);
    };
    searchBox.querySelector("button").addEventListener("click", activateSearch);
    searchBox.querySelector("input").addEventListener("keydown", (event) => {
      if (event.key === "Enter") activateSearch();
    });

    const baseRender = render;
    render = () => {
      if (state.view === "map") renderOptimizedMapView();
      else baseRender();
      syncGlobalControls();
      writeUrlState();
      addSupplementalControls();
      enhanceTreemap();
      enhanceDotogram();
      enhanceMapPaletteLegend();
      const svgButton = actionBox.querySelector('[data-atlas-action="svg"]');
      svgButton.disabled = !document.querySelector("#viz svg");
      svgButton.title = svgButton.disabled ? "Для этой визуализации SVG недоступен" : "Скачать текущий график в SVG";
      requestAnimationFrame(highlightSearchTarget);
    };

    document.querySelectorAll(".viz-btn").forEach((button) => {
      button.onclick = () => {
        state.view = button.dataset.view;
        render();
      };
    });
    const yearSelect = document.getElementById("yearSelect");
    if (yearSelect) yearSelect.onchange = () => {
      state.year = yearSelect.value;
      render();
    };
    const ageSelect = document.getElementById("ageSelect");
    if (ageSelect) ageSelect.onchange = () => {
      state.age = ageSelect.value;
      render();
    };
    document.querySelectorAll("#sexSeg button").forEach((button) => {
      button.onclick = () => {
        state.sex = button.dataset.value;
        render();
      };
    });

    window.addEventListener("popstate", () => {
      restoringHistory = true;
      Object.assign(state, defaults);
      readUrlState();
      render();
      restoringHistory = false;
    });

    readUrlState();
    render();
  };

  const enhanceCatalog = () => {
    if (page || !document.querySelector("main > .region")) return;
    const cards = [...document.querySelectorAll(".report")];
    if (!cards.length) return;

    const tools = document.createElement("section");
    tools.className = "site-catalog-tools";
    tools.setAttribute("aria-label", "Фильтр каталога отчётов");
    tools.innerHTML = `
      <h2 class="site-catalog-tools__title">Найти нужный анализ</h2>
      <div class="site-catalog-tools__controls">
        <input type="search" aria-label="Поиск по названию и описанию" placeholder="МКБ, возраст, территория, онкология…">
        <select aria-label="Регион"><option value="all">Все регионы</option><option value="sakhalin">Сахалинская область</option><option value="amur">Амурская область</option></select>
        <select aria-label="Формат"><option value="all">Все форматы</option><option value="interactive">Интерактивные</option><option value="report">Отчёты и атласы</option></select>
      </div>
      <nav class="site-catalog-paths" aria-label="Быстрые сценарии анализа">
        <a href="${new URL("sakhalin/full_report.html", siteRoot).href}">Обзор Сахалинской области</a>
        <a href="${new URL("amur/full_report.html", siteRoot).href}">Обзор Амурской области</a>
        <a href="${new URL("sakhalin/icd_treemap/index.html?view=arrow&arrowMode=region", siteRoot).href}">Сравнить регионы по классам МКБ</a>
      </nav>
      <p class="site-catalog-tools__status" role="status" aria-live="polite"></p>`;
    document.querySelector("main > header")?.insertAdjacentElement("afterend", tools);

    const [queryInput, regionSelect, formatSelect] = tools.querySelectorAll("input, select");
    const status = tools.querySelector(".site-catalog-tools__status");
    const applyFilter = () => {
      const query = queryInput.value.trim().toLocaleLowerCase("ru-RU");
      let visible = 0;
      cards.forEach((card) => {
        const href = card.getAttribute("href") || "";
        const region = href.startsWith("amur/") ? "amur" : "sakhalin";
        const format = href.includes("icd_treemap") ? "interactive" : "report";
        const show = (!query || card.textContent.toLocaleLowerCase("ru-RU").includes(query))
          && (regionSelect.value === "all" || regionSelect.value === region)
          && (formatSelect.value === "all" || formatSelect.value === format);
        card.hidden = !show;
        if (show) visible += 1;
      });
      document.querySelectorAll("main > .region").forEach((section) => {
        section.hidden = !section.querySelector(".report:not([hidden])");
      });
      status.textContent = visible ? `Показано отчётов: ${visible}` : "По выбранным условиям отчёты не найдены.";
    };
    queryInput.addEventListener("input", applyFilter);
    regionSelect.addEventListener("change", applyFilter);
    formatSelect.addEventListener("change", applyFilter);
    applyFilter();
  };

  enhanceCatalog();
  enhanceAtlas();
})();
