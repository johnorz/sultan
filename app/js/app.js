/**
 * Shopee Sultan — Interactive Prototype App (v3)
 * Supports: fade-in share overlay, packet fly animation (animates actual packet),
 * 2-tab nav (Send/Me), leaderboard, top nav bar, phone bump.
 * Score breakdown REMOVED per user request.
 */

// ===== APP STATE =====
const state = {
  role: 'sender',
  tier: 'sultan',
  screen: '',
  history: [],
  activeTab: 'send',
  sheetOpen: false,
  receiverSegment: null,    // current receiver segment from receiverSegments
  senderMilestone: 0,       // how many successful sends (for milestone tracking)
};

// ===== HELPERS =====
function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }
function tierData() { return CONFIG.tiers[state.tier]; }
function formatCurrency(amount) {
  return `${CONFIG.currency.symbol} ${CONFIG.currency.format(amount)}`;
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ===== RECEIVER SEGMENT SELECTION (weighted random) =====
function pickReceiverSegment() {
  const segments = CONFIG.receiverSegments;
  const r = Math.random();
  let cumulative = 0;
  for (const seg of segments) {
    cumulative += seg.populationMix;
    if (r <= cumulative) return seg;
  }
  return segments[segments.length - 1]; // fallback
}

function setReceiverSegment(segmentId) {
  // Manually set segment (for debug panel)
  const seg = CONFIG.receiverSegments.find(s => s.id === segmentId);
  if (seg) {
    state.receiverSegment = seg;
    applyReceiverSegment();
  }
}

function applyReceiverSegment() {
  const seg = state.receiverSegment;
  if (!seg) return;
  const t = tierData();
  const c = CONFIG.currency;

  // Update result overlay content
  const badge = $('jackpot-badge');
  const amount = $('jackpot-amount');
  const bonus = $('jackpot-bonus');
  const source = $('jackpot-source');
  if (!badge || !amount) return;

  badge.textContent = `${seg.badgeIcon} ${seg.badge}`;
  badge.style.background = `linear-gradient(135deg, ${seg.badgeColor}, ${seg.badgeColor}cc)`;

  // Randomize existing_active reward between 50% and 200% of base
  let displayAmount = seg.rewardAmount;
  if (seg.id === 'existing_active') {
    const factor = 0.5 + Math.random() * 1.5; // 0.5× to 2.0×
    displayAmount = Math.round(seg.rewardAmount * factor);
  }
  amount.textContent = c.format(displayAmount);

  bonus.textContent = seg.isIncremental ? 'Exclusive reward for you!' : 'Standard gift reward';
  source.textContent = `${t.packetSeal} Sultan Ahmad · ${t.name}`;

  // Update receiver locked screen hint based on segment
  const tag = $('recv-extra-tag');
  if (tag && seg.isIncremental) {
    tag.textContent = seg.id === 'new_user' ? '🎁 Special Welcome Gift' : '✨ Extra Reward';
  }
}

// ===== SENDER MILESTONE REWARDS =====
function getMilestoneReward(sendCount) {
  const sr = CONFIG.sendRewards;
  const step = sr.milestoneStepUsers;
  const milestoneNum = Math.floor(sendCount / step);
  if (milestoneNum <= 0) return null;
  const reward = sr.baseReward + (milestoneNum - 1) * sr.incrementReward;
  const t = tierData();
  const multiplied = sr.applyTierMultiplier ? Math.round(reward * t.rewardMultiplier) : reward;
  return {
    milestoneNum,
    sendCount: milestoneNum * step,
    baseReward: reward,
    tierMultiplier: t.rewardMultiplier,
    finalReward: multiplied,
  };
}

function getNextMilestone(sendCount) {
  const sr = CONFIG.sendRewards;
  const step = sr.milestoneStepUsers;
  const nextMilestoneNum = Math.floor(sendCount / step) + 1;
  const sendsNeeded = nextMilestoneNum * step - sendCount;
  const reward = sr.baseReward + (nextMilestoneNum - 1) * sr.incrementReward;
  const t = tierData();
  const multiplied = sr.applyTierMultiplier ? Math.round(reward * t.rewardMultiplier) : reward;
  return {
    milestoneNum: nextMilestoneNum,
    sendsNeeded,
    reward: multiplied,
  };
}

function calculateCumulativeMilestoneRewards(totalSends) {
  const sr = CONFIG.sendRewards;
  const step = sr.milestoneStepUsers;
  const milestones = Math.floor(totalSends / step);
  const t = tierData();
  let total = 0;
  for (let i = 1; i <= milestones; i++) {
    const reward = sr.baseReward + (i - 1) * sr.incrementReward;
    total += sr.applyTierMultiplier ? Math.round(reward * t.rewardMultiplier) : reward;
  }
  return total;
}

// ===== SCORE INFO TOOLTIP =====
function toggleScoreTooltip(e) {
  e.stopPropagation();
  const existing = document.querySelector('.score-tooltip');
  if (existing) { existing.remove(); return; }
  const t = tierData();
  const sc = t.scoreComponents;
  const scoring = CONFIG.scoring;
  const tooltip = document.createElement('div');
  tooltip.className = 'score-tooltip';
  tooltip.innerHTML = `
    <div class="score-tt-title">Score Breakdown</div>
    <div class="score-tt-row"><span>${scoring.vipMembership.label} (${Math.round(scoring.vipMembership.weight*100)}%)</span><strong>${sc.vip}/${scoring.vipMembership.maxPoints}</strong></div>
    <div class="score-tt-row"><span>${scoring.monthlySpend.label} (${Math.round(scoring.monthlySpend.weight*100)}%)</span><strong>${sc.spend}/${scoring.monthlySpend.maxPoints}</strong></div>
    <div class="score-tt-row"><span>${scoring.accountActivity.label} (${Math.round(scoring.accountActivity.weight*100)}%)</span><strong>${sc.activity}/${scoring.accountActivity.maxPoints}</strong></div>
    <div class="score-tt-row"><span>${scoring.socialEngagement.label} (${Math.round(scoring.socialEngagement.weight*100)}%)</span><strong>${sc.social}/${scoring.socialEngagement.maxPoints}</strong></div>
    <div class="score-tt-total"><span>Total</span><strong>${sc.vip + sc.spend + sc.activity + sc.social}/100</strong></div>
  `;
  e.currentTarget.closest('.sender-header, .balance-card').appendChild(tooltip);
  // Auto-close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeTooltip() {
      tooltip.remove();
      document.removeEventListener('click', closeTooltip);
    }, { once: true });
  }, 10);
}

