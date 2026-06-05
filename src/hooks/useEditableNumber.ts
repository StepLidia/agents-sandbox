import { useEffect, useState } from 'react';

const incompleteNumberValues = new Set(['', '-', '.', '-.']);

export function useEditableNumber(value: number, onChange: (value: number) => void) {
  const [draftValue, setDraftValue] = useState(() => formatEditableNumber(value));

  useEffect(() => {
    setDraftValue(formatEditableNumber(value));
  }, [value]);

  function handleChange(rawValue: string) {
    setDraftValue(rawValue);

    if (incompleteNumberValues.has(rawValue)) {
      return;
    }

    const nextValue = Number(rawValue);

    if (Number.isFinite(nextValue)) {
      onChange(nextValue);
    }
  }

  return {
    inputValue: draftValue,
    onInputChange: handleChange,
  };
}

function formatEditableNumber(value: number) {
  return Number.isFinite(value) ? String(value) : '0';
}
