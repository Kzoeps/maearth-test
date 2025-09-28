import { ImpactClaim } from "../components/Form";

import {
  Agent,
  ComAtprotoRepoGetRecord,
  ComAtprotoRepoListRecords,
} from "@atproto/api";
import type { OAuthSession } from "@atproto/oauth-client-browser";

const IMPACT_CLAIM_COLLECTION = "org.hypercert.impactClaims";

export const formatListRecordsResponse = (
  response: ComAtprotoRepoListRecords.Response
) => {
  return response.data.records.map((record) => ({
    ...record.value,
    uri: record.uri,
  }));
};

const formatGetRecordResponse = (
  response: ComAtprotoRepoGetRecord.Response
) => {
  return { ...response.data.value, uri: response.data.uri };
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
  }
};
