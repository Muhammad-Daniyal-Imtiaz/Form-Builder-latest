'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, GripVertical, Plus, Trash2, GitBranch } from 'lucide-react'
import { useBuilder } from './BuilderContext'
import { cn } from '@/utils/cn'
import { useTheme } from '@/components/ThemeProvider'

export function FieldSettingsPanel() {
  const { activeFieldId, setActiveFieldId, fields, updateField, addOption, updateOption, removeOption } = useBuilder()
  const { currentTheme } = useTheme()

  const activeField = fields.find(f => f.id === activeFieldId)

  const addLogicRule = () => {
    if (!activeField) return;
    const newRule = {
      id: crypto.randomUUID(),
      condition: 'equals' as const,
      value: '',
      action: 'show' as const,
      targetId: ''
    };
    updateField(activeField.id, { logicRules: [...(activeField.logicRules || []), newRule] });
  };

  const updateLogicRule = (ruleId: string, updates: any) => {
    if (!activeField) return;
    updateField(activeField.id, {
      logicRules: activeField.logicRules?.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    });
  };

  const removeLogicRule = (ruleId: string) => {
    if (!activeField) return;
    updateField(activeField.id, {
      logicRules: activeField.logicRules?.filter(r => r.id !== ruleId)
    });
  };

  return (
    <AnimatePresence>
      {activeField && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="w-80 border-l h-[calc(100vh-56px)] sticky top-14 shadow-2xl z-20 flex flex-col shrink-0 transition-colors duration-500"
          style={{ backgroundColor: `${currentTheme.bg}cc`, borderColor: currentTheme.border, backdropBlur: '40px' }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: currentTheme.border }}>
            <div className="flex items-center gap-2 font-bold" style={{ color: currentTheme.primary }}>
              <Settings className="w-4 h-4" />
              <span className="text-sm">Field Settings</span>
            </div>
            <button
              onClick={() => setActiveFieldId(null)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: currentTheme.textMuted }}>
                  Field Location
                </label>
                <select
                  value={activeField.pageIndex}
                  onChange={(e) => updateField(activeField.id, { pageIndex: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-2 outline-none transition-all appearance-none cursor-pointer"
                  style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.primary, borderColor: `${currentTheme.primary}20` }}
                >
                  {Array.from({ length: Math.max(1, ...fields.map(f => f.pageIndex)) + 1 }).map((_, i) => (
                    <option key={i} value={i}>Page {i + 1}</option>
                  ))}
                  <option value={Math.max(0, ...fields.map(f => f.pageIndex)) + 1}>+ Create Page {Math.max(1, ...fields.map(f => f.pageIndex)) + 2}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: currentTheme.textMuted }}>
                  Field Label
                </label>
                <input
                  type="text"
                  value={activeField.label}
                  onChange={(e) => updateField(activeField.id, { label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 outline-none transition-all"
                  style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border, color: currentTheme.text }}
                />
              </div>

              {['text', 'email', 'number', 'textarea'].includes(activeField.type) && (
                <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: currentTheme.textMuted }}>
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={activeField.placeholder || ''}
                  onChange={(e) => updateField(activeField.id, { placeholder: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 outline-none transition-all"
                  style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border, color: currentTheme.text }}
                  placeholder="Enter placeholder..."
                />
                </div>
              )}

              <div className="pt-2">
                <label 
                  className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors"
                  style={{ backgroundColor: `${currentTheme.bg}40`, borderColor: currentTheme.border }}
                >
                  <input
                    type="checkbox"
                    checked={activeField.required}
                    onChange={(e) => updateField(activeField.id, { required: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: currentTheme.primary }}
                  />
                  <div>
                    <div className="text-sm font-bold" style={{ color: currentTheme.text }}>Required Field</div>
                    <div className="text-[10px] font-medium leading-tight mt-0.5" style={{ color: currentTheme.textMuted }}>User must fill this out</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Options Manager */}
            {['select', 'multiselect', 'radio', 'checkbox'].includes(activeField.type) && (
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-3" style={{ color: currentTheme.textMuted }}>
                  Choices
                </label>
                <div className="space-y-2">
                  {activeField.options?.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <div className="p-1.5 text-gray-300 cursor-grab">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(activeField.id, idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                      <button
                        onClick={() => removeOption(activeField.id, idx)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addOption(activeField.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 border-2 border-dashed border-indigo-100 rounded-lg text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            {/* Logic & Branching Manager */}
            {['text', 'email', 'number', 'select', 'radio', 'checkbox'].includes(activeField.type) && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-indigo-500" />
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                    Logic & Branching
                  </label>
                </div>
                
                <div className="space-y-3">
                  {activeField.logicRules?.map((rule) => (
                    <div key={rule.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 relative group">
                      <button
                        onClick={() => removeLogicRule(rule.id)}
                        className="absolute -top-2 -right-2 p-1 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <span>If answer</span>
                        <select
                          value={rule.condition}
                          onChange={(e) => updateLogicRule(rule.id, { condition: e.target.value })}
                          className="bg-white border border-gray-200 rounded px-1 py-0.5 outline-none text-indigo-600"
                        >
                          <option value="equals">is exactly</option>
                          <option value="not_equals">is not</option>
                          <option value="contains">contains</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => updateLogicRule(rule.id, { value: e.target.value })}
                        placeholder="Expected value..."
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm outline-none focus:border-indigo-400 transition-colors"
                      />

                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 pt-1">
                        <span>Then</span>
                        <select
                          value={rule.action}
                          onChange={(e) => updateLogicRule(rule.id, { action: e.target.value })}
                          className="bg-white border border-gray-200 rounded px-1 py-0.5 outline-none text-pink-600 font-bold"
                        >
                          <option value="show">Show</option>
                          <option value="hide">Hide</option>
                          <option value="jump_to">Jump To</option>
                        </select>
                      </div>

                      <select
                        value={rule.targetId}
                        onChange={(e) => updateLogicRule(rule.id, { targetId: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm outline-none focus:border-pink-400 transition-colors"
                      >
                        <option value="">Select target field...</option>
                        {fields.filter(f => f.id !== activeField.id).map(f => (
                          <option key={f.id} value={f.id}>{f.label} (Type: {f.type})</option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <button
                    onClick={addLogicRule}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Logic Rule
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
