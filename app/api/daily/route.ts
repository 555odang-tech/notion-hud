import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const CALENDAR_DB = process.env.CALENDAR_DATABASE_ID!;
const TODO_DB = process.env.TODO_DATABASE_ID!;

// Asia/Seoul 기준 날짜 반환
function getDateKST(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/\. /g, "-")
    .replace(".", "");
}

// Start Date로 캘린더 페이지 찾기
async function findCalendarPage(dateStr: string) {
  const res: any = await notion.databases.query({
    database_id: CALENDAR_DB,
    filter: {
      property: "Start Date",
      date: { equals: dateStr },
    },
  });

  if (res.results.length === 0) return null;
  if (res.results.length > 1) {
    console.warn(`[경고] ${dateStr}에 캘린더 페이지가 ${res.results.length}개 있음. 최신 1개 사용.`);
    return res.results.sort((a: any, b: any) =>
      b.last_edited_time.localeCompare(a.last_edited_time)
    )[0];
  }
  return res.results[0];
}

// 오늘 페이지 없으면 생성
async function findOrCreateTodayPage(todayStr: string) {
  let page = await findCalendarPage(todayStr);
  if (!page) {
    console.log(`[생성] ${todayStr} 페이지 없음 → 새로 생성`);
    const day = new Date(todayStr).getDate();
    page = await notion.pages.create({
      parent: { database_id: CALENDAR_DB },
      properties: {
        Name: {
          title: [{ text: { content: `${day}일` } }],
        },
        "Start Date": {
          date: { start: todayStr },
        },
      },
    } as any);
  }
  return page;
}

// 어제 미완료 TODO → 오늘 페이지로 이월
async function carryOverYesterday(todayPageId: string, yesterdayPageId: string) {
  // 어제 페이지의 TODO 중 완료=false, 구분=오늘인 항목 조회
  const res: any = await notion.databases.query({
    database_id: TODO_DB,
    filter: {
      and: [
        {
          property: "오늘(캘린더)",
          relation: { contains: yesterdayPageId },
        },
        {
          property: "완료",
          checkbox: { equals: false },
        },
        {
          property: "구분",
          select: { equals: "오늘" },
        },
      ],
    },
  });

  const todos = res.results;
  console.log(`[이월] 어제 미완료 ${todos.length}개 발견`);

  for (const todo of todos) {
    await notion.pages.update({
      page_id: todo.id,
      properties: {
        구분: {
          select: { name: "밀린" },
        },
        "오늘(캘린더)": {
          relation: [{ id: todayPageId }],
        },
      },
    } as any);
  }

  return todos.length;
}

// GET: 수동 트리거용
export async function GET() {
  try {
    const todayStr = getDateKST(0);
    const yesterdayStr = getDateKST(-1);

    // 오늘 페이지 찾거나 생성
    const todayPage = await findOrCreateTodayPage(todayStr);

    // 어제 페이지 찾기
    const yesterdayPage = await findCalendarPage(yesterdayStr);

    let carriedOver = 0;
    if (yesterdayPage) {
      carriedOver = await carryOverYesterday(todayPage.id, yesterdayPage.id);
    }

    return NextResponse.json({
      success: true,
      today: todayStr,
      todayPageId: todayPage.id,
      yesterday: yesterdayStr,
      yesterdayPageFound: !!yesterdayPage,
      carriedOver,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
