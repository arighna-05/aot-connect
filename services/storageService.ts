

import { User, Community, Post, Department, Year, UserRole, PollOption, Chat, ChatMessage, ChatStatus, Comment, Attachment, CommunityType } from '../types';

const STORAGE_KEYS = {
  USERS: 'aot_users',
  CURRENT_USER: 'aot_current_user',
  COMMUNITIES: 'aot_communities',
  POSTS: 'aot_posts',
  CHATS: 'aot_chats',
  MESSAGES: 'aot_messages'
};

const DEPT_FULL_NAMES: Record<Department, string> = {
    [Department.CSE]: 'Computer Science & Engineering (CSE)',
    [Department.CSBS]: 'Computer Science & Business Systems (CSBS)',
    [Department.AIML]: 'Artificial Intelligence & Machine Learning (AIML)',
    [Department.ECE]: 'Electronics & Communication Engineering (ECE)',
    [Department.EEE]: 'Electrical & Electronics Engineering (EEE)',
    [Department.EE]: 'Electrical Engineering (EE)',
    [Department.ME]: 'Mechanical Engineering (ME)',
    [Department.MCA]: 'Master of Computer Applications (MCA)'
};

// Helper to generate consistent IDs
const getRestrictedCommunityId = (dept: Department, year: Year) => `c-restricted-${dept}-${year}`.replace(/\s/g, '');
const getPublicDeptCommunityId = (dept: Department) => `c-public-${dept}`;

