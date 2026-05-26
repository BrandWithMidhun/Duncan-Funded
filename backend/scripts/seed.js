// Seed script — populates the Postgres database with categories, tags,
// an author, sample SEO blog posts, and a couple of demo subscribers.
import 'dotenv/config';
import { initDb, closeDb, get, run } from '../src/lib/db.js';
import { genId, toSlug, estimateReadingTime, now } from '../src/lib/helpers.js';

const POSTS = [
  {
    title: 'What Is a Prop Trading Firm? A Trader’s Guide to Funded Capital',
    excerpt:
      'Proprietary trading firms back skilled traders with real capital in exchange for a share of the profits. Here is how the model works and why it has reshaped retail trading.',
    category: 'Education',
    tags: ['prop trading', 'funded accounts', 'beginners'],
    metaDescription:
      'Learn what a prop trading firm is, how funded trading accounts work, and how the profit-split model lets skilled traders scale without risking personal capital.',
    featured: true,
    content: `## The funded trading model, explained

A proprietary — or "prop" — trading firm provides capital to traders who demonstrate skill and discipline. Instead of risking your own savings, you trade the firm's money and keep the majority of the profits you generate.

At Duncan Funded, that share reaches up to 90%. The firm absorbs the downside risk; the trader supplies the strategy.

## Why the model exists

Markets reward consistency, but most retail traders are under-capitalised. A trader with a proven edge but a small account cannot realise meaningful returns. Prop firms solve this asymmetry: they locate talent and supply the capital, while the trader supplies the discipline.

## The evaluation phase

Before receiving a funded account, traders complete an evaluation — a structured test of risk management. You must reach a profit target while respecting daily and total drawdown limits. This is not about hitting home runs; it is about proving you can protect capital.

## What separates a serious firm

- **Transparent rules** published before you pay
- **Real infrastructure** — institutional execution and liquidity
- **Reliable payouts** on a fixed schedule
- **A scaling plan** that rewards consistency over time

The prop model has democratised access to serious capital. For a disciplined trader, it is the shortest honest path from skill to scale.`,
  },
  {
    title: 'Mastering Drawdown: The Discipline That Funds Traders',
    excerpt:
      'Most evaluations are failed on risk, not returns. Understanding daily and maximum drawdown is the single most important skill for passing a funded challenge.',
    category: 'Risk Management',
    tags: ['drawdown', 'risk management', 'evaluation'],
    metaDescription:
      'Daily and maximum drawdown limits cause most failed prop firm evaluations. Learn how to manage drawdown and protect your funded trading account.',
    featured: true,
    content: `## Drawdown is the real test

Profit targets get the attention, but drawdown limits decide who gets funded. A daily loss limit caps how much you can lose in a single session; a maximum loss limit caps your total loss from the account's starting balance.

Breach either, and the evaluation ends — regardless of how profitable you were.

## Think in percentages, not pips

A 5% daily loss limit on a $50,000 account is $2,500. If your trading plan risks 1% per trade, that is five losing trades before you are out for the day. Knowing this number before the session starts changes how you behave.

## Three habits that protect capital

1. **Set a hard daily stop.** When you reach 60% of your daily limit, close the platform. The market will be there tomorrow.
2. **Size from the limit, not the target.** Position size should be derived from your drawdown ceiling, never from how much you hope to make.
3. **Treat the limit as sacred.** Funded traders do not negotiate with their own rules.

## The mindset shift

Amateurs ask "how much can I make?" Professionals ask "how much can I lose before I must stop?" The Duncan evaluation rewards the second question. Master drawdown, and funding follows.`,
  },
  {
    title: 'Building a Trading Routine Worthy of the Duncan Standard',
    excerpt:
      'Consistency is a process, not a personality trait. A repeatable daily routine is what separates funded traders from gamblers.',
    category: 'Strategy',
    tags: ['routine', 'discipline', 'trading psychology'],
    metaDescription:
      'A structured daily trading routine builds the consistency prop firms reward. Here is a pre-market, in-session, and post-market framework for funded traders.',
    content: `## Why routine beats motivation

Motivation fluctuates. Routine does not. The traders who pass evaluations and keep funded accounts are rarely the most talented — they are the most consistent.

## Pre-market: prepare the battlefield

Before the session, review the economic calendar for high-impact news, mark key levels on your charts, and define the specific setups you will trade. Decide your maximum risk for the day in currency terms. Preparation removes improvisation.

## In-session: execute, do not invent

During the session, trade only the setups you defined. Log every entry and exit as you make it. If you reach your daily stop, you are finished — close the terminal. The discipline to stop is the discipline that gets funded.

## Post-market: review honestly

After the close, review the day's trades against your plan. Did each trade meet your criteria, or did you force it? Tag your mistakes. Reflection compounds: a trader who reviews honestly for a month improves faster than one who trades twice as often without review.

## The Duncan standard

Trade with honour means trading the same way on a winning day as a losing one. Routine is how that consistency becomes automatic.`,
  },
  {
    title: 'Forex Pairs Explained: Majors, Minors, and What to Trade First',
    excerpt:
      'New to currency markets? Understanding pair categories — and their behaviour — is the foundation every funded trader builds on.',
    category: 'Education',
    tags: ['forex', 'currency pairs', 'beginners'],
    metaDescription:
      'A beginner-friendly guide to forex currency pairs — majors, minors, and exotics — and which pairs new funded traders should focus on first.',
    content: `## The three categories

Currency pairs fall into three groups. **Majors** include the most traded pairs — EUR/USD, GBP/USD, USD/JPY — all involving the US dollar. **Minors**, or crosses, pair major currencies without the dollar, such as EUR/GBP. **Exotics** pair a major with an emerging-market currency and carry wider spreads.

## Why majors come first

For a trader in evaluation, majors are usually the right starting point. They offer the tightest spreads, the deepest liquidity, and the most predictable behaviour around news. Lower transaction costs matter when you are trading within strict drawdown limits.

## Volatility and session timing

EUR/USD moves most during the London–New York overlap. GBP/JPY is far more volatile and can punish oversized positions. Match the pair's typical range to your risk plan, not your ambition.

## A focused approach

Rather than watching twenty pairs, master two or three. Learn how they behave at key levels, around news, and across sessions. Depth beats breadth — especially when real capital is on the line.

## Building from here

Once you are consistent on majors, selectively add crosses that suit your strategy. The goal is never more markets; it is more mastery of the markets you already trade.`,
  },
  {
    title: 'Passing Your Funded Challenge: A Phase-by-Phase Playbook',
    excerpt:
      'The Duncan evaluation rewards process over heroics. Here is a calm, structured plan to move from challenge to funded account.',
    category: 'Strategy',
    tags: ['evaluation', 'funded accounts', 'prop trading'],
    metaDescription:
      'A practical, phase-by-phase playbook for passing a prop firm funded trading challenge — covering targets, drawdown, pacing, and mindset.',
    content: `## Start with the rules, not the chart

Before your first trade, write down the four numbers that govern your challenge: the profit target, the daily loss limit, the maximum loss limit, and your per-trade risk. Every decision flows from these.

## Phase one: prove your edge

The first phase is about demonstrating a repeatable edge. Aim to reach the profit target gradually — small, consistent gains compound and keep you far from drawdown limits. Avoid the temptation to hit the target in a single session; that is how accounts breach.

## Phase two: prove your consistency

Where applicable, the second phase has a lower target. The challenge here is psychological — many traders become reckless once the finish line is visible. Treat phase two exactly like phase one. The process does not change because the target is closer.

## Pacing is a strategy

There is no time limit at Duncan Funded. Use that. A trader who needs three good setups per week and takes nothing else will outperform one who forces a trade every session. Patience is not passive — it is an edge.

## After funding

Passing the evaluation is the beginning. Funded traders earn payouts on a fixed schedule and can scale their capital through consistency. The habits that passed the challenge are the same habits that grow the account.`,
  },
  {
    title: 'Trading Psychology: Why Your Mindset Is Your Real Edge',
    excerpt:
      'Strategy can be taught in an afternoon. Emotional discipline takes years — and it is what ultimately decides who stays funded.',
    category: 'Risk Management',
    tags: ['trading psychology', 'discipline', 'mindset'],
    metaDescription:
      'Trading psychology — managing fear, greed, and revenge trading — is what keeps traders funded. Learn the mental discipline behind consistent performance.',
    content: `## The gap between knowing and doing

Most traders know they should cut losses and let winners run. Far fewer actually do it. That gap is psychology, and closing it is the real work of becoming a professional.

## The three emotions to manage

**Fear** makes traders exit winners early and skip valid setups. **Greed** makes them oversize positions and hold past their plan. **Revenge** — the urge to win back a loss immediately — is the most destructive of all, and the fastest route to a breached account.

## Detaching from outcome

A single trade is one sample from a large distribution. Judging yourself by one result is statistically meaningless. Professionals judge themselves by whether they followed their process — the outcome of any individual trade is noise.

## Practical safeguards

Predefine entries, stops, and targets before you trade so decisions are not made under emotional pressure. Step away after reaching your daily stop. Keep a journal that records how you felt, not just what you did. Patterns in your psychology become visible only when you write them down.

## The honourable trader

The Duncan motto — trade with honour — is also a psychological discipline. It means keeping your word to yourself: trading your plan, respecting your limits, and accepting outcomes with composure. That is the edge no indicator can give you.`,
  },
];

