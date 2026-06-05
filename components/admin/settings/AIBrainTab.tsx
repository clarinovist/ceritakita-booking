'use client';

import { SystemSettings } from '@/lib/types/settings';

interface AIBrainTabProps {
  settings: SystemSettings;
  onAIChange: (key: string, value: any) => void;
}

const PROVIDER_OPTIONS = ['openai', 'deepseek', 'openrouter', 'gemini', 'custom'];

export default function AIBrainTab({ settings, onAIChange }: AIBrainTabProps) {
  const ai = settings.ai_brain || {
    ai_cs_enabled: false,
    ai_cs_provider: 'openai',
    ai_cs_model: 'gpt-4o-mini',
    ai_cs_base_url: '',
    ai_cs_temperature: 0.2,
    ai_cs_max_context_messages: 30,
    ai_cs_confidence_auto_send_threshold: 0.85,
    ai_cs_allowed_auto_intents: 'schedule_check,booking_request,testimonial,unknown',
    ai_cs_insight_enabled: false,
    ai_cs_draft_enabled: false,
    ai_cs_auto_send_enabled: false,
    ai_cs_system_prompt: ''
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">WhatsApp AI Brain</h3>
        <p className="text-sm text-gray-600">
          Atur model provider, parameter inferensi, dan prompt langsung dari dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between border rounded-lg p-3">
            <span className="text-sm font-medium text-gray-700">AI CS Enabled</span>
            <input
              type="checkbox"
              checked={!!ai.ai_cs_enabled}
              onChange={(e) => onAIChange('ai_cs_enabled', e.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between border rounded-lg p-3">
            <span className="text-sm font-medium text-gray-700">Insight Enabled</span>
            <input
              type="checkbox"
              checked={!!ai.ai_cs_insight_enabled}
              onChange={(e) => onAIChange('ai_cs_insight_enabled', e.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between border rounded-lg p-3">
            <span className="text-sm font-medium text-gray-700">Draft Enabled</span>
            <input
              type="checkbox"
              checked={!!ai.ai_cs_draft_enabled}
              onChange={(e) => onAIChange('ai_cs_draft_enabled', e.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between border rounded-lg p-3">
            <span className="text-sm font-medium text-gray-700">Auto Send Enabled</span>
            <input
              type="checkbox"
              checked={!!ai.ai_cs_auto_send_enabled}
              onChange={(e) => onAIChange('ai_cs_auto_send_enabled', e.target.checked)}
            />
          </label>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h4 className="text-base font-bold text-gray-900">Provider & Model</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={ai.ai_cs_provider || 'openai'}
              onChange={(e) => onAIChange('ai_cs_provider', e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              {PROVIDER_OPTIONS.map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={ai.ai_cs_model || ''}
              onChange={(e) => onAIChange('ai_cs_model', e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="deepseek-chat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL (optional)</label>
            <input
              type="text"
              value={ai.ai_cs_base_url || ''}
              onChange={(e) => onAIChange('ai_cs_base_url', e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="https://api.deepseek.com/v1"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h4 className="text-base font-bold text-gray-900">Runtime Parameters</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="2"
              value={ai.ai_cs_temperature ?? 0.2}
              onChange={(e) => onAIChange('ai_cs_temperature', Number(e.target.value))}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Context Messages</label>
            <input
              type="number"
              min="1"
              max="200"
              value={ai.ai_cs_max_context_messages ?? 30}
              onChange={(e) => onAIChange('ai_cs_max_context_messages', Number(e.target.value))}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-send Confidence Threshold</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={ai.ai_cs_confidence_auto_send_threshold ?? 0.85}
              onChange={(e) => onAIChange('ai_cs_confidence_auto_send_threshold', Number(e.target.value))}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Auto Intents</label>
            <input
              type="text"
              value={ai.ai_cs_allowed_auto_intents || ''}
              onChange={(e) => onAIChange('ai_cs_allowed_auto_intents', e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="schedule_check,booking_request,testimonial,unknown"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-3">
        <h4 className="text-base font-bold text-gray-900">System Prompt Template</h4>
        <p className="text-xs text-gray-500">
          Gunakan placeholder {'{{contextString}}'} dan {'{{chatHistory}}'}. Jika kosong, default prompt internal dipakai.
        </p>
        <textarea
          value={ai.ai_cs_system_prompt || ''}
          onChange={(e) => onAIChange('ai_cs_system_prompt', e.target.value)}
          rows={16}
          className="w-full border rounded-lg p-3 font-mono text-xs"
          placeholder="Paste custom system prompt here..."
        />
      </div>
    </div>
  );
}
