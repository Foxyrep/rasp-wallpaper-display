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

## v0.0.2已实现功能：
后端 (backend/)
routers/weather.py — 天气API路由，支持高德天气API，可配置单日/三天预报

显示页面 (frontend/display/)
components/WeatherDisplay.jsx — 天气显示组件，支持天气图标映射
三个时钟组件均已集成天气显示（在时钟上方）

控制面板 (frontend/control/)
components/WeatherSettings.jsx — 天气配置组件，可开启/关闭天气、选择显示天数、配置API Key和城市编码

## v0.0.3已实现功能：
Docker容器化部署：
- Dockerfile — 多阶段构建：Node.js编译前端 + Python+nginx运行时
- nginx.conf — 反向代理：8000端口显示页面、8001端口控制面板、/api和/ws转发到后端5000
- entrypoint.sh — 容器启动脚本，启动后端和nginx
- .dockerignore — 排除不必要的文件

Docker部署方式（在linux_x86开发机上交叉编译aarch64镜像）：
```bash
# 1. 创建 buildx 构建器（首次）
docker buildx create --name mybuilder --use
docker buildx inspect --bootstrap

# 2. 构建并导出为 tar 文件
docker buildx build --platform linux/arm64 -t rasp-wallpaper:v0.0.3 --output type=docker,dest=rasp-wallpaper-v0.0.3.tar .

# 3. 拷贝到树莓派
scp rasp-wallpaper-v0.0.3.tar pi@<树莓派IP>:~/

# 4. 在树莓派上加载并运行
docker load -i rasp-wallpaper-v0.0.3.tar
docker run -d --name wallpaper-display \
  -p 5000:5000 -p 8000:8000 -p 8001:8001 \
  -v wallpaper-data:/app/data \
  -v wallpaper-uploads:/app/uploads \
  --restart unless-stopped \
  rasp-wallpaper:v0.0.3
```

## v0.0.4已实现功能：
新增”环境声可视化”模式，作为继壁纸、时钟之后的第三个显示功能
后端 (backend/)
routers/soundviz.py — 环境声可视化配置API（风格、颜色、灵敏度）
config_manager.py — 新增 soundviz 默认配置块

显示页面 (frontend/display/)
components/SoundVisualizer.jsx — 核心可视化组件，Web Audio API + Canvas 渲染
支持3种风格：频谱柱状(bar)、环形波形(circular)、流动波线(wave)
仅在该模式激活时请求麦克风，切走时自动释放
关闭了回声消除、噪声抑制、自动增益以获取最真实的环境声

控制面板 (frontend/control/)
components/SoundVizSettings.jsx — 可视化风格选择、主题颜色选择、灵敏度调节
SystemSettings.jsx — 模式下拉框新增”环境声可视化”选项

注意：环境声可视化不参与自动切换（auto-switch仅在壁纸和时钟间轮换）

实现原理：
- 未使用第三方开源库，完全基于浏览器原生API实现
- 音频采集：navigator.mediaDevices.getUserMedia 获取麦克风输入，关闭了回声消除/噪声抑制/自动增益
- 音频分析：Web Audio API（AudioContext + AnalyserNode），fftSize=2048，getByteFrequencyData获取频域数据用于bar和circular，getByteTimeDomainData获取时域数据用于wave
- 渲染：HTML5 Canvas 2D，requestAnimationFrame驱动60fps渲染循环
- 麦克风生命周期：仅在soundviz模式激活时请求并持有麦克风，切走其他模式时组件卸载自动释放stream和AudioContext
- 彩色模式：通过HSL色轮映射实现RGB渐变，无需额外依赖

## v0.0.5待实现：