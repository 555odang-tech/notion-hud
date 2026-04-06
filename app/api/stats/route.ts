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
  }).format(new Date());
  // "2025. 01. 06." → "2025-01-06"
  const parts = str.replace(/\s/g, "").replace(/\./g, "-").split("-").filter(Boolean);
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

export async function GET() {
  try {
    const today = getTodaySeoul();

    // 캘린더 DB 전체 읽기
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
      xp: 0,
      tokens: 0,
      progress: "0%",
      gauge: "",
      todoTotal: 0,
      todoDone: 0,
    };

    if (todayCalPage) {
      const props = todayCalPage.properties;
      const todoRes: any = await notion.databases.query({
        database_id: TODO_DB,
        filter: {
          and: [
            { property: "오늘(캘린더)", relation: { contains: todayCalPage.id } },
            { property: "구분", select: { equals: "오늘" } },
          ],
        },
      });

      const todos = todoRes.results;
      todayData = {
        date: today,
        xp: getNumber(props, "XP"),
        tokens: getNumber(props, "토큰(오늘)"),
        progress: props["진행률 %"]?.rich_text?.[0]?.plain_text ?? "0%",
        gauge: props["오늘 진척도"]?.rich_text?.[0]?.plain_text ?? "",
        todoTotal: todos.length,
        todoDone: todos.filter((t: any) => getCheckbox(t.properties, "완료")).length,
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
