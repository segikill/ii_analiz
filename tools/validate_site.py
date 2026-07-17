from __future__ import annotations

import csv
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.html_lang = ""
        self.title_count = 0
        self.h1_count = 0
        self.main_count = 0
        self.images = 0
        self.images_without_alt = 0
        self.asset_links: list[str] = []
        self.internal_links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "html":
            self.html_lang = values.get("lang") or ""
        elif tag == "title":
            self.title_count += 1
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "main":
            self.main_count += 1
        elif tag == "img":
            self.images += 1
            if "alt" not in values:
                self.images_without_alt += 1

        candidate = values.get("href") if tag in {"a", "link"} else values.get("src")
        if not candidate:
            return
        if tag in {"link", "script"}:
            self.asset_links.append(candidate)
        if tag == "a":
            self.internal_links.append(candidate)


def resolve_internal(page: Path, value: str) -> Path | None:
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or value.startswith(("#", "data:", "mailto:", "javascript:")):
        return None
    path = unquote(parsed.path)
    if not path:
        return None
    if path.startswith("/"):
        path = path.removeprefix("/ii_analiz/").lstrip("/")
        return ROOT / path
    return (page.parent / path).resolve()


def validate_page(page: Path) -> list[str]:
    html = page.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(html)
    relative = page.relative_to(ROOT).as_posix()
    errors: list[str] = []

    if parser.html_lang != "ru":
        errors.append(f"{relative}: lang должен быть ru")
    if parser.title_count != 1:
        errors.append(f"{relative}: найдено title: {parser.title_count}")
    if parser.h1_count != 1:
        errors.append(f"{relative}: найдено h1: {parser.h1_count}")
    if parser.main_count != 1:
        errors.append(f"{relative}: найдено main: {parser.main_count}")
    if parser.images_without_alt:
        errors.append(f"{relative}: изображений без alt: {parser.images_without_alt}")
    if "assets/site.css" not in html or "assets/site.js" not in html:
        errors.append(f"{relative}: не подключены общие site.css/site.js")
    for forbidden in ("Executive Summary", "смертностность"):
        if forbidden in html:
            errors.append(f"{relative}: осталось выражение «{forbidden}»")

    for link in [*parser.asset_links, *parser.internal_links]:
        target = resolve_internal(page, link)
        if target is not None and not target.exists():
            errors.append(f"{relative}: отсутствует цель ссылки {link}")
    return errors


def main() -> None:
    pages = sorted(ROOT.rglob("*.html"))
    errors: list[str] = []
    for page in pages:
        errors.extend(validate_page(page))

    atlas_script = (ROOT / "assets" / "site.js").read_text(encoding="utf-8")
    if "перечень НП в неё не включён" not in atlas_script:
        errors.append("assets/site.js: экспорт должен явно исключать перечень НП")

    tables = ROOT / "sakhalin" / "icd_treemap" / "tables"
    quality = json.loads((tables / "quality.json").read_text(encoding="utf-8"))

    def csv_total(filename: str) -> int:
        with (tables / filename).open(encoding="utf-8-sig", newline="") as source:
            return sum(int(row["deaths"]) for row in csv.DictReader(source))

    reconciliations = {
        "class_year.csv": quality["mapped_icd"],
        "municipality_class.csv": quality["municipality_mapped"],
        "settlement_summary.csv": quality["settlement_coordinate_mapped"],
    }
    for filename, expected in reconciliations.items():
        actual = csv_total(filename)
        if actual != expected:
            errors.append(f"{filename}: сумма {actual}, ожидалось {expected}")
    if "\\" in quality["source"] or "/" in quality["source"]:
        errors.append("quality.json: опубликован абсолютный путь к исходному файлу")
    if "\\" in quality["coordinate_reference"] or "/" in quality["coordinate_reference"]:
        errors.append("quality.json: опубликован абсолютный путь к справочнику координат")

    if errors:
        print("Site validation failed:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print(f"Site validation passed: {len(pages)} HTML pages")


if __name__ == "__main__":
    main()
