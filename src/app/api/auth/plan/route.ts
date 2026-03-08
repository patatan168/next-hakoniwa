import { db } from '@/db/kysely';
import { asyncRequestValid } from '@/global/function/api';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
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
  const planData = await db
    .selectFrom('plan')
    .selectAll()
    .where('from_uuid', '=', uuid)
    .orderBy('plan_no', 'asc')
    .execute();
  return NextResponse.json(planData);
}

export async function POST(request: NextRequest) {
  if (await isTurnProcessing()) {
    return turnProcessingResponse();
  }

  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: '計画の送信が失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
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
      await db.transaction().execute(async (trx) => {
        await trx.deleteFrom('plan').where('from_uuid', '=', uuid).execute();
        if (data.length > 0) {
          const insertData = data.map((plan) => ({
            from_uuid: uuid,
            to_uuid: plan.to_uuid,
            plan_no: plan.plan_no,
            times: plan.times,
            x: plan.x,
            y: plan.y,
            plan: plan.plan,
          }));
          await trx.insertInto('plan').values(insertData).execute();
        }
      });
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
      await db.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('plan')
          .where('from_uuid', '=', uuid)
          .where('plan_no', '=', data.plan_no)
          .execute();
        await trx
          .insertInto('plan')
          .values({
            from_uuid: uuid,
            to_uuid: data.to_uuid,
            plan_no: data.plan_no,
            times: data.times,
            x: data.x,
            y: data.y,
            plan: data.plan,
          })
          .execute();
      });
    }
    return response;
  }
}
