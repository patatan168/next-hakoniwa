import { asyncRequestValid } from '@/global/function/api';
import { dbConn } from '@/global/function/db';
import { planInfoZodValid } from '@/global/valid/planInfo';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return new Response('Unauthorized', { status: 401 });
  }
  using db = dbConn('./src/db/data/main.db');
  const planData = db.client.prepare('SELECT * FROM plan WHERE from_uuid=?').all(uuid);
  return NextResponse.json(planData);
}

export async function POST(request: NextRequest) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: '計画の送信が失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
  using db = dbConn('./src/db/data/main.db');
  const cloned = request.clone();
  const requestBody = await cloned.json();
  if (requestBody instanceof Array) {
    const postDataZod = z.array(
      planInfoZodValid.omit({
        from_uuid: true,
        edit: true,
      })
    );
    const { response, data } = await asyncRequestValid(request, postDataZod);
    if (data !== null) {
      const insertPlan = db.client.prepare(
        `INSERT INTO plan(from_uuid, to_uuid, plan_no, times, x, y, plan) values(?, ?, ?, ?, ? ,?, ?)`
      );
      const deletePlan = db.client.prepare(`DELETE FROM plan WHERE from_uuid=?`);
      const upsertManyPlans = db.client.transaction((plans) => {
        // NOTE: 既存の計画を削除してから追加
        deletePlan.run(uuid);
        for (const plan of plans) {
          insertPlan.run(uuid, plan.to_uuid, plan.plan_no, plan.times, plan.x, plan.y, plan.plan);
        }
      });
      upsertManyPlans(data);
    }
    return response;
  } else {
    const { response, data } = await asyncRequestValid(
      request,
      planInfoZodValid.omit({
        from_uuid: true,
        edit: true,
      })
    );
    if (data !== null) {
      const insertPlan = db.client.prepare(
        `INSERT INTO plan(from_uuid, to_uuid, plan_no, times, x, y, plan) values(?, ?, ?, ?, ? ,?, ?)`
      );
      const deletePlan = db.client.prepare(`DELETE FROM plan WHERE from_uuid=? AND plan_no=?`);
      const upsertPlan = db.client.transaction((plan) => {
        // NOTE: 既存の計画を削除してから追加
        deletePlan.run(uuid, plan.plan_no);
        insertPlan.run(uuid, plan.to_uuid, plan.plan_no, plan.times, plan.x, plan.y, plan.plan);
      });
      upsertPlan(data);
    }
    return response;
  }
}