// ===== TOAST =====
function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
  }, 1800);
}

// ===== SCREEN NAVIGATION (slide transitions for sub-screens) =====
function navigateTo(screenId) {
  // Close share overlay if open
  if (state.sheetOpen) closeShareSheet();

  const current = document.querySelector('.screen.active');
  if (current) {
    state.history.push(current.id);
    current.classList.remove('active');
    current.classList.add('slide-left');
    setTimeout(() => {
      current.classList.add('hidden');
      current.classList.remove('slide-left');
    }, CONFIG.animations.screenTransition);
  }
  const next = $(screenId);
  next.classList.remove('hidden', 'slide-left');
  next.classList.add('slide-right');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      next.classList.remove('slide-right');
      next.classList.add('active');
    });
  });
  state.screen = screenId;
}

function navigateBack() {
  if (state.sheetOpen) {
    closeShareSheet();
    return;
  }
  const prevId = state.history.pop();
  if (!prevId) return; // Already at home, do nothing
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.remove('active');
    current.classList.add('slide-right');
    setTimeout(() => {
      current.classList.add('hidden');
      current.classList.remove('slide-right');
    }, CONFIG.animations.screenTransition);
  }
  const prev = $(prevId);
  prev.classList.remove('hidden', 'slide-right');
  prev.classList.add('slide-left');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      prev.classList.remove('slide-left');
      prev.classList.add('active');
    });
  });
  state.screen = prevId;
}

function resetToHome() {
  state.history = [];
  state.activeTab = 'send';
  state.sheetOpen = false;
  // Close share overlay
  $('shareOverlay').classList.remove('open', 'vip-mode');
  // Restore packets
  restorePackets();
  // Reset receiver state
  resetReceiverState();
  // Hide all screens
  $$('.screen').forEach(s => {
    s.classList.remove('active', 'slide-left', 'slide-right');
    s.classList.add('hidden');
  });
  const homeId = getHomeScreen();
  const el = $(homeId);
  el.classList.remove('hidden');
  el.classList.add('active');
  state.screen = homeId;
  updateBottomNavHighlight();
}

function restorePackets() {
  ['packetNormal', 'packetVip'].forEach(id => {
    const pkt = $(id);
    if (pkt) {
      pkt.style.transition = 'none';
      pkt.style.transform = '';
      pkt.style.opacity = '';
    }
  });
  // Also restore share mini packet
  const mini = $('sharePacketMini');
  if (mini) mini.classList.remove('fly-out', 'fly-center');
  // Clear send particles
  const sp = $('sendParticles');
  if (sp) sp.innerHTML = '';
}

function getHomeScreen() {
  if (state.role === 'receiver') return 'screen-recv-locked';
  return tierData().isVip ? 'screen-sender-vip' : 'screen-sender-normal';
}

// ===== TAB SWITCHING (Send / Me) =====
function switchTab(tab) {
  if (state.activeTab === tab) return;
  state.activeTab = tab;
  if (state.sheetOpen) closeShareSheet();

  const senderScreen = tierData().isVip ? 'screen-sender-vip' : 'screen-sender-normal';
  const meScreen = 'screen-me';

  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.remove('active');
    current.classList.add('hidden');
  }

  if (tab === 'send') {
    const el = $(senderScreen);
    el.classList.remove('hidden');
    el.classList.add('active');
    state.screen = senderScreen;
  } else {
    const el = $(meScreen);
    el.classList.remove('hidden');
    el.classList.add('active');
    state.screen = meScreen;
  }

  state.history = [];
  updateBottomNavHighlight();
}

