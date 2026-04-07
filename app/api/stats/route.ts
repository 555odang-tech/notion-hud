import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export const revalidate = 60;

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const CALENDAR_DB = process.env.CALENDAR_DATABASE_ID!;
const TODO_DB = process.env.TODO_DATABASE_ID!;

function getTodaySeoul(): string {
  const str = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\. /g, "-")
    .replace(".", "");
  const parts = str.split("-").filter(Boolean);
  return `${parts[0]}-${parts[1]}-${parts[2]}`;
}

function getNumber(props: any, key: string): number {
  const p = props[key];
  if (!p) return 0;
  if (p.type === "number") return p.number ?? 0;
  if (p.type === "formula") return p.formula?.number ?? 0;
  return 0;
}

function getCheckbox(props: any, key: string): boolean {
  return props[key]?.checkbox ?? false;
}

function getDate(props: any, key: string): string {
  return props[key]?.date?.start ?? "";
}

function getSelect(props: any, key: string): string {
  return props[key]?.select?.name ?? "";
}

function getTitle(props: any, key: string): string {
  return props[key]?.title?.[0]?.plain_text ?? "";
}

export async function GET() {
  try {
    const today = getTodaySeoul();

    const calPages: any[] = [];
    let cursor: string | undefined;
    do {
      const res: any = await notion.databases.query({
        database_id: CALENDAR_DB,
        start_cursor: cursor,
        page_size: 100,
      });
      calPages.push(...res.results);
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);

    let totalXP = 0;
    let totalTokens = 0;
    let todayCalPage: any = null;

    for (const page of calPages) {
      const props = page.properties;
      totalXP += getNumber(props, "XP");
      totalTokens += getNumber(props, "토큰(오늘)");
      if (getDate(props, "Start Date") === today) todayCalPage = page;
    }

    const level = Math.max(1, Math.floor(totalXP / 100) + 1);
    const xpInLevel = totalXP % 100;
    const xpToNext = xpInLevel === 0 && totalXP > 0 ? 0 : 100 - xpInLevel;

    let todayData = {
      date: today,
      xp: 0, tokens: 0,
      total: 0, done: 0,
      dailyTotal: 0, dailyDone: 0, dailyXp: 0, dailyCoins: 0,
      overdueTotal: 0, overdueDone: 0,
      todayPageMissing: true,
      dailyItems: [] as { name: string; done: boolean }[],
      overdueItems: [] as { name: string; done: boolean }[],
    };

    if (todayCalPage) {
      const props = todayCalPage.properties;

      const todoRes: any = await notion.databases.query({
        database_id: TODO_DB,
        filter: {
          property: "오늘(캘린더)",
          relation: { contains: todayCalPage.id },
        },
      });

      const todos = todoRes.results;

      const todayTodos = todos.filter((t: any) => getSelect(t.properties, "구분") === "오늘");
      const dailyTodos = todos.filter((t: any) => getSelect(t.properties, "구분") === "일일");
      const overdueTodos = todos.filter((t: any) => getSelect(t.properties, "구분") === "밀린");

      const todayDone = todayTodos.filter((t: any) => getCheckbox(t.properties, "완료")).length;
      const dailyDone = dailyTodos.filter((t: any) => getCheckbox(t.properties, "완료")).length;
      const overdueDone = overdueTodos.filter((t: any) => getCheckbox(t.properties, "완료")).length;

      todayData = {
        date: today,
        xp: getNumber(props, "XP"),
        tokens: getNumber(props, "토큰(오늘)"),
        total: todayTodos.length,
        done: todayDone,
        dailyTotal: dailyTodos.length,
        dailyDone,
        dailyXp: dailyDone * 5,
        dailyCoins: dailyDone,
        overdueTotal: overdueTodos.length,
        overdueDone,
        todayPageMissing: false,
        dailyItems: dailyTodos.map((t: any) => ({
          name: getTitle(t.properties, "TODO"),
          done: getCheckbox(t.properties, "완료"),
        })),
        overdueItems: overdueTodos.map((t: any) => ({
          name: getTitle(t.properties, "TODO"),
          done: getCheckbox(t.properties, "완료"),
        })),
      };
    }

    return NextResponse.json({
      totalXP,
      totalTokens,
      level,
      xpInLevel,
      xpToNext,
      today: todayData,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
