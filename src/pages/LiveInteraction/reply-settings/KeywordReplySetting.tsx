import { useMemoizedFn } from 'ahooks'
import { PlusIcon, Trash2Icon, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Hint, SettingRow, Token } from '@/components/common/Layout'
import { TagInput } from '@/components/common/TagInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'
import { useToast } from '@/hooks/useToast'

interface Rule {
  keywords: string[]
  contents: string[]
}

export function KeywordReplySetting() {
  const { config, updateKeywordRules, updateKeywordReplyEnabled } = useAutoReplyConfig()
  const rules = config.comment.keywordReply.rules
  const keywordReplyEnabled = config.comment.keywordReply.enable
  const [showEditor, setShowEditor] = useState(false)
  const keywordReplyId = useId()

  const addRule = () => {
    updateKeywordRules([...rules, { keywords: [], contents: [] }])
  }

  return (
    <div className="space-y-5">
      <SettingRow
        label="启用关键词回复"
        htmlFor={keywordReplyId}
        description="评论包含某条规则的关键词时，从该规则的回复里随机挑一条发送"
      >
        <Switch
          id={keywordReplyId}
          checked={keywordReplyEnabled}
          onCheckedChange={updateKeywordReplyEnabled}
        />
      </SettingRow>

      {keywordReplyEnabled && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium">
              规则
              <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">
                {rules.length}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowEditor(prev => !prev)}>
                {showEditor ? '逐条编辑' : '批量编辑'}
              </Button>
              {!showEditor && (
                <Button variant="outline" size="sm" onClick={addRule}>
                  <PlusIcon />
                  添加规则
                </Button>
              )}
            </div>
          </div>

          {showEditor ? (
            <KeywordReplyEditor rules={rules} onSave={updateKeywordRules} />
          ) : (
            <CommonKeywordManager rules={rules} saveRules={updateKeywordRules} />
          )}
        </div>
      )}
    </div>
  )
}

function CommonKeywordManager({
  rules,
  saveRules,
}: {
  rules: Rule[]
  saveRules: (rules: Rule[]) => void
}) {
  const updateRule = useMemoizedFn((ruleIndex: number, patch: Partial<Rule>) => {
    saveRules(rules.map((rule, i) => (i === ruleIndex ? { ...rule, ...patch } : rule)))
  })

  const removeRule = useMemoizedFn((ruleIndex: number) => {
    saveRules(rules.filter((_, i) => i !== ruleIndex))
  })

  if (rules.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-10 text-center text-[13px] text-muted-foreground">
        还没有规则，点击"添加规则"开始
      </p>
    )
  }

  return (
    <div className="divide-y overflow-hidden rounded-lg border">
      {rules.map((rule, ruleIndex) => (
        <RuleItem
          // oxlint-disable-next-line react/no-array-index-key -- 规则没有 id，下标无妨
          key={ruleIndex}
          index={ruleIndex}
          rule={rule}
          onChange={patch => updateRule(ruleIndex, patch)}
          onRemove={() => removeRule(ruleIndex)}
        />
      ))}
    </div>
  )
}