function updateBottomNavHighlight() {
  $$('.bottom-nav .nav-item').forEach(item => {
    const tabName = item.getAttribute('data-tab');
    item.classList.toggle('active', tabName === state.activeTab);
  });
}

// ===== SHARE OVERLAY (FADE IN/OUT) =====
function openShareSheet() {
  state.sheetOpen = true;
  const t = tierData();
  const overlay = $('shareOverlay');

  // Apply VIP mode
  if (t.isVip) {
    overlay.classList.add('vip-mode');
  } else {
    overlay.classList.remove('vip-mode');
  }

  // Build the mini packet at top
  buildSharePacket();

  // Reset fly-out state
  $('sharePacketMini').classList.remove('fly-out');

  // Fade in
  overlay.classList.add('open');
}

function closeShareSheet() {
  state.sheetOpen = false;
  $('shareOverlay').classList.remove('open');
  // Restore dashboard packets
  restorePackets();
}

function buildSharePacket() {
  const t = tierData();
  const mini = $('sharePacketMini');

  let pktBg, pktShadow, sealBg;
  if (t.isVip) {
    pktBg = 'linear-gradient(180deg, #1a1a2e, #0a0a1a)';
    pktShadow = '0 6px 20px rgba(252,211,77,0.25), inset 0 0 0 2px rgba(252,211,77,0.3)';
    sealBg = 'linear-gradient(135deg, #FCD34D, #B45309, #FCD34D)';
  } else {
    const styles = {
      silver: { bg: 'linear-gradient(180deg, #CBD5E0, #A0AEC0)', shadow: '0 6px 16px rgba(160,174,192,0.3)', sealBg: '#E2E8F0' },
      gold: { bg: 'linear-gradient(180deg, #68D391, #38A169)', shadow: '0 6px 16px rgba(72,187,120,0.3)', sealBg: '#FCD34D' },
      platinum: { bg: 'linear-gradient(180deg, #63B3ED, #3182CE)', shadow: '0 6px 16px rgba(66,153,225,0.3)', sealBg: 'linear-gradient(135deg, #dbeafe, #60a5fa)' },
      diamond: { bg: 'linear-gradient(180deg, #B794F4, #805AD5)', shadow: '0 6px 16px rgba(159,122,234,0.3)', sealBg: 'linear-gradient(135deg, #e9d5ff, #a855f7)' },
    };
    const s = styles[state.tier] || styles.silver;
    pktBg = s.bg;
    pktShadow = s.shadow;
    sealBg = s.sealBg;
  }

  mini.style.background = pktBg;
  mini.style.boxShadow = pktShadow;
  mini.innerHTML = `<div class="share-packet-seal" style="background:${sealBg}">${t.packetSeal}</div>`;
  $('sharePacketLabel').textContent = 'Your gift is ready to send';
  $('shareTitle').textContent = t.isVip ? 'Send your Sultan gift' : 'Send your gift';
}

// ===== FANCY SEND ANIMATION (jump center → enlarge → particle burst → fly out) =====
function animatePacketFly(callback) {
  const mini = $('sharePacketMini');
  const t = tierData();

  // Step 1: Jump to center and enlarge
  mini.classList.remove('fly-out', 'fly-center');
  mini.classList.add('fly-center');

  // Step 2: After centering, burst particles + blast off
  setTimeout(() => {
    // Spawn particle burst
    spawnSendParticles(t.color);

    // Blast off
    mini.classList.remove('fly-center');
    mini.classList.add('fly-out');
  }, 450);

  // Step 3: Callback after full animation
  setTimeout(() => {
    if (callback) callback();
  }, 1100);
}

function spawnSendParticles(color) {
  const container = $('sendParticles');
  if (!container) return;
  container.innerHTML = '';
  const cx = 187, cy = 350; // approx center of the share overlay
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'send-particle';
    const angle = (i / 12) * Math.PI * 2;
    const dist = 60 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.background = color;
    p.style.setProperty('--sp-end', `translate(${dx}px, ${dy}px)`);
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    p.style.width = `${4 + Math.random() * 6}px`;
    p.style.height = p.style.width;
    container.appendChild(p);
  }
}

// ===== PHONE BUMP =====
function simulateBump() {
  // Show a quick toast and fly anim concept, then go home
  showToast('Gift sent via Phone Bump! 🎉');
  setTimeout(() => {
    resetToHome();
  }, 1000);
}

