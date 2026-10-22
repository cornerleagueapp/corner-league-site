import { useId } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
export default function ThemedSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className="cl-choice">
      <label htmlFor={id}>{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="cl-choice-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="cl-choice-menu">
          {options.map((option) => (
            <SelectItem
              className="cl-choice-item"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
