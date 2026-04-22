'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import * as Atoms from '@/atoms';
import * as Hooks from '@/hooks';
import * as Molecules from '@/molecules';
import * as Organisms from '@/organisms';
import * as Libs from '@/libs';
import { ARTICLE_TITLE_MAX_CHARACTER_LENGTH, POST_MAX_CHARACTER_LENGTH } from '@/config';
import { POST_THREAD_CONNECTOR_VARIANTS } from '@/atoms';
import { POST_INPUT_VARIANT } from './PostInput.constants';
import type { PostInputProps } from './PostInput.types';
import { PostInputExpandableSection } from '../PostInputExpandableSection';
import { PostInputAttachments } from '@/molecules/PostInputAttachments/PostInputAttachments';
import type { ArticleJSON } from '@/hooks';
import { sanitizeCodeBlockLanguages } from '@/molecules/MarkdownEditor/InitializedMDXEditor.utils';

const isMediaFile = (file: File): boolean => file.type.startsWith('image/') || file.type.startsWith('video/');
const isMediaExistingAttachment = (attachment: Hooks.ExistingAttachmentMeta): boolean =>
  attachment.type.length === 0 || attachment.type.startsWith('image/') || attachment.type.startsWith('video/');
const EXPANDABLE_SECTION_PARENT_GAP_PX = 16;

