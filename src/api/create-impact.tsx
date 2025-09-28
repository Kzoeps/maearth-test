import {
  Agent,
  ComAtprotoRepoGetRecord,
  ComAtprotoRepoListRecords,
} from "@atproto/api";
import type { OAuthSession } from "@atproto/oauth-client-browser";
import type { ImpactClaim } from "../components/Form";

const IMPACT_CLAIM_COLLECTION = "org.hypercert.impactClaims";

export const formatListRecordsResponse = (
  response: ComAtprotoRepoListRecords.Response
) => {
  return response.data.records.map((record) => ({
    ...(record.value as any), // ImpactClaim fields
    uri: record.uri, // add the AT URI
  }));
};

const formatGetRecordResponse = (
  response: ComAtprotoRepoGetRecord.Response
) => {
  return { ...(response.data.value as any), uri: response.data.uri };
};

export const createImpactClaim = async (
  session: OAuthSession,
  claim: ImpactClaim
) => {
  try {
    const record = {
      $type: IMPACT_CLAIM_COLLECTION,
      ...claim,
    };
    const agent = new Agent(session);
    const res = await agent.com.atproto.repo.putRecord({
      repo: agent.assertDid,
      collection: IMPACT_CLAIM_COLLECTION,
      rkey: crypto.randomUUID(),
      record,
      validate: false,
    });
    console.log("created impact claim");
    console.log(res);
  } catch (e) {
    console.error("error createing impact claim ", e);
    throw e;
  }
};

// ✅ NEW: list API with cursor pagination
export type ListImpactClaimsResult = {
  items: (ImpactClaim & { uri: string })[];
  cursor?: string | null;
};

export async function listImpactClaims(
  session: OAuthSession,
  opts?: { limit?: number; cursor?: string | null; reverse?: boolean }
): Promise<ListImpactClaimsResult> {
  const agent = new Agent(session);
  const res = await agent.com.atproto.repo.listRecords({
    repo: agent.assertDid,
    collection: IMPACT_CLAIM_COLLECTION,
    limit: opts?.limit ?? 20,
    cursor: opts?.cursor ?? undefined,
    reverse: opts?.reverse ?? true, // newest first by rkey
  });

  return {
    items: formatListRecordsResponse(res) as any,
    cursor: res.data.cursor ?? null,
  };
}
