## Rasp-wallpaper-display

# 项目名称：树莓派壁纸展示器

# 项目概括：一个在树莓派上运行的应用，可以显示当前天气、时间、壁纸、以及其他自定义信息

# 开发要求及日志：

## 技术栈
1、后端：Python、FastAPI
2、前端：（分为控制面板和显示页面）：Web、JavaScript、React
3、运行环境：Python后端与显示页面运行在树莓派4B上，控制面板需要在同一家庭网络的其他设备（手机、电脑）上访问

## v0.0.1待实现：
- 项目框架搭建，初版功能实现
- 基于python和FastAPI开发后端，首先支持自定义壁纸展示 和 个性化时钟 两个功能
- 应用运行后，启动一个全屏服务，显示用户配置的内容
- 自定义壁纸功能支持用户上传壁纸，支持上传多张壁纸
- 个性化时钟功能提供几种默认的不同风格的时钟页面（圆形12小时制、电子24小时制、仿计数器风格时钟）
  
在控制面板界面，用户可以做如下配置：
- 对于整体系统，用户可以做如下配置：
  - 可以在控制面板选择当前显示功能（壁纸/时钟）
  - 可以选择时钟和壁纸功能自动切换，可以控制每个功能持续时间
- 对于壁纸功能：
  - 可以在控制面板上传图片到后端
  - 可以配置图片自动切换，可以配置切换的时间间隔
- 对于时钟功能：
  - 可以从预设的几个风格的时钟中选择
  - 可以配置是否显示年月日和星期几

后端使用0.0.0.0:5000端口，显示页面的前端开放0.0.0.0:8000端口，控制面板的前端开放0.0.0.0:8001端口
应用启动后应自动打开前端并进入全屏模式
确保用户可以用手机或电脑，与树莓派连接同一个家庭WIFI,并访问192.168.1.x:8001(具体IP取决于树莓派分配得到的IP)进入配置页面进行配置

## v0.0.1已实现功能：
后端 (backend/)
main.py — FastAPI 入口，WebSocket /ws 推送配置变更
config_manager.py — JSON 配置持久化
ws_manager.py — WebSocket 连接管理
routers/system.py — 模式切换、自动轮换 API
routers/wallpaper.py — 壁纸上传/删除/列表 API
routers/clock.py — 时钟风格配置 API

显示页面 (frontend/display/)
App.jsx — WebSocket 连接，根据配置切换壁纸/时钟
WallpaperDisplay.jsx — 全屏壁纸轮播
ClockCircle12.jsx — SVG 圆形12小时制
ClockDigital24.jsx — LED风格24小时制
ClockCounter.jsx — 翻页计数器风格

控制面板 (frontend/control/)
SystemSettings.jsx — 模式选择、自动切换
WallpaperManager.jsx — 上传/删除/轮播配置
ClockSettings.jsx — 风格选择、日期显示
启动: ./start.sh 一键启动所有服务，--start-fullscreen 打开显示页面，ESC 退出全屏，Ctrl+C 终止。

## v0.0.2待实现：
- 在时钟功能中新增一个天气显示功能，可以在控制面板的时钟功能中选择是否开启，以及显示单日还是三天
- 使用高德天气API，配置如下（将其中的key和city和extensions配置到控制面板中，交给用户配置）：
    key = "d294b6e594db19b11580209d4ab003fd"  # 默认
    city = "510116"  # 默认成都双流区（我的位置）adcode
    extensions = "all"  # all为含预报，不传这个参数就只查当天
    url = f"https://restapi.amap.com/v3/weather/weatherInfo?key={key}&city={city}&extensions={extensions}"
    r = requests.get(url)

    返回结构你需要现场调用一下这个接口看看。
- 如果用户不配置extensions，只显示当天天气
- 如果用户配置extensions = "all"，显示三天的天气
- 在时间上方显示
- 显示格式为 今天/明天/后天+天气图标+天气文本+温度范围，天气图标你可以下载一些常用的
