'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type MDXEditorMethods, type MDXEditorProps } from '@mdxeditor/editor';
import { useTranslations } from 'next-intl';
import { useDebounceCallback } from 'usehooks-ts';
import {
  ARTICLE_ATTACHMENT_MAX_FILES,
  ARTICLE_SUPPORTED_ATTACHMENT_MIME_TYPES,
  ARTICLE_SUPPORTED_FILE_TYPES,
  ARTICLE_TITLE_MAX_CHARACTER_LENGTH,
  ATTACHMENT_MAX_IMAGE_SIZE,
  ATTACHMENT_MAX_OTHER_SIZE,
  POST_ATTACHMENT_MAX_FILES,
  POST_MAX_CHARACTER_LENGTH,
  POST_SUPPORTED_ATTACHMENT_MIME_TYPES,
  POST_SUPPORTED_FILE_TYPES,
} from '@/config/posts';
import { FileController } from '@/controllers/file/file';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile/useCurrentUserProfile';
import { useDeletePost } from '@/hooks/useDeletePost/useDeletePost';
import { useEmojiInsert } from '@/hooks/useEmojiInsert/useEmojiInsert';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete/useMentionAutocomplete';
import { getContentWithMention } from '@/hooks/useMentionAutocomplete/useMentionAutocomplete.utils';
import { usePost } from '@/hooks/usePost/usePost';
import { useUserDetails } from '@/hooks/useUserDetails/useUserDetails';
import { CompositeIdDomain } from '@/models/models.types';
import { buildCompositeIdFromPubkyUri } from '@/models/models.utils';
import { useToast } from '@/molecules/Toaster/use-toast';
import { POST_INPUT_VARIANT } from '@/organisms/PostInput/PostInput.constants';
import { useTimelineFeedContext } from '@/organisms/Timeline/Feed/TimelineFeed/TimelineFeedContext';
import { FileVariant } from '@/services/nexus/file/file.types';
import { useLocalFilesStore } from '@/stores/localFiles/localFiles.store';
import type {
  EditAttachmentControls,
  ExistingAttachmentMeta,
  UsePostInputOptions,
  UsePostInputReturn,
} from './usePostInput.types';
import { hasRequiredMediaForEdit, isMediaExistingAttachment } from './usePostInput.utils';

/**
 * Hook that encapsulates all PostInput logic.
 *
 * Manages:
 * - Content, tags, attachments, article state (via usePost)
 * - Expand/collapse behavior
 * - Emoji picker integration
 * - Form submission (post or reply)
 * - Click outside detection for collapse
 * - Content change notifications to parent
 * - File drag and drop handling
 * - Mention autocomplete (@username and pubky ID patterns)
 * - Clipboard paste handling for file attachments
 */
