import { TextFunction } from "@sonolus/core";

export const localized = (labels: Record<"en" | "ja" | "ko" | "zhs" | "zht", string>) =>
  `${TextFunction.Localize}:${JSON.stringify(labels)}`;

// Official MasterText labels; keys retain the original game localization IDs.
export const officialOptionText = {
  ui_option_detail_note_judge_position_display: localized({
    en: "HIT Position Display",
    ja: "判定位置表示",
    ko: "판정 위치 표시",
    zhs: "判定位置显示",
    zht: "判定位置顯示",
  }),
  ui_option_detail_note_measure_line_display: localized({
    en: "Bar Line Display",
    ja: "小節線表示",
    ko: "마디선 표시",
    zhs: "小节线显示",
    zht: "小節線顯示",
  }),
  ui_option_display2_lane_guideline_opacity: localized({
    en: "Guideline Opacity",
    ja: "ガイドライン不透明度",
    ko: "가이드라인 불투명도",
    zhs: "引导线不透明度",
    zht: "引導線的不透明度",
  }),
  ui_option_display2_lane_guideline_count: localized({
    en: "Number of Guidelines",
    ja: "ガイドライン表示数",
    ko: "가이드라인 표시 수",
    zhs: "引导线显示数量",
    zht: "引導線顯示數量",
  }),
  ui_option_display2_lane_guideline_count_4: localized({
    en: "4 Lanes",
    ja: "4レーン",
    ko: "4레인",
    zhs: "4轨道",
    zht: "4軌",
  }),
  ui_option_display2_lane_guideline_count_6: localized({
    en: "6 Lanes",
    ja: "6レーン",
    ko: "6레인",
    zhs: "6轨道",
    zht: "6軌",
  }),
  ui_option_display2_lane_guideline_count_8: localized({
    en: "8 Lanes",
    ja: "8レーン",
    ko: "8레인",
    zhs: "8轨道",
    zht: "8軌",
  }),
  ui_option_display2_lane_guideline_count_12: localized({
    en: "12 Lanes",
    ja: "12レーン",
    ko: "12레인",
    zhs: "12轨道",
    zht: "12軌",
  }),
};
