export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  steps?: string[];
  tips?: string[];
  warnings?: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  articles: HelpArticle[];
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: 'contact' | 'report' | 'guidelines';
}

export const helpContent = {
  quickActions: [
    {
      id: 'contact-support',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: 'mail',
      color: 'blue',
      action: 'contact' as const
    },
    {
      id: 'report-issue',
      title: 'Report an Issue',
      description: 'Report safety or technical issues',
      icon: 'flag',
      color: 'red',
      action: 'report' as const
    },
    {
      id: 'community-guidelines',
      title: 'Community Guidelines',
      description: 'Learn about our community standards',
      icon: 'users',
      color: 'blue',
      action: 'guidelines' as const
    }
  ] as QuickAction[],

  communityGuidelines: {
    id: 'community-guidelines',
    title: 'Community Guidelines',
    content: 'Our Community Guidelines exist to foster a safe, respectful, and trustworthy marketplace for everyone—both renters and owners. By using GearGrab, you agree to follow these rules. Violations may result in warnings, account restrictions, or permanent bans.',
    sections: [
      {
        title: 'Respectful Communication',
        points: [
          'Treat every member with courtesy—no harassment, hate speech, or bullying',
          'Use clear and polite language when messaging',
          'Respond to messages in a timely manner',
          'Keep conversations relevant to the rental transaction'
        ]
      },
      {
        title: 'Honest Listings & Transparency',
        points: [
          'Always provide accurate, up-to-date information about your gear',
          'Disclose any known defects or damage',
          'Use real photos of your actual gear—no stock photos',
          'Update availability calendar regularly'
        ]
      },
      {
        title: 'Fair Pricing & Fees',
        points: [
          'Set rental prices that reflect your gear\'s condition and market rates',
          'No hidden fees—communicate all charges up front',
          'Honor the prices listed in your rental agreement',
          'Don\'t attempt to circumvent GearGrab\'s payment system'
        ]
      },
      {
        title: 'Prohibited Content & Behavior',
        points: [
          'No illegal or regulated items (e.g., weapons, restricted gear)',
          'No fraudulent bookings or payment scams',
          'No impersonation of other users, GearGrab staff, or trademarks',
          'No spam, duplicate listings, or misleading information'
        ]
      },
      {
        title: 'Safety & Trust Measures',
        points: [
          'Complete ID verification before renting or listing',
          'Maintain gear in clean, functioning, and safe condition',
          'Report any suspicious activity or policy violations promptly',
          'Meet in safe, public locations for gear exchanges'
        ]
      }
    ]
  },

  categories: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'play',
      description: 'Learn the basics of using GearGrab',
      articles: [
        {
          id: 'create-account',
          title: 'How to create an account',
          content: 'New to GearGrab? This section walks you through everything you need to get up and running—how to create an account, verify your identity, customize your profile, and understand our core community guidelines.',
          steps: [
            'Step-by-step instructions for registering on desktop or mobile (iOS/Android)',
            'Tips for choosing a strong password and setting up two-factor authentication (2FA)',
            'How to verify your email address and phone number',
            'What to do if you never receive the verification code'
          ]
        },
        {
          id: 'verify-identity',
          title: 'Verifying your identity',
          content: 'ID verification is mandatory for all new users and essential for trust and safety on our platform.',
          steps: [
            'Why ID verification matters for trust and safety (mandatory for all new users)',
            'Accepted IDs and how to upload them (driver\'s license, passport, state ID)',
            'How to complete the selfie check using your phone camera',
            'Troubleshooting common verification issues (blurriness, expired IDs)'
          ]
        },
        {
          id: 'setup-profile',
          title: 'Setting up your profile',
          content: 'Create a compelling profile that builds trust with other users.',
          steps: [
            'How to add a profile photo that meets our guidelines (clear headshot, good lighting)',
            'Writing an informative bio: What renters/owners want to know (location, experience, availability)',
            'Linking social profiles or adding additional identity proofs (e.g., LinkedIn) for extra verification points',
            'How to set your notification preferences (email vs. SMS)'
          ]
        },
        {
          id: 'community-guidelines',
          title: 'Understanding our community guidelines',
          content: 'Our Community Guidelines exist to foster a safe, respectful, and trustworthy marketplace for everyone.',
          steps: [
            'Key rules you must agree to before listing or renting',
            'Consequences of violating guidelines (warnings, suspensions, permanent bans)',
            'How we enforce policies (automated scans, human review)',
            'Where to go if you have questions about the rules'
          ]
        }
      ]
    },
    {
      id: 'renting',
      title: 'Renting Gear',
      icon: 'search',
      description: 'Everything about finding and booking gear',
      articles: [
        {
          id: 'search-gear',
          title: 'How to search for gear',
          content: 'Find the perfect equipment for your outdoor adventures with our powerful search tools.',
          steps: [
            'Using filters: Category (e.g., camping, water sports), date range, location radius, price range, gear type, brand',
            'Map view vs. list view: When to use each to find nearby listings',
            'Keyword search tips: Using "kayak," "inflatable paddleboard," "mountain bike," etc.',
            'Saving searches and setting up alerts for new listings matching your criteria'
          ]
        },
        {
          id: 'gear-conditions',
          title: 'Understanding gear conditions',
          content: 'Learn how to evaluate gear condition and make informed rental decisions.',
          steps: [
            'Explanation of condition ratings: "Like New," "Good," "Fair," "Needs Repair"',
            'How to read owner-provided condition reports and photos',
            'Questions to ask before booking: "When was the last maintenance check?" "Any known issues?"',
            'How to inspect gear at pickup: Visual cues (rust, tears, broken parts) and functional tests'
          ]
        },
        {
          id: 'booking-payment',
          title: 'Booking and payment process',
          content: 'Complete your rental booking with confidence using our secure payment system.',
          steps: [
            'Selecting rental dates and optional add-ons (e.g., helmet, life jacket, insurance)',
            'How rental pricing breaks down: nightly rate, cleaning fee, security deposit, service fee, insurance fee',
            'Accepted payment methods: major credit/debit cards, Apple Pay, Google Pay',
            'How to apply a promo code or referral discount',
            'Step-by-step walkthrough: "Confirm booking" → "Pay now" → "Receive booking confirmation email"'
          ]
        },
        {
          id: 'pickup-transfer',
          title: 'Pickup and transfer options',
          content: 'Coordinate smooth gear pickup and return with owners.',
          steps: [
            'Owner-managed pickup: Scheduling a time/location; what to bring (ID, confirmation code)',
            'Delivery/pickup services (if available in your area): How to request delivery, associated fees, time slots',
            'Contactless handoff: How to coordinate key lockboxes or secure drop-off points',
            'When to arrive early, when to be on time, and what to do if you\'re running late'
          ]
        },
        {
          id: 'gear-damage',
          title: 'What to do if gear is damaged',
          content: 'Handle gear damage situations properly to ensure fair resolution.',
          steps: [
            'Immediate steps: Documenting damage with timestamped photos/video and contacting the owner within 1 hour',
            'How to file a damage claim through GearGrab: Upload pictures, describe what happened',
            'Understanding deductible amounts, insurance coverage, and your liability as a renter',
            'When credits/refunds apply (e.g., if the gear is unusable on arrival)'
          ]
        }
      ]
    },
    {
      id: 'listing',
      title: 'Listing Your Gear',
      icon: 'plus',
      description: 'Start earning by sharing your equipment',
      articles: [
        {
          id: 'first-listing',
          title: 'Creating your first listing',
          content: 'Turn your idle gear into income with a compelling listing.',
          steps: [
            'Step-by-step: "Add New Listing" → "Select Category" → "Choose Subcategory" → "Enter Title & Description"',
            'Tips for writing a clear, honest title and description (brand/model/year, condition, features)',
            'Required fields: "Title," "Category," "Base Price," "Security Deposit," "Location"',
            'Preview your listing on desktop and mobile before publishing'
          ]
        },
        {
          id: 'great-photos',
          title: 'Taking great photos',
          content: 'High-quality photos are essential for successful listings.',
          steps: [
            'Recommended gear: DSLR or a modern smartphone with HDR enabled',
            'Light and background: Use clean, clutter-free background, shoot outdoors or near a window',
            'Angles to capture: Full gear profile, close-ups of any scratches or wear, functional shots',
            'Minimum of 5 photos: front view, side view, back view, accessories, and close-ups of defects'
          ],
          tips: [
            'Photo size and format: At least 1200×800 pixels, JPEG or PNG, no watermarks',
            'Remove personal items from the frame',
            'Don\'t use stock photos or images from Google'
          ]
        },
        {
          id: 'competitive-pricing',
          title: 'Setting competitive prices',
          content: 'Price your gear competitively to maximize bookings and earnings.',
          steps: [
            'How to research local market rates: Search similar listings by location, category, and condition',
            'Factoring in additional costs: Cleaning fees, delivery fees, insurance costs, service fees',
            'Seasonal pricing strategies: Higher rates during peak season, discounts during off-peak months',
            'Minimum rental period: One day, one weekend, weekly. How to choose based on gear type',
            'How to offer promotions: "First rental 10% off," "Book 3 days, get 1 free"'
          ]
        },
        {
          id: 'manage-calendar',
          title: 'Managing your calendar',
          content: 'Keep your availability up-to-date and avoid double-bookings.',
          steps: [
            'How to sync your GearGrab availability with personal calendars (Google Calendar, iCal)',
            'Block out dates for personal use, maintenance, or vacations',
            'Setting lead time (e.g., renters must book at least 24 hours in advance)',
            'How to edit or close listings temporarily: "Pause" listing vs. "Deactivate" permanently'
          ]
        },
        {
          id: 'handle-bookings',
          title: 'Handling bookings and communication',
          content: 'Manage rental requests and communicate effectively with renters.',
          steps: [
            'How to accept or decline a booking request: Check renter profile, messaging history',
            'Using the built-in messaging inbox: Templates for commonly asked questions',
            'Tips for clear communication: Confirm pickup location, time, what to bring (ID, deposit)',
            'How to send rental agreements or waivers (if required by local laws or insurance)',
            'Managing cancellations: Understanding GearGrab\'s cancellation policy'
          ]
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Trust',
      icon: 'shield',
      description: 'Stay safe and build trust in our community',
      articles: [
        {
          id: 'user-verification',
          title: 'User verification process',
          content: 'Trust and safety are at the core of GearGrab\'s mission. Every member must complete ID verification.',
          steps: [
            'Why verifying your identity matters: Reduces fraud, builds confidence, meets insurance requirements',
            'Submit a government-issued photo ID (driver\'s license, passport, state ID)',
            'Complete a selfie check: Take a live photo holding your ID',
            'GearGrab\'s review process (usually takes under 30 minutes during business hours)',
            'What happens if your verification fails: How to resubmit clearer photos'
          ]
        },
        {
          id: 'insurance-coverage',
          title: 'Insurance coverage explained',
          content: 'Understand how GearGrab\'s insurance protects both renters and owners.',
          steps: [
            'How GearGrab\'s renter insurance works: Covers up to $5,000 in accidental damage or theft',
            'Owner\'s insurance protection: If you list gear, you\'re covered up to $2,500 per incident',
            'When insurance applies: Accidental damage, theft (with police report)',
            'When insurance doesn\'t apply: Willful neglect, racing, illegal activities, wear-and-tear',
            'How to make an insurance claim: File within 24 hours, provide proof of gear value'
          ]
        },
        {
          id: 'report-safety',
          title: 'Reporting safety concerns',
          content: 'Know how to report safety issues and what to expect from our response.',
          steps: [
            'What qualifies as a safety concern: Threatening messages, unsafe pickup locations, dangerous gear',
            'Navigate to "Report an Issue" → "Safety Concern"',
            'Fill in details: user profiles involved, listing ID, date/time, location, description',
            'Attach evidence: screenshots, photos, recordings',
            'Our Safety & Trust team responds within 12 hours'
          ],
          warnings: [
            'For life-threatening situations, call 911 first',
            'Cancel booking immediately if you feel unsafe',
            'File a Safety Concern report afterward'
          ]
        },
        {
          id: 'dispute-resolution',
          title: 'Dispute resolution process',
          content: 'Understand how disputes are resolved fairly and efficiently.',
          steps: [
            'Step 1: Attempt direct resolution through GearGrab\'s messaging system',
            'Step 2: Mediation request—either party can click "Request Mediation"',
            'Step 3: Evidence collection—both sides submit photos, messages, invoices',
            'Step 4: Final decision—Trust & Safety reviews and issues binding resolution',
            'Appeal process: Submit appeal within 48 hours if you disagree with decision'
          ]
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Billing',
      icon: 'credit-card',
      description: 'Understand payments, fees, and payouts',
      articles: [
        {
          id: 'payment-methods',
          title: 'Payment methods and security',
          content: 'Learn about accepted payment methods and security measures.',
          steps: [
            'Accepted methods: Major credit/debit cards (Visa, Mastercard, American Express, Discover), Apple Pay, Google Pay, PayPal',
            'Why we don\'t accept cash or checks: Fraud prevention, transaction traceability',
            'PCI compliance and encryption: All card data is tokenized—GearGrab never stores raw card information',
            'How to add or remove a payment method in Account Settings',
            'What to do if your card is declined: Check billing address, CVV, sufficient funds'
          ]
        },
        {
          id: 'understanding-fees',
          title: 'Understanding fees',
          content: 'Breakdown of all fees associated with rentals.',
          steps: [
            'GearGrab service fee (10% – 15% of rental subtotal): Covers platform maintenance, support, trust & safety',
            'Cleaning fee (owner-defined): Charged by owner to cover cleaning costs—optional but visible at checkout',
            'Security deposit (owner-defined, refundable): Held by GearGrab upon booking',
            'Delivery/pickup fee (if applicable): Owners may charge extra for delivery',
            'Insurance fee (optional but recommended): Roughly $5–$20 per rental, covers accidental damage or theft'
          ]
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'cog',
      description: 'Troubleshoot technical issues',
      articles: [
        {
          id: 'app-issues',
          title: 'App not working properly',
          content: 'Common fixes for app crashes, freezes, and errors.',
          steps: [
            'Force-quit and relaunch the app',
            'Check for updates in the App Store/Google Play',
            'Clear app cache (Android: Settings → Apps → GearGrab → Storage → Clear Cache)',
            'Reinstall the app if problems persist',
            'Check GearGrab\'s status page (geargrab.statuspage.io) for known outages'
          ],
          tips: [
            'Switch networks (Wi-Fi vs. cellular) to rule out connectivity issues',
            'Try a different device to isolate the problem',
            'Collect logs: Go to App Settings → Help → "Send Diagnostic Logs"'
          ]
        },
        {
          id: 'login-issues',
          title: 'Login and password issues',
          content: 'Resolve login problems and reset passwords.',
          steps: [
            'Forgotten password: Click "Forgot Password?" and enter your registered email',
            'Check inbox and spam folder for password-reset link',
            'Choose a new password: At least 8 characters with uppercase, lowercase, and numeral',
            'Locked account: Wait 30 minutes, then try again. Contact Support if still locked',
            'Two-factor authentication problems: Use backup codes or contact Support with photo ID'
          ]
        }
      ]
    }
  ] as HelpCategory[]
};