// Initial Data Seeding
const seedData = () => {
  // Seed Users
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const initialUsers: User[] = [
      {
        id: 'u-admin',
        email: 'admin@aot.edu.in',
        username: 'admin',
        fullName: 'System Admin',
        isAnonymous: false,
        interests: [],
        role: UserRole.ADMIN,
        joinedCommunityIds: ['c-global'],
        isVerified: true,
        following: [],
        followers: [],
        bio: 'Administrator of AOT Connect.',
        pronouns: 'They/Them'
      },
      {
        id: 'u-demo',
        email: 'student@aot.edu.in',
        username: 'demo_student',
        fullName: 'Demo Student',
        department: Department.CSE,
        year: Year.THIRD,
        isAnonymous: false,
        interests: ['Coding', 'Robotics'],
        role: UserRole.STUDENT,
        // Auto-joins handled in logic below, but initially hardcoded for demo consistency
        joinedCommunityIds: ['c-global', getPublicDeptCommunityId(Department.CSE), getRestrictedCommunityId(Department.CSE, Year.THIRD)],
        isVerified: true,
        following: ['u-jane'],
        followers: ['u-jane'],
        bio: 'CS Student | Tech Enthusiast | Loves building things.',
        pronouns: 'He/Him'
      },
      {
        id: 'u-jane',
        email: 'jane@aot.edu.in',
        username: 'jane_doe',
        fullName: 'Jane Doe',
        department: Department.EEE,
        year: Year.SECOND,
        isAnonymous: false,
        interests: ['Music', 'Art'],
        role: UserRole.STUDENT,
        joinedCommunityIds: ['c-global', getPublicDeptCommunityId(Department.EEE), getRestrictedCommunityId(Department.EEE, Year.SECOND)],
        isVerified: true,
        following: ['u-demo'],
        followers: ['u-demo'],
        bio: 'Music lover and EEE sophomore.',
        pronouns: 'She/Her'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  }

  // --- SEED COMMUNITIES (REWRITE TO MATCH NEW STRUCTURE) ---
  // We force update communities to ensure structure matches the requirement
  const communities: Community[] = [];

  // 1. The Common Space
  communities.push({
      id: 'c-global',
      name: 'Common Space',
      description: 'The main hall for everyone. Global announcements and campus-wide discussions.',
      type: 'COMMON',
      category: 'OFFICIAL',
      memberCount: 1540,
      rules: ['Be respectful', 'No spam', 'Keep it relevant to college life']
  });

  // 2. Public Department Communities (8 Total)
  Object.values(Department).forEach(dept => {
      communities.push({
          id: getPublicDeptCommunityId(dept),
          name: `AOT - ${DEPT_FULL_NAMES[dept]}`,
          description: `Official public forum for the ${DEPT_FULL_NAMES[dept]} department. Open to all students.`,
          type: 'PUBLIC_DEPT',
          category: 'ACADEMIC',
          memberCount: Math.floor(Math.random() * 200) + 50,
          rules: ['Academic discussions only', 'Respect faculty and peers']
      });
  });

  // 3. Restricted Year-Specific Communities
  Object.values(Department).forEach(dept => {
      Object.values(Year).forEach(year => {
          if (dept === Department.MCA && year === Year.FOURTH) return; // MCA has 3 years

          communities.push({
              id: getRestrictedCommunityId(dept, year),
              name: `${dept} ${year}`,
              description: `Private group for ${dept} ${year} students. Hidden from others.`,
              type: 'RESTRICTED_YEAR',
              category: 'ACADEMIC',
              memberCount: Math.floor(Math.random() * 60) + 10,
              isPrivate: true,
              rules: ['Confidential discussions', 'Class updates only']
          });
      });
  });

  // 4. Open Clubs & Interest Communities
  const clubs = [
      { id: 'c-club-coding', name: 'Coding Club', desc: 'Competitive programming, hackathons, and dev talks.' },
      { id: 'c-club-music', name: 'Music Society', desc: 'Jam sessions, band formation, and event planning.' },
      { id: 'c-club-robotics', name: 'Robotics Club', desc: 'Building bots, drone workshops, and tech fests.' },
      { id: 'c-club-sports', name: 'Sports Club', desc: 'Cricket, Football, and inter-college tournaments.' },
      { id: 'c-club-placement', name: 'Placement Prep', desc: 'Mock interviews, aptitude tests, and career guidance.' },
      { id: 'c-club-photo', name: 'Photography Club', desc: 'Capture the campus moments. Photo walks and editing workshops.' }
  ];

  clubs.forEach(club => {
      communities.push({
          id: club.id,
          name: club.name,
          description: club.desc,
          type: 'OPEN_CLUB',
          category: 'INTEREST',
          memberCount: Math.floor(Math.random() * 100) + 20,
          rules: ['Participate actively', 'Share your work']
      });
  });

  localStorage.setItem(STORAGE_KEYS.COMMUNITIES, JSON.stringify(communities));

  // --- CLEANUP LEGACY DEMO POSTS (Migration) ---
  // Ensure we remove the old hardcoded demo posts if they exist in storage
  const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
  if (storedPosts) {
      let posts = JSON.parse(storedPosts) as Post[];
      const idsToRemove = ['p-2', 'p-3'];
      const filtered = posts.filter(p => !idsToRemove.includes(p.id));
      if (filtered.length !== posts.length) {
          localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filtered));
      }
  }

  // --- SEED POSTS ---
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    const initialPosts: Post[] = [
      {
        id: 'p-1',
        communityId: 'c-global',
        authorId: 'u-admin',
        authorName: 'System Admin',
        title: 'Welcome to AOT Connect',
        content: '📢 Welcome to the new AOT Connect! Explore your Department channels and join Clubs to get started.',
        timestamp: Date.now() - 100000,
        likes: 45,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        comments: [],
        isAnonymousPost: false,
        isPublic: true,
        postType: 'ANNOUNCEMENT',
        tags: ['#Welcome', '#AOT', '#Official'],
        views: 1205,
        bookmarkedBy: []
      }
    ];
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
  }
};

seedData();

