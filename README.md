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

GitHub 与和风天气密钥配置在 Vercel 项目的 Environment Variables 中，变量名见 `.env.example`。这些值只由服务端函数读取，浏览器只访问同源 `/api/*`。本地开发时可以把 `.env.example` 复制到 `.env.local` 并填写密钥。

## Vercel 部署

项目根目录的 `vercel.json` 已配置 Vite 构建、`dist` 静态目录，以及 `/api/*`、`/robots.txt` 和 `/sitemap.xml` 函数路由。Vercel 使用 Node.js 24。若项目尚未导入，在 Vercel 中从 GitHub 导入 `Nocticur/3D-HOME` 并使用仓库根目录，然后先验证 Preview 部署，再更新正式部署。

在 Vercel 项目的 Domains 中添加 `home.mourn.top`，并按 Vercel 提供的记录配置 DNS。博客仍由独立站点提供；本项目通过 `blog.mourn.top` 链接博客页面并读取 `/rss.xml`。

Preview 会输出 `noindex` 元信息，且 `/robots.txt` 禁止索引。生产 canonical 和站点地图使用 `src/config/site.json` 中的 `url`。
