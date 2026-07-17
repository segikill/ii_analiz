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

  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const improveTreemapContrast = () => {
    document.querySelectorAll(".tile").forEach((tile) => {
      const background = getComputedStyle(tile).backgroundColor;
      const rgb = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (!rgb || rgb.length !== 3) return;
      if (background.startsWith("color(srgb")) {
        rgb.forEach((value, index) => { rgb[index] = value * 255; });
      }
      const luminance = 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
      const whiteContrast = 1.05 / (luminance + 0.05);
      tile.style.color = whiteContrast >= 4.5 ? "#ffffff" : "#000000";
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

    const defaults = { ...state };
    const enumValues = {
      view: ["treemap", "heatmap", "arrow", "pyramid", "plot", "map", "dotogram"],
      sex: ["all", "1", "2"],
      age: ["all", "0_14", "15_44", "45_64", "65_79", "80P"],
      treeType: ["root", "class", "block"],
      treeMetric: ["n", "share", "pgpzh"],
      treeColor: ["change", "age"],
      heatUnit: ["mo", "settlement"],
      heatMetric: ["share", "n"],
      heatLimit: ["25", "50", "all"],
      arrowMode: ["time", "sex", "region"],
      pyramidMetric: ["n", "share"],
      plotLevel: ["class", "code"],
      mapUnit: ["settlement", "mo"],
      mapMetric: ["n", "share"],
      dotUnit: ["settlement", "mo"],
      dotMetric: ["n", "share", "median", "pgpzh"]
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
        const metric = (value) => state.mapMetric === "share"
          ? (state.mapClass === "all" ? value.total / Math.max(filtered().length, 1) * 100 : value.selected / value.total * 100)
          : value.selected;
        const ranked = [...map.values()].sort((a, b) => metric(b) - metric(a)).slice(0, 15);
        document.querySelectorAll(".rank-item").forEach((item, index) => item.classList.toggle("site-map-suppressed", ranked[index]?.selected < 5));
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
      baseRender();
      syncGlobalControls();
      writeUrlState();
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
