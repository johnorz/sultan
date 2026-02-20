/**
 * Shopee Sultan — Configuration
 * All tier, budget, reward, and financial parameters.
 * Change values here to adjust the entire app.
 */

const CONFIG = {
  // ===== CURRENCY =====
  currency: {
    code: 'IDR',
    symbol: '<svg class="sc-icon" viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="10" r="10" fill="#F9A825"/><circle cx="10" cy="10" r="8.5" fill="none" stroke="#F57F17" stroke-width="0.8" opacity="0.4"/><text x="10" y="14.5" text-anchor="middle" fill="#fff" font-size="12" font-weight="800" font-family="Arial,sans-serif">S</text></svg>',
    locale: 'id-ID',
    format(amount) {
      return amount.toLocaleString(this.locale);
    },
  },

  // ===== TIER DEFINITIONS =====
  tiers: {
    silver: {
      id: 'silver',
      name: 'Teman',
      color: '#A0AEC0',
      scoreRange: [0, 19],
      monthlySpendMin: 0,
      monthlySpendMax: 500000,
      giftBudget: 50000,
      maxPackets: 5,
      packetValue: 10000,
      packetSeal: 'S',
      packetStyle: 'silver',
      packetLabel: 'Basic Red',
      packetDescription: 'Paper envelope',
      vipRequired: 'None',
      isVip: false,
      perks: ['Link sharing', 'QR code', 'Phone Bump', 'Mass Airdrop'],
      sendMethods: ['link', 'qr', 'nfc', 'radar'],
      canRadar: true,
      canNfc: true,
      maxLinkSendsPerDay: 10,
      maxF2fBroadcastsPerHour: 5,
      rewardMultiplier: 0.5,        // T5 (Bottom) from reward_config
      trafficShare: 0.10,
      // Mock score components (out of their max)
      scoreComponents: { vip: 0, spend: 3, activity: 5, social: 2 },
    },
    gold: {
      id: 'gold',
      name: 'Sahabat',
      color: '#48BB78',
      scoreRange: [20, 39],
      monthlySpendMin: 500000,
      monthlySpendMax: 2000000,
      giftBudget: 200000,
      maxPackets: 15,
      packetValue: 13333,
      packetSeal: '🌿',
      packetStyle: 'gold',
      packetLabel: 'Green Packet',
      packetDescription: 'Jade silk envelope',
      vipRequired: 'None',
      isVip: false,
      perks: ['Link sharing', 'QR code', 'Phone Bump', 'Mass Airdrop'],
      sendMethods: ['link', 'qr', 'nfc', 'radar'],
      canRadar: true,
      canNfc: true,

      maxLinkSendsPerDay: 20,
      maxF2fBroadcastsPerHour: 5,
      rewardMultiplier: 0.8,        // T4 (Low) from reward_config
      trafficShare: 0.15,
      scoreComponents: { vip: 0, spend: 15, activity: 8, social: 5 },
    },
    platinum: {
      id: 'platinum',
      name: 'Dermawan',
      color: '#4299E1',
      scoreRange: [40, 59],
      monthlySpendMin: 2000000,
      monthlySpendMax: 5000000,
      giftBudget: 750000,
      maxPackets: 30,
      packetValue: 25000,
      packetSeal: '❄️',
      packetStyle: 'platinum',
      packetLabel: 'Blue Crystal',
      packetDescription: 'Frost crystal shard',
      vipRequired: 'VIP Silver',
      isVip: true,
      perks: ['Link sharing', 'QR code', 'Phone Bump', 'Mass Airdrop'],
      sendMethods: ['link', 'qr', 'nfc', 'radar'],
      canRadar: true,
      canNfc: true,

      maxLinkSendsPerDay: 30,
      maxF2fBroadcastsPerHour: 5,
      rewardMultiplier: 1.0,        // T3 (Mid) from reward_config
      trafficShare: 0.20,
      scoreComponents: { vip: 15, spend: 22, activity: 10, social: 5 },
    },
    diamond: {
      id: 'diamond',
      name: 'Juragan',
      color: '#9F7AEA',
      scoreRange: [60, 79],
      monthlySpendMin: 5000000,
      monthlySpendMax: 15000000,
      giftBudget: 2000000,
      maxPackets: 50,
      packetValue: 40000,
      packetSeal: '💎',
      packetStyle: 'diamond',
      packetLabel: 'Purple Royal',
      packetDescription: 'Amethyst gem packet',
      vipRequired: 'VIP Gold',
      isVip: true,
      perks: ['Link sharing', 'QR code', 'Phone Bump', 'Mass Airdrop'],
      sendMethods: ['link', 'qr', 'nfc', 'radar'],
      canRadar: true,
      canNfc: true,

      maxLinkSendsPerDay: 40,
      maxF2fBroadcastsPerHour: 8,
      rewardMultiplier: 1.2,        // T2 (Top) from reward_config
      trafficShare: 0.23,
      scoreComponents: { vip: 28, spend: 28, activity: 12, social: 7 },
    },
    sultan: {
      id: 'sultan',
      name: 'Sultan',
      color: '#FCD34D',
      scoreRange: [80, 100],
      monthlySpendMin: 15000000,
      monthlySpendMax: Infinity,
      giftBudget: 5000000,
      maxPackets: 100,
      packetValue: 50000,
      packetSeal: '👑',
      packetStyle: 'sultan',
      packetLabel: 'Black-Gold Luxe',
      packetDescription: 'Obsidian gold treasure',
      vipRequired: 'VIP Platinum',
      isVip: true,
      perks: ['Link sharing', 'QR code', 'Phone Bump', 'Mass Airdrop'],
      sendMethods: ['link', 'qr', 'nfc', 'radar'],
      canRadar: true,
      canNfc: true,

      maxLinkSendsPerDay: 50,
      maxF2fBroadcastsPerHour: 10,
      rewardMultiplier: 1.5,        // T1 (Sultan) from reward_config
      trafficShare: 0.32,
      scoreComponents: { vip: 40, spend: 35, activity: 14, social: 9 },
    },
  },

  // ===== TIER SCORE CALCULATION WEIGHTS =====
  scoring: {
    vipMembership: { weight: 0.40, maxPoints: 40, label: 'VIP Status' },
    monthlySpend:  { weight: 0.35, maxPoints: 35, label: 'Monthly Spend' },
    accountActivity: { weight: 0.15, maxPoints: 15, label: 'Activity' },
    socialEngagement: { weight: 0.10, maxPoints: 10, label: 'Social' },
  },

  // ===== RESERVE & DEDUCTION LOGIC =====
  transactions: {
    reserveOnSwipe: true,
    chargeOnAccept: true,
    returnOnDecline: true,
    autoExpireHours: 48,
    partialSettlement: true,
    showPendingInBalance: true,
  },

  // ===== SEND REWARDS (from reward_config.json: sender_incentives) =====
  sendRewards: {
    type: 'milestone_cumulative',
    milestoneStepUsers: 3,             // Every N successful referrals
    baseReward: 2000,                  // Rp 2,000 for first milestone
    incrementReward: 2000,             // +Rp 2,000 per subsequent milestone
    applyTierMultiplier: true,         // Multiply by tier multiplier
  },

  // ===== RECEIVER SEGMENTS (from reward_config.json) =====
  receiverSegments: [
    {
      id: 'existing_active',
      name: 'Existing MAU',
      populationMix: 0.60,
      rewardAmount: 200,
      frequencyCap: 10,
      conversionRate: 0.05,
      isIncremental: false,
      badge: "Friend's Treat",
      badgeColor: '#EE4D2D',
      badgeIcon: '🧧',
    },
    {
      id: 'new_active',
      name: 'New Active (Light Resurrection)',
      populationMix: 0.25,
      rewardAmount: 2000,
      frequencyCap: 1,
      conversionRate: 0.08,
      isIncremental: true,
      badge: 'Welcome Back Gift',
      badgeColor: '#4ecdc4',
      badgeIcon: '🎉',
    },
    {
      id: 'ra',
      name: 'Re-Activated (Deep Dormant)',
      populationMix: 0.10,
      rewardAmount: 10000,
      frequencyCap: 1,
      conversionRate: 0.15,
      isIncremental: true,
      badge: 'Welcome Back Gift',
      badgeColor: '#4ecdc4',
      badgeIcon: '🎉',
    },
    {
      id: 'new_user',
      name: 'Pure New User',
      populationMix: 0.05,
      rewardAmount: 15000,
      frequencyCap: 1,
      conversionRate: 0.20,
      isIncremental: true,
      badge: 'New User Bonus',
      badgeColor: '#8B5CF6',
      badgeIcon: '🎁',
    },
  ],

  // ===== TRAFFIC ASSUMPTIONS (from reward_config.json) =====
  trafficAssumptions: {
    totalSenders: 1000000,
    avgReferralsPerSender: 3.0,
    mauCannibalizationDecayRate: 0.15,
  },

  // ===== OPERATIONAL COSTS (from reward_config.json) =====
  operationalCosts: {
    fixedOpsCost: 200000000,
    description: 'Includes Marketing Buzz seeding and operational costs',
  },

  // ===== LEGACY RECEIVER CONFIG (kept for reference) =====
  receiver: {
    dormantThresholdDays: 30,
    claimDeadlineHours: 48,
  },

  // ===== RADAR BROADCAST =====
  radar: {
    maxRadiusMeters: 10,
    maxDetectedUsers: 20,
    defaultSelectedCount: 3,
    minSelectedCount: 1,
  },

  // ===== SWIPE GESTURE =====
  swipe: {
    thresholdPx: 120,
    velocityThreshold: 500,
    rubberBandDuration: 300,
  },

  // ===== ANIMATION DURATIONS (ms) =====
  animations: {
    packetGrab: 100,
    packetThrow: 400,
    numberReveal: 800,
    confettiDuration: 2000,
    screenTransition: 400,
    broadcastDuration: 3000,
    packetFlyDuration: 1500,            // Red packet fly animation
  },

  // ===== UI STRINGS =====
  strings: {
    senderNormal: {
      headerTitle: '🧧 Shopee Traktir',
      tagline: 'Spread joy to your friends!',
      balanceLabel: 'Your Coin Balance',
      swipeHint: 'Swipe packet up to send!',
      swipeFailHint: 'Swipe up harder!',
    },
    senderVip: {
      balanceLabel: 'Coin Treasury',
      swipeHint: 'Swipe Up to Make it Rain',
      broadcastSub: 'Broadcast to nearby friends',
    },
    receiver: {
      tapHintNormal: 'Tap packet to open',
      tapHintVip: "Tap to open Sultan's gift",
      finePrint: 'Sender is NOT charged until you accept. Unclaimed packets return to sender after 48 hours.',
      withdrawBtn: '💰 Withdraw to Wallet',
    },
    shareSheet: {
      title: 'Send your gift',
      f2fTitle: 'Nearby',
      socialTitle: 'Share via App',
      cancel: 'Cancel',
    },
    radar: {
      title: '📡 Mass Airdrop',
      subtitle: 'Choose how many people to gift nearby',
      costLabel: 'Maximum Budget Reserved',
      costNote: '✓ Only deducted when recipients accept',
      broadcastBtn: '📡 Start Airdrop',
      broadcasting: 'Airdropping... 💸',
    },
  },

  // ===== SOCIAL CHANNELS =====
  channels: [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', desc: 'Contact or group' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', desc: 'Chat' },
    { id: 'twitter', name: 'X', icon: '𝕏', desc: 'Post or DM' },
    { id: 'instagram', name: 'Instagram', icon: '📸', desc: 'Story or DM' },
  ],

  f2fMethods: [
    { id: 'phonebump', name: 'Phone Bump', icon: '📲', desc: 'Hold phones together' },
    { id: 'airdrop', name: 'Mass Airdrop', icon: '📡', desc: 'Send to everyone nearby' },
  ],

  // ===== RECENT RECIPIENTS MOCK DATA =====
  recipients: [
    { name: 'Dewi Lestari',   avatar: '👩', time: '2m ago',  claimed: true  },
    { name: 'Budi Santoso',   avatar: '👨', time: '15m ago', claimed: true  },
    { name: 'Rina Kartika',   avatar: '👩', time: '1h ago',  claimed: true  },
    { name: 'Ahmad Yusuf',    avatar: '👨', time: '3h ago',  claimed: false },
    { name: 'Siti Nurhaliza', avatar: '👩', time: '5h ago',  claimed: true  },
  ],

  // ===== MOCK ME TAB DATA (per tier) =====
  meTab: {
    silver:   { totalSent: 3,  totalReceived: 45000,   sendEarnings: 5000,   packetsClaimed: 2,  totalCoinsShared: 20000 },
    gold:     { totalSent: 12, totalReceived: 180000,  sendEarnings: 20000,  packetsClaimed: 8,  totalCoinsShared: 100000 },
    platinum: { totalSent: 24, totalReceived: 520000,  sendEarnings: 40000,  packetsClaimed: 18, totalCoinsShared: 450000 },
    diamond:  { totalSent: 42, totalReceived: 1200000, sendEarnings: 70000,  packetsClaimed: 35, totalCoinsShared: 1400000 },
    sultan:   { totalSent: 87, totalReceived: 3500000, sendEarnings: 145000, packetsClaimed: 72, totalCoinsShared: 3600000 },
  },
};

// Freeze config
Object.freeze(CONFIG);
Object.freeze(CONFIG.currency);
Object.freeze(CONFIG.scoring);
Object.freeze(CONFIG.transactions);
Object.freeze(CONFIG.sendRewards);
Object.freeze(CONFIG.receiver);
Object.freeze(CONFIG.radar);
Object.freeze(CONFIG.swipe);
Object.freeze(CONFIG.animations);
Object.freeze(CONFIG.strings);
Object.freeze(CONFIG.trafficAssumptions);
Object.freeze(CONFIG.operationalCosts);
CONFIG.receiverSegments.forEach(s => Object.freeze(s));
Object.freeze(CONFIG.receiverSegments);
Object.keys(CONFIG.tiers).forEach(k => Object.freeze(CONFIG.tiers[k]));
Object.freeze(CONFIG.tiers);
