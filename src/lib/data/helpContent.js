/**
 * Help Content Data
 * Contains all help content for the application
 */

export const helpSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    description: 'Learn the basics of using GearGrab',
    articles: [
      {
        id: 'create-account',
        title: 'Creating Your Account',
        content: 'Learn how to sign up and set up your GearGrab profile.',
        tags: ['account', 'signup', 'profile']
      },
      {
        id: 'browse-gear',
        title: 'Browsing Available Gear',
        content: 'Discover how to find the perfect gear for your adventure.',
        tags: ['browse', 'search', 'gear']
      },
      {
        id: 'first-booking',
        title: 'Making Your First Booking',
        content: 'Step-by-step guide to booking your first rental.',
        tags: ['booking', 'rental', 'first-time']
      }
    ]
  },
  {
    id: 'renting',
    title: 'Renting Gear',
    icon: '🎒',
    description: 'Everything about renting gear from others',
    articles: [
      {
        id: 'how-to-book',
        title: 'How to Book Gear',
        content: 'Complete guide to the booking process.',
        tags: ['booking', 'process', 'rental']
      },
      {
        id: 'payment-methods',
        title: 'Payment Methods',
        content: 'Learn about accepted payment methods and security.',
        tags: ['payment', 'security', 'billing']
      },
      {
        id: 'pickup-delivery',
        title: 'Pickup and Delivery',
        content: 'Options for getting your rented gear.',
        tags: ['pickup', 'delivery', 'logistics']
      },
      {
        id: 'guarantee-protection',
        title: 'GearGrab Guarantee and Protection',
        content: 'Understanding rental GearGrab Guarantee options.',
        tags: ['guarantee', 'protection', 'coverage']
      }
    ]
  },
  {
    id: 'listing',
    title: 'Listing Your Gear',
    icon: '📝',
    description: 'How to list and manage your gear rentals',
    articles: [
      {
        id: 'create-listing',
        title: 'Creating a Listing',
        content: 'How to create an attractive and effective gear listing.',
        tags: ['listing', 'create', 'photos']
      },
      {
        id: 'pricing-strategy',
        title: 'Pricing Your Gear',
        content: 'Tips for competitive and profitable pricing.',
        tags: ['pricing', 'strategy', 'profit']
      },
      {
        id: 'managing-bookings',
        title: 'Managing Bookings',
        content: 'How to handle incoming booking requests.',
        tags: ['bookings', 'management', 'requests']
      },
      {
        id: 'gear-maintenance',
        title: 'Gear Maintenance',
        content: 'Keeping your gear in top condition for renters.',
        tags: ['maintenance', 'care', 'quality']
      }
    ]
  },
  {
    id: 'safety',
    title: 'Safety & Trust',
    icon: '🛡️',
    description: 'Staying safe and building trust in the community',
    articles: [
      {
        id: 'safety-guidelines',
        title: 'Safety Guidelines',
        content: 'Essential safety tips for all users.',
        tags: ['safety', 'guidelines', 'tips']
      },
      {
        id: 'verification-process',
        title: 'User Verification',
        content: 'How our verification process works.',
        tags: ['verification', 'identity', 'trust']
      },
      {
        id: 'reporting-issues',
        title: 'Reporting Issues',
        content: 'How to report problems or concerns.',
        tags: ['reporting', 'issues', 'support']
      },
      {
        id: 'dispute-resolution',
        title: 'Dispute Resolution',
        content: 'How we handle disputes between users.',
        tags: ['disputes', 'resolution', 'mediation']
      }
    ]
  },
  {
    id: 'account',
    title: 'Account Management',
    icon: '👤',
    description: 'Managing your account and settings',
    articles: [
      {
        id: 'profile-settings',
        title: 'Profile Settings',
        content: 'How to update your profile information.',
        tags: ['profile', 'settings', 'personal']
      },
      {
        id: 'notification-preferences',
        title: 'Notification Preferences',
        content: 'Customizing your notification settings.',
        tags: ['notifications', 'preferences', 'email']
      },
      {
        id: 'privacy-settings',
        title: 'Privacy Settings',
        content: 'Controlling your privacy and data sharing.',
        tags: ['privacy', 'data', 'security']
      },
      {
        id: 'account-deletion',
        title: 'Account Deletion',
        content: 'How to delete your account if needed.',
        tags: ['deletion', 'account', 'removal']
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    description: 'Common issues and solutions',
    articles: [
      {
        id: 'login-issues',
        title: 'Login Problems',
        content: 'Solving common login and authentication issues.',
        tags: ['login', 'authentication', 'password']
      },
      {
        id: 'payment-issues',
        title: 'Payment Problems',
        content: 'Resolving payment and billing issues.',
        tags: ['payment', 'billing', 'errors']
      },
      {
        id: 'booking-issues',
        title: 'Booking Problems',
        content: 'Common booking issues and solutions.',
        tags: ['booking', 'errors', 'problems']
      },
      {
        id: 'app-performance',
        title: 'App Performance',
        content: 'Improving app performance and resolving technical issues.',
        tags: ['performance', 'technical', 'speed']
      }
    ]
  }
];

export const faqItems = [
  {
    id: 'what-is-geargrab',
    question: 'What is GearGrab?',
    answer: 'GearGrab is a peer-to-peer platform that connects outdoor enthusiasts who want to rent gear with those who have gear to share. It\'s like Airbnb for outdoor equipment.',
    category: 'general'
  },
  {
    id: 'how-does-it-work',
    question: 'How does GearGrab work?',
    answer: 'Simply browse available gear in your area, contact the owner, book the dates you need, and arrange pickup or delivery. After your adventure, return the gear and leave a review.',
    category: 'general'
  },
  {
    id: 'is-it-safe',
    question: 'Is it safe to rent gear from strangers?',
    answer: 'Yes! We verify all users, provide GearGrab Guarantee options, and have a comprehensive review system. We also offer safety guidelines and dispute resolution services.',
    category: 'safety'
  },
  {
    id: 'what-if-gear-breaks',
    question: 'What if the gear breaks during my rental?',
    answer: 'Normal wear and tear is expected, but if gear is damaged due to misuse, you may be responsible for repair costs. Our GearGrab Guarantee options can help protect you.',
    category: 'guarantee'
  },
  {
    id: 'how-much-does-it-cost',
    question: 'How much does it cost to use GearGrab?',
    answer: 'GearGrab charges a small service fee on each booking. Renters pay the fee, while gear owners receive the full rental amount minus payment processing fees.',
    category: 'pricing'
  },
  {
    id: 'can-i-cancel-booking',
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel bookings according to the cancellation policy set by the gear owner. Cancellation policies vary, so check before booking.',
    category: 'booking'
  }
];

export const quickActions = [
  {
    id: 'contact-support',
    title: 'Contact Support',
    description: 'Get help from our support team',
    icon: '📧',
    action: 'contact-support'
  },
  {
    id: 'report-issue',
    title: 'Report an Issue',
    description: 'Report a problem or safety concern',
    icon: '⚠️',
    action: 'report-issue'
  },
  {
    id: 'community-guidelines',
    title: 'Community Guidelines',
    description: 'Read our community rules and guidelines',
    icon: '📋',
    action: 'community-guidelines'
  },
  {
    id: 'safety-tips',
    title: 'Safety Tips',
    description: 'Learn how to stay safe while using GearGrab',
    icon: '🛡️',
    action: 'safety-tips'
  }
];

export const helpContent = {
  helpSections,
  faqItems,
  quickActions
};

export default helpContent;
