# [INPUT]: 已公证装订的单应用暂存目录、CCBaga 同源 800×500 像素背景与 DeepRant ICNS。
# [OUTPUT]: dmgbuild 无头生成的 Finder 窗口、单应用到 Applications 的拖拽坐标。
# [POS]: 安装盘只负责交付 DeepRant.app；布局不接触应用内部，签名与公证由 release.py 执行。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
from pathlib import Path

ROOT = Path(defines['root'])
stage = Path(defines['stage'])
files = [str(stage / 'DeepRant.app')]
symlinks = {'Applications': '/Applications'}
icon = str(ROOT / 'src-tauri/icons/icon.icns')
background = str(ROOT / 'src/assets/dmg-background.png')
format = 'UDZO'
window_rect = ((100, 100), (800, 500))
default_view = 'icon-view'
include_icon_view_settings = True
include_list_view_settings = False
show_status_bar = False
show_tab_view = False
show_toolbar = False
show_pathbar = False
show_sidebar = False
arrange_by = None
text_size = 16
icon_size = 112
icon_locations = {
    'DeepRant.app': (200, 275),
    'Applications': (600, 275),
}
