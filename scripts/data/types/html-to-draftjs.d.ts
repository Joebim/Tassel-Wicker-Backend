declare module "html-to-draftjs" {
  import { ContentBlock } from "draft-js";

  interface HtmlToDraftResult {
    contentBlocks: ContentBlock[];
    entityMap?: any;
  }

  function htmlToDraft(
    html: string,
    options?: {
      customChunkRenderer?: (node: any) => any;
      customEntityTransform?: (entity: any) => any;
    }
  ): HtmlToDraftResult | null;

  export default htmlToDraft;
}



