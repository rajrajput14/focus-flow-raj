import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface RecurringRuleSelectorProps {
  value: string | null;
  onChange: (rule: string | null) => void;
}

export function RecurringRuleSelector({ value, onChange }: RecurringRuleSelectorProps) {
  const [customInterval, setCustomInterval] = useState('1');
  const [customUnit, setCustomUnit] = useState('days');

  const handleRuleChange = (rule: string) => {
    if (rule === 'none') {
      onChange(null);
    } else if (rule === 'custom') {
      onChange(`every_${customInterval}_${customUnit}`);
    } else {
      onChange(rule);
    }
  };

  return (
    <div className="space-y-3">
      <Select value={value || 'none'} onValueChange={handleRuleChange}>
        <SelectTrigger className="glass-card">
          <SelectValue placeholder="No recurrence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {value?.startsWith('every_') && (
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={customInterval}
            onChange={(e) => {
              setCustomInterval(e.target.value);
              onChange(`every_${e.target.value}_${customUnit}`);
            }}
            className="glass-card w-20"
          />
          <Select value={customUnit} onValueChange={(unit) => {
            setCustomUnit(unit);
            onChange(`every_${customInterval}_${unit}`);
          }}>
            <SelectTrigger className="glass-card flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}