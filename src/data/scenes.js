/**
 * [INPUT]: 无运行时依赖。id 必须与 src-tauri/src/scenes.rs 的 SCENES 对齐。
 * [OUTPUT]: 提供游戏场景目录。custom 走用户自填名称与提示词。
 * [POS]: 前端场景名单的唯一来源。GameSceneCard 只读这里。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const GAMES = {
  lol: '英雄联盟',
  dota2: 'Dota 2',
  csgo: 'CS2',
  valorant: 'Valorant',
  overwatch: '守望先锋',
  marvel_rivals: '漫威争锋',
  hots: '风暴英雄',
  r6: '彩虹六号',
  apex: 'Apex Legends',
  pubg: 'PUBG',
  naraka: '永劫无间',
  wows: '战舰世界',
  star_citizen: '星际公民',
  the_division_2: '全境封锁2',
  mengsanguo: '梦三国',
  yanyun: '燕云十六声',
  fortnite: 'Fortnite',
  minecraft: 'Minecraft',
  warzone: 'Warzone',
  wow: '魔兽世界',
  custom: '自定义场景',
};
