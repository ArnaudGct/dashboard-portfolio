"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/tag";

export interface TagOption {
  id: string;
  label: string;
  important: boolean;
}

export interface TagCheckboxProps {
  options: TagOption[];
  selectedTags: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
  variant?:
    | "default"
    | "outlined"
    | "primary"
    | "secondary"
    | "destructive"
    | "success"
    | "warning";
}

export function TagCheckbox({
  options,
  selectedTags,
  onChange,
  className,
  variant = "default",
}: TagCheckboxProps) {
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selectedTags.includes(option.id);
        return (
          <div
            key={option.id}
            onClick={() => toggleTag(option.id)}
            className="cursor-pointer"
          >
            <Tag
              variant={isSelected ? "primary" : variant}
              className={cn(
                isSelected && "bg-primary/10 border-primary text-primary",
                "transition-all"
              )}
            >
              {option.label}
            </Tag>
          </div>
        );
      })}
    </div>
  );
}