// ===== FANCY RECEIVER OPEN (in-place, no page navigation) =====
// 3-phase: grow → shake (tension) → burst open
function openReceiverPacket() {
  const display = $('recv-tap-area');
  const overlay = $('recvResultOverlay');

  // Guard: already animating?
  if (display.classList.contains('growing') || display.classList.contains('shaking') || display.classList.contains('bursting')) return;
  if (overlay && overlay.classList.contains('show')) return;

  // Phase 1: Grow (0–700ms) — packet scales up with bounce
  display.classList.add('growing');

  // Phase 2: Shake (700–1500ms) — intense vibration at max size, building tension
  setTimeout(() => {
    display.classList.remove('growing');
    display.classList.add('shaking');
  }, 700);

  // Phase 3: Burst open (1500ms) — packet explodes outward + particles
  setTimeout(() => {
    display.classList.remove('shaking');
    display.classList.add('bursting');
    spawnRecvBurstParticles();
  }, 1500);

  // Phase 4: Show result overlay (1800ms)
  setTimeout(() => {
    if (overlay) overlay.classList.add('show');
  }, 1800);
}

function spawnRecvBurstParticles() {
  const container = $('recvBurstParticles');
  if (!container) return;
  container.innerHTML = '';
  const cx = 187, cy = 300;
  const colors = ['#FCD34D', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#10B981'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'recv-burst-particle';
    const angle = (i / 18) * Math.PI * 2;
    const dist = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 5 + Math.random() * 8;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty('--bp-end', `translate(${dx}px, ${dy}px)`);
    p.style.animationDelay = `${Math.random() * 0.1}s`;
    container.appendChild(p);
  }
}

function resetReceiverState() {
  const display = $('recv-tap-area');
  const overlay = $('recvResultOverlay');
  if (!display || !overlay) return;
  display.classList.remove('growing', 'shaking', 'bursting');
  overlay.classList.remove('show');
  // Reset packet visibility
  const pkt = display.querySelector('.recv-packet-big');
  if (pkt) { pkt.style.transform = ''; pkt.style.opacity = ''; pkt.style.filter = ''; }
  // Reset hidden elements
  display.querySelectorAll('.recv-extra-tag, .recv-from, .recv-tier-badge, .recv-tap-hint').forEach(el => {
    el.style.opacity = '';
    el.style.transform = '';
  });
  // Clear burst particles
  const bp = $('recvBurstParticles');
  if (bp) bp.innerHTML = '';
}

// ===== TIER VISUAL MAPPING =====
function getTierVisuals(tierId) {
  const t = CONFIG.tiers[tierId];
  const isVip = t.isVip;
  const recvBgMap = {
    silver: 'linear-gradient(180deg, #cc3300 0%, #EE4D2D 50%, #cc3300 100%)',
    gold: 'linear-gradient(180deg, #1a5e2e 0%, #38A169 50%, #1a5e2e 100%)',
    platinum: 'linear-gradient(180deg, #0a1a3a 0%, #1e3a5f 50%, #0a1a3a 100%)',
    diamond: 'linear-gradient(180deg, #1a0a2e 0%, #2e1065 50%, #1a0a2e 100%)',
    sultan: 'linear-gradient(180deg, #1a0505 0%, #2d0a0a 50%, #1a0505 100%)',
  };
  return {
    tierClass: `tier-${tierId}`,
    packetStyleClass: isVip ? 'recv-packet-vip-style' : 'recv-packet-normal-style',
    recvBg: recvBgMap[tierId],
    fromColor: isVip ? t.color : '#fff',
    hintColor: isVip ? '#555' : 'rgba(255,255,255,0.5)',
    badgeBg: `rgba(${hexToRgb(t.color)}, 0.15)`,
    badgeColor: t.color,
    tagBg: tierId === 'sultan' ? 'var(--gold-gradient)' : `rgba(${hexToRgb(t.color)}, 0.15)`,
    tagColor: tierId === 'sultan' ? '#000' : t.color,
    tagText: isVip ? '✨ Contains Extra Coins' : t.packetLabel,
    showParticles: isVip,
  };
}

// ===== POPULATE SHARE SCREEN =====
function populateShareScreen() {
  const f2fGrid = $('f2fGrid');
  const channelGrid = $('channelGrid');
  if (!f2fGrid || !channelGrid) return;

  // F2F methods
  f2fGrid.innerHTML = '';
  CONFIG.f2fMethods.forEach(method => {
    const btn = document.createElement('div');
    btn.className = 'f2f-btn';
    btn.innerHTML = `<span class="ch-icon">${method.icon}</span><span class="ch-name">${method.name}</span><span class="ch-desc">${method.desc}</span>`;
    btn.addEventListener('click', () => {
      if (method.id === 'airdrop') {
        closeShareSheet();
        setTimeout(() => navigateTo('screen-radar'), 100);
      } else if (method.id === 'phonebump') {
        closeShareSheet();
        setTimeout(() => navigateTo('screen-phone-bump'), 100);
      }
    });
    f2fGrid.appendChild(btn);
  });

  // Social channels
  channelGrid.innerHTML = '';
  CONFIG.channels.forEach(ch => {
    const btn = document.createElement('div');
    btn.className = 'channel-btn';
    btn.innerHTML = `<span class="ch-icon">${ch.icon}</span><span class="ch-name">${ch.name}</span>`;
    btn.addEventListener('click', () => {
      // Animate the actual packet flying out from the share overlay
      animatePacketFly(() => {
        // Increment send count and check milestone
        state.senderMilestone++;
        const milestone = getMilestoneReward(state.senderMilestone);
        if (milestone && state.senderMilestone % CONFIG.sendRewards.milestoneStepUsers === 0) {
          // Hit a milestone!
          showToast(`🎉 Milestone ${milestone.milestoneNum}! +${formatCurrency(milestone.finalReward)} reward (${tierData().rewardMultiplier}× tier bonus)`);
        } else {
          const next = getNextMilestone(state.senderMilestone);
          showToast(`Sent via ${ch.name}! ${next.sendsNeeded} more to earn ${formatCurrency(next.reward)}`);
        }
        // Pick a new random segment for next receiver open
        state.receiverSegment = pickReceiverSegment();
        // Close overlay and go home
        state.sheetOpen = false;
        $('shareOverlay').classList.remove('open');
        restorePackets();
        resetToHome();
      });
    });
    channelGrid.appendChild(btn);
  });
}