// Helper to hydrate posts
const hydratePosts = (posts: Post[]): Post[] => {
  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const communities: Community[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITIES) || '[]');
  const userMap = new Map(users.map((u) => [u.id, u]));
  const commMap = new Map(communities.map((c) => [c.id, c]));

  // Recursively hydrate comments
  const hydrateComments = (comments: Comment[], community: Community | undefined): Comment[] => {
      return comments.map(c => {
          const author = userMap.get(c.authorId);
          
          // Anonymity Logic for Comments:
          // If User is Anonymous Globally AND it's a Public Space -> Enforce Anonymity Retroactively
          // Or if post/comment context implies anonymity.
          const isPublicSpace = community && community.type !== 'RESTRICTED_YEAR';
          const isEffectiveAnon = (author?.isAnonymous && isPublicSpace);

          let authorName = c.authorName;
          let authorAvatar = c.authorAvatar;

          if (isEffectiveAnon) {
              authorName = 'Anonymous Student';
              authorAvatar = undefined;
          } else if (author) {
              authorName = author.fullName;
              authorAvatar = author.avatarUrl;
          }

          const hydrated: Comment = {
              ...c,
              authorName,
              authorAvatar,
          };
          
          if (hydrated.replies && hydrated.replies.length > 0) {
              hydrated.replies = hydrateComments(hydrated.replies, community);
          }
          return hydrated;
      });
  };

  return posts.map(p => {
      const post = { ...p };
      const author = userMap.get(post.authorId);
      const community = commMap.get(post.communityId);

      if (community) {
          post.communityName = community.name;
      }

      // Anonymity Logic for Posts
      const isPublicSpace = community && community.type !== 'RESTRICTED_YEAR';
      // Retroactive Check: If author is anonymous globally and it's a public space, enforce anonymity
      const isGlobalAnon = author?.isAnonymous && isPublicSpace;
      // Effective Anonymity: Either per-post flag OR global flag enforcement
      const isEffectiveAnon = post.isAnonymousPost || isGlobalAnon;

      if (isEffectiveAnon) {
          post.authorName = 'Anonymous Student';
          post.authorAvatar = undefined;
          post.isAnonymousPost = true; // Ensure UI treats it as anonymous (disabling links, etc.)
      } else if (author) {
          post.authorName = author.fullName;
          post.authorAvatar = author.avatarUrl;
      } else {
          post.authorName = 'Unknown User';
          post.authorAvatar = undefined;
      }
      
      if (post.comments) {
          post.comments = hydrateComments(post.comments, community);
      }
      return post;
  });
}

