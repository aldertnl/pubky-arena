'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';
import {
  Calendar,
  CalendarRange,
  Clock,
  Flame,
  type LucideIcon,
  MessageCircle,
  Orbit,
  Repeat,
  RotateCcw,
  Rows4,
  Star,
  Tag as TagIcon,
} from 'lucide-react';
import { Button } from '@/atoms/Button/Button';
import { useArenaIdeas } from '@/hooks/useArenaIdeas/useArenaIdeas';
import { useHotTags } from '@/hooks/useHotTags/useHotTags';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { useRequireAuth } from '@/hooks/useRequireAuth/useRequireAuth';
import { useStreamPagination } from '@/hooks/useStreamPagination/useStreamPagination';
import {
  ARENA_PAGE_SIZE,
  ARENA_TIMEFRAME_PAGE_SIZE,
  ARENA_TOPIC_LIMIT,
  type ArenaMetric,
  getArenaCandidateSorting,
  rankArenaIdeasForTimeframe,
  shouldLoadMoreArenaTimeframe,
} from '@/libs/arena/arena';
import { cn, generateRandomColor, hexToRgba } from '@/libs/utils/utils';
import { type PostStreamId } from '@/models/stream/post/postStream.types';
import { CONTENT_FILTER_OPTIONS } from '@/molecules/Filters/FilterContent/FilterContent.constants';
import { REACH_FILTER_META } from '@/molecules/Filters/FilterReach/FilterReach';
import { PostTag } from '@/molecules/PostTag/PostTag';
import { type NexusHotTag, UserStreamReach } from '@/services/nexus/nexus.types';
import { useAuthStore } from '@/stores/auth/auth.store';
import { CONTENT, type ContentType, REACH, type ReachType } from '@/stores/home/home.types';
import { getStreamIdFromFilters } from '@/stores/home/home.utils';
import { useHotStore } from '@/stores/hot/hot.store';
import { TIMEFRAME, type TimeframeType } from '@/stores/hot/hot.types';
import styles from './Arena.module.css';
import { ArenaConversation } from './ArenaConversation';
import { ArenaFilterMenu } from './ArenaFilterMenu';
import { ArenaFloor, ArenaFloorSkeleton } from './ArenaFloor';
import { ArenaParticles } from './ArenaParticles';
import { ArenaTagConnectors } from './ArenaTagConnectors';
import { ArenaTagPicker } from './ArenaTagPicker';

const WINDOWS = [
  { value: TIMEFRAME.TODAY, label: 'Today’s', contextLabel: 'Today', icon: Star },
  { value: TIMEFRAME.THIS_WEEK, label: 'This week’s', contextLabel: 'This week', icon: CalendarRange },
  { value: TIMEFRAME.THIS_MONTH, label: 'This month’s', contextLabel: 'This month', icon: Calendar },
  { value: TIMEFRAME.ALL_TIME, label: 'All-time', contextLabel: 'All time', icon: Clock },
];

const REACH_OPTIONS = [
  { value: REACH.ALL, hotReach: undefined },
  { value: REACH.NETWORK, hotReach: UserStreamReach.WOT },
  { value: REACH.FOLLOWING, hotReach: UserStreamReach.FOLLOWING },
  { value: REACH.FRIENDS, hotReach: UserStreamReach.FRIENDS },
];

const REACH_MENU_LABELS: Record<ReachType, string> = {
  [REACH.ALL]: 'From everyone',
  [REACH.NETWORK]: 'From my network',
  [REACH.FOLLOWING]: 'From people I follow',
  [REACH.FRIENDS]: 'From friends',
  [REACH.ME]: 'From me',
};
const REACH_MENU_OPTIONS = REACH_OPTIONS.map(({ value }) => ({
  value,
  ...REACH_FILTER_META[value],
  label: REACH_MENU_LABELS[value],
}));
const CONTENT_OPTIONS = CONTENT_FILTER_OPTIONS.map(({ key, label, icon }) => ({
  value: key,
  label: key === CONTENT.ALL ? 'Content' : label,
  icon,
}));
const VIEW_OPTIONS = [
  { value: 'arena' as const, label: 'In arena', icon: Orbit },
  { value: 'list' as const, label: 'In grid', icon: Rows4 },
];

const RANK_OPTIONS = [
  { value: 'popular', label: 'Most popular', icon: Flame },
  { value: 'replies', label: 'Most replied', icon: MessageCircle },
  { value: 'tags', label: 'Most tagged', icon: TagIcon },
  { value: 'reposts', label: 'Most reposted', icon: Repeat },
  { value: 'newest', label: 'Newest', icon: Clock },
] satisfies { value: ArenaMetric; label: string; icon: LucideIcon }[];