function RuleItem({
  index,
  rule,
  onChange,
  onRemove,
}: {
  index: number
  rule: Rule
  onChange: (patch: Partial<Rule>) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState('')

  const addContent = () => {
    const content = draft.trim()
    if (!content) return
    onChange({ contents: [...rule.contents, content] })
    setDraft('')
  }

  return (
    <div className="group grid grid-cols-[2rem_1fr_2rem] gap-x-2 gap-y-3 px-3 py-3.5">
      <span className="pt-2 font-mono text-xs text-muted-foreground tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">评论包含</p>
          <TagInput
            value={rule.keywords}
            onChange={keywords => onChange({ keywords })}
            placeholder="输入关键词，回车添加"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">随机回复其中一条</p>
          {rule.contents.length > 0 && (
            <ul className="space-y-1">
              {rule.contents.map((content, i) => (
                <li
                  // oxlint-disable-next-line react/no-array-index-key -- 回复可重复，下标无妨
                  key={i}
                  className="group/item flex items-start gap-2 rounded-md bg-muted/60 py-1.5 pr-1 pl-2.5 text-[13px]"
                >
                  <span className="flex-1 leading-relaxed break-words">{content}</span>
                  <button
                    type="button"
                    className="rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-foreground focus-visible:opacity-100"
                    onClick={() => onChange({ contents: rule.contents.filter((_, j) => j !== i) })}
                    aria-label="删除这条回复"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                addContent()
              }
            }}
            onBlur={addContent}
            placeholder="输入回复内容，回车添加，可用 {用户名}"
            className="text-[13px]"
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
        onClick={onRemove}
        aria-label={`删除规则 ${index + 1}`}
      >
        <Trash2Icon />
      </Button>
    </div>
  )
}

function KeywordReplyEditor({ rules, onSave }: { rules: Rule[]; onSave: (rules: Rule[]) => void }) {
  const toLocalText = useCallback((rules: Rule[]): string => {
    return rules
      .map(rule => {
        return `${rule.keywords.join('/')}|${rule.contents.join('|')}`
      })
      .join('\n')
  }, [])

  const { toast } = useToast()
  const [localText, setLocalText] = useState(toLocalText(rules))
  const [savedText, setSavedText] = useState(localText)

  const lines = useMemo(() => localText.split('\n'), [localText])
  const hasChanges = localText !== savedText

  const toRules = (lines: string[]): Rule[] => {
    const rules = lines.map((line, index) => {
      const items = line.split('|')
      if (items.length < 2) {
        throw new Error(`第 ${index + 1} 行错误：请至少提供一个关键词和一条回复内容`)
      }
      const keywords = items[0].split('/').map(s => s.trim())
      const emptyKeywordIndex = keywords.findIndex(kw => kw.length === 0)
      if (emptyKeywordIndex >= 0) {
        throw new Error(`第 ${index + 1} 行错误：第 ${emptyKeywordIndex + 1} 个关键词是空的`)
      }
      const contents = items.slice(1).map(s => s.trim())
      const emptyContentIndex = contents.findIndex(con => con.length === 0)
      if (emptyContentIndex >= 0) {
        throw new Error(`第 ${index + 1} 行错误：第 ${emptyContentIndex + 1} 条回复内容是空的`)
      }
      return {
        keywords,
        contents,
      }
    })
    return rules
  }

  const handleSaveBtnClick = () => {
    try {
      const rules = toRules(lines)
      onSave(rules)
      setSavedText(localText)
      toast.success('保存成功')
    } catch (e) {
      if (e instanceof Error) {
        // 格式错误
        toast.error(e.message)
      } else {
        toast.error(String(e))
      }
    }
  }

  useEffect(() => {
    setLocalText(toLocalText(rules))
  }, [rules, toLocalText])

  return (
    <div className="space-y-2">
      <Hint>
        每行一条规则：<Token>关键词A/关键词B|回复1|回复2</Token>。用 <Token>/</Token>{' '}
        分隔多个关键词，用 <Token>|</Token> 分隔关键词和每条回复
      </Hint>
      <div className="flex overflow-hidden rounded-lg border bg-card focus-within:ring-1 focus-within:ring-ring">
        <div className="border-r bg-muted/60 py-1 font-mono text-xs text-muted-foreground select-none">
          {lines.map((_, i) => (
            <div
              // oxlint-disable-next-line react/no-array-index-key -- 行号就是下标
              key={i}
              className="h-8 min-w-9 px-2.5 text-right leading-8 tabular-nums"
            >
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          className="flex-1 resize-none bg-transparent px-3 py-1 text-[13px] whitespace-pre outline-none [scrollbar-width:none]"
          style={{ lineHeight: '2rem' }}
          value={localText}
          spellCheck="false"
          onChange={e => setLocalText(e.target.value)}
          rows={lines.length || 1}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        {hasChanges && <span className="text-xs text-muted-foreground">有未保存的修改</span>}
        <Button size="sm" onClick={handleSaveBtnClick} disabled={!hasChanges}>
          保存
        </Button>
      </div>
    </div>
  )
}
