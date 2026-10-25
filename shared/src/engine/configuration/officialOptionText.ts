import { TextFunction } from "@sonolus/core";

export const localized = (labels: Record<"en" | "ja" | "ko" | "zhs" | "zht", string>) =>
  `${TextFunction.Localize}:${JSON.stringify(labels)}`;

// Official MasterText labels; keys retain the original game localization IDs.
export const officialOptionText = {
  ui_option_basic_note_speed: localized({
    en: "Notes Speed",
    ja: "ノーツ速度",
    ko: "노트 속도",
    zhs: "节奏图示速度",
    zht: "節奏圖示速度",
  }),
  ui_option_basic_ntoe_mirror: localized({
    en: "Mirror Chart",
    ja: "ミラー譜面",
    ko: "미러 채보",
    zhs: "镜像谱面",
    zht: "鏡像譜面",
  }),
  ui_option_basic_live_vibration: localized({
    en: "Vibration",
    ja: "振動",
    ko: "진동",
    zhs: "震动",
    zht: "震動",
  }),
  ui_option_detail_note_judge_position_display: localized({
    en: "HIT Position Display",
    ja: "判定位置表示",
    ko: "판정 위치 표시",
    zhs: "判定位置显示",
    zht: "判定位置顯示",
  }),
  ui_option_detail_note_slide_opacity: localized({
    en: "Slide Opacity",
    ja: "スライド不透明度",
    ko: "슬라이드 불투명도",
    zhs: "滑动不透明度",
    zht: "滑動的不透明度",
  }),
  ui_option_detail_note_simultaneous_line_display: localized({
    en: "Simultaneous Press Line Display",
    ja: "同時押しライン表示",
    ko: "동시 치기 라인 표시",
    zhs: "同时点击线显示",
    zht: "同時按壓線顯示",
  }),
  ui_option_detail_note_measure_line_display: localized({
    en: "Bar Line Display",
    ja: "小節線表示",
    ko: "마디선 표시",
    zhs: "小节线显示",
    zht: "小節線顯示",
  }),
  ui_option_display2_lane_opacity: localized({
    en: "Lane Opacity",
    ja: "レーン不透明度",
    ko: "레인 불투명도",
    zhs: "轨道不透明度",
    zht: "軌道的不透明度",
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
  ui_option_display2_lane_guideline_count_0: localized({
    en: "No Display",
    ja: "表示なし",
    ko: "표시 없음",
    zhs: "不显示",
    zht: "不顯示",
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
  ui_option_display2_note_effect: localized({
    en: "Notes Effect",
    ja: "ノーツエフェクト",
    ko: "노트 이펙트",
    zhs: "节奏图示特效",
    zht: "節奏圖示特效",
  }),
  ui_option_display2_note__start_position: localized({
    en: "Notes Start Position",
    ja: "ノーツ開始位置",
    ko: "노트 시작 위치",
    zhs: "节奏图示起始位置",
    zht: "節奏圖示開始位置",
  }),
  ui_option_sound_live_note_se: localized({
    en: "Notes SE",
    ja: "ノーツSE",
    ko: "노트 SE",
    zhs: "节奏图示音效",
    zht: "節奏圖示SE",
  }),
};
