import { useState } from 'react';
import type { Currency, Money } from '../../../api/types';
import { Field, fieldAria } from '../../../ui/Field';
import { Input, Select } from '../../../ui/Input';
import type { FieldProps } from '../types';

const CURRENCIES: Currency[] = ['RWF', 'USD', 'EUR'];

/** Stored as {amount, currency}; cleared amount stores null. */
export function MoneyField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const money = value && typeof value === 'object' ? (value as Money) : null;
  // remember the chosen currency while the amount is still empty
  const [pendingCurrency, setPendingCurrency] = useState<Currency>('RWF');
  const currency = money?.currency ?? pendingCurrency;

  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <div className="money-input">
        <Input
          {...fieldAria(id, field.help, error, required)}
          type="number"
          inputMode="decimal"
          step="any"
          min={field.min ?? 0}
          value={money && typeof money.amount === 'number' ? money.amount : ''}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value === '' ? null : { amount: Number(e.target.value), currency })}
        />
        <Select
          aria-label={`${field.label} currency`}
          value={currency}
          disabled={readOnly}
          onChange={(e) => {
            const c = e.target.value as Currency;
            setPendingCurrency(c);
            if (money) onChange({ amount: money.amount, currency: c });
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
    </Field>
  );
}