export function usePostInput({
  variant,
  postId,
  originalPostId,
  editPostId,
  onSuccess,
  placeholder,
  expanded = false,
  onContentChange,
  onArticleModeChange,
  editAttachments,
  editIsArticle,
}: UsePostInputOptions): UsePostInputReturn {
  // State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isDragging, setIsDragging] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachmentMeta[]>([]);
  const [isLoadingExistingAttachments, setIsLoadingExistingAttachments] = useState(false);
  const [editHadMediaAttachments, setEditHadMediaAttachments] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const markdownEditorRef = useRef<MDXEditorMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const isSavingEditRef = useRef(false);

  // Hooks
  const t = useTranslations('post.placeholder');
  const tPost = useTranslations('post');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');
  const tFile = useTranslations('toast.file');
  const { currentUserPubky } = useCurrentUserProfile();
  const {
    content,
    setContent,
    tags,
    setTags,
    attachments,
    setAttachments,
    isArticle,
    setIsArticle,
    articleTitle,
    setArticleTitle,
    reply,
    post,
    repost,
    edit,
    isSubmitting,
  } = usePost();
  const timelineFeed = useTimelineFeedContext();
  const { toast } = useToast();
  const { deletePost } = useDeletePost();

  // Get original post author's name for repost toast message
  const originalPostAuthorId = originalPostId ? originalPostId.split(':')[0] : null;
  const { userDetails: originalPostAuthor } = useUserDetails(originalPostAuthorId);

  // Handle mention selection - inserts pubky{userId} into content
  const handleMentionSelect = useCallback(
    (userId: string) => {
      const newContent = getContentWithMention(content, userId);
      if (newContent.length <= POST_MAX_CHARACTER_LENGTH) {
        setContent(newContent);
      }
      // Focus textarea after selection
      textareaRef.current?.focus();
    },
    [content, setContent],
  );

  // Mention autocomplete
  const {
    users: mentionUsers,
    isOpen: mentionIsOpen,
    selectedIndex: mentionSelectedIndex,
    setSelectedIndex: setMentionSelectedIndex,
    handleKeyDown: mentionHandleKeyDown,
  } = useMentionAutocomplete({ content, onSelect: handleMentionSelect });

  // Resolve existing attachment URIs to metadata for edit mode
  useEffect(() => {
    // During edit save, post details may update and temporarily mutate editAttachments.
    // Ignore those transient updates to prevent flickering ghost attachments in the dialog.
    if (isSavingEditRef.current) return;

    const isMediaOrUnknownAttachment = isMediaExistingAttachment;

    // Clear stale state from a previous edit target
    setExistingAttachments([]);
    setIsLoadingExistingAttachments(false);
    setEditHadMediaAttachments(false);

    if (!editAttachments || editAttachments.length === 0) return;

    let cancelled = false;
    setIsLoadingExistingAttachments(true);

    const resolve = async () => {
      try {
        const metadata = await FileController.getMetadata({ fileAttachments: editAttachments });
        if (cancelled) return;

        // Build lookup by URI for matching metadata to original URIs
        const metadataByUri = new Map(metadata.map((m) => [m.uri, m]));

        // Map ALL original editAttachments, using metadata when available,
        // falling back to CDN URL generation for files not in local DB
        const resolved: ExistingAttachmentMeta[] = editAttachments.map((uri) => {
          const m = metadataByUri.get(uri);
          if (m) {
            const isImage = m.content_type.startsWith('image');
            return {
              uri,
              name: m.name,
              type: m.content_type,
              previewUrl: FileController.getFileUrl({
                fileId: m.id,
                variant: isImage ? FileVariant.FEED : FileVariant.MAIN,
              }),
            };
          }
          // Fallback: generate preview URL directly from URI without local DB
          const compositeId = buildCompositeIdFromPubkyUri({
            uri,
            domain: CompositeIdDomain.FILES,
          });
          const previewUrl = compositeId
            ? FileController.getFileUrl({ fileId: compositeId, variant: FileVariant.MAIN })
            : '';
          return { uri, name: '', type: '', previewUrl };
        });
        setExistingAttachments(resolved);
        // Conservative fallback: unresolved attachment types are treated as media to
        // keep edit-time media guards active when metadata cannot be determined.
        setEditHadMediaAttachments(resolved.some(isMediaOrUnknownAttachment));
      } catch {
        // If metadata resolution fails entirely, fall back to raw URIs so submit still preserves them
        if (!cancelled) {
          const fallback = editAttachments.map((uri) => {
            const compositeId = buildCompositeIdFromPubkyUri({
              uri,
              domain: CompositeIdDomain.FILES,
            });
            const previewUrl = compositeId
              ? FileController.getFileUrl({ fileId: compositeId, variant: FileVariant.MAIN })
              : '';
            return { uri, name: '', type: '', previewUrl };
          });
          setExistingAttachments(fallback);
          // Conservative fallback: if metadata fetch fails, assume unknown attachments can be media
          // so "must keep at least one media" validation remains enforced.
          setEditHadMediaAttachments(fallback.some(isMediaOrUnknownAttachment));
        }
      } finally {
        if (!cancelled) setIsLoadingExistingAttachments(false);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [editAttachments]);

  useEffect(() => {
    isSavingEditRef.current = false;
  }, [variant, editPostId]);

  // Notify parent of content changes
  useEffect(() => {
    onContentChange?.(content, tags, attachments, articleTitle);
  }, [content, tags, attachments, articleTitle, onContentChange]);

  // Notify parent of article mode changes
  useEffect(() => {
    onArticleModeChange?.(isArticle);
  }, [isArticle, onArticleModeChange]);

  // Handle click outside to collapse (only when expanded prop is false)
  useEffect(() => {
    if (expanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is inside the container
      if (containerRef.current?.contains(target)) return;

      // Check if click is inside MDXEditor popup containers (portaled outside the container)
      const mdxEditorPopup = document.querySelector('.mdxeditor-popup-container');
      if (mdxEditorPopup?.contains(target)) return;

      // Check if click is inside a dialog (portaled outside the container, e.g., EmojiPickerDialog)
      const dialogContent = document.querySelector('[data-slot="dialog-content"]');
      if (dialogContent?.contains(target)) return;

      // Collapse only if there's no content
      if (!content.trim() && tags.length === 0 && attachments.length === 0 && !articleTitle.trim()) {
        setIsExpanded(false);
        setIsArticle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded, content, tags, attachments, setIsArticle, articleTitle]);

  // Handle expand on interaction
  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  // Autosize textarea height (Safari doesn't support `field-sizing: content` yet)
  useLayoutEffect(() => {
    if (isArticle) return;
    resizeTextarea();
  }, [content, isArticle, resizeTextarea]);

  // Handle submit using reply, repost, post, or edit method from hook
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isLoadingExistingAttachments) return;

    const hasContent = Boolean(content.trim());
    const hasNewAttachments = attachments.length > 0;
    const hasExistingAttachments = existingAttachments.length > 0;

    // For replies and posts, require content or new attachments.
    // For reposts, content is optional.
    // For article mode, require both content and title.
    // For edits, allow text-only or attachment-only updates.
    if (isArticle && (!hasContent || !articleTitle.trim())) return;
    if (variant === POST_INPUT_VARIANT.EDIT && !hasContent && !hasNewAttachments && !hasExistingAttachments) return;
    if (
      variant !== POST_INPUT_VARIANT.REPOST &&
      variant !== POST_INPUT_VARIANT.EDIT &&
      !hasContent &&
      !hasNewAttachments
    )
      return;

    const getLocalAttachmentFromFile = (file: File) => {
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');
      return { type: file.type, name: file.name, urls: { main: url, feed: isImage ? url : undefined } };
    };

    const getLocalAttachmentFromExisting = (attachment: ExistingAttachmentMeta) => {
      const isImage = attachment.type.startsWith('image/');
      return {
        type: attachment.type,
        name: attachment.name,
        urls: { main: attachment.previewUrl, feed: isImage ? attachment.previewUrl : undefined },
      };
    };

    let didEditSucceed = false;

    // Wrapper that syncs local-first attachments, prepends to timeline, and calls original onSuccess
    const handleSuccess = (createdPostId: string) => {
      if (variant === POST_INPUT_VARIANT.EDIT) {
        didEditSucceed = true;
      }

      const localAttachmentsFromNewFiles = attachments.map(getLocalAttachmentFromFile);

      if (variant === POST_INPUT_VARIANT.EDIT) {
        const localAttachmentsFromExistingFiles = existingAttachments.map(getLocalAttachmentFromExisting);
        useLocalFilesStore
          .getState()
          .setPostAttachments(createdPostId, [...localAttachmentsFromExistingFiles, ...localAttachmentsFromNewFiles]);
      } else if (localAttachmentsFromNewFiles.length > 0) {
        useLocalFilesStore.getState().setPostAttachments(createdPostId, localAttachmentsFromNewFiles);
      }

      // Only prepend to timeline for posts and reposts, not replies or edits
      if (variant !== POST_INPUT_VARIANT.REPLY && variant !== POST_INPUT_VARIANT.EDIT) {
        timelineFeed?.prependPosts(createdPostId);
        setIsExpanded(false);
      }
      // Call original onSuccess callback if provided
      onSuccess?.(createdPostId);
    };

    switch (variant) {
      case POST_INPUT_VARIANT.REPLY:
        await reply({ postId: postId!, onSuccess: handleSuccess });
        break;
      case POST_INPUT_VARIANT.REPOST:
        await repost({
          originalPostId: originalPostId!,
          originalAuthorName: originalPostAuthor?.name,
          onSuccess: handleSuccess,
          onUndo: deletePost,
        });
        break;
      case POST_INPUT_VARIANT.EDIT:
        isSavingEditRef.current = true;
        await edit({
          editPostId: editPostId!,
          newAttachments: attachments.length > 0 ? attachments : undefined,
          existingAttachmentUrls: existingAttachments.map((a) => a.uri),
          onSuccess: handleSuccess,
        });

        // Keep the guard active after a successful edit to avoid late prop-driven flicker
        // right before the dialog unmounts. Reset only when edit did not succeed.
        if (!didEditSucceed) {
          isSavingEditRef.current = false;
        }
        break;
      case POST_INPUT_VARIANT.POST:
      default:
        await post({ onSuccess: handleSuccess });
        break;
    }
  }, [
    content,
    attachments,
    existingAttachments,
    isArticle,
    articleTitle,
    variant,
    postId,
    originalPostId,
    originalPostAuthor,
    reply,
    post,
    repost,
    edit,
    editPostId,
    isSubmitting,
    isLoadingExistingAttachments,
    onSuccess,
    timelineFeed,
    deletePost,
  ]);

  // Handle textarea change with validation
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= POST_MAX_CHARACTER_LENGTH) {
        setContent(value);
      }
    },
    [setContent],
  );

  // Wrapper to apply validation when emoji is inserted
  const handleEmojiChange = useCallback(
    (newValue: string) => {
      if (newValue.length <= POST_MAX_CHARACTER_LENGTH) {
        setContent(newValue);
      }
    },
    [setContent],
  );

  // Handle article title change with validation
  const handleArticleTitleChange = useDebounceCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= ARTICLE_TITLE_MAX_CHARACTER_LENGTH) {
      setArticleTitle(value);
    }
  }, 500);

  // Handle article body change - length validation is handled via MDXEditor's maxLength plugin
  const handleArticleBodyChange = useDebounceCallback<NonNullable<MDXEditorProps['onChange']>>(
    (markdown) => setContent(markdown),
    500,
  );

  // Emoji insert handler
  const handleEmojiSelect = useEmojiInsert({
    inputRef: textareaRef,
    value: content,
    onChange: handleEmojiChange,
  });

  // File handling - shared logic for both file input and drag/drop
  const handleFilesAdded = useCallback(
    (files: File[]) => {
      if (isSubmitting || files.length === 0) return;

      const ATTACHMENT_MAX_FILES = isArticle ? ARTICLE_ATTACHMENT_MAX_FILES : POST_ATTACHMENT_MAX_FILES;
      const SUPPORTED_ATTACHMENT_MIME_TYPES = isArticle
        ? ARTICLE_SUPPORTED_ATTACHMENT_MIME_TYPES
        : POST_SUPPORTED_ATTACHMENT_MIME_TYPES;
      const SUPPORTED_FILE_TYPES = isArticle ? ARTICLE_SUPPORTED_FILE_TYPES : POST_SUPPORTED_FILE_TYPES;

      const existingCount = isLoadingExistingAttachments ? (editAttachments?.length ?? 0) : existingAttachments.length;
      const currentCount = attachments.length + existingCount;
      const availableSlots = ATTACHMENT_MAX_FILES - currentCount;

      if (availableSlots <= 0) {
        toast({
          title: tToast('error'),
          description: tFile('maxFiles', { max: ATTACHMENT_MAX_FILES }),
        });
        return;
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (validFiles.length >= availableSlots) {
          errors.push(tFile('maxFilesPartial', { max: ATTACHMENT_MAX_FILES }));
          break;
        }

        // Check against specific supported MIME types from pubky-app-specs
        const isAcceptedType = SUPPORTED_ATTACHMENT_MIME_TYPES.includes(file.type);
        if (!isAcceptedType) {
          errors.push(tFile('unsupportedType', { name: file.name, type: file.type, formats: SUPPORTED_FILE_TYPES }));
          continue;
        }

        const isImage = file.type.startsWith('image/');
        const maxSize = isImage ? ATTACHMENT_MAX_IMAGE_SIZE : ATTACHMENT_MAX_OTHER_SIZE;
        const maxOtherSizeLabel = `${Math.round(ATTACHMENT_MAX_OTHER_SIZE / (1024 * 1024))}MB`;
        const maxSizeLabel = isImage ? '5MB' : maxOtherSizeLabel;

        if (file.size > maxSize) {
          errors.push(tFile('fileTooLarge', { name: file.name, maxSize: maxSizeLabel }));
          continue;
        }

        validFiles.push(file);
      }

      if (errors.length > 0) {
        toast({
          title: errors.length > 1 ? tToast('errors') : tToast('error'),
          description: errors.join('\n'),
        });
      }

      if (validFiles.length > 0) {
        setAttachments((prev) => [...prev, ...validFiles]);
      }
    },
    [
      isArticle,
      isSubmitting,
      isLoadingExistingAttachments,
      editAttachments?.length,
      attachments.length,
      existingAttachments.length,
      setAttachments,
      toast,
      tToast,
      tFile,
    ],
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;

      // Only set dragging if there are files being dragged
      if (e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
        // Auto-expand when dragging files over
        if (!isExpanded) {
          setIsExpanded(true);
        }
      }
    },
    [isExpanded],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;

    // Only set isDragging to false when we've left all nested elements
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;

      // Extract files from drag event
      const files: File[] = [];

      for (const item of dataTransfer.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();

          if (file) {
            files.push(file);
          }
        }
      }

      handleFilesAdded(files);
    },
    [handleFilesAdded],
  );

  // Trigger file input click
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle paste events - extract files from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      // Only prevent default if we have files - allow normal text paste
      e.preventDefault();
      handleFilesAdded(files);
    }
  };

  const handleArticleClick = () => setIsArticle(true);

  const isEdit = variant === POST_INPUT_VARIANT.EDIT;
  const isArticleEdit = isEdit && Boolean(editIsArticle);

  const editAttachmentControls: EditAttachmentControls | undefined = isEdit
    ? {
        existingAttachments,
        onRemoveExisting: (index) => {
          const attachmentToRemove = existingAttachments[index];
          if (!attachmentToRemove) return;

          const nextExistingAttachments = existingAttachments.filter((_, i) => i !== index);
          const canRemove = hasRequiredMediaForEdit(
            nextExistingAttachments,
            attachments,
            editHadMediaAttachments,
            isArticleEdit,
          );

          if (!canRemove) {
            toast({
              title: tCommon('error'),
              description: tPost('editRequiresImage'),
            });
            return;
          }

          setExistingAttachments(nextExistingAttachments);
        },
        onRemoveAttachment: (index) => {
          const attachmentToRemove = attachments[index];
          if (!attachmentToRemove) return;

          const nextAttachments = attachments.filter((_, i) => i !== index);
          const canRemove = hasRequiredMediaForEdit(
            existingAttachments,
            nextAttachments,
            editHadMediaAttachments,
            isArticleEdit,
          );

          if (!canRemove) {
            toast({
              title: tCommon('error'),
              description: tPost('editRequiresImage'),
            });
            return;
          }

          setAttachments(nextAttachments);
        },
        isRemoveExistingDisabled: (index) => {
          const nextExistingAttachments = existingAttachments.filter((_, i) => i !== index);
          return !hasRequiredMediaForEdit(nextExistingAttachments, attachments, editHadMediaAttachments, isArticleEdit);
        },
        isRemoveAttachmentDisabled: (index) => {
          const nextAttachments = attachments.filter((_, i) => i !== index);
          return !hasRequiredMediaForEdit(existingAttachments, nextAttachments, editHadMediaAttachments, isArticleEdit);
        },
      }
    : undefined;

  // Derived values
  const hasContent = content.trim().length > 0;
  const displayPlaceholder = placeholder ?? t(variant);

  return {
    // Refs
    textareaRef,
    markdownEditorRef,
    containerRef,
    fileInputRef,

    // State
    content,
    setContent,
    tags,
    setTags,
    attachments,
    setAttachments,
    existingAttachments,
    setExistingAttachments,
    isLoadingExistingAttachments,
    editHadMediaAttachments,
    editAttachmentControls,
    isArticle,
    setIsArticle,
    articleTitle,
    setArticleTitle,
    isDragging,
    isExpanded,
    isSubmitting,
    showEmojiPicker,
    setShowEmojiPicker,

    // Mention autocomplete state
    mentionUsers,
    mentionIsOpen,
    mentionSelectedIndex,
    setMentionSelectedIndex,

    // Derived values
    hasContent,
    displayPlaceholder,
    currentUserPubky,

    // Handlers
    handleExpand,
    handleSubmit,
    handleChange,
    handleArticleClick,
    handleArticleTitleChange,
    handleArticleBodyChange,
    handleEmojiSelect,
    handleFilesAdded,
    handleFileClick,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    handleMentionSelect,
    handleMentionKeyDown: mentionHandleKeyDown,
  };
}
