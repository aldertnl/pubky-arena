import { CirclePlay, Download, Image, Layers, Library, Link, Newspaper, StickyNote } from 'lucide-react';
import { CONTENT } from '@/stores/home/home.types';

export const CONTENT_FILTER_OPTIONS = [
  { key: CONTENT.ALL, label: 'All', icon: Layers },
  { key: CONTENT.SHORT, label: 'Posts', icon: StickyNote },
  { key: CONTENT.LONG, label: 'Articles', icon: Newspaper },
  { key: CONTENT.COLLECTIONS, label: 'Collections', icon: Library },
  { key: CONTENT.IMAGES, label: 'Images', icon: Image },
  { key: CONTENT.VIDEOS, label: 'Videos', icon: CirclePlay },
  { key: CONTENT.LINKS, label: 'Links', icon: Link },
  { key: CONTENT.FILES, label: 'Files', icon: Download },
];
