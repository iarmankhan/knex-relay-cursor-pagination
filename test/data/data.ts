export interface Post {
  id: string;
  creation_timestamp: Date;
  title: string;
}

export const posts: Post[] = [
  {
    id: 'ae52f86a-a5d3-4f3a-8558-815b946ac947',
    creation_timestamp: new Date('2023-07-06'),
    title: 'Post 0',
  },
  {
    // e276120a-3060-410f-a976-fc2eba7ada47
    id: '00000000-0000-0000-0000-000000000001',
    creation_timestamp: new Date('2023-07-07'),
    title: 'Post 1',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    creation_timestamp: new Date('2023-07-08'),
    title: 'Post 2',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    creation_timestamp: new Date('2023-07-09'),
    title: 'Post 3',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    creation_timestamp: new Date('2023-07-10'),
    title: 'Post 4',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    creation_timestamp: new Date('2023-07-11'),
    title: 'Post 5',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    creation_timestamp: new Date('2023-07-12'),
    title: 'Post 6',
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    creation_timestamp: new Date('2023-07-13'),
    title: 'Post 7',
  }
];

export const comments = [
  // Comments for Post 0 (3 comments)
  {
    id: '00000000-0000-0000-0000-000000000005',
    creation_timestamp: new Date('2023-07-12'),
    post_id: 'ae52f86a-a5d3-4f3a-8558-815b946ac947',
    value: 'Comment 5',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    creation_timestamp: new Date('2023-07-13'),
    post_id: 'ae52f86a-a5d3-4f3a-8558-815b946ac947',
    value: 'Comment 6',
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    creation_timestamp: new Date('2023-07-14'),
    post_id: 'ae52f86a-a5d3-4f3a-8558-815b946ac947',
    value: 'Comment 7',
  },

  // Comments for Post 2 (2 comments)
  {
    id: '00000000-0000-0000-0000-000000000008',
    creation_timestamp: new Date('2023-07-15'),
    post_id: '00000000-0000-0000-0000-000000000002',
    value: 'Comment 8',
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    creation_timestamp: new Date('2023-07-16'),
    post_id: '00000000-0000-0000-0000-000000000002',
    value: 'Comment 9',
  },

  // Comments for Post 3 (2 comments)
  {
    id: '00000000-0000-0000-0000-000000000010',
    creation_timestamp: new Date('2023-07-17'),
    post_id: '00000000-0000-0000-0000-000000000003',
    value: 'Comment 10',
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    creation_timestamp: new Date('2023-07-18'),
    post_id: '00000000-0000-0000-0000-000000000003',
    value: 'Comment 11',
  },

  // Comments for Post 4 (5 comments)
  {
    id: '00000000-0000-0000-0000-000000000000',
    creation_timestamp: new Date('2023-07-11'),
    post_id: '00000000-0000-0000-0000-000000000004',
    value: 'Comment 0',
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    creation_timestamp: new Date('2023-07-12'),
    post_id: '00000000-0000-0000-0000-000000000004',
    value: 'Comment 1',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    creation_timestamp: new Date('2023-07-13'),
    post_id: '00000000-0000-0000-0000-000000000004',
    value: 'Comment 2',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    creation_timestamp: new Date('2023-07-15'),
    post_id: '00000000-0000-0000-0000-000000000004',
    value: 'Comment 3',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    creation_timestamp: new Date('2023-07-16'),
    post_id: '00000000-0000-0000-0000-000000000004',
    value: 'Comment 4',
  },

  // Comments for Post 6 (1 comment)
  {
    id: '00000000-0000-0000-0000-000000000012',
    creation_timestamp: new Date('2023-07-19'),
    post_id: '00000000-0000-0000-0000-000000000006',
    value: 'Comment 12',
  },
];