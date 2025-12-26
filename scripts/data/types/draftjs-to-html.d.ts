declare module "draftjs-to-html" {
  import { RawDraftContentState } from "draft-js";

  function draftToHtml(
    contentState: RawDraftContentState,
    hashtagConfig?: any,
    directional?: boolean,
    customEntityTransform?: any
  ): string;

  export default draftToHtml;
}