// ===== RENDER LEADERBOARD =====
function renderLeaderboard() {
  const t = tierData();
  const youAmount = t.giftBudget * 0.6;

  ['lb-list-normal', 'lb-list-vip'].forEach(listId => {
    const list = $(listId);
    if (!list) return;
    list.innerHTML = '';

    const data = CONFIG.leaderboard.map(entry => {
      if (entry.isYou) return { ...entry, amountSent: youAmount };
      return { ...entry };
    });
    data.sort((a, b) => b.amountSent - a.amountSent);

    data.forEach((entry, idx) => {
      const rank = idx + 1;
      const item = document.createElement('div');
      item.className = 'lb-item' + (entry.isYou ? ' is-you' : '');
      let rankClass = 'lb-rank-default';
      if (rank === 1) rankClass = 'lb-rank-1';
      else if (rank === 2) rankClass = 'lb-rank-2';
      else if (rank === 3) rankClass = 'lb-rank-3';
      const nameHtml = entry.isYou
        ? `${entry.name}<span class="lb-you-badge">YOU</span>`
        : entry.name;
      item.innerHTML = `
        <div class="lb-rank ${rankClass}">${rank}</div>
        <div class="lb-avatar">${entry.avatar}</div>
        <div class="lb-name">${nameHtml}</div>
        <div class="lb-amount">${formatCurrency(entry.amountSent)}</div>
      `;
      list.appendChild(item);
    });
  });
}

