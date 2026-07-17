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
    if (state.mapLabels === undefined) state.mapLabels = "key";
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
      heatMetric: ["share", "n", "per10k", "per100k"],
      heatLimit: ["25", "50", "all"],
      arrowMode: ["time", "sex", "region"],
      pyramidMetric: ["n", "share"],
      plotLevel: ["class", "code"],
      mapUnit: ["settlement", "mo"],
      mapMetric: ["n", "share", "per10k", "per100k"],
      mapLabels: ["key", "off"],
      dotUnit: ["settlement", "mo"],
      dotMetric: ["n", "share", "median", "pgpzh", "per10k", "per100k"],
      dotLabels: ["outliers", "top", "off"]
    };
    const classKeys = new Set(["pyramidClass", "plotClass", "mapClass", "dotClass"]);
    const urlKeys = Object.keys(defaults);
    let restoringHistory = false;
    let searchTarget = null;
    let suppressSmallValues = false;
    let mapViewport = [0, 0, 760, 790];

    const isValid = (key, value) => {
      if (enumValues[key]) return enumValues[key].includes(value);
      if (key === "year") return value === "all" || DATA.years.map(String).includes(value);
      if (classKeys.has(key)) return value === "all" || (Number.isInteger(+value) && +value >= 0 && +value < DATA.classes.length);
      if (key === "treeIndex") return Number.isInteger(+value) && +value >= -1 && +value < Math.max(DATA.classes.length, DATA.blocks.length);
      if (key === "mapScaleMax") return value === "" || (Number.isFinite(+value) && +value >= 0 && +value <= 1e9);
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
        controls.insertAdjacentHTML("beforeend", `
          <div class="field"><label for="mapLabels">Подписи на карте</label>
          <select id="mapLabels"><option value="key">Ключевые центры</option><option value="off">Без подписей</option></select></div>`);
        const labels = document.getElementById("mapLabels");
        labels.value = state.mapLabels;
        labels.onchange = () => { state.mapLabels = labels.value; render(); };
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
          addTip(point, `<b>${esc(definition.name)}</b><div class="tip-grid"><span>${territoryMetricLabel(state.dotMetric)}</span><strong>${formatDotValue(value.value)}</strong><span>Население ${DATA.populationYear}</span><strong>${populationValue(definition) ? fmt(populationValue(definition)) : "н/д"}</strong><span>Всего смертей</span><strong>${fmt(value.total)}</strong><span>Выбранная причина</span><strong>${fmt(value.selected)}</strong><span>Структура</span><strong>${esc(topClasses(value))}</strong></div>`);
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
          addTip(point, `<b>${esc(definition.name)}</b><div class="tip-grid"><span>Муниципалитет</span><strong>${esc(definition.municipality)}</strong><span>${territoryMetricLabel(state.dotMetric)}</span><strong>${formatDotValue(value.value)}</strong><span>Население ${DATA.populationYear}</span><strong>${populationValue(definition) ? fmt(populationValue(definition)) : "н/д"}</strong><span>Всего смертей</span><strong>${fmt(value.total)}</strong><span>Выбранная причина</span><strong>${fmt(value.selected)}</strong><span>Структура</span><strong>${esc(topClasses(value))}</strong></div>`);
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
      document.getElementById("methodText").textContent = `Dotogram показывает территориальный контекст: НП сгруппированы по муниципалитетам, а муниципалитеты отображаются ранжированным точечным графиком. Подписи выделяют только статистически необычные или крупнейшие значения.${rateBase(state.dotMetric) ? ` Показатель рассчитан как смерти в текущем фильтре / население ${DATA.populationYear} × ${state.dotMetric === "per10k" ? "10 000" : "100 000"}; для многолетнего фильтра он накопительный.` : state.dotMetric === "n" || state.dotMetric === "pgpzh" ? " Для абсолютных значений применяется корневая шкала, чтобы крупнейший центр не сжимал остальные территории у нуля." : ""}`;
    };

    const appendMapCenterLabels = (mapSvg) => {
      if (state.mapLabels !== "key") return;
      const { defs, map } = geoValues("settlement", state.mapClass);
      const limit = DATA.regionKey === "amur" ? 12 : 10;
      const candidates = [...map.values()].filter((value) => value.total > 0).sort((left, right) => right.total - left.total).slice(0, limit * 2);
      const placed = [];
      const layer = svg("g", { class: "site-map-label-layer", "aria-hidden": "true" });
      for (const value of candidates) {
        if (placed.length >= limit) break;
        const definition = defs[value.idx];
        const [x, y] = project(definition.x3857, definition.y3857, 760, 790);
        const label = definition.name.length > 20 ? `${definition.name.slice(0, 19)}…` : definition.name;
        const width = Math.max(48, label.length * 6.2 + 8), height = 15;
        const attempts = [[7, -16], [7, 4], [-width - 7, -16], [-width - 7, 4], [10, -31], [-width - 10, -31]];
        let box = null;
        for (const [dx, dy] of attempts) {
          const candidate = { x: x + dx, y: y + dy, w: width, h: height };
          const inside = candidate.x >= 2 && candidate.x + candidate.w <= 758 && candidate.y >= 2 && candidate.y + candidate.h <= 788;
          const overlaps = placed.some((other) => !(candidate.x + candidate.w + 3 < other.x || other.x + other.w + 3 < candidate.x || candidate.y + candidate.h + 3 < other.y || other.y + other.h + 3 < candidate.y));
          if (inside && !overlaps) { box = candidate; break; }
        }
        if (!box) continue;
        placed.push(box);
        layer.appendChild(svg("circle", { cx: x, cy: y, r: 2.2, class: "map-center-marker" }));
        const text = textNode(layer, box.x + (box.x < x ? box.w - 3 : 3), box.y + 11, label, "map-center-label", box.x < x ? "end" : "start");
        text.setAttribute("paint-order", "stroke");
      }
      mapSvg.appendChild(layer);
      document.querySelector(".map-legend")?.insertAdjacentHTML("beforeend", '<div class="site-map-legend-note">Подписаны ключевые центры по объёму данных</div>');
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
        target = document.querySelectorAll("#viz svg path")[searchTarget.index];
      } else if (searchTarget.type === "settlement" && state.view === "map") {
        const settlement = DATA.settlements[searchTarget.index];
        const expected = project(settlement.x3857, settlement.y3857, 760, 790);
        target = [...document.querySelectorAll("#viz svg circle")].find((circle) =>
          Math.abs(+circle.getAttribute("cx") - expected[0]) < 0.4 && Math.abs(+circle.getAttribute("cy") - expected[1]) < 0.4
        );
      }
      if (target) {
        target.classList.add("site-atlas-highlight");
        target.scrollIntoView({ block: "center", inline: "center" });
      }
    };

    const enhanceMapInteractions = () => {
      if (state.view !== "map") return;
      const svg = document.querySelector("#viz .map-layout svg");
      const canvas = svg?.parentElement;
      if (!svg || !canvas) return;
      canvas.classList.add("site-map-canvas");
      svg.setAttribute("viewBox", mapViewport.join(" "));
      svg.querySelectorAll("path").forEach((path) => {
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("stroke-linecap", "round");
      });

      const controls = document.createElement("div");
      controls.className = "site-map-controls";
      controls.setAttribute("aria-label", "Управление масштабом карты");
      controls.innerHTML = '<button type="button" data-map-zoom="in" aria-label="Приблизить карту">+</button><button type="button" data-map-zoom="out" aria-label="Отдалить карту">−</button><button type="button" data-map-zoom="reset">Сброс</button>';
      canvas.appendChild(controls);

      const applyViewport = () => svg.setAttribute("viewBox", mapViewport.join(" "));
      const zoom = (factor, centerX = mapViewport[0] + mapViewport[2] / 2, centerY = mapViewport[1] + mapViewport[3] / 2) => {
        const nextWidth = Math.max(170, Math.min(760, mapViewport[2] * factor));
        const nextHeight = nextWidth * 790 / 760;
        const ratioX = (centerX - mapViewport[0]) / mapViewport[2];
        const ratioY = (centerY - mapViewport[1]) / mapViewport[3];
        mapViewport = [centerX - nextWidth * ratioX, centerY - nextHeight * ratioY, nextWidth, nextHeight];
        applyViewport();
      };
      controls.querySelector('[data-map-zoom="in"]').onclick = () => zoom(0.8);
      controls.querySelector('[data-map-zoom="out"]').onclick = () => zoom(1.25);
      controls.querySelector('[data-map-zoom="reset"]').onclick = () => {
        mapViewport = [0, 0, 760, 790];
        applyViewport();
        setStatus("Охват карты сброшен.");
      };

      svg.addEventListener("wheel", (event) => {
        event.preventDefault();
        const bounds = svg.getBoundingClientRect();
        const centerX = mapViewport[0] + (event.clientX - bounds.left) / bounds.width * mapViewport[2];
        const centerY = mapViewport[1] + (event.clientY - bounds.top) / bounds.height * mapViewport[3];
        zoom(event.deltaY > 0 ? 1.16 : 0.86, centerX, centerY);
      }, { passive: false });

      let drag = null;
      let lastDragMoved = false;
      svg.addEventListener("pointerdown", (event) => {
        lastDragMoved = false;
        drag = { x: event.clientX, y: event.clientY, view: [...mapViewport], moved: false };
        svg.setPointerCapture(event.pointerId);
        svg.classList.add("is-panning");
      });
      svg.addEventListener("pointermove", (event) => {
        if (!drag) return;
        const bounds = svg.getBoundingClientRect();
        const dx = (event.clientX - drag.x) / bounds.width * drag.view[2];
        const dy = (event.clientY - drag.y) / bounds.height * drag.view[3];
        if (Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true;
        mapViewport = [drag.view[0] - dx, drag.view[1] - dy, drag.view[2], drag.view[3]];
        applyViewport();
      });
      const endDrag = () => {
        lastDragMoved = Boolean(drag?.moved);
        drag = null;
        svg.classList.remove("is-panning");
      };
      svg.addEventListener("pointerup", endDrag);
      svg.addEventListener("pointercancel", endDrag);

      const { defs, map } = geoValues(state.mapUnit, state.mapClass);
      const shapes = state.mapUnit === "mo"
        ? [...svg.querySelectorAll("path")]
        : [...svg.querySelectorAll("circle")];
      shapes.forEach((shape, shapeIndex) => {
        let definition;
        let value;
        if (state.mapUnit === "mo") {
          definition = defs[shapeIndex];
          value = map.get(shapeIndex);
        } else {
          const cx = +shape.getAttribute("cx");
          const cy = +shape.getAttribute("cy");
          const settlementIndex = DATA.settlements.findIndex((settlement) => {
            const point = project(settlement.x3857, settlement.y3857, 760, 790);
            return Math.abs(cx - point[0]) < 0.4 && Math.abs(cy - point[1]) < 0.4;
          });
          definition = defs[settlementIndex];
          value = map.get(settlementIndex);
        }
        if (!definition || !value) return;
        shape.tabIndex = 0;
        shape.setAttribute("role", "button");
        shape.setAttribute("aria-label", `${definition.name}: ${value.selected} смертей по выбранной причине, всего ${value.total}`);
        const lock = () => {
          shapes.forEach((item) => item.classList.remove("site-atlas-highlight"));
          shape.classList.add("site-atlas-highlight");
          setStatus(`Объект закреплён: ${definition.name}`);
        };
        shape.addEventListener("click", () => { if (!lastDragMoved) lock(); });
        shape.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            lock();
          }
        });
        shape.classList.toggle("site-map-suppressed", suppressSmallValues && value.selected < 5);
      });

      const localControls = document.getElementById("localControls");
      if (localControls) {
        const privacy = document.createElement("div");
        privacy.className = "field";
        privacy.innerHTML = `<label class="site-map-privacy"><input type="checkbox" ${suppressSmallValues ? "checked" : ""}>Скрывать малые значения n &lt; 5</label>`;
        privacy.querySelector("input").onchange = (event) => {
          suppressSmallValues = event.target.checked;
          render();
        };
        localControls.appendChild(privacy);
      }
      if (suppressSmallValues) {
        document.querySelector(".map-legend")?.insertAdjacentHTML("beforeend", '<div class="site-map-legend-note">Малые значения n &lt; 5 скрыты</div>');
        const definitions = state.mapUnit === "mo" ? DATA.municipalities : DATA.settlements;
        const metric = (value) => territoryMetric(state.mapMetric, value, definitions[value.idx], state.mapClass, filtered().length);
        const ranked = [...map.values()].filter((value) => Number.isFinite(metric(value))).sort((a, b) => metric(b) - metric(a)).slice(0, 15);
        document.querySelectorAll(".rank-item").forEach((item, index) => item.classList.toggle("site-map-suppressed", ranked[index]?.selected < 5));
      }
      appendMapCenterLabels(svg);
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
      baseRender();
      syncGlobalControls();
      writeUrlState();
      addSupplementalControls();
      enhanceTreemap();
      enhanceDotogram();
      const svgButton = actionBox.querySelector('[data-atlas-action="svg"]');
      svgButton.disabled = !document.querySelector("#viz svg");
      svgButton.title = svgButton.disabled ? "Для этой визуализации SVG недоступен" : "Скачать текущий график в SVG";
      enhanceMapInteractions();
      requestAnimationFrame(highlightSearchTarget);
    };

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
