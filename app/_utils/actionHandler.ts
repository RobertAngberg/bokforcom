import type { PoolClient } from "pg";
import { pool } from "../_lib/db";
import type { UserId } from "../_types/common";
import { ensureSession, type BetterAuthSession } from "./session";

export type ActionSuccess<T = Record<string, unknown>> = { success: true } & T;
export type ActionFailure = { success: false; error: string };
export type ActionResult<T = Record<string, unknown>> = ActionSuccess<T> | ActionFailure;

export type ActionWithClient<T> = (client: PoolClient) => Promise<ActionResult<T>>;

export async function runWithDbAction<T>(
  actionName: string,
  action: ActionWithClient<T>
): Promise<ActionResult<T>> {
  const client = await pool.connect();

  try {
    const result = await action(client);
    return result;
  } catch (error) {
    console.error(`❌ ${actionName} error:`, error);
    return {
      success: false,
      error: error instanceof Error && error.message ? error.message : "Ett oväntat fel inträffade",
    };
  } finally {
    client.release();
  }
}

type AuthedActionContext = {
  client: PoolClient;
  userId: UserId;
  session: BetterAuthSession;
};

export type AuthedAction<T> = (context: AuthedActionContext) => Promise<ActionResult<T>>;

export async function runAuthedDbAction<T>(
  actionName: string,
  action: AuthedAction<T>
): Promise<ActionResult<T>> {
  try {
    const { userId, session } = await ensureSession({ redirectTo: false });

    return runWithDbAction(actionName, (client) => action({ client, userId, session }));
  } catch (error) {
    console.error(`❌ ${actionName} auth error:`, error);

    const message = error instanceof Error && error.message ? error.message : "Du är inte behörig";

    return { success: false, error: message };
  }
}