async function main() {
  console.log('🌱 Seeding Duncan Funded database...');
  await initDb();

  // Author
  let author = await get('SELECT id FROM users WHERE email = ?', [
    'editorial@duncanfunded.com',
  ]);
  if (!author) {
    const id = genId();
    await run(
      'INSERT INTO users (id, email, name, role, "createdAt") VALUES (?,?,?,?,?)',
      [id, 'editorial@duncanfunded.com', 'The Duncan Council', 'ADMIN', now()],
    );
    author = { id };
  }

  for (const p of POSTS) {
    const postSlug = toSlug(p.title);
    if (await get('SELECT id FROM posts WHERE slug = ?', [postSlug])) {
      console.log(`  • skip (exists): ${p.title}`);
      continue;
    }

    // Category
    const catSlug = toSlug(p.category);
    let cat = await get('SELECT id FROM categories WHERE slug = ?', [catSlug]);
    if (!cat) {
      const id = genId();
      await run(
        'INSERT INTO categories (id, slug, name, "createdAt") VALUES (?,?,?,?)',
        [id, catSlug, p.category, now()],
      );
      cat = { id };
    }

    // Tags
    const tagIds = [];
    for (const t of p.tags) {
      const tSlug = toSlug(t);
      let tag = await get('SELECT id FROM tags WHERE slug = ?', [tSlug]);
      if (!tag) {
        const id = genId();
        await run('INSERT INTO tags (id, slug, name, "createdAt") VALUES (?,?,?,?)', [
          id,
          tSlug,
          t,
          now(),
        ]);
        tag = { id };
      }
      tagIds.push(tag.id);
    }

    // Post
    const postId = genId();
    const ts = now();
    await run(
      `INSERT INTO posts
        (id, slug, title, excerpt, content, "coverImage", status, featured,
         "readingTime", views, "metaTitle", "metaDescription", "ogImage", "canonicalUrl",
         "publishedAt", "createdAt", "updatedAt", "authorId", "categoryId")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        postId,
        postSlug,
        p.title,
        p.excerpt,
        p.content,
        null,
        'PUBLISHED',
        !!p.featured,
        estimateReadingTime(p.content),
        0,
        null,
        p.metaDescription,
        null,
        null,
        ts,
        ts,
        ts,
        author.id,
        cat.id,
      ],
    );
    for (const tagId of tagIds) {
      await run(
        'INSERT INTO tags_on_posts ("postId", "tagId") VALUES (?,?) ON CONFLICT DO NOTHING',
        [postId, tagId],
      );
    }
    console.log(`  ✓ ${p.title}`);
  }

  // Demo subscribers
  for (const email of ['scout@example.com', 'chieftain@example.com']) {
    if (!(await get('SELECT id FROM subscribers WHERE email = ?', [email]))) {
      await run(
        `INSERT INTO subscribers (id, email, status, source, "confirmedAt", "unsubToken", "createdAt")
         VALUES (?,?,'ACTIVE','seed',?,?,?)`,
        [genId(), email, now(), genId(), now()],
      );
    }
  }

  console.log('✅ Seed complete.');
}

main()
  .then(() => closeDb())
  .catch(async (e) => {
    console.error(e);
    await closeDb();
    process.exit(1);
  });
