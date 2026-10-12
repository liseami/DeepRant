/**
 * [INPUT]: 依赖 src-tauri/src/scenes.rs 的稳定场景 ID
 * [OUTPUT]: 提供中英游戏目录；自定义语境由用户填写
 * [POS]: 前端场景显示的唯一数据源，后端决定每个 ID 的术语提示词
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const GAMES = {
  lol: ['英雄联盟', 'League of Legends'],
  dota2: ['Dota 2', 'Dota 2'],
  csgo: ['CS2', 'CS2'],
  valorant: ['Valorant', 'Valorant'],
  overwatch: ['守望先锋', 'Overwatch'],
  marvel_rivals: ['漫威争锋', 'Marvel Rivals'],
  hots: ['风暴英雄', 'Heroes of the Storm'],
  r6: ['彩虹六号', 'Rainbow Six Siege'],
  apex: ['Apex Legends', 'Apex Legends'],
  pubg: ['PUBG', 'PUBG'],
  naraka: ['永劫无间', 'Naraka: Bladepoint'],
  wows: ['战舰世界', 'World of Warships'],
  wot: ['坦克世界', 'World of Tanks'],
  star_citizen: ['星际公民', 'Star Citizen'],
  the_division_2: ['全境封锁2', 'The Division 2'],
  mengsanguo: ['梦三国', 'Dream Three Kingdoms'],
  yanyun: ['燕云十六声', 'Where Winds Meet'],
  honor_of_kings: ['王者荣耀', 'Honor of Kings'],
  fortnite: ['Fortnite', 'Fortnite'],
  minecraft: ['Minecraft', 'Minecraft'],
  warzone: ['Warzone', 'Warzone'],
  wow: ['魔兽世界', 'World of Warcraft'],
  custom: ['自定义场景', 'Custom context'],
};

export function sceneName(id, locale) {
  return GAMES[id]?.[locale === 'en' ? 1 : 0] || id;
}
