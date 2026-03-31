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

const isImageFile = (file: File): boolean => file.type.startsWith('image/');
const isImageExistingAttachment = (attachment: Hooks.ExistingAttachmentMeta): boolean =>
  attachment.type.length === 0 || attachment.type.startsWith('image/');

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
    editHadAttachments,
    editHadImageAttachments,
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

    const baseValid = Libs.canSubmitPost(variant, content, attachments, isSubmitting, isArticle, articleTitle);
    const hasExistingImages = existingAttachments.some(isImageExistingAttachment);
    const hasNewImages = attachments.some(isImageFile);

    // If the original post had images, require at least one image attachment to save
    if (editHadImageAttachments && !hasExistingImages && !hasNewImages) {
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
    editHadImageAttachments,
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
  // In edit mode: only allow attachment operations if the original post had attachments
  const editAllowsImages = isEdit && editHadAttachments;
  // In edit mode without original attachments, disable attachment features
  const disableImageFeatures = isEdit && !editHadAttachments;

  const { toast } = Molecules.useToast();

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

  function handleOnRemoveExistings(
    existingAttachments: Hooks.ExistingAttachmentMeta[],
    attachments: File[],
    setExistingAttachments: React.Dispatch<React.SetStateAction<Hooks.ExistingAttachmentMeta[]>>,
  ): ((index: number) => void) | undefined {
    return (index) => {
      const attachmentToRemove = existingAttachments[index];
      if (!attachmentToRemove) return;

      const hasNewImages = attachments.some(isImageFile);
      const existingImageCount = existingAttachments.filter(isImageExistingAttachment).length;
      const isRemovingImage = isImageExistingAttachment(attachmentToRemove);
      const remainingImageCount = existingImageCount - (isRemovingImage ? 1 : 0);

      // If the original post had images, preserve at least one image across existing + new attachments.
      const wouldRemoveLastImage =
        editHadImageAttachments && isRemovingImage && remainingImageCount === 0 && !hasNewImages;
      if (wouldRemoveLastImage) {
        toast({
          title: tCommon('error'),
          description: t('editRequiresImage'),
        });
        return;
      }
      setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    };
  }

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
      onDragEnter={disableImageFeatures ? undefined : handleDragEnter}
      onDragLeave={disableImageFeatures ? undefined : handleDragLeave}
      onDragOver={disableImageFeatures ? undefined : handleDragOver}
      onDrop={disableImageFeatures ? undefined : handleDrop}
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
            characterLimit={
              isArticle ? undefined : { count: Libs.getCharacterCount(content), max: POST_MAX_CHARACTER_LENGTH }
            }
            showPopover={false}
          />
        )}

        {!isArticle && (
          <Atoms.Container overrideDefaults className="relative">
            <Atoms.Textarea
              ref={textareaRef}
              placeholder={displayPlaceholder}
              className="min-h-6 resize-none border-none p-0 font-medium text-secondary-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={content}
              onChange={handleChange}
              onFocus={handleExpand}
              onKeyDown={handleKeyDown}
              onPaste={disableImageFeatures ? undefined : handlePaste}
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

        {!disableImageFeatures && (
          <PostInputAttachments
            ref={fileInputRef}
            attachments={attachments}
            setAttachments={setAttachments}
            handleFilesAdded={handleFilesAdded}
            isSubmitting={isSubmitting}
            isArticle={isArticle}
            handleFileClick={handleFileClick}
            existingAttachments={editAllowsImages ? existingAttachments : undefined}
            onRemoveExisting={
              editAllowsImages
                ? handleOnRemoveExistings(existingAttachments, attachments, setExistingAttachments)
                : undefined
            }
          />
        )}

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
          onImageClick={disableImageFeatures ? undefined : handleFileClick}
          onArticleClick={handleArticleClick}
          isPostDisabled={!isValid()}
          submitMode={variant}
        />
      </Atoms.Container>
    </Atoms.Container>
  );
}