export const storageService = {
  getUsers: (): User[] => {
    const usersRaw = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    // Ensure following/followers are arrays to prevent crashes
    return usersRaw.map((u: any) => ({
        ...u,
        following: Array.isArray(u.following) ? u.following : [],
        followers: Array.isArray(u.followers) ? u.followers : [],
        joinedCommunityIds: Array.isArray(u.joinedCommunityIds) ? u.joinedCommunityIds : [],
        interests: Array.isArray(u.interests) ? u.interests : []
    }));
  },

  getUserById: (id: string): User | undefined => {
    const users = storageService.getUsers();
    return users.find(u => u.id === id);
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    // Ensure arrays exist before saving
    if (!user.following) user.following = [];
    if (!user.followers) user.followers = [];

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    let user = JSON.parse(data);
    const freshUser = storageService.getUserById(user.id);
    const finalUser = freshUser || user;
    
    // Ensure arrays exist
    if (!Array.isArray(finalUser.following)) finalUser.following = [];
    if (!Array.isArray(finalUser.followers)) finalUser.followers = [];
    if (!Array.isArray(finalUser.joinedCommunityIds)) finalUser.joinedCommunityIds = [];
    if (!Array.isArray(finalUser.interests)) finalUser.interests = [];
    
    return finalUser;
  },

  setCurrentUser: (user: User | null, token?: string) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      if (token) {
        localStorage.setItem("aot_token", token);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem("aot_token");
    }
  },


  // UPDATED: Logic to filter visible communities based on user
  getCommunities: (user?: User): Community[] => {
    const allCommunities = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITIES) || '[]') as Community[];
    
    // CHANGE: Admin sees all communities
    if (user?.role === UserRole.ADMIN) return allCommunities;

    if (!user) return allCommunities.filter(c => c.type !== 'RESTRICTED_YEAR');

    const myRestrictedId = user.department && user.year 
        ? getRestrictedCommunityId(user.department, user.year) 
        : null;

    return allCommunities.filter(c => {
        if (c.type === 'RESTRICTED_YEAR') {
            return c.id === myRestrictedId; // Only show MY restricted community
        }
        return true; // Show all others (Common, Public Dept, Clubs)
    });
  },

  // Helper for admin setup
  getAllCommunities: (): Community[] => {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITIES) || '[]') as Community[];
  },
  
  getCommunityById: (id: string): Community | undefined => {
      const comms = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITIES) || '[]');
      return comms.find((c: Community) => c.id === id);
  },

  getPosts: (communityId: string): Post[] => {
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    const communityPosts = allPosts.filter(p => p.communityId === communityId).sort((a, b) => b.timestamp - a.timestamp);
    return hydratePosts(communityPosts);
  },

  // UPDATED: Aggregated Feed logic (For You)
  getHomeFeed: (user: User): Post[] => {
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    
    // Filter posts from communities the user has joined
    // OR public posts from ANY community (except restricted ones user isn't in)
    // For "For You", we prioritize joined communities but can mix in trending public posts
    
    // Simple logic: Show posts from Joined Communities + Global Posts
    const feedPosts = allPosts.filter(p => {
        return (user.joinedCommunityIds && user.joinedCommunityIds.includes(p.communityId)) || p.communityId === 'c-global';
    }).sort((a, b) => b.timestamp - a.timestamp);

    return hydratePosts(feedPosts);
  },

  getUserPosts: (userId: string): Post[] => {
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    const userPosts = allPosts.filter(p => p.authorId === userId).sort((a, b) => b.timestamp - a.timestamp);
    return hydratePosts(userPosts);
  },

  // ASYNC BACKEND METHODS
  getHomeFeedAsync: async (user: User): Promise<Post[]> => {
    const { getPosts } = require("./api");
    try {
      const posts = await getPosts();
      // Filter logic similar to sync version if backend doesn't filter yet
      const feedPosts = posts.filter((p: any) => {
        return (user.joinedCommunityIds && user.joinedCommunityIds.includes(p.community_id)) || p.community_id === 'c-global';
      });
      // Map backend fields to frontend fields
      return feedPosts.map((p: any) => ({
        id: p.id,
        communityId: p.community_id,
        authorId: p.author_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        communityName: p.community_name,
        title: p.title,
        content: p.content,
        timestamp: new Date(p.created_at).getTime(),
        likes: p.likes || 0,
        dislikes: p.dislikes || 0,
        likedBy: [],
        dislikedBy: [],
        comments: [],
        isAnonymousPost: p.is_anonymous_post,
        postType: p.post_type,
        tags: p.tags || [],
        views: p.views || 0,
        bookmarkedBy: []
      }));
    } catch (err) {
      console.error(err);
      return storageService.getHomeFeed(user); // Fallback to local
    }
  },

  getPostsAsync: async (communityId: string): Promise<Post[]> => {
    const { getPosts } = require("./api");
    try {
      const posts = await getPosts(communityId);
      return posts.map((p: any) => ({
        id: p.id,
        communityId: p.community_id,
        authorId: p.author_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        communityName: p.community_name,
        title: p.title,
        content: p.content,
        timestamp: new Date(p.created_at).getTime(),
        likes: p.likes || 0,
        dislikes: p.dislikes || 0,
        likedBy: [],
        dislikedBy: [],
        comments: [],
        isAnonymousPost: p.is_anonymous_post,
        postType: p.post_type,
        tags: p.tags || [],
        views: p.views || 0,
        bookmarkedBy: []
      }));
    } catch (err) {
      console.error(err);
      return storageService.getPosts(communityId);
    }
  },

  getUserPostsAsync: async (userId: string): Promise<Post[]> => {
    const { getPosts } = require("./api");
    try {
      const posts = await getPosts();
      // Filter posts by authorId
      const userPosts = posts.filter((p: any) => p.author_id === userId);
      return userPosts.map((p: any) => ({
        id: p.id,
        communityId: p.community_id,
        authorId: p.author_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        communityName: p.community_name,
        title: p.title,
        content: p.content,
        timestamp: new Date(p.created_at).getTime(),
        likes: p.likes || 0,
        dislikes: p.dislikes || 0,
        likedBy: [],
        dislikedBy: [],
        comments: [],
        isAnonymousPost: p.is_anonymous_post,
        postType: p.post_type,
        tags: p.tags || [],
        views: p.views || 0,
        bookmarkedBy: []
      }));
    } catch (err) {
      console.error(err);
      return storageService.getUserPosts(userId);
    }
  },



  createPost: async (post: Post) => {
    const { createPost } = require("./api");
    try {
      await createPost({
        id: post.id,
        communityId: post.communityId,
        authorId: post.authorId,
        title: post.title || '',
        content: post.content,
        postType: post.postType || 'DEFAULT',
        isAnonymousPost: post.isAnonymousPost || false,
        tags: post.tags || []
      });
    } catch (err) {
      console.error("Failed to persist post to backend", err);
    }

    // Fallback/Local cache
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    post.title = post.title || '';
    post.likedBy = [];
    post.dislikedBy = [];
    post.likes = 0;
    post.dislikes = 0;
    post.views = 0;
    post.bookmarkedBy = [];
    post.tags = post.tags || [];
    post.postType = post.postType || 'DEFAULT';
    
    allPosts.unshift(post);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
  },


  deletePost: (postId: string) => {
    let allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    allPosts = allPosts.filter(p => p.id !== postId);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
  },

  addComment: (postId: string, comment: Comment) => {
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        const post = allPosts[postIndex];
        if (!post.comments) post.comments = [];
        
        // Init extended fields
        comment.likes = 0;
        comment.likedBy = [];
        comment.replies = [];
        
        post.comments.push(comment);
        allPosts[postIndex] = post;
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
    }
  },

  getCommentsAsync: async (postId: string): Promise<Comment[]> => {
      const { getComments } = require("./api");
      try {
          const comments = await getComments(postId);
          return comments.map((c: any) => ({
              id: c.id,
              postId: c.post_id,
              authorId: c.author_id,
              authorName: c.author_name,
              authorAvatar: c.author_avatar,
              content: c.content,
              timestamp: new Date(c.created_at).getTime(),
              likes: c.likes_count || 0,
              likedBy: [],
              replies: []
          }));
      } catch (err) {
          console.error(err);
          return [];
      }
  },

  addCommentAsync: async (postId: string, comment: Partial<Comment>) => {
      const { addComment } = require("./api");
      try {
          await addComment(postId, {
              authorId: comment.authorId,
              content: comment.content,
              parentCommentId: comment.parentCommentId
          });
      } catch (err) {
          console.error(err);
      }
  },


  addReply: (postId: string, parentCommentId: string, reply: Comment) => {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
      const postIndex = allPosts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
          const post = allPosts[postIndex];
          const parent = post.comments.find(c => c.id === parentCommentId);
          if (parent) {
              if (!parent.replies) parent.replies = [];
              // Init extended fields
              reply.likes = 0;
              reply.likedBy = [];
              reply.replies = [];
              parent.replies.push(reply);
              allPosts[postIndex] = post;
              localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
          }
      }
  },

  deleteComment: (postId: string, commentId: string) => {
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        const post = allPosts[postIndex];
        if (post.comments) {
            // Filter top level
            const originalLength = post.comments.length;
            post.comments = post.comments.filter(c => c.id !== commentId);
            
            // If not found in top level, check replies
            if (post.comments.length === originalLength) {
                post.comments.forEach(c => {
                    if (c.replies) {
                        c.replies = c.replies.filter(r => r.id !== commentId);
                    }
                });
            }

            allPosts[postIndex] = post;
            localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
        }
    }
  },
  
  updateComment: (postId: string, commentId: string, newContent: string) => {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
      const postIndex = allPosts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
          const post = allPosts[postIndex];
          // Search in top level
          let target = post.comments.find(c => c.id === commentId);
          if (!target) {
              // Search in replies
              for (const c of post.comments) {
                  if (c.replies) {
                      target = c.replies.find(r => r.id === commentId);
                      if (target) break;
                  }
              }
          }
          
          if (target) {
              target.content = newContent;
              allPosts[postIndex] = post;
              localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
          }
      }
  },

  toggleCommentLike: (postId: string, commentId: string, userId: string) => {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
      const postIndex = allPosts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
          const post = allPosts[postIndex];
          
          const toggleLike = (c: Comment) => {
              if (!c.likedBy) c.likedBy = [];
              if (typeof c.likes !== 'number') c.likes = 0;

              if (c.likedBy.includes(userId)) {
                  c.likedBy = c.likedBy.filter(id => id !== userId);
                  c.likes = Math.max(0, c.likes - 1);
              } else {
                  c.likedBy.push(userId);
                  c.likes++;
              }
          };

          // Search top level
          let target = post.comments.find(c => c.id === commentId);
          if (target) {
              toggleLike(target);
          } else {
              // Search replies
              for (const c of post.comments) {
                  if (c.replies) {
                      target = c.replies.find(r => r.id === commentId);
                      if (target) {
                          toggleLike(target);
                          break;
                      }
                  }
              }
          }
          
          if (target) {
             allPosts[postIndex] = post;
             localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
          }
      }
  },

  joinCommunity: async (userId: string, communityId: string) => {
    const { joinCommunity } = require("./api");
    try {
      await joinCommunity(userId, communityId);
    } catch (err) {
      console.error("Failed to join community on backend", err);
    }

    const users = storageService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = users[userIndex];
    if (!user.joinedCommunityIds.includes(communityId)) {
      user.joinedCommunityIds.push(communityId);
      storageService.saveUser(user);
      
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        storageService.setCurrentUser(user);
      }
    }
  },

  
  leaveCommunity: async (userId: string, communityId: string) => {
      const { leaveCommunity } = require("./api");
      try {
          await leaveCommunity(userId, communityId);
      } catch (err) {
          console.error("Failed to leave community on backend", err);
      }

      const users = storageService.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;

      const user = users[userIndex];
      user.joinedCommunityIds = user.joinedCommunityIds.filter(id => id !== communityId);
      storageService.saveUser(user);
      
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        storageService.setCurrentUser(user);
      }
  },


  toggleFollow: async (currentUserId: string, targetUserId: string) => {
    const { toggleFollow } = require("./api");
    try {
        await toggleFollow(targetUserId, currentUserId);
    } catch (err) {
        console.error("Failed to toggle follow on backend", err);
    }

    const users = storageService.getUsers(); 
    const currentUserIdx = users.findIndex(u => u.id === currentUserId);
    const targetUserIdx = users.findIndex(u => u.id === targetUserId);

    if (currentUserIdx === -1 || targetUserIdx === -1) return;

    const currentUser = { ...users[currentUserIdx] };
    const targetUser = { ...users[targetUserIdx] };

    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
    } else {
        if (!currentUser.following.includes(targetUserId)) {
            currentUser.following.push(targetUserId);
        }
        if (!targetUser.followers.includes(currentUserId)) {
            targetUser.followers.push(currentUserId);
        }
    }

    users[currentUserIdx] = currentUser;
    users[targetUserIdx] = targetUser;
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    const sessionUser = storageService.getCurrentUser();
    if (sessionUser && sessionUser.id === currentUserId) {
        storageService.setCurrentUser(currentUser);
    }
  },


  toggleBookmark: async (postId: string, userId: string) => {
    const { interactWithPost } = require("./api");
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        const post = allPosts[postIndex];
        if (!post.bookmarkedBy) post.bookmarkedBy = [];
        
        const isBookmarked = post.bookmarkedBy.includes(userId);
        try {
            await interactWithPost(postId, userId, isBookmarked ? 'UNBOOKMARK' : 'BOOKMARK');
        } catch (err) {
            console.error(err);
        }

        if (isBookmarked) {
            post.bookmarkedBy = post.bookmarkedBy.filter(id => id !== userId);
        } else {
            post.bookmarkedBy.push(userId);
        }
        allPosts[postIndex] = post;
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
    }
  },


  incrementViews: (postId: string) => {
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        const post = allPosts[postIndex];
        post.views = (post.views || 0) + 1;
        allPosts[postIndex] = post;
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
    }
  },

  // UPDATED: Helper to get auto-join IDs
  getAutoJoinCommunityIds: (dept: Department, year: Year): string[] => {
    return [
        'c-global',
        getPublicDeptCommunityId(dept),
        getRestrictedCommunityId(dept, year)
    ];
  },
  
  // Kept for backward compat / specific calls
  getAutoJoinCommunityId: (dept: Department, year: Year): string => {
       return getRestrictedCommunityId(dept, year);
  },

  toggleLike: async (postId: string, userId: string) => {
      const { interactWithPost } = require("./api");
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
      const postIndex = allPosts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
          const post = allPosts[postIndex];
          if (!post.likedBy) post.likedBy = [];
          if (!post.dislikedBy) post.dislikedBy = [];
          
          if (typeof post.likes !== 'number') post.likes = 0;
          if (typeof post.dislikes !== 'number') post.dislikes = 0;

          const alreadyLiked = post.likedBy.includes(userId);
          const alreadyDisliked = post.dislikedBy.includes(userId);

          try {
              await interactWithPost(postId, userId, alreadyLiked ? 'UNLIKE' : 'LIKE');
          } catch (err) {
              console.error(err);
          }

          if (alreadyLiked) {
              post.likedBy = post.likedBy.filter(id => id !== userId);
              post.likes = Math.max(0, post.likes - 1);
          } else {
              post.likedBy.push(userId);
              post.likes++;
              if (alreadyDisliked) {
                  post.dislikedBy = post.dislikedBy.filter(id => id !== userId);
                  post.dislikes = Math.max(0, post.dislikes - 1);
              }
          }
          
          allPosts[postIndex] = post;
          localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
      }
  },


  toggleDislike: async (postId: string, userId: string) => {
      const { interactWithPost } = require("./api");
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
      const postIndex = allPosts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
          const post = allPosts[postIndex];
          if (!post.likedBy) post.likedBy = [];
          if (!post.dislikedBy) post.dislikedBy = [];

          if (typeof post.likes !== 'number') post.likes = 0;
          if (typeof post.dislikes !== 'number') post.dislikes = 0;

          const alreadyDisliked = post.dislikedBy.includes(userId);
          const alreadyLiked = post.likedBy.includes(userId);

          try {
              await interactWithPost(postId, userId, alreadyDisliked ? 'UNDISLIKE' : 'DISLIKE');
          } catch (err) {
              console.error(err);
          }

          if (alreadyDisliked) {
              post.dislikedBy = post.dislikedBy.filter(id => id !== userId);
              post.dislikes = Math.max(0, post.dislikes - 1);
          } else {
              post.dislikedBy.push(userId);
              post.dislikes++;
              if (alreadyLiked) {
                  post.likedBy = post.likedBy.filter(id => id !== userId);
                  post.likes = Math.max(0, post.likes - 1);
              }
          }

          allPosts[postIndex] = post;
          localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
      }
  },


  votePoll: (postId: string, optionId: string) => {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]') as Post[];
      const post = allPosts.find(p => p.id === postId);
      if (post && post.poll) {
          const option = post.poll.options.find(o => o.id === optionId);
          if (option) {
              option.votes += 1;
              post.poll.totalVotes += 1;
              localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
          }
      }
  },

  fileToBase64: (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  },

  // --- CHAT SERVICES ---

  getSelfChatId: (userId: string) => `chat-self-${userId}`,

  getChats: (userId: string): Chat[] => {
    const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]') as Chat[];
    let userChats = allChats.filter(c => c.participantIds.includes(userId));

    // Ensure the "Official Announcements" chat exists for every user
    const hasAnnouncementChat = userChats.some(c => c.id === 'chat-announcements');
    
    // Virtual injection of announcement chat if not present in user's list
    if (!hasAnnouncementChat) {
        const adminMsg = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]').filter((m: ChatMessage) => m.chatId === 'chat-announcements').pop();
        
        const announcementChat: Chat = {
            id: 'chat-announcements',
            participantIds: ['u-admin', userId], // Virtual participation
            initiatorId: 'u-admin',
            status: ChatStatus.ACCEPTED,
            updatedAt: adminMsg ? adminMsg.timestamp : Date.now(),
            lastMessage: adminMsg ? { content: adminMsg.content, timestamp: adminMsg.timestamp } : { content: 'Welcome', timestamp: Date.now()}
        };
        userChats.unshift(announcementChat);
    }

    // --- SELF CHAT INJECTION ---
    const selfChatId = storageService.getSelfChatId(userId);
    const selfChatMsg = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]').filter((m: ChatMessage) => m.chatId === selfChatId).pop();
    
    const selfChat: Chat = {
        id: selfChatId,
        participantIds: [userId],
        initiatorId: userId,
        status: ChatStatus.ACCEPTED,
        updatedAt: selfChatMsg ? selfChatMsg.timestamp : Date.now(), 
        lastMessage: selfChatMsg ? { content: selfChatMsg.content, timestamp: selfChatMsg.timestamp } : { content: 'Private Notes', timestamp: Date.now() }
    };
    
    userChats = userChats.filter(c => c.id !== selfChatId);
    userChats.unshift(selfChat);

    return userChats.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getChatBetweenUsers: (user1Id: string, user2Id: string): Chat | undefined => {
    const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]') as Chat[];
    return allChats.find(c => c.participantIds.includes(user1Id) && c.participantIds.includes(user2Id));
  },

  createChatRequest: (fromId: string, toId: string): Chat => {
    const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]') as Chat[];
    
    const existing = allChats.find(c => c.participantIds.includes(fromId) && c.participantIds.includes(toId));
    if (existing) return existing;

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      participantIds: [fromId, toId],
      initiatorId: fromId,
      status: ChatStatus.PENDING,
      updatedAt: Date.now()
    };
    
    allChats.push(newChat);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
    return newChat;
  },

  acceptChatRequest: (chatId: string) => {
    const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]') as Chat[];
    const chatIndex = allChats.findIndex(c => c.id === chatId);
    if (chatIndex >= 0) {
      allChats[chatIndex].status = ChatStatus.ACCEPTED;
      allChats[chatIndex].updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
    }
  },

  rejectChatRequest: (chatId: string) => {
    let allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]') as Chat[];
    allChats = allChats.filter(c => c.id !== chatId);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
  },

  getChatMessages: (chatId: string): ChatMessage[] => {
    const allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]') as ChatMessage[];
    return allMsgs.filter(m => m.chatId === chatId).sort((a, b) => a.timestamp - b.timestamp);
  },
  
  getSelfMessages: (userId: string): ChatMessage[] => {
      const selfChatId = storageService.getSelfChatId(userId);
      return storageService.getChatMessages(selfChatId);
  },

  sendChatMessage: (chatId: string, senderId: string, content: string, attachments?: Attachment[]) => {
    const allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]') as ChatMessage[];
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId,
      content,
      timestamp: Date.now(),
      attachments
    };
    allMsgs.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMsgs));

    const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]') as Chat[];
    const chatIndex = allChats.findIndex(c => c.id === chatId);
    
    if (chatIndex >= 0) {
      const displayContent = attachments && attachments.length > 0 && !content ? `[Attachment] ${attachments[0].name}` : content;
      allChats[chatIndex].lastMessage = { content: displayContent, timestamp: newMessage.timestamp };
      allChats[chatIndex].updatedAt = newMessage.timestamp;
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
    }
  },
  
  sendSelfMessage: (userId: string, content: string, attachments?: Attachment[]) => {
      const selfChatId = storageService.getSelfChatId(userId);
      storageService.sendChatMessage(selfChatId, userId, content, attachments);
  },
  
  deleteMessage: (messageId: string) => {
      let allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]') as ChatMessage[];
      allMsgs = allMsgs.filter(m => m.id !== messageId);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMsgs));
  }
};