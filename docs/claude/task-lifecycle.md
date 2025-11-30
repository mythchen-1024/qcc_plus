# 任务执行生命周期

本文档定义接收任务后的标准执行流程。

> **定位**：本文档是任务执行流程的详细说明，主文件见 @CLAUDE.md

## 任务启动流程

1. **理解需求** - 理解用户需求的核心目标和约束条件
2. **查阅文档** - 根据任务类型查阅对应文档和代码
3. **检查依赖** - 确认前置条件和依赖项
4. **执行任务** - 按照基本执行流程完成任务

## 基本执行流程

| 步骤 | 动作 | 说明 |
|------|------|------|
| 1 | 理解需求 | 理解用户需求的核心目标和约束条件 |
| 2 | 分析设计 | 分析需求，设计实现方案，必要时技术验证 |
| 3 | 编写代码 | **必须使用 Codex Skill** 完成代码实现 |
| 4 | 测试验证 | 编写测试用例，使用真实数据验证 |
| 5 | 更新文档 | 更新相关文档，保持文档与代码一致 |

## Codex Skill 强制使用规则

**强制规则**：所有代码编写、代码解析、代码分析任务必须使用 Codex Skill

- 模型固定为 `gpt-5.1-codex-max`
- reasoning effort 固定为 `high`

### 适用任务

- 新功能代码编写
- 代码重构和优化
- Bug 修复
- 代码审查和分析
- 代码解释和理解
- 测试代码编写

### 最佳实践：避免 Shell 转义问题

```bash
# 1. 写入 prompt
Write file: .codex_prompt.txt

# 2. 执行 codex
cat .codex_prompt.txt | codex exec --model gpt-5.1-codex-max \
  --config model_reasoning_effort=high \
  --sandbox workspace-write \
  --full-auto \
  --skip-git-repo-check 2>/dev/null

# 3. 删除临时文件
rm .codex_prompt.txt
```

### 必要参数

| 参数 | 说明 |
|------|------|
| `--model gpt-5.1-codex-max` | 必须 |
| `--config model_reasoning_effort=high` | 必须 |
| `--skip-git-repo-check` | 必须 |
| `--sandbox workspace-write` | 写文件时 |
| `--sandbox read-only` | 仅分析时 |
| `--full-auto` | 自动执行 |
| `2>/dev/null` | 隐藏 thinking tokens |

### Resume 继续会话

```bash
echo "new prompt" | codex exec --skip-git-repo-check resume --last 2>/dev/null
```

Resume 时不需要指定 model 和 reasoning effort，会继承原会话设置。

## 项目文件夹规范

| 路径 | 用途 |
|------|------|
| `verify/[功能名]/verify_*.go` | 技术验证代码，通过后标记 `_pass` |
| `tests/[功能名]/test_*.go` | 测试代码，通过后标记 `_pass` |
| `debugs/[问题名]/debug_*.go` | 调试代码，完成后标记 `_pass` |
| `docs/*.md` | 项目文档 |
| `tasks/[需求名]/story_*.md` | 任务文档，完成后标记 `_Y` |

## 相关文档

- @CLAUDE.md - 主记忆文件
- @docs/claude/coding-standards.md - 编码规范
- @docs/claude/lessons-learned.md - 踩坑记录（Codex 使用问题）
