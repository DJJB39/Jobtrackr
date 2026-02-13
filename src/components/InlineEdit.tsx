import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  maxLength?: number;
  as?: "h1" | "h2" | "p" | "span";
}

const InlineEdit = ({
  value,
  onChange,
  placeholder = "Click to edit…",
  className,
  inputClassName,
  multiline = false,
  maxLength,
  as: Tag = "p",
}: InlineEditProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if ("setSelectionRange" in inputRef.current) {
        inputRef.current.setSelectionRange(draft.length, draft.length);
      }
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    const shared = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(maxLength ? e.target.value.slice(0, maxLength) : e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      placeholder,
      className: cn("text-sm", inputClassName),
      maxLength,
    };

    return multiline ? (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        {...shared}
        className={cn("min-h-[80px] resize-none text-sm", inputClassName)}
      />
    ) : (
      <Input ref={inputRef as React.RefObject<HTMLInputElement>} {...shared} />
    );
  }

  return (
    <Tag
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-pointer rounded-md px-1 -mx-1 transition-colors hover:bg-muted/60",
        !value && "text-muted-foreground italic",
        className
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </Tag>
  );
};

export default InlineEdit;
