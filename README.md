# AutoScroll

AutoScroll是一个MarginNote4自动滚动插件，面向长时间阅读与手写场景，支持悬浮控制面板、快捷键调速与手写时自动暂停。

## 功能特性

- 自动识别阅读器中的可滚动目标视图并持续下滑
- 提供可拖拽悬浮面板，实时显示当前阅读进度
- 支持滚动速度调节，范围为 `5`到 `400pt/s`
- 支持手写后恢复延迟调节，范围为 `0.5s`到 `1.5s`
- 识别手写动作并自动暂停，停笔后按设定延迟恢复
- 滚动到底部后自动停止

## 快捷键

- `Space`开始或暂停自动滚动
- `[`降低滚动速度
- `]`提高滚动速度

## 开发

1. 安装依赖

```bash
pnpm install
```

2. 构建插件

```bash
pnpm build
```

## 项目结构

- `src/main.js`插件入口，只负责 `JSB.require(...)`导入
- `src/MNAutoScrollAddon.js`插件生命周期与命令入口
- `src/AutoScrollRuntime.js`自动滚动核心状态、计时器与快捷键处理
- `src/AutoScrollPanel.js`悬浮面板UI与布局刷新
- `src/AutoScrollViewFinder.js`滚动目标视图识别逻辑
- `src/mnaddon.json`插件元信息
