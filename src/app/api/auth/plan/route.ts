import { asyncRequestValid } from '@/global/function/api';
import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { accessLogger } from '@/global/function/logger';
import { planInfoZodValid } from '@/global/valid/planInfo';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const response = new NextResponse();
  const uuid = await validAuthCookie(db.client, response, request);
  if (uuid !== undefined) {
    accessLogger(request).info(`Request Plan uuid=${uuid}`);
    const planData = db.client.prepare('SELECT * FROM plan WHERE from_uuid=?').all(uuid);
    return NextResponse.json(planData);
  } else {
    accessLogger(request).warn('Unauthorized Plan');
    return new Response('Unauthorized', { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const response = new NextResponse();
  const uuid = await validAuthCookie(db.client, response, request);
  if (uuid !== undefined) {
    accessLogger(request).info(`Request Plan uuid=${uuid}`);
    const { response, data } = await asyncRequestValid(
      request,
      planInfoZodValid.omit({
        from_uuid: true,
      })
    );
    if (data !== null) {
      const postPlan = db.client.prepare(
        `INSERT INTO plan(from_uuid, to_uuid, plan_no, times, x, y, plan) values(?, ?, ?, ?, ? ,?, ?)`
      );
      postPlan.run(uuid, data.to_uuid, data.plan_no, data.times, data.x, data.y, data.plan);
    }
    return response;
  } else {
    accessLogger(request).warn('Unauthorized Plan');
    return NextResponse.json(
      { error: '計画の送信が失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
}
