import { StoryStatus, StoryType, Visibility } from '@untold/db/enums';

export type DummyStory = {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  storyType: StoryType;
  status: StoryStatus;
  visibility: Visibility;
  chapterCount: number;
  likeCount: number;
  commentCount: number;
  updatedAt: Date;
};

const DAY = 24 * 60 * 60 * 1000;

export const dummyUser = {
  name: 'Amri',
};

export const dummyStories: DummyStory[] = [
  {
    id: 'story-1',
    title: 'The Summer We Never Forgot',
    description:
      'A story about childhood, memory, and the things we leave behind.',
    coverImage: null,
    storyType: StoryType.MEMOIR,
    status: StoryStatus.IN_PROGRESS,
    visibility: Visibility.PRIVATE,
    chapterCount: 4,
    likeCount: 12,
    commentCount: 3,
    updatedAt: new Date(Date.now() - 1 * DAY),
  },
  {
    id: 'story-2',
    title: 'Letters to My Father',
    description: 'Everything I wish I had said, written down instead.',
    coverImage: null,
    storyType: StoryType.PERSONAL,
    status: StoryStatus.DRAFT,
    visibility: Visibility.PRIVATE,
    chapterCount: 2,
    likeCount: 4,
    commentCount: 0,
    updatedAt: new Date(Date.now() - 6 * DAY),
  },
  {
    id: 'story-3',
    title: 'The House at the End of the Road',
    description: 'A mystery buried in the last house on Maple Street.',
    coverImage: null,
    storyType: StoryType.MYSTERY,
    status: StoryStatus.DRAFT,
    visibility: Visibility.LINK,
    chapterCount: 7,
    likeCount: 28,
    commentCount: 9,
    updatedAt: new Date(Date.now() - 16 * DAY),
  },
  {
    id: 'story-4',
    title: 'What the Tide Brought Back',
    description: 'A fisherman finds something on the shore he cannot explain.',
    coverImage: null,
    storyType: StoryType.FICTION,
    status: StoryStatus.COMPLETED,
    visibility: Visibility.PUBLIC,
    chapterCount: 11,
    likeCount: 63,
    commentCount: 21,
    updatedAt: new Date(Date.now() - 40 * DAY),
  },
];

export function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / DAY);

  if (diffDays <= 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? 'a month ago' : `${months} months ago`;
}
