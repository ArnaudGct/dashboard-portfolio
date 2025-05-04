"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RemovableTagProps {
  id: string;
  label: string;
  important?: boolean;
  onRemove: (id: string) => void;
  tagType?: "tag" | "searchTag" | "album";
  className?: string;
}

export function RemovableTag({
  id,
  label,
  important = false,
  onRemove,
  tagType = "tag",
  className,
}: RemovableTagProps) {
  const typeTerms = {
    tag: { singular: "tag", plural: "tags" },
    searchTag: { singular: "tag de recherche", plural: "tags de recherche" },
    album: { singular: "album", plural: "albums" },
  }[tagType];

  return (
    <Badge
      className={cn(
        "flex items-center gap-1 pl-2 pr-1 cursor-pointer hover:bg-destructive/10 transition-colors group",
        className
      )}
      variant={important ? "default" : "secondary"}
      onClick={() => {
        onRemove(id);
        toast.success(
          `${typeTerms.singular.charAt(0).toUpperCase() + typeTerms.singular.slice(1)} "${label || id}" supprimé`
        );
      }}
    >
      <span className="max-w-[150px] truncate" title={label || id}>
        {label || id}
      </span>
      <X
        className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100"
        onClick={(e) => {
          // Empêcher la propagation pour éviter que le clic ne soit capturé deux fois
          e.stopPropagation();
          // Le comportement de suppression est déjà géré par le badge parent
        }}
      />
    </Badge>
  );
}