export function PostInput({
  dataCy,
  id,
  variant,
  postId,
  originalPostId,
  editPostId,
  onSuccess,
  placeholder,
  showThreadConnector = false,
  expanded = false,
  onContentChange,
  onArticleModeChange,
  editContent,
  editIsArticle,
  editAttachments,
  autoFocusTextarea = false,
  initialContent,
  initialAttachments,
}: PostInputProps) {
  const t = useTranslations('post');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast.post');
  const {
    textareaRef,
    markdownEditorRef,
    containerRef,
    fileInputRef,
    content,
    setContent,
    tags,
    setTags,
    attachments,
    setAttachments,
    isArticle,
    setIsArticle,
    handleArticleClick,
    articleTitle,
    setArticleTitle,
    handleArticleTitleChange,
    handleArticleBodyChange,
    isDragging,
    isExpanded,
    isSubmitting,
    showEmojiPicker,
    setShowEmojiPicker,
    displayPlaceholder,
    currentUserPubky,
    handleExpand,
    handleSubmit,
    handleChange,
    handleEmojiSelect,
    handleFilesAdded,
    handleFileClick,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    // Mention autocomplete
    mentionUsers,
    mentionIsOpen,
    mentionSelectedIndex,
    setMentionSelectedIndex,
    handleMentionSelect,
    handleMentionKeyDown,
    existingAttachments,
    setExistingAttachments,
    isLoadingExistingAttachments,
    editHadMediaAttachments,
  } = Hooks.usePostInput({
    variant,
    postId,
    originalPostId,
    editPostId,
    onSuccess,
    placeholder,
    expanded,
    onContentChange,
    onArticleModeChange,
    editAttachments,
  });

  const isValid = React.useCallback(() => {
    if (isLoadingExistingAttachments) return false;

    const hasTrimmedContent = Boolean(content.trim());
    const hasNewAttachments = attachments.length > 0;
    const hasExistingAttachments = existingAttachments.length > 0;
    const hasAnyAttachments = hasNewAttachments || hasExistingAttachments;
    const baseValid =
      variant === POST_INPUT_VARIANT.EDIT && !isArticle
        ? !isSubmitting && (hasTrimmedContent || hasAnyAttachments)
        : Libs.canSubmitPost(variant, content, attachments, isSubmitting, isArticle, articleTitle);
    const hasExistingMedia = existingAttachments.some(isMediaExistingAttachment);
    const hasNewMedia = attachments.some(isMediaFile);

    // If the original post had media, require at least one media attachment to save.
    if (editHadMediaAttachments && !hasExistingMedia && !hasNewMedia) {
      return false;
    }
    return baseValid;
  }, [
    variant,
    content,
    attachments,
    isSubmitting,
    isLoadingExistingAttachments,
    isArticle,
    articleTitle,
    editHadMediaAttachments,
    existingAttachments,
  ]);

  const enterSubmitHandler = Hooks.useEnterSubmit(isValid, handleSubmit, {
    requireModifier: true,
  });

  // Combined keyboard handler: mention popover takes priority, then enter submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (handleMentionKeyDown(e)) return;
    enterSubmitHandler(e);
  };

  const isEdit = variant === POST_INPUT_VARIANT.EDIT;
  const isArticleEdit = isEdit && Boolean(editIsArticle);

  const { toast } = Molecules.useToast();

  const hasRequiredMediaForEdit = React.useCallback(
    (nextExistingAttachments: Hooks.ExistingAttachmentMeta[], nextAttachments: File[]): boolean => {
      if (!editHadMediaAttachments) return true;
      // Article edits can only have one banner attachment; allow temporary removal so users can replace it.
      // Submit validation still prevents saving while no media is present.
      if (isArticleEdit) return true;

      const hasExistingMedia = nextExistingAttachments.some(isMediaExistingAttachment);
      const hasNewMedia = nextAttachments.some(isMediaFile);
      return hasExistingMedia || hasNewMedia;
    },
    [editHadMediaAttachments, isArticleEdit],
  );

  React.useEffect(() => {
    if (isEdit) {
      if (editIsArticle) {
        setIsArticle(true);

        try {
          const parsed = JSON.parse(editContent) as ArticleJSON;
          setArticleTitle(parsed.title || '');
          setContent(parsed.body || '');
        } catch {
          toast({
            title: tCommon('error'),
            description: tToast('parseError'),
          });
        }
      } else {
        setContent(editContent);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is an external side-effect, not a dependency
  }, [variant, editContent, editIsArticle]);

  // Pre-fill content from share target or other external sources
  React.useEffect(() => {
    if (initialContent && !isEdit) {
      setContent(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, []);

  // Pre-fill attachments from share target or other external sources
  React.useEffect(() => {
    if (initialAttachments && initialAttachments.length > 0 && !isEdit) {
      handleFilesAdded(initialAttachments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, []);

  const handleOnRemoveExisting = React.useCallback(
    (index: number) => {
      if (!isEdit) return;

      const attachmentToRemove = existingAttachments[index];
      if (!attachmentToRemove) return;

      const nextExistingAttachments = existingAttachments.filter((_, i) => i !== index);
      const canRemove = hasRequiredMediaForEdit(nextExistingAttachments, attachments);

      if (!canRemove) {
        toast({
          title: tCommon('error'),
          description: t('editRequiresImage'),
        });
        return;
      }

      setExistingAttachments(nextExistingAttachments);
    },
    [isEdit, existingAttachments, hasRequiredMediaForEdit, attachments, toast, tCommon, t, setExistingAttachments],
  );

  const isRemoveExistingDisabled = React.useCallback(
    (index: number) => {
      if (!isEdit) return false;
      const nextExistingAttachments = existingAttachments.filter((_, i) => i !== index);
      return !hasRequiredMediaForEdit(nextExistingAttachments, attachments);
    },
    [isEdit, existingAttachments, attachments, hasRequiredMediaForEdit],
  );

  const handleOnRemoveAttachment = React.useCallback(
    (index: number) => {
      if (!isEdit) return;

      const attachmentToRemove = attachments[index];
      if (!attachmentToRemove) return;

      const nextAttachments = attachments.filter((_, i) => i !== index);
      const canRemove = hasRequiredMediaForEdit(existingAttachments, nextAttachments);

      if (!canRemove) {
        toast({
          title: tCommon('error'),
          description: t('editRequiresImage'),
        });
        return;
      }

      setAttachments(nextAttachments);
    },
    [isEdit, attachments, hasRequiredMediaForEdit, existingAttachments, toast, tCommon, t, setAttachments],
  );

  const isRemoveAttachmentDisabled = React.useCallback(
    (index: number) => {
      if (!isEdit) return false;
      const nextAttachments = attachments.filter((_, i) => i !== index);
      return !hasRequiredMediaForEdit(existingAttachments, nextAttachments);
    },
    [isEdit, attachments, existingAttachments, hasRequiredMediaForEdit],
  );
  const characterLimit = isArticle
    ? undefined
    : { count: Libs.getCharacterCount(content), max: POST_MAX_CHARACTER_LENGTH };

  return (
    <Atoms.Container
      data-cy={dataCy}
      id={id}
      ref={containerRef}
      className={Libs.cn(
        'relative cursor-pointer rounded-md border border-dashed p-4 transition-colors duration-200',
        isDragging ? 'border-brand' : 'border-input',
      )}
      onClick={handleExpand}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <Atoms.Container
          className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-brand/10"
          overrideDefaults
        >
          <Atoms.Typography className="text-brand">{t('dropFiles')}</Atoms.Typography>
        </Atoms.Container>
      )}

      {showThreadConnector && <Atoms.PostThreadConnector variant={POST_THREAD_CONNECTOR_VARIANTS.DIALOG_REPLY} />}
      <Atoms.Container className="gap-4 contain-inline-size">
        {isArticle && (
          <Atoms.Input
            placeholder={t('articleTitle')}
            defaultValue={articleTitle}
            onChange={handleArticleTitleChange}
            maxLength={ARTICLE_TITLE_MAX_CHARACTER_LENGTH}
            disabled={isSubmitting}
            className="h-auto border-none p-0 text-3xl font-bold md:text-6xl"
          />
        )}

        {currentUserPubky && (
          <Organisms.PostHeader
            postId={currentUserPubky}
            isReplyInput={true}
            characterLimit={characterLimit}
            showPopover={false}
          />
        )}

        {!isArticle && (
          <Atoms.Container overrideDefaults className="relative">
            <Atoms.Textarea
              ref={textareaRef}
              placeholder={displayPlaceholder}
              variant="inline"
              value={content}
              onChange={handleChange}
              onFocus={handleExpand}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              maxLength={POST_MAX_CHARACTER_LENGTH}
              rows={1}
              disabled={isSubmitting}
              aria-haspopup="listbox"
              autoFocus={autoFocusTextarea}
            />

            {/* Mention autocomplete popover */}
            {mentionIsOpen && (
              <Molecules.MentionPopover
                users={mentionUsers}
                selectedIndex={mentionSelectedIndex}
                onSelect={handleMentionSelect}
                onHover={setMentionSelectedIndex}
              />
            )}
          </Atoms.Container>
        )}

        <PostInputAttachments
          ref={fileInputRef}
          attachments={attachments}
          setAttachments={setAttachments}
          handleFilesAdded={handleFilesAdded}
          isSubmitting={isSubmitting}
          isArticle={isArticle}
          handleFileClick={handleFileClick}
          existingAttachments={isEdit ? existingAttachments : undefined}
          onRemoveExisting={isEdit ? handleOnRemoveExisting : undefined}
          onRemoveAttachment={isEdit ? handleOnRemoveAttachment : undefined}
          isRemoveExistingDisabled={isEdit ? isRemoveExistingDisabled : undefined}
          isRemoveAttachmentDisabled={isEdit ? isRemoveAttachmentDisabled : undefined}
        />

        {isArticle && (
          <Molecules.MarkdownEditor
            ref={markdownEditorRef}
            autoFocus
            markdown={sanitizeCodeBlockLanguages(content)}
            onChange={handleArticleBodyChange}
            readOnly={isSubmitting}
          />
        )}

        {/* Show original post preview for reposts */}
        {variant === POST_INPUT_VARIANT.REPOST && originalPostId && (
          <Molecules.PostPreviewCard postId={originalPostId} className="bg-card" />
        )}

        <PostInputExpandableSection
          isExpanded={isExpanded}
          content={content}
          tags={tags}
          isSubmitting={isSubmitting}
          isArticle={isArticle}
          setTags={setTags}
          onSubmit={handleSubmit}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          onImageClick={handleFileClick}
          onArticleClick={handleArticleClick}
          isPostDisabled={!isValid()}
          submitMode={variant}
          parentGapPx={EXPANDABLE_SECTION_PARENT_GAP_PX}
          characterLimit={characterLimit}
        />
      </Atoms.Container>
    </Atoms.Container>
  );
}