// ===== POPULATE ME TAB =====
function applyMeTab() {
  const t = tierData();
  const meData = CONFIG.meTab[state.tier];

  $('me-avatar').textContent = t.packetSeal;
  $('me-tier-badge').textContent = t.name;
  $('me-tier-badge').style.background = `rgba(${hexToRgb(t.color)}, 0.2)`;
  $('me-tier-badge').style.color = t.color;

  // Calculate send earnings from milestone system
  const effectiveSends = meData.totalSent + state.senderMilestone;
  const milestoneData = getMilestoneReward(effectiveSends);
  const cumulativeSendEarnings = milestoneData ? calculateCumulativeMilestoneRewards(effectiveSends) : 0;
  const totalEarnings = cumulativeSendEarnings + meData.totalReceived;
  $('me-total-amount').textContent = formatCurrency(totalEarnings);
  $('me-send-earnings').textContent = formatCurrency(cumulativeSendEarnings);
  $('me-total-sent').textContent = effectiveSends;
  $('me-received').textContent = formatCurrency(meData.totalReceived);

  // Style Me screen based on VIP
  const meScreen = $('screen-me');
  const meNav = $('bottom-nav-me');

  if (t.isVip) {
    meScreen.style.background = 'linear-gradient(180deg, #0a0a1a, #1A1A1A)';
    meNav.className = 'bottom-nav bn-vip';

    // Status bar + top nav
    const sb = meScreen.querySelector('.sb-me');
    if (sb) { sb.style.background = 'transparent'; sb.style.color = 'var(--gold)'; }
    const tn = meScreen.querySelector('.tn-me');
    if (tn) { tn.style.background = 'transparent'; tn.style.color = 'rgba(252,211,77,0.7)'; }

    // Me header
    const mh = meScreen.querySelector('.me-header');
    if (mh) mh.style.background = 'transparent';
    const mn = meScreen.querySelector('.me-name');
    if (mn) {
      mn.style.background = 'var(--gold-gradient)';
      mn.style.webkitBackgroundClip = 'text';
      mn.style.webkitTextFillColor = 'transparent';
    }

    // Cards
    $$('.me-card').forEach(card => { card.style.background = 'rgba(255,255,255,0.04)'; card.style.border = '1px solid rgba(255,255,255,0.06)'; });
    $$('.me-card-title').forEach(el => el.style.color = '#ccc');
    $$('.me-card-amount').forEach(el => {
      el.style.background = 'var(--gold-gradient)';
      el.style.webkitBackgroundClip = 'text';
      el.style.webkitTextFillColor = 'transparent';
    });
    $$('.me-card-detail').forEach(el => el.style.color = '#666');

    const tc = $('me-total-card');
    if (tc) { tc.style.background = 'linear-gradient(135deg, rgba(252,211,77,0.08), rgba(180,83,9,0.08))'; tc.style.border = '1px solid rgba(252,211,77,0.15)'; tc.style.boxShadow = 'none'; }
    const tl = tc?.querySelector('.me-total-label');
    if (tl) tl.style.color = '#888';
    const ta = $('me-total-amount');
    if (ta) { ta.style.background = 'var(--gold-gradient)'; ta.style.webkitBackgroundClip = 'text'; ta.style.webkitTextFillColor = 'transparent'; }

    $$('.me-activity-title').forEach(el => el.style.color = '#666');
    $$('.me-activity-item').forEach(el => { el.style.borderBottomColor = 'rgba(255,255,255,0.04)'; el.style.color = '#888'; });
    $$('.me-activity-item strong').forEach(el => el.style.color = '#ccc');
  } else {
    meScreen.style.background = '#f5f5f5';
    meNav.className = 'bottom-nav bn-me';

    const sb = meScreen.querySelector('.sb-me');
    if (sb) { sb.style.background = 'var(--orange)'; sb.style.color = '#fff'; }
    const tn = meScreen.querySelector('.tn-me');
    if (tn) { tn.style.background = 'var(--orange)'; tn.style.color = 'rgba(255,255,255,0.85)'; }

    const mh = meScreen.querySelector('.me-header');
    if (mh) mh.style.background = '';
    const mn = meScreen.querySelector('.me-name');
    if (mn) { mn.style.background = ''; mn.style.webkitBackgroundClip = ''; mn.style.webkitTextFillColor = ''; mn.style.color = '#333'; }

    $$('.me-card').forEach(card => { card.style.background = '#fff'; card.style.border = 'none'; });
    $$('.me-card-title').forEach(el => el.style.color = '#333');
    $$('.me-card-amount').forEach(el => { el.style.background = ''; el.style.webkitBackgroundClip = ''; el.style.webkitTextFillColor = ''; el.style.color = 'var(--orange)'; });
    $$('.me-card-detail').forEach(el => el.style.color = '#999');

    const tc = $('me-total-card');
    if (tc) { tc.style.background = '#fff'; tc.style.border = 'none'; tc.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }
    const tl = tc?.querySelector('.me-total-label');
    if (tl) tl.style.color = '#999';
    const ta = $('me-total-amount');
    if (ta) { ta.style.background = ''; ta.style.webkitBackgroundClip = ''; ta.style.webkitTextFillColor = ''; ta.style.color = 'var(--orange)'; }

    $$('.me-activity-title').forEach(el => el.style.color = '#999');
    $$('.me-activity-item').forEach(el => { el.style.borderBottomColor = '#eee'; el.style.color = '#555'; });
    $$('.me-activity-item strong').forEach(el => el.style.color = '#333');
  }
}

// ===== RADAR SLIDER =====
function updateRadarCost() {
  const count = parseInt($('radarSlider').value);
  const t = tierData();
  const total = count * t.packetValue;
  $('radar-count').textContent = `${count} of 5`;
  $('radar-cost').textContent = formatCurrency(total);

  const accepted = Math.max(1, count - 1);
  const declined = count - accepted;
  const charged = accepted * t.packetValue;
  const returned = declined * t.packetValue;
  $('settlement-text').textContent = `${accepted} of ${count} accepted!`;
  $('settlement-sub').textContent = `${formatCurrency(charged)} charged · ${formatCurrency(returned)} returned`;
}

// ===== BROADCAST =====
function startBroadcast() {
  navigateTo('screen-broadcasting');
  setTimeout(() => navigateTo('screen-settlement'), CONFIG.animations.broadcastDuration);
}

