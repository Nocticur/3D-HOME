# 3D Home

一个使用 React、Three.js 与 GSAP 程序化绘制的可交互矢量线稿房间。房间中的电脑、个人壁画、RSS 书架、风铃、留声机、键盘和家具都是可交互入口。

## AI 生成提示词

我建议各位自己生成，本项目代码完全vibe梭哈出来的，没仔细看有没有石

其他参考同类优秀作品：https://yibi2333.github.io/line-art-style-magic-cabin

提前需求：你需要下载这里的源码https://github.com/Animnia/pure-line-room，需要一个模型排行不低于glm 5.3f的模型，需要PLAN模式或者头脑风暴skill。

本项目AI提示词，【】是你需要替换的内容：
深度学习下方源码，复刻一个矢量线条风格的可交互房间，房间布局要严格按照图片所示。【自己房间的广角图片（提供图片）】
【开源的代码的目录】、https://linehome.metagaruta.com
先进行头脑风暴和按照代码规范skill，分析代码的同时进行调研同类开发，提出更多同类需求功能，尽可能完善房间的功能，提供不低于30种房间交互方式供我选择。
最终生成计划、技术文档、后续开发调整文档、测试计划文档。

## Development

```powershell
pnpm install
pnpm build
pnpm dev
```

## 环境变量

1、GitHub 与和风天气密钥仅配置在 EdgeOne 环境变量中，参考 `.env.example`。浏览器只访问同源 `/api/*`。

2、站点信息在config里面配置JSON。

这块地方我没测试过

SEO 元信息统一维护在 `src/config/site.json`。`/robots.txt` 与 `/sitemap.xml` 由边缘函数按当前请求域名生成，不需要配置站点域名环境变量。
