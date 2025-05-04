"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddPhotoItemSimple } from "@/components/sections/creations/photos/add/add-photo-item-simple";
import { AddPhotoItemMultiple } from "@/components/sections/creations/photos/add/add-photo-item-multiple";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, UploadCloud } from "lucide-react";

type TagOption = {
  id: string;
  label: string;
  important: boolean;
};

type PhotoAddTabsProps = {
  availableTags: TagOption[];
  availableSearchTags: TagOption[];
  availableAlbums: TagOption[];
};

export function PhotoAddItem({
  availableTags,
  availableSearchTags,
  availableAlbums,
}: PhotoAddTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("simple");

  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/creations/photos">Photos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ajouter des photos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simple" className="flex gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo unique</span>
                </TabsTrigger>
                <TabsTrigger value="multiple" className="flex gap-2">
                  <UploadCloud className="w-4 h-4" />
                  <span>Photos multiples</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="simple" className="mt-0">
            <AddPhotoItemSimple
              availableTags={availableTags}
              availableSearchTags={availableSearchTags}
              availableAlbums={availableAlbums}
            />
          </TabsContent>

          <TabsContent value="multiple" className="mt-0">
            <AddPhotoItemMultiple
              availableTags={availableTags}
              availableSearchTags={availableSearchTags}
              availableAlbums={availableAlbums}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
