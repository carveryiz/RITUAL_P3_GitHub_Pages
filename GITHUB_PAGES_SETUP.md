# RITUAL P3 Demo：GitHub Pages 部署

压缩包内包含可直接发布的静态网站，不需要安装 Node.js，也不需要执行构建命令。

1. 在 GitHub 新建一个仓库，例如 `ritual-p3-camera-demo`。
2. 进入仓库，选择 **Add file → Upload files**。
3. 上传压缩包内的全部文件，确保 `index.html` 位于仓库根目录，然后提交到 `main` 分支。
4. 打开 **Settings → Pages**。
5. 在 **Build and deployment** 中选择 **Deploy from a branch**。
6. Branch 选择 `main`，文件夹选择 `/(root)`，然后保存。
7. 等待 GitHub 完成部署。访问地址通常为：

   `https://你的用户名.github.io/ritual-p3-camera-demo/`

## 文件说明

- `index.html`：页面入口。
- `editor.css`：界面样式。
- `editor.js`：全部交互逻辑。
- `.nojekyll`：让 GitHub Pages 直接发布静态文件。

该 Demo 使用模拟配置数据，不包含真实歌曲、Unity 工程或商业资产。
