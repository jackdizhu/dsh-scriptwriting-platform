# dsh-scriptwriting-tools

面向模型的读写工具包（Consumer 角色）：草稿、大纲、世界地图、人物关系、时间线、物体能力。

## Model Experience

骨架阶段未贡献模型可见内容；能力填充后必须逐项填写：

- What the model sees：工具 schema 原文（待填充）
- Token effect：fixed / conditional（待填充）
- KV Cache effect：append-only / prefix-stable / replacing（待填充，注明失效条件）

工具 schema 与提示词 section 会影响 KV Cache 复用，此项不可省略（`docs/dsh-plugin-development-guide.md` §5.3）。
