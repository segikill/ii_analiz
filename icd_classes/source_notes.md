# ICD Class Analysis Source Notes

- Source workbook: `C:\Users\User\YandexDisk\#9 МЕДИЦИНА ДВ\3. Рабочие материалы\Сахалинская обл\смертность с 2016 _ v3.xlsx`
- Report: `C:\Users\User\Documents\Смертность\outputs\icd_classes\icd_class_report.html`
- Included years: 2016-2025
- Excluded partial 2026 rows: 1673
- Period rows: 64677
- Unmapped ICD rows: 0

## Method
- Read individual records from `Список умерших`.
- Normalized ICD strings by translating common Cyrillic lookalikes to Latin letters and extracting the leading ICD code.
- Mapped ICD-10 codes to classes I-XXII using code ranges.
- Built class-year, class summary, top three-character code, age/sex, and municipality-class tables.
- HTML report charts are static PNGs generated with Seaborn/Matplotlib.

## Chart Map
- `coverage`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\source_coverage.png`
- `rank`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\icd_class_total_rank.png`
- `composition`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\icd_class_composition_trend.png`
- `delta`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\icd_class_delta_2016_2025.png`
- `heatmap`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\icd_class_share_heatmap.png`
- `age_sex`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\icd_class_age_sex_profile.png`
- `top_codes`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\icd_top_3char_codes.png`
- `municipality`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\icd_municipality_top3_concentration.png`
- `contact_sheet`: `C:\Users\User\Documents\Смертность\outputs\icd_classes\charts\contact_sheet.png`