// ===== APPLY TIER =====
function applyTier() {
  const t = tierData();
  const v = getTierVisuals(state.tier);
  const c = CONFIG.currency;

  // --- Score subtitle (current month) ---
  const now = new Date();
  const monthStr = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const score = t.scoreRange[0] + Math.floor((t.scoreRange[1] - t.scoreRange[0]) * 0.9);

  // --- Normal sender dashboard ---
  $('sender-balance').textContent = c.format(t.giftBudget);
  $('sender-packets').textContent = `${t.maxPackets} packets remaining`;
  $('sender-tier-badge').style.background = v.badgeBg;
  $('sender-tier-badge').style.color = v.badgeColor;
  $('sender-tier-dot').style.background = t.color;

  $('sender-tier-text').textContent = `${t.name} · Score ${score}/100`;

  $('sender-intro').textContent = 'Send red packets to friends and earn rewards for every successful referral!';
  $('sender-title').textContent = CONFIG.strings.senderNormal.headerTitle;
  $('sender-tagline').textContent = `${monthStr}`;
  $('sendHintNormal').textContent = CONFIG.strings.senderNormal.swipeHint;
  $('sendSubNormal').textContent = `${t.maxPackets} packets · Swipe to gift`;

  $('packetWrapperNormal').className = v.tierClass;
  $('sealNormal').textContent = t.packetSeal;

  // --- VIP sender dashboard ---
  $('vip-balance').textContent = c.format(t.giftBudget);
  $('vip-packets-val').textContent = t.maxPackets;
  $('vip-title').textContent = `${t.name} Privilege`;
  $('vip-tier-label').textContent = `Score ${score}/100 · ${monthStr}`;
  $('vip-bal-label').textContent = t.isVip ? CONFIG.strings.senderVip.balanceLabel : CONFIG.strings.senderNormal.balanceLabel;
  $('vip-intro').textContent = 'Share your generosity. Send exclusive gifts and earn milestone rewards.';
  $('vip-micro-packets').textContent = `${t.maxPackets} packets`;
  $('vip-micro-each').textContent = `Swipe to gift`;
  $('sendHintVip').textContent = t.isVip ? CONFIG.strings.senderVip.swipeHint : CONFIG.strings.senderNormal.swipeHint;

  $('packetWrapperVip').className = v.tierClass;
  $('sealVip').textContent = t.packetSeal;

  const meData = CONFIG.meTab[state.tier];
  $('vip-gifted-val').textContent = meData.totalSent;

  // --- Radar / Airdrop (tier-aware) ---
  $('screen-radar').setAttribute('data-radar-tier', state.tier);
  $('radar-center-icon').textContent = t.packetSeal;

  // --- Receiver locked ---
  $('screen-recv-locked').style.background = v.recvBg;
  $('recv-packet-big').className = 'recv-packet-big ' + v.packetStyleClass;
  $('recv-seal-big').textContent = t.packetSeal;
  $('recv-extra-tag').style.background = v.tagBg;
  $('recv-extra-tag').style.color = v.tagColor;
  $('recv-extra-tag').textContent = v.tagText;
  $('recv-from').style.color = v.fromColor;
  $('recv-from').textContent = `${t.packetSeal} From: Sultan Ahmad`;
  $('recv-tier-badge').style.background = v.badgeBg;
  $('recv-tier-badge').style.color = v.badgeColor;
  $('recv-tier-badge').textContent = t.name;
  $('recv-tap-hint').style.color = v.hintColor;
  $('recv-tap-hint').textContent = t.isVip ? CONFIG.strings.receiver.tapHintVip : CONFIG.strings.receiver.tapHintNormal;
  $('recv-particles').style.display = v.showParticles ? 'block' : 'none';

  // --- Receiver opened (use segment data) ---
  if (!state.receiverSegment) state.receiverSegment = pickReceiverSegment();
  applyReceiverSegment();

  // Broadcasting seals
  $$('.flying-packet .mini-seal').forEach(s => s.textContent = t.packetSeal);

  // Dynamic renders
  renderLeaderboard();
  applyMeTab();
  updateRadarCost();
}