type PostWindow = { timeframe: TimeframeType; now: number };

type StageProps = {
  topics: NexusHotTag[];
  postWindow: PostWindow;
  topic: string;
  onTopic: (topic: string) => void;
  isList: boolean;
  metric: ArenaMetric;
  content: ContentType;
};

export function Arena() {
  const { reach, setReach, timeframe, setTimeframe } = useHotStore();
  const currentUserPubky = useAuthStore((state) => state.currentUserPubky);
  const effectiveReach = currentUserPubky ? reach : REACH.ALL;
  const { requireAuth } = useRequireAuth();
  const isPhone = useIsMobile({ breakpoint: 'sm' });
  const [isList, setIsList] = useState(false);
  const displayAsGrid = isPhone || isList;
  const [metric, setMetric] = useState<ArenaMetric>('popular');
  const [content, setContent] = useState<ContentType>(CONTENT.ALL);
  const scope = `${effectiveReach}:${timeframe}:${currentUserPubky ?? 'guest'}`;
  const topics = useHotTags({
    reach: REACH_OPTIONS.find((option) => option.value === effectiveReach)?.hotReach,
    timeframe,
    limit: ARENA_TOPIC_LIMIT,
  });
  const [chosenTopic, setChosenTopic] = useState<{ scope: string; label: string } | null>(null);
  const topic = chosenTopic?.scope === scope ? chosenTopic.label : topics.rawTags[0]?.label;
  function changeReach(value: ReachType) {
    const applyReach = () => {
      setChosenTopic(null);
      setReach(value);
    };
    if (value === REACH.ALL) applyReach();
    else requireAuth(applyReach);
  }
  function resetFilters() {
    setChosenTopic(null);
    setTimeframe(TIMEFRAME.THIS_MONTH);
    setMetric('popular');
    setContent(CONTENT.ALL);
    setReach(currentUserPubky ? REACH.NETWORK : REACH.ALL);
    setIsList(false);
  }
  return (
    <div className={styles.arena}>
      <div className={styles.toolbar}>
        <svg className={styles.toolbarDivider} aria-hidden="true" focusable="false">
          <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <div className={cn(styles.filters, 'font-medium')} role="group" aria-label="Arena filters">
          <div className={styles.filterClause}>
            <span className={styles.mobileHidden}>Show</span>{' '}
            <ArenaFilterMenu
              label="Timeframe"
              value={timeframe}
              options={WINDOWS}
              onChange={(value) => {
                setChosenTopic(null);
                setTimeframe(value);
              }}
              lowercase
            />
          </div>{' '}
          <div className={styles.filterClause}>
            <ArenaFilterMenu label="Ranking" value={metric} options={RANK_OPTIONS} onChange={setMetric} lowercase />
          </div>{' '}
          <div className={styles.filterClause}>
            <ArenaTagPicker
              key={topic}
              topic={topic}
              topics={topics.rawTags}
              timeframeLabel={WINDOWS.find((window) => window.value === timeframe)?.contextLabel ?? timeframe}
              onTopic={(label) => setChosenTopic({ scope, label })}
            />
          </div>{' '}
          <div className={cn(styles.filterClause, styles.mobileHidden)}>
            <ArenaFilterMenu
              label="Content"
              value={content}
              options={CONTENT_OPTIONS}
              onChange={setContent}
              lowercase
            />
          </div>{' '}
          <div className={styles.filterClause}>
            <ArenaFilterMenu
              label="Reach"
              value={effectiveReach}
              options={REACH_MENU_OPTIONS}
              onChange={changeReach}
              lowercase
            />
          </div>{' '}
          <div className={styles.filterClause}>
            <ArenaFilterMenu
              label="View"
              value={isList ? 'list' : 'arena'}
              options={VIEW_OPTIONS}
              onChange={(value) => setIsList(value === 'list')}
              lowercase
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(styles.resetButton, 'text-xs text-muted-foreground')}
            onClick={resetFilters}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>
              Reset<span className={styles.mobileHidden}> defaults</span>
            </span>
          </Button>
        </div>
      </div>
      <ArenaTopics
        key={scope}
        reach={effectiveReach}
        timeframe={timeframe}
        data={topics}
        topic={topic}
        onTopic={(label) => setChosenTopic({ scope, label })}
        isList={displayAsGrid}
        metric={metric}
        content={content}
      />
      <details className="mt-6 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer text-xs leading-4 font-medium tracking-[0.075rem] uppercase">
          How ranking works
        </summary>
        <div className="mt-2 max-w-2xl space-y-2 leading-relaxed">
          <p>
            Topics follow Pubky’s trending-tag ranking for your selected reach and timeframe. A topic’s count is the
            number of posts carrying that tag. Today, This week, and This month use rolling 24-hour, 7-day, and 30-day
            windows; All time has no time limit.
          </p>
          <p>
            Most popular adds distinct tag labels + (direct replies × 4) + (reposts × 3). Most tagged, Most replied, and
            Most reposted use only that count. Newest uses the timestamp shown on the post. Tags measure attention, not
            necessarily agreement.
          </p>
          <p>
            Reach and timeframe determine which topics are trending and which posts compete. After you select a topic,
            post rankings compare its loaded posts from everyone within the selected timeframe. Content includes all
            types. Bounded windows load posts chronologically before applying your selected ranking. All time loads by
            engagement unless Newest is selected. Arena displays up to ten posts and keeps your selection visible; Grid
            displays up to nine. Equal post scores use a stable order with unique rank numbers. Muted authors and
            deleted posts are excluded. Counts may be cached.
          </p>
          <p>
            The leading reply is ranked separately by Most popular, regardless of the post ranking above. All pages of
            direct replies to the original are checked, then filtered by the same timeframe and mute settings. Replies
            do not need the selected tag, content type, or reach. Show all replies opens the standard thread page.
          </p>
        </div>
      </details>
    </div>
  );
}

