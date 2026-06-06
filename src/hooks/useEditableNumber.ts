import { useEffect, useState } from 'react';

const incompleteNumberValues = new Set(['', '-', '.', '-.']);

type EditableNumberOptions = {
  format?: 'money' | 'plain';
};

export function useEditableNumber(value: number, onChange: (value: number) => void, options: EditableNumberOptions = {}) {
  const format = options.format ?? 'plain';
  const [draftValue, setDraftValue] = useState(() => formatEditableNumber(value, format));

  useEffect(() => {
    setDraftValue(formatEditableNumber(value, format));
  }, [format, value]);

  function handleChange(rawValue: string) {
    const nextValue = parseEditableNumber(rawValue, format);
    setDraftValue(format === 'money' && Number.isFinite(nextValue) ? formatEditableNumber(nextValue, format) : rawValue);

    if (incompleteNumberValues.has(rawValue)) {
      return;
    }

    if (Number.isFinite(nextValue)) {
      onChange(nextValue);
    }
  }

  return {
    inputValue: draftValue,
    onInputChange: handleChange,
  };
}

function parseEditableNumber(value: string, format: EditableNumberOptions['format']) {
  if (format === 'money') {
    return Number(value.replace(/[^\d.-]/g, ''));
  }

  return Number(value);
}

function formatEditableNumber(value: number, format: EditableNumberOptions['format']) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (format === 'money') {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }

  return String(value);
}