// ===== SWIPE-TO-SEND =====
function setupSwipe(areaId, packetId) {
  const area = $(areaId);
  const packet = $(packetId);
  let startY = 0, currentY = 0, isDragging = false;

  function onStart(e) {
    if (state.sheetOpen) return;
    const touch = e.touches ? e.touches[0] : e;
    startY = touch.clientY;
    isDragging = true;
    packet.classList.add('dragging');
    packet.style.transition = 'none';
  }

  function onMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    currentY = touch.clientY;
    const deltaY = Math.min(0, currentY - startY);
    packet.style.transform = `translateY(${deltaY}px) scale(${1 + Math.abs(deltaY) * 0.001})`;
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    packet.classList.remove('dragging');
    const deltaY = currentY - startY;

    if (deltaY < -80) {
      // Successful swipe — animate packet out then open share overlay
      packet.style.transition = 'transform 0.4s ease-out, opacity 0.3s';
      packet.style.transform = 'translateY(-300px) scale(0.5)';
      packet.style.opacity = '0';
      setTimeout(() => {
        openShareSheet();
      }, CONFIG.animations.packetThrow);
    } else {
      // Rubber band back
      packet.style.transition = `transform ${CONFIG.swipe.rubberBandDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
      packet.style.transform = '';
      if (deltaY > -30) showToast(CONFIG.strings.senderNormal.swipeFailHint);
    }
    startY = 0;
    currentY = 0;
  }

  area.addEventListener('touchstart', onStart, { passive: true });
  area.addEventListener('touchmove', onMove, { passive: false });
  area.addEventListener('touchend', onEnd);
  area.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
}

// ===== DEBUG PANEL =====
function setTier(tier) {
  state.tier = tier;
  $$('.debug-btn[data-tier]').forEach(b => b.classList.toggle('active', b.dataset.tier === tier));
  applyTier();
  resetToHome();
  updateDebugMilestone();
  renderDebugEconomics();
}

function setRole(role) {
  state.role = role;
  $$('.debug-role-btn').forEach(b => b.classList.toggle('active', b.dataset.role === role));
  resetToHome();
}

function debugSimulateSend() {
  state.senderMilestone++;
  const milestone = getMilestoneReward(state.senderMilestone);
  if (milestone && state.senderMilestone % CONFIG.sendRewards.milestoneStepUsers === 0) {
    showToast(`🎉 Milestone ${milestone.milestoneNum}! +${formatCurrency(milestone.finalReward)}`);
  }
  // Pick new receiver segment
  state.receiverSegment = pickReceiverSegment();
  applyReceiverSegment();
  applyMeTab();
  updateDebugMilestone();
  // Highlight segment button
  $$('.debug-seg-btn').forEach(b => b.classList.toggle('active', b.dataset.seg === state.receiverSegment.id));
}

function updateDebugMilestone() {
  const sends = $('dbg-sends');
  const nextEl = $('dbg-next-milestone');
  if (!sends || !nextEl) return;
  const meData = CONFIG.meTab[state.tier];
  const total = meData.totalSent + state.senderMilestone;
  sends.textContent = total;
  const next = getNextMilestone(total);
  nextEl.textContent = `${next.sendsNeeded} more → ${formatCurrency(next.reward)}`;
}

function renderDebugEconomics() {
  const el = $('debugEconomics');
  if (!el) return;
  const t = tierData();
  const ta = CONFIG.trafficAssumptions;
  const oc = CONFIG.operationalCosts;
  const totalReceivers = ta.totalSenders * ta.avgReferralsPerSender;

  // Calculate blended receiver cost
  let blendedCost = 0;
  CONFIG.receiverSegments.forEach(seg => {
    blendedCost += seg.rewardAmount * seg.populationMix;
  });

  // Sender milestone cost (average per sender over 3 referrals)
  const avgMilestones = Math.floor(ta.avgReferralsPerSender / CONFIG.sendRewards.milestoneStepUsers);
  let senderCostPerUser = 0;
  for (let i = 1; i <= avgMilestones; i++) {
    senderCostPerUser += CONFIG.sendRewards.baseReward + (i - 1) * CONFIG.sendRewards.incrementReward;
  }

  const totalReceiverCost = totalReceivers * blendedCost;
  const totalSenderCost = ta.totalSenders * senderCostPerUser;
  const totalBudget = totalReceiverCost + totalSenderCost + oc.fixedOpsCost;

  el.innerHTML = `
    <div class="econ-row">Senders: <strong>${(ta.totalSenders/1e6).toFixed(1)}M</strong> × ${ta.avgReferralsPerSender} ref = <strong>${(totalReceivers/1e6).toFixed(1)}M</strong> receivers</div>
    <div class="econ-row">Blended recv cost: <strong>${formatCurrency(Math.round(blendedCost))}</strong>/person</div>
    <div class="econ-row">Sender milestone (avg): <strong>${formatCurrency(senderCostPerUser)}</strong>/sender</div>
    <div class="econ-row">Tier multiplier (${t.name}): <strong>${t.rewardMultiplier}×</strong></div>
    <div class="econ-divider"></div>
    <div class="econ-row">Receiver cost: <strong>${formatCurrency(totalReceiverCost)}</strong></div>
    <div class="econ-row">Sender cost: <strong>${formatCurrency(totalSenderCost)}</strong></div>
    <div class="econ-row">Fixed ops: <strong>${formatCurrency(oc.fixedOpsCost)}</strong></div>
    <div class="econ-row econ-total">Total budget: <strong>${formatCurrency(totalBudget)}</strong></div>
    <div class="econ-row">Per recv USD: <strong>$${(blendedCost / 16000).toFixed(3)}</strong></div>
  `;
}

// ===== SCALE PHONE FRAME TO FIT VIEWPORT =====
// Uses CSS zoom (not transform:scale) so hit-testing, scrolling, and pointer events work correctly.
// On mobile (<= 500px), the phone frame goes full-screen — no zoom needed.
function scalePhoneFrame() {
  const frame = document.querySelector('.phone-frame');
  const isMobile = window.innerWidth <= 500;
  if (isMobile) {
    frame.style.zoom = '';
    return;
  }
  const frameW = 375, frameH = 812;
  const pad = 20;
  const maxW = window.innerWidth - pad * 2;
  const maxH = window.innerHeight - pad * 2;
  const scale = Math.min(1, maxW / frameW, maxH / frameH);
  frame.style.zoom = scale;
}

// ===== INIT =====
function init() {
  scalePhoneFrame();
  window.addEventListener('resize', scalePhoneFrame);

  populateShareScreen();
  setupSwipe('sendAreaNormal', 'packetNormal');
  setupSwipe('sendAreaVip', 'packetVip');
  $('recv-tap-area').addEventListener('click', openReceiverPacket);
  $('radarSlider').addEventListener('input', updateRadarCost);

  // Debug toggle
  $('debugToggle').addEventListener('click', () => $('debugPanel').classList.toggle('open'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') $('debugPanel').classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!$('debugPanel').contains(e.target) && !$('debugToggle').contains(e.target)) {
      $('debugPanel').classList.remove('open');
    }
  });

  applyTier();
  resetToHome();
  updateDebugMilestone();
  renderDebugEconomics();
}

document.addEventListener('DOMContentLoaded', init);