function ArenaTopics({
  reach,
  timeframe,
  data,
  topic,
  onTopic,
  ...display
}: {
  reach: ReachType;
  timeframe: TimeframeType;
  data: ReturnType<typeof useHotTags>;
  topic?: string;
  onTopic: StageProps['onTopic'];
} & Pick<StageProps, 'isList' | 'metric' | 'content'>) {
  // The parent remounts this scope when its shared timeframe changes.
  const [now] = useState(Date.now);
  const { rawTags, isLoading, error, refetch } = data;
  if (isLoading && !topic) return <ArenaLoading isList={display.isList} />;
  if (error && !topic)
    return (
      <div className={styles.status} role="alert">
        Could not load topics.{' '}
        <Button variant="ghost" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  if (!topic)
    return (
      <div className={styles.status} role="status">
        No topics in this window. Try a wider timeframe.
      </div>
    );
  return (
    <ArenaTopic
      key={`${topic}:${display.content}`}
      {...display}
      postWindow={{ timeframe, now }}
      topics={rawTags}
      topic={topic}
      onTopic={onTopic}
      reach={reach}
    />
  );
}

function ArenaStage({
  topics,
  topic,
  onTopic,
  isList,
  metric,
  content,
  postWindow,
  children,
}: Pick<StageProps, 'topics' | 'topic' | 'onTopic' | 'isList' | 'metric' | 'content' | 'postWindow'> & {
  children: React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tagRotations, setTagRotations] = useState<number[]>([]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let inView = true;
    const update = () => stage.toggleAttribute('data-arena-paused', !inView || document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { rootMargin: '100px' },
    );
    observer.observe(stage);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTagRotations(Array.from({ length: ARENA_TOPIC_LIMIT }, () => (Math.random() - 0.5) * 4));
    });
    return () => cancelAnimationFrame(frame);
  }, [topic, metric, content, isList, postWindow.timeframe]);

  return (
    <div
      ref={stageRef}
      className={cn(styles.stage, isList && styles.listStage)}
      style={{ '--arena-topic-color': generateRandomColor(topic) } as CSSProperties}
    >
      {/* Decorative rings and particles stay behind the interactive content. */}
      <div className={styles.bowl} aria-hidden="true" data-testid="arena-orbits">
        <span className={styles.atmosphere} />
        <span className={cn(styles.orbit, styles.orbitRear)} data-orbit="rear" />
        <span className={cn(styles.orbit, styles.orbitMiddle)} data-orbit="middle" />
        <span className={cn(styles.orbit, styles.orbitOuter)} data-orbit="outer" />
        <span className={cn(styles.orbit, styles.orbitFront)} data-orbit="front" />
        <span className={cn(styles.orbit, styles.orbitCrossOne)} data-orbit="cross-one" />
        <span className={cn(styles.orbit, styles.orbitCrossTwo)} data-orbit="cross-two" />
        <span className={cn(styles.orbit, styles.orbitCrossThree)} data-orbit="cross-three" />
        <span className={cn(styles.orbit, styles.orbitInner)} data-orbit="inner" />
        <span className={cn(styles.orbit, styles.orbitAccent)} data-orbit="accent" />
        <ArenaParticles />
      </div>
      {!isList && <ArenaTagConnectors key={topic} stageRef={stageRef} topic={topic} />}
      <div className={styles.topics} role="group" aria-label="Topic standings">
        {topics.map((tag, index) => {
          const rank = index + 1;
          const tagColor = generateRandomColor(tag.label);
          const selected = tag.label === topic;
          return (
            <div
              key={tag.label}
              className={styles.topic}
              style={{ opacity: selected ? 1 : Math.max(0.55, (21 - rank) / 20) }}
              role="group"
              aria-label={`Rank ${rank}`}
            >
              <div
                className={styles.topicControl}
                style={
                  {
                    '--arena-tag-scale': (20 + ARENA_TOPIC_LIMIT - rank) / 20,
                    '--arena-tag-rotation': `${tagRotations[index] ?? 0}deg`,
                    '--arena-topic-pill-color': tagColor,
                    '--arena-topic-pill-glow': hexToRgba(tagColor, 0.32),
                  } as CSSProperties
                }
              >
                <div
                  className={cn(styles.topicTagGroup, selected && styles.selectedTopicControl)}
                  data-arena-selected-topic={selected || undefined}
                >
                  <span className={styles.topicRank} aria-hidden="true">
                    #{rank}
                  </span>
                  <PostTag
                    label={tag.label}
                    maxLabelLength={14}
                    className={cn('max-w-none shrink-0', styles.topicTag)}
                    selectedStyle={{
                      borderColor: tagColor,
                      boxShadow: `inset 0 0 8px 0 ${tagColor}`,
                    }}
                    count={tag.tagged_count}
                    selected={selected}
                    onClick={() => onTopic(tag.label)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}

function ArenaTopic(props: StageProps & { reach: ReachType }) {
  const sort = getArenaCandidateSorting(props.metric, props.postWindow.timeframe);
  const streamId = `${getStreamIdFromFilters(sort, REACH.ALL, props.content)}:${props.topic}` as PostStreamId;
  const isBoundedTimeframe = props.postWindow.timeframe !== TIMEFRAME.ALL_TIME;
  const stream = useStreamPagination({
    streamId,
    limit: isBoundedTimeframe ? ARENA_TIMEFRAME_PAGE_SIZE : ARENA_PAGE_SIZE,
  });
  const { hasMore, loadMore, loading, loadingMore, postIds } = stream;
  const { ideas, error } = useArenaIdeas(stream.postIds);
  const ranked = rankArenaIdeasForTimeframe(ideas, props.metric, props.postWindow.timeframe, props.postWindow.now);
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = ranked.find((idea) => idea.id === chosen) ?? ranked[0];
  const rootId = selected?.replyTo ?? selected?.id;
  useEffect(() => {
    if (
      !loading &&
      !loadingMore &&
      hasMore &&
      ideas.length === postIds.length &&
      shouldLoadMoreArenaTimeframe(ideas, props.postWindow.timeframe, props.postWindow.now)
    ) {
      void loadMore();
    }
  }, [
    hasMore,
    ideas,
    loadMore,
    loading,
    loadingMore,
    postIds.length,
    props.postWindow.now,
    props.postWindow.timeframe,
  ]);
  return (
    <>
      <ArenaStage {...props}>
        {stream.loading ? (
          <ArenaLoading compact isList={props.isList} />
        ) : stream.error || error ? (
          <div className={styles.status} role="alert">
            Could not load ideas.{' '}
            <Button onClick={() => void stream.refresh()} variant="ghost">
              Retry
            </Button>
          </div>
        ) : !ranked.length ? (
          <div className={styles.status} role="status">
            No posts found for this tag.
          </div>
        ) : (
          <ArenaFloor
            ideas={ranked}
            selectedId={selected?.id}
            onSelect={setChosen}
            isList={props.isList}
            metric={props.metric}
            topic={props.topic}
            contentLabel={CONTENT_OPTIONS.find((option) => option.value === props.content)?.label ?? 'Content'}
            rotationKey={`${props.topic}:${props.content}:${props.reach}:${props.postWindow.timeframe}`}
          />
        )}
      </ArenaStage>
      {rootId && selected && (
        <ArenaConversation key={rootId} postWindow={props.postWindow} rootId={rootId} selectedId={selected.id} />
      )}
    </>
  );
}

function ArenaLoading({ compact = false, isList = false }: { compact?: boolean; isList?: boolean }) {
  return (
    <div
      className={cn(styles.arenaLoading, !compact && styles.initialArenaLoading)}
      role="status"
      aria-label="Loading Arena"
    >
      <ArenaFloorSkeleton isList={isList} />
      <span className="sr-only">Loading Arena…</span>
    </div>
  );
}
