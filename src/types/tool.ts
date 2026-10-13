export type ToolCategory =
  | 'pdf'
  | 'image'
  | 'student'
  | 'text'
  | 'calculator'
  | 'qr'
  | 'developer'
  | 'productivity'
  | 'career'
  | 'media'
  | 'advanced';

export type ToolStatus = 'planned' | 'in-development' | 'implemented' | 'tested' | 'blocked';

export type ProcessingMethod = 'browser-local' | 'browser-worker' | 'hybrid-ai';

export interface ToolRegistryItem {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  shortDescription?: string;
  keywords: string[];
  synonyms: string[];
  inputRequirements?: string;
  supportedFormats?: string[];
  executionMode: ProcessingMethod;
  isOfflineCapable: boolean;
  status: ToolStatus;
  aiActionId?: string;
  iconName?: string;
  badge?: string;
  path: string;
}

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  iconName: string;
  gradient: string;
  toolCount?: number;
}